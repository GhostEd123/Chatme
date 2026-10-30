# Chatme — Code Review Action Points

> [!IMPORTANT]
> **Priority order:** Fix session safety & message reliability before adding new screens. Media and security screens should only ship when their underlying behavior is fully implemented.

---

## Module 1 — Architecture & Components

### 🔴 Action 1.1 — Replace mock chat deletion with a real API mutation
- Remove the `useChatStore` delete action from the live chat list
- Implement deletion via a dedicated API mutation
- Invalidate / update conversation queries after deletion
- Keep mock/local data completely isolated from production flows

### 🔴 Action 1.2 — Extract message synchronization out of `ChatDetailScreen`
- Move socket-event merging, delivery/read receipts into reusable hooks or services
- Split the screen into focused sub-components: **Composer**, **MessageList**, **AttachmentPicker**
- Cache sync must not depend on a specific screen being mounted

### 🟡 Action 1.3 — Unify token refresh under one owner
- HTTP client and socket service each refresh independently — consolidate into a **shared session service**
- Both transports must call the same refresh logic (covered further in Module 3)

---

## Module 2 — Types & State Ownership

### 🔴 Action 2.1 — Isolate cached data per account and clear on logout *(High Priority)*
- Scope query keys to the authenticated user ID (e.g. `["conversations", userId]`)
- On logout: cancel in-flight requests, clear the TanStack Query cache, clear persisted query storage, and reset all realtime/socket state
- Prevent account B from ever seeing account A's cached data

### 🔴 Action 2.2 — Align message types with the API contract
- Extend the message model to support `audio`, `video`, `document`, nullable `text`, and attachments
- Remove misleading type assertions (e.g., hardcoded `kind: "text"` in socket mapping)
- Define a canonical **API message type** and a separate **UI model** with explicit transformation

### 🟡 Action 2.3 — Separate onboarding state from authenticated identity
- Do not create a user object with an empty ID to hold pre-verification data
- Create a dedicated **onboarding/pending state** for phone number and `challengeId`
- Reserve `user !== null` exclusively for a verified server identity
- Explicitly decide which fields are persisted vs. transient (e.g., `challengeId` should not persist)

---

## Module 3 — Authentication Lifecycle

### 🔴 Action 3.1 — Deduplicate token refresh with a shared in-flight promise *(High Priority)*
- Replace independent per-request refresh with **one shared refresh promise**
- All concurrent 401 callers must await the same promise
- Credentials are written once when the single refresh resolves

### 🔴 Action 3.2 — Prevent stale refresh from restoring credentials after logout
- Track a **session generation counter or account ID**; reject refresh results belonging to an old session
- Distinguish **network failures** (recoverable) from **authentication rejection** (definitive) — a network error must not erase a valid session
- Local logout should not block indefinitely waiting for server revocation

### 🔴 Action 3.3 — Protect credentials and remove sensitive logging *(High Priority)*
- Configure **MMKV with an encryption key** or migrate tokens to platform-backed secure storage (Keychain / Keystore)
- Remove or redact all logging of: tokens, OTP codes, full auth responses, message bodies
- Development-only logs must still redact sensitive fields

### 🟡 Action 3.4 — Complete the OTP resend & countdown flow
- Use the server-provided code length (do not hardcode 4 digits)
- Implement a real countdown timer using server-provided resend timing
- Wire up the "Resend code" button to re-request OTP and replace the active challenge

---

## Module 4 — Async Work & Lifecycle

### 🔴 Action 4.1 — Implement connection recovery for normal failures
- Re-enable or implement Socket.IO reconnection with **bounded exponential backoff**
- Separate **network reconnection** from **token refresh** — not every disconnect needs a token refresh
- Handle `ping timeout` and generic connection errors, not just selected disconnect reasons
- Recover automatically when connectivity returns

### 🔴 Action 4.2 — Resubscribe after connect / reconnect
- Make presence and other subscriptions **connection-aware**: if the subscription runs before the socket is ready, retry when the connection becomes available
- Re-establish all subscriptions on every new connection (including reconnects)
- Add **timeouts to acknowledgement promises** so they don't hang indefinitely

### 🟡 Action 4.3 — Make async operations bounded and recoverable
- Add **cancellation and timeouts** to the API helper (use `AbortController` / query cancellation)
- Wrap the entire contact load (permission check + device read) in a single `try/catch/finally` so a failure always clears the loading spinner
- Replace the current `startTyping` per-keystroke emission with a **real throttle/debounce** that cleans up on unmount

---

