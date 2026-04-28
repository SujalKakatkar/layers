import { Link } from "react-router"

function Navbar() {
  return (
    <nav className="sticky bg-black/80 top-0 z-50 flex justify-center px-4 pt-4">
      <main className="w-full max-w-6xl flex items-center justify-between
        rounded-2xl
        bg-black/80
        backdrop-blur-xl
        border border-white/8
        shadow-lg shadow-black/40
        px-6 h-[60px]">

        {/* Logo */}
        <Link to="/" className="flex items-center">
          <h1 className="font-black text-xl tracking-tight text-white">
            Layer
          </h1>
        </Link>

        {/* Actions */}
        <section className="flex items-center gap-4">
          <Link to="/auth/sign-in">
            <button className="hidden sm:inline-flex text-white/50 hover:text-white text-sm font-medium transition-colors duration-150 px-3 py-1.5">
              Log In
            </button>
          </Link>
          <Link to="/dashboard">
            <button className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold
              bg-emerald-700 text-white hover:bg-emerald-600
              transition-all duration-200 hover:shadow-md hover:shadow-emerald-500/20">
              Start Building
            </button>
          </Link>
        </section>

      </main>
    </nav>
  )
}

export default Navbar