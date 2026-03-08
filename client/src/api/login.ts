import instance from "../utils/http";

export interface UserInfo {
  id: number;
  username: string;
  email: string;
  avatar: string | null;
  token: string;
}

interface LoginData {
    email: string;
    password: string;
}
interface RegisterData {
    username: string;
    email: string;
    password: string;
}

export interface RefreshTokenResponse {
    token: string;
    refreshToken: string;
}

export const login = async (data: LoginData): Promise<UserInfo> => {
    return instance.post('/v1/login', data);
};

export const register = async (data: RegisterData) => {
    return instance.post('/v1/register', data);
};

export const refreshToken = async (refreshToken: string): Promise<RefreshTokenResponse> => {
    return instance.post('/v1/refresh', { refreshToken });
};