import React, { createContext, useContext, useState, useEffect } from "react";
import apiClient from "../api/client";

export type UserRole = "student" | "teacher" | "admin";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: UserRole) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) {
      apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      fetchMe();
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const fetchMe = async () => {
    try {
      const res = await apiClient.get("/auth/me");
      setUser(res.data);
    } catch {
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const res = await apiClient.post("/auth/login", { email, password });
    const { access_token, user_id, name, role } = res.data;
    setToken(access_token);
    setUser({ id: user_id, name, email, role });
    localStorage.setItem("token", access_token);
    apiClient.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
  };

  const register = async (name: string, email: string, password: string, role: UserRole = "student") => {
    const res = await apiClient.post("/auth/register", { name, email, password, role });
    const { access_token, user_id, role: userRole } = res.data;
    setToken(access_token);
    setUser({ id: user_id, name, email, role: userRole });
    localStorage.setItem("token", access_token);
    apiClient.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    delete apiClient.defaults.headers.common["Authorization"];
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
