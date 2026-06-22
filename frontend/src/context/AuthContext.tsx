import React, { createContext, useContext, useState, useEffect } from "react";
import { getMe, loginUser, registerUser } from "../services/api";

interface User {
  id: number;
  username: string;
  email: string;
  whatsapp_phone?: string | null;
  whatsapp_active?: boolean;
  whatsapp_sandbox?: string | null;
  ai_provider?: string | null;
  ai_model?: string | null;
  ai_api_key?: string | null;
  profile_focus?: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (credentials: any) => Promise<User>;
  register: (userData: any) => Promise<User>;
  logout: () => void;
  updateUser: (updatedUser: Partial<User>) => void;
  language: string;
  changeLanguage: (lang: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<string>(() => {
    return localStorage.getItem("fryd_lang") || "es";
  });

  const changeLanguage = (lang: string) => {
    setLanguage(lang);
    localStorage.setItem("fryd_lang", lang);
    window.dispatchEvent(new Event("languagechange"));
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        try {
          const profile = await getMe();
          setUser(profile);
          setToken(storedToken);
        } catch (error) {
          console.error("Failed to authenticate token:", error);
          // Token is invalid or expired
          localStorage.removeItem("token");
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (credentials: any) => {
    try {
      const response = await loginUser(credentials);
      const { access_token } = response;
      localStorage.setItem("token", access_token);
      setToken(access_token);
      
      const profile = await getMe();
      setUser(profile);
      return profile;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const register = async (userData: any) => {
    try {
      await registerUser(userData);
      // Automatically log in after registration
      return await login({
        email: userData.email,
        password: userData.password,
      });
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updatedUser } : null));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser, language, changeLanguage }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
