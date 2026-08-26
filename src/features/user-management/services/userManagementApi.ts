import { axiosClient } from "@/lib/http/axiosClient";
import type {
  CreateUserPayload,
  ManagedUser,
  UpdateUserPayload,
  UserListParams,
  UserListResponse,
  UserMutationResponse,
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

export async function updateUser(
  id: string,
  payload: UpdateUserPayload,
): Promise<UserMutationResponse> {
  const response = await axiosClient.patch<UserMutationResponse>(
    `/users/${encodeURIComponent(id)}`,
    compactPayload(payload),
  );
  return response.data;
}

export async function deleteUser(id: string): Promise<UserMutationResponse> {
  const response = await axiosClient.delete<UserMutationResponse>(
    `/users/${encodeURIComponent(id)}`,
  );
  return response.data;
}

export function userToFormValues(user: ManagedUser): UpdateUserPayload {
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
