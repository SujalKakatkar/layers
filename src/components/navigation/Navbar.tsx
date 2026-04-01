import {BringToFront} from "lucide-react"
import {Button} from "../ui/button"
import {Link} from "react-router"

function Navbar () {
    return (
        <nav className="sticky top-0 z-50 flex justify-center px-4 py-3">
            <main className="w-full max-w-6xl flex items-center justify-between rounded-xbg-white/60 dark:bg-zinc-900/60 backdrop-blur-lg border border-white/20 shadow-sm px-5 h-16">

                {/* Logo */}
                <section className="flex items-center gap-2">
                    <BringToFront className="h-5 w-5 text-primary" />
                    <h1 className="font-semibold text-lg tracking-tight">
                        Layer
                    </h1>
                </section>

                {/* Actions */}
                <section className="flex items-center gap-3">
                    <Link to={'/auth/sign-in'}>
                        <Button variant="ghost" className="hidden sm:inline-flex">
                            Log In
                        </Button>
                    </Link>
                    <Button className="rounded-lg px-5 font-medium shadow-sm">
                        Try Layer
                    </Button>

                </section>

            </main>
        </nav>
    )
}

export default Navbar