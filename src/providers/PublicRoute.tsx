import {Navigate} from "react-router";
import {useAuthStore} from "../store/useAuthStore";
import type {ReactNode} from "react";
import Loading from "@/loading/Loading";

export default function PublicRoute ({children}: {children: ReactNode}) {
    const user = useAuthStore((s) => s.user);
    const loading = useAuthStore((s) => s.loading);

    
    if (loading) return <Loading />;
    if (user) return <Navigate to="/dashboard" />;

    return children;
}
