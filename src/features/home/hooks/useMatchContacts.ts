import { apiRequest } from "@/core/lib/apiClient";
import { useMutation } from "@tanstack/react-query";

interface ContactMatchDto {
  matchedPhoneNumber: string;
  user: {
    id: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
}

interface MatchContactsResponse {
  matches: ContactMatchDto[];
}

export function useMatchContacts() {
  return useMutation<MatchContactsResponse, Error, string[]>({
    mutationFn: (phoneNumbers) =>
      apiRequest<MatchContactsResponse>("/contacts/match", {
        method: "POST",
        body: { phoneNumbers },
      }),
  });
}
