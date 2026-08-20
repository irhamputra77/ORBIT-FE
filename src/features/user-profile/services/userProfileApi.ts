import { axiosClient } from "@/lib/http/axiosClient";
import type { UserProfile, UserProfileResponse } from "../types";

export async function getCurrentUserProfile(signal?: AbortSignal): Promise<UserProfile> {
  const response = await axiosClient.get<UserProfileResponse>("/users/me", {
    signal,
  });

  return response.data.data;
}
