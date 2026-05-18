import { Link, useLocation } from "react-router"
import { useAuthStore } from "@/store/useAuthStore"
import { ThemeToggle } from "../ThemeToggle"

function Navbar() {
  const user = useAuthStore((s) => s.user)
  const location = useLocation()

  return (
    <nav className="sticky bg-background top-0 z-50 flex justify-center px-4 pt-4">
      <main className="w-full max-w-6xl flex items-center justify-between
        rounded-2xl
        bg-background/80
        backdrop-blur-xl
        border border-border
        px-6 h-[60px]">

        {/* Logo */}
        <Link to="/" className="flex items-center">
          <h1 className="font-black text-xl tracking-tight text-primary ">
            Layer
          </h1>
        </Link>

        {/* Actions */}
        <section className="flex items-center gap-4">
          {location.pathname !== '/learn' && (
            <Link to="/learn" className="hidden sm:inline-flex text-foreground/50 hover:text-foreground text-sm font-medium transition-colors duration-150 px-3 py-1.5">
              Learn Layers
            </Link>
          )}
          {!user && (
            <Link to="/auth/sign-in">
              <button className="hidden sm:inline-flex text-foreground/50 hover:text-foreground text-sm font-medium transition-colors duration-150 px-3 py-1.5">
                Log In
              </button>
            </Link>
          )}
          
          <ThemeToggle />

          <Link to="/dashboard">
            <button className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold
              bg-primary text-primary-foreground hover:bg-primary
              transition-all duration-200 hover:shadow-md hover:shadow-primary/20">
              {user ? "Dashboard" : "Start Building"}
            </button>
          </Link>
        </section>

      </main>
    </nav>
  )
}

export default Navbar