## Module 5 — Reliable Messaging

### 🔴 Action 5.1 — Unify HTTP and socket message reconciliation *(High Priority)*
- Create **one upsert / reconcile function** used by: send mutation response, incoming socket events, refetches, and retries
- Match messages by both `serverId` and `clientMessageId` to prevent duplicates regardless of which arrives first
- Maintain consistent ordering after reconciliation

### 🔴 Action 5.2 — Preserve failed messages and reuse their original client IDs
- Generate `clientMessageId` **once** when constructing the pending message, not inside the mutation invocation
- Do not clear the composer before the send is confirmed — preserve text and status on failure
- Show a failed-message bubble with a **Retry** action that reuses the same ID and payload

### 🟡 Action 5.3 — Implement message history pagination
- Preserve `pageInfo` / cursor metadata from the messages response
- Implement "load earlier messages" using the stored cursor
- After reconnecting, fetch messages missed while disconnected and reconcile with local cache

### 🟡 Action 5.4 — Fix delivery/read receipts
- Implement the empty socket receipt handlers (`message:delivered`, `message:read`)
- Mark messages as read only when the correct conversation is **visible and foregrounded**
- Drive the check-mark UI from actual server receipt data, not just message count

---

## Module 6 — Media & Permissions

### 🔴 Action 6.1 — Connect picker results to the upload pipeline
- Gallery and document pickers currently discard their results — wire them up fully:
  **Select → validate → authorize upload → upload to Cloudinary → complete verification → send attachment message**
- Expose progress, cancellation, failure, and retry at each stage
- **Never embed Cloudinary secrets in the app bundle**

### 🔴 Action 6.2 — Fix avatar upload and remove placeholder recording
- Pass the modal's selection callback in the avatar screen
- Connect selection → upload → `PUT /me/avatar`; remove the premature "photo is being uploaded" message
- Either implement real audio recording/playback, or **visibly disable** the microphone control until it works

### 🟡 Action 6.3 — Request permissions in context and batch contact matching
- Do not request media-library permission on chat screen mount — request it **when the user taps the attachment button**
- Handle `denied` / `limited` access and the "return from Settings" case
- Normalize contact phone numbers to international format with country context
- Batch contact matching requests at ≤ 100 numbers per call (API limit)

---

## Module 7 — Navigation & Accessibility

### 🔴 Action 7.1 — Add session-aware routing with authentication guards
- Model four explicit app states: **bootstrapping → signed-out → onboarding → authenticated**
- Protect chat and settings routes; unauthenticated access must redirect to the sign-in flow
- Session restoration on launch should resolve before rendering any protected route

### 🔴 Action 7.2 — Move app lock to a global navigation boundary
- Lift PIN/biometric enforcement **above** all protected screens, not inside `ChatsScreen`
- Scope the SecureStore PIN key per account
- A storage-read error must **not** silently unlock the screen — treat it as a failed unlock
- Replace the Face ID visual mock with real biometric authentication (`expo-local-authentication`)

### 🟡 Action 7.3 — Add accessible labels and states to composer controls
- Add `accessibilityLabel`, `accessibilityRole`, and `accessibilityState` (disabled / busy) to the attachment and send buttons
- When the send button visually becomes a microphone, either implement the action or mark the control as disabled
- Verify message reading order, large-text layout, and focus management with VoiceOver / TalkBack

### 🟡 Action 7.4 — Implement notification-driven navigation
- Handle notification tap responses **after** session restoration completes
- Route through the same authentication + app-lock gate
- Validate the target conversation exists before navigating; handle unavailable conversations gracefully

---

## Suggested Priority Order

| Priority | Items |
|----------|-------|
| 🔴 **Do first** | 2.1 Account cache isolation on logout, 3.1 Single refresh promise, 3.3 Secure credential storage, 5.1 Message reconciliation |
| 🔴 **Do next** | 1.2 Extract screen logic, 3.2 Stale refresh guard, 4.1 Socket reconnection, 5.2 Failed-message preservation, 6.1 Upload pipeline, 7.1 Auth guards, 7.2 Global app lock |
| 🟡 **Then** | 1.3 Unified session service, 2.2 Message types, 2.3 Onboarding state, 3.4 OTP resend, 4.2 Resubscribe on reconnect, 4.3 Bounded async, 5.3 Pagination, 5.4 Receipts, 6.2 Avatar/recording, 6.3 Permission timing, 7.3 Accessibility, 7.4 Notification nav |
| 🟢 **After above** | 1.1 Mock deletion replacement |
