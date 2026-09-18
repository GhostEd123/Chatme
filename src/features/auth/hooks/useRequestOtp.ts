import { apiRequest } from "@/core/lib/apiClient";
import { useMutation } from "@tanstack/react-query";

interface RequestOtpInput {
  phoneNumber: string;
}

interface RequestOtpResponse {
  challengeId: string;
  phoneNumberMasked: string;
  expiresInSeconds: number;
  resendInSeconds: number;
  codeLength: number;
}

export function useRequestOtp() {
  return useMutation<RequestOtpResponse, Error, RequestOtpInput>({
    mutationFn: (input) =>
      apiRequest<RequestOtpResponse>("/auth/otp/request", {
        method: "POST",
        body: input,
        skipAuth: true,
      }),
  });
}
