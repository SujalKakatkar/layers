import {useEffect} from "react";
import {Toaster} from "@/components/ui/sonner";
import {RouterProvider} from "react-router";
import {useAuthStore} from "./store/useAuthStore";
import {routes} from "./routes/route";
import Loading from "./loading/Loading";
import {registerLogoutHandler} from "./lib/api";

export default function Root () {
    const {checkAuth, loading} = useAuthStore();

    useEffect(() => {
        registerLogoutHandler(() => {
            console.log("logout triggered");
            useAuthStore.getState().setUser(null)
            window.location.replace("/auth/sign-in")
        })
        checkAuth();
    }, []);

    if (loading) {
        return <Loading />;
    }

    return (
        <>
            <Toaster richColors closeButton position="top-right" />
            <RouterProvider router={routes} />
        </>
    );
}