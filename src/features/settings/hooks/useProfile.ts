import { apiRequest } from "@/core/lib/apiClient";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/core/lib/queryClient";

interface UserProfile {
  id: string;
  phoneNumber: string;
  displayName: string | null;
  avatarUrl: string | null;
  profileComplete: boolean;
  createdAt: string;
}

export function useProfile() {
  const { user } = useAuthStore.getState();
  return useQuery<UserProfile>({
    queryKey: ["profile", user?.id],
    queryFn: () => apiRequest<UserProfile>("/me"),
    staleTime: 60_000,
  });
}

interface UpdateProfileInput {
  displayName: string;
}

export function useUpdateProfile() {
  const { user, updateUser } = useAuthStore.getState();
  return useMutation<UserProfile, Error, UpdateProfileInput>({
    mutationFn: (input) =>
      apiRequest<UserProfile>("/me", {
        method: "PATCH",
        body: input,
      }),
    onSuccess: (data) => {
      // Update local cache
      queryClient.setQueryData(["profile", user?.id], data);
      
      // Update auth store
      updateUser({
        name: data.displayName ?? "",
        photo: data.avatarUrl ?? undefined,
      });
    },
  });
}
