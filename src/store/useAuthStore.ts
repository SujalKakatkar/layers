import {create} from "zustand";
import type {User, Session} from "@supabase/supabase-js";
import {supabase} from "@/lib/supbase";

type AuthState = {
    user: User | null;
    session: Session | null;
    loading: boolean;

    setUser: (user: User | null) => void;
    setSession: (session: Session | null) => void;
    setLoading: (loading: boolean) => void;

    signUp: (email: string, password: string) => Promise<{error: Error | null}>;
    login: (email: string, password: string) => Promise<{error: Error | null}>;
    signInWithGoogle: () => Promise<{error: Error | null}>
    logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    session: null,
    loading: true,

    setUser: (user) => set({user}),
    setSession: (session) => set({session}),
    setLoading: (loading) => set({loading}),

    signUp: async (email, password) => {
        const {error} = await supabase.auth.signUp({
            email,
            password,
        });

        return {error};
    },

    login: async (email, password) => {
        const {error} = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        return {error};
    },

    logout: async () => {
        await supabase.auth.signOut();
        set({user: null, session: null});
    },
    signInWithGoogle: async () => {
        const {error} = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/dashboard/`,
            },
        });

        return {error};
    },
}));