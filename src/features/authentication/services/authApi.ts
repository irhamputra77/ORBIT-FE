import { axiosClient } from "@/lib/http/axiosClient";
import type { LoginPayload, LoginResult } from "../types";

export async function login(payload: LoginPayload): Promise<LoginResult> {
  const response = await axiosClient.post<LoginResult>("/auth/login", payload);
  return response.data;
}

export async function logout() {
  await axiosClient.post("/auth/logout");
}
