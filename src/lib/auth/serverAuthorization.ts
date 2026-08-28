import "server-only";

import axios from "axios";
import { redirect } from "next/navigation";
import { backendApi, getAuthorizationHeader } from "@/lib/http/backendRoute";
import type { UserProfile, UserProfileResponse, UserRole } from "@/features/user-profile";

async function getAuthenticatedUser(): Promise<UserProfile | null> {
  const authorization = await getAuthorizationHeader();
  if (!authorization) return null;

  try {
    const response = await backendApi.get<UserProfileResponse>("/api/users/me", {
      headers: { Authorization: authorization },
    });

    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error) && [401, 403].includes(error.response?.status ?? 0)) {
      return null;
    }

    throw error;
  }
}

export async function requireRole(allowedRoles: readonly UserRole[]) {
  const user = await getAuthenticatedUser();

  if (!user) redirect("/login");
  if (!allowedRoles.includes(user.role)) redirect("/dashboard?access=denied");

  return user;
}
