import axios from "axios";

let redirectingToLogin = false;

export const axiosClient = axios.create({
  baseURL: "/api",
  timeout: 15_000,
  withCredentials: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

axiosClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      typeof window !== "undefined" &&
      window.location.pathname !== "/login" &&
      !redirectingToLogin
    ) {
      redirectingToLogin = true;
      window.localStorage.removeItem("orbit_user");
      window.sessionStorage.removeItem("orbit_user");
      await window.fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
      window.location.assign("/login");
    }

    return Promise.reject(error);
  },
);
