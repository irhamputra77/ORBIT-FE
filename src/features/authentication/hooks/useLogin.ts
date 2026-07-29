"use client";

import axios from "axios";
import { useState } from "react";
import { login } from "../services/authApi";
import type {
  AuthenticationErrorResponse,
  LoginPayload,
  LoginResult,
} from "../types";

export function useLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitLogin(payload: LoginPayload): Promise<LoginResult | null> {
    setIsLoading(true);
    setError(null);

    try {
      return await login(payload);
    } catch (caughtError) {
      if (axios.isAxiosError<AuthenticationErrorResponse>(caughtError)) {
        setError(
          caughtError.response?.data.message ??
            (caughtError.response?.status === 401
              ? "Email atau password salah."
              : "Login gagal. Silakan coba kembali."),
        );
      } else {
        setError("Terjadi kesalahan saat login.");
      }

      return null;
    } finally {
      setIsLoading(false);
    }
  }

  return {
    submitLogin,
    isLoading,
    error,
  };
}
