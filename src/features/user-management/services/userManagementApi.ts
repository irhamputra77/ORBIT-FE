import { axiosClient } from "@/lib/http/axiosClient";
import type {
  CreateUserPayload,
  ManagedUser,
  ResetPasswordResponse,
  UpdateUserPayload,
  UserDetailResponse,
  UserFormValues,
  UserListParams,
  UserListResponse,
  UserMutationResponse,
  UserStatusResponse,
} from "../types";

function compactPayload<T extends object>(payload: T) {
  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [
      key,
      typeof value === "string" && value.trim() === "" ? null : value,
    ]),
  );
}

export async function getUsers(
  params: UserListParams,
  signal?: AbortSignal,
): Promise<UserListResponse> {
  const response = await axiosClient.get<UserListResponse>("/users", {
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      ...(params.role && params.role !== "ALL" ? { role: params.role } : {}),
      ...(params.operatorId?.trim() ? { operatorId: params.operatorId.trim() } : {}),
      ...(params.search?.trim() ? { search: params.search.trim() } : {}),
    },
    signal,
  });

  return response.data;
}

export async function createUser(payload: CreateUserPayload): Promise<UserMutationResponse> {
  const response = await axiosClient.post<UserMutationResponse>(
    "/users",
    compactPayload(payload),
  );
  return response.data;
}

export async function getUser(
  id: string,
  signal?: AbortSignal,
): Promise<ManagedUser> {
  const response = await axiosClient.get<UserDetailResponse>(
    `/users/${encodeURIComponent(id)}`,
    { signal },
  );
  return response.data.data;
}

export async function updateUser(
  id: string,
  payload: UpdateUserPayload,
): Promise<UserMutationResponse> {
  const normalizedPayload = Object.entries(payload).reduce<Record<string, unknown>>(
    (result, [key, value]) => {
      if (key === "employeeNumber" && typeof value === "string" && !value.trim()) {
        return result;
      }
      if (
        (key === "operatorId" || key === "unit")
        && typeof value === "string"
        && !value.trim()
      ) {
        result[key] = null;
        return result;
      }
      result[key] = value;
      return result;
    },
    {},
  );

  const response = await axiosClient.patch<UserMutationResponse>(
    `/users/${encodeURIComponent(id)}`,
    normalizedPayload,
  );
  return response.data;
}

export async function updateUserStatus(
  id: string,
  active: boolean,
): Promise<UserStatusResponse> {
  const response = await axiosClient.patch<UserStatusResponse>(
    `/users/${encodeURIComponent(id)}/status`,
    { active },
  );
  return response.data;
}

export async function resetUserPassword(
  id: string,
  password: string,
): Promise<ResetPasswordResponse> {
  const response = await axiosClient.post<ResetPasswordResponse>(
    `/users/${encodeURIComponent(id)}/reset-password`,
    { password },
  );
  return response.data;
}

export async function deleteUser(id: string): Promise<{ message?: string }> {
  const response = await axiosClient.delete<{ message?: string }>(
    `/users/${encodeURIComponent(id)}`,
  );
  return response.data;
}

export function userToFormValues(
  user: ManagedUser,
): Omit<UserFormValues, "password"> {
  return {
    employeeNumber: user.employeeNumber ?? "",
    name: user.name ?? "",
    email: user.email,
    username: user.username,
    role: user.role,
    operatorId: user.operatorId ?? "",
    unit: user.unit ?? "",
    active: user.active,
  };
}
