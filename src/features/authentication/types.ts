export interface LoginPayload {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  username?: string;
  role: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginApiResponse {
  message: string;
  data: {
    token: string;
    user: AuthenticatedUser;
  };
}

export interface LoginResult {
  user: AuthenticatedUser;
}

export interface AuthenticationErrorResponse {
  message?: string;
  error?: string;
}
