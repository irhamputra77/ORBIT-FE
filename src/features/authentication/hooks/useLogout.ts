"use client";

import { useState } from "react";
import { logout } from "../services/authApi";

export function useLogout() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function submitLogout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      await logout();
    } finally {
      window.localStorage.removeItem("orbit_user");
      window.sessionStorage.removeItem("orbit_user");
      window.location.assign("/login");
    }
  }

  return { submitLogout, isLoggingOut };
}
