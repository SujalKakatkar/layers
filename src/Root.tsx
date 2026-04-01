import {RouterProvider} from "react-router";
import {useAuthStore} from "./store/useAuthStore";
import {routes} from "./routes/route";
import Loading from "./loading/Loading";

export default function Root () {
    const loading = useAuthStore((s) => s.loading);

    if(loading) {
        return <Loading/>; 
    }

    return <RouterProvider router={routes} />;
}