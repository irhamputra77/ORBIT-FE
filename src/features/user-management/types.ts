import type { UserProfile, UserRole } from "@/features/user-profile";

export type ManagedUser = UserProfile;

export interface UserListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UserListResponse {
  data: ManagedUser[];
  meta: UserListMeta;
}

export interface UserMutationResponse {
  message?: string;
  data?: ManagedUser;
}

export interface UserDetailResponse {
  data: ManagedUser;
}

export interface UserStatusResponse {
  message?: string;
  data?: Pick<ManagedUser, "id" | "active">;
}

export interface ResetPasswordResponse {
  message?: string;
  data?: Pick<ManagedUser, "id" | "email" | "username" | "role" | "active">;
}

export interface UserListParams {
  page?: number;
  limit?: number;
  role?: UserRole | "ALL";
  operatorId?: string;
  search?: string;
}

export interface UserFormValues {
  employeeNumber: string;
  name: string;
  email: string;
  username: string;
  password: string;
  role: UserRole;
  operatorId: string;
  unit: string;
  active: boolean;
}

export type CreateUserPayload = UserFormValues;
export type UpdateUserPayload = Partial<Omit<UserFormValues, "password">>;
