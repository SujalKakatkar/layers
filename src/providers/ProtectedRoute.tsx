import {Navigate} from "react-router";
import {useAuthStore} from "../store/useAuthStore";
import type {ReactNode} from "react";

export default function ProtectedRoute ({children}: {children: ReactNode}) {
    const user = useAuthStore((s) => s.user);
    const loading = useAuthStore((s) => s.loading);

    if(loading) return <p>Loading...</p>;
    if(!user) return <Navigate to="/auth/sign-in" />;

    return children;
}