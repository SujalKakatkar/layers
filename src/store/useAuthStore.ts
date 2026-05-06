import {create} from "zustand";
import {api} from "@/lib/api";

export type User = {
    _id: string;
    email: string;
    fullName: string;
};

type AuthState = {
    user: User | null;
    loading: boolean;

    setUser: (user: User | null) => void;
    setLoading: (loading: boolean) => void;

    signUp: (email: string, password: string, fullName: string) => Promise<{error: string | null}>;
    login: (email: string, password: string) => Promise<{error: string | null}>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
    forgotPassword: (email: string) => Promise<{error: string | null}>;
    resetPassword: (token: string, password: string) => Promise<{error: string | null}>;
};

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    loading: true,

    setUser: (user) => set({user}),
    setLoading: (loading) => set({loading}),

    signUp: async (email, password, fullName) => {
        try {
            const response = await api.post("/auth/signup", {
                fullName,
                email,
                password,
            });
        
            set({user: response.data.data});
            return {error: null};
        } catch (error: any) {
            console.error("Signup error:", error);
            return {
                error: error.response?.data?.message || "An error occurred during signup",
            };
        }finally{
            set({loading: false})
        }
    },

    login: async (email, password) => {
        try {
            const response = await api.post("/auth/signin", {
                email,
                password,
            });
            
            set({user: response.data.data});
            
            return {error: null};
        } catch (error: any) {
            
            
            return {
                error: error.response?.data?.message || "An error occurred during login",
            };
        }finally{
            set({loading: false})
        }
    },

    logout: async () => {
        try {
            await api.post("/auth/logout");
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            set({user: null});
        }
    },

    checkAuth: async () => {
        try {
            const response = await api.get("/auth/me");
            set({user: response.data.data});
        } catch (error) {
            set({user: null});
        } finally {
            set({loading: false});
        }
    },

    forgotPassword: async (email: string) => {
        try {
            await api.post("/auth/forgot-password", {email});
            return {error: null};
        } catch (error: any) {
            console.error("Forgot password error:", error);
            return {
                error: error.response?.data?.message || "Failed to send reset link",
            };
        }
    },

    resetPassword: async (token: string, password: string) => {
        try {
            await api.post(`/auth/reset-password?token=${token}`, { password});
            return {error: null};
        } catch (error: any) {
            console.error("Reset password error:", error);
            return {
                error: error.response?.data?.message || "Failed to reset password",
            };
        }
    },
}));