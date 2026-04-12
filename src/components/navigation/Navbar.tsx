import {Button} from "../ui/button"
import {Link} from "react-router"

function Navbar () {
    return (
        <nav className="sticky top-0 z-50 flex justify-center p-4">
            <main className="w-full max-w-5xl flex items-center justify-between 
                rounded-2xl 
                bg-white/70 dark:bg-zinc-900/70 
                backdrop-blur-xl 
                border border-zinc-200/40 dark:border-zinc-700/40 
                shadow-md 
                px-6 h-18">

                {/* Logo */}
                <section className="flex items-center">
                    <h1 className="font-black text-2xl tracking-tight">
                        Layer
                    </h1>
                </section>

                {/* Actions */}
                <section className="flex items-center gap-6">
                    <Link to={'/auth/sign-in'}>
                        <Button
                            variant="ghost"
                            className="hidden sm:inline-flex text-zinc-600 dark:text-zinc-300 hover:text-black dark:hover:text-white"
                        >
                            Log In
                        </Button>
                    </Link>

                    <Button
                        className="rounded-lg px-5 font-semibold 
  bg-white text-black 
  hover:bg-zinc-200 transition"
                    >
                        Try Layer
                    </Button>
                </section>

            </main>
        </nav>
    )
}

export default Navbar