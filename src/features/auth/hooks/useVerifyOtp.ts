import { apiRequest } from "@/core/lib/apiClient";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useMutation } from "@tanstack/react-query";

interface VerifyOtpInput {
  challengeId: string;
  code: string;
  device: {
    name: string;
    platform: "ios" | "android" | "web";
  };
}

interface VerifyOtpResponse {
  accessToken: string;
  accessTokenExpiresInSeconds: number;
  refreshToken: string;
  refreshTokenExpiresInSeconds: number;
  user: {
    id: string;
    phoneNumber: string;
    displayName: string | null;
    avatarUrl: string | null;
    profileComplete: boolean;
    createdAt: string;
  };
}

export function useVerifyOtp() {
  const { setTokens, setUser } = useAuthStore.getState();

  return useMutation<VerifyOtpResponse, Error, VerifyOtpInput>({
    mutationFn: (input) =>
      apiRequest<VerifyOtpResponse>("/auth/otp/verify", {
        method: "POST",
        body: input,
        skipAuth: true,
      }),
    onSuccess: (data) => {
      // Persist tokens
      setTokens(data.accessToken, data.refreshToken);
      // Persist user (map from API shape to store shape)
      setUser({
        id: data.user.id,
        name: data.user.displayName ?? "",
        phone: data.user.phoneNumber,
        photo: data.user.avatarUrl ?? undefined,
        hasPinSetup: undefined,
      });
    },
  });
}
