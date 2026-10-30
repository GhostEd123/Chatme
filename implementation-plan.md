# Chatme — Full Implementation Plan

## Wave 1 (Critical — parallel)
- **W1-A** Session service + single refresh promise + logout cache wipe + secure storage
- **W1-B** Auth-guarded navigation + root index session restore + onboarding state isolation
- **W1-C** Message reconciliation upsert + failed-message preservation

## Wave 2 (after W1 — parallel)
- **W2-A** Socket reconnection with backoff + connection-aware resubscription
- **W2-B** Extract ChatDetailScreen into sub-components (MessageList, Composer, AttachmentMenu)
- **W2-C** Delete conversation via real API + remove mock store dependency from ChatsScreen

## Wave 3 (after W2 — parallel)
- **W3-A** OTP resend + countdown + align types + media types
- **W3-B** Message pagination + receipt handlers + read-marking logic
- **W3-C** Media upload pipeline (image picker → Cloudinary → send) + permission in context
- **W3-D** Global app lock + real biometric (Face ID) + account-scoped PIN key

## Wave 4 (after W3)
- **W4-A** Accessibility labels + notification navigation
- **W4-B** Avatar upload + typing throttle + contact batching
