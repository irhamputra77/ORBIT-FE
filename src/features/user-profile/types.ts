export type UserRole = "ADMIN" | "TECHNICIAN" | "ENGINEER" | "MANAGER";

export interface UserOperator {
  id: string;
  code: string;
  name: string;
}

export interface UserProfile {
  id: string;
  employeeNumber: string | null;
  name: string | null;
  email: string;
  username: string;
  role: UserRole;
  operatorId: string | null;
  unit: string | null;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
  operator: UserOperator | null;
}

export interface UserProfileResponse {
  data: UserProfile;
}
