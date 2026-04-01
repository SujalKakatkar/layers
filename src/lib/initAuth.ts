import {useAuthStore} from "@/store/useAuthStore";
import {supabase} from "./supbase";

export const initAuthListener = () => {
    const {setUser, setSession, setLoading} = useAuthStore.getState();

    supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session ?? null);
        setUser(session?.user ?? null);

        if(window.location.hash || window.location.href.endsWith("#")) {
            window.history.replaceState(
                {},
                document.title,
                window.location.pathname + window.location.search
            );
        }
    });

    // Then fetch session
    supabase.auth.getSession().then(({data}) => {
        setSession(data.session ?? null);
        setUser(data.session?.user ?? null);
        setLoading(false);
    });
};