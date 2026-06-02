import { BookOpen, LogOut } from "lucide-react"
import { Link } from "react-router"
import { ThemeToggle } from "@/components/ThemeToggle"
import type { User } from "@/store/useAuthStore"

interface HeaderProps {
  user: User | null
  onLogout: () => void
}

export function Header({ user, onLogout }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border px-6">
      <div className="max-w-6xl mx-auto h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-foreground border border-primary/20">
            {user?.fullName?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-bold text-foreground">{user?.fullName || 'User'}</p>
            <p className="text-[10px] text-foreground/40">Personal Workspace</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link 
            to="/learn"
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-xs font-medium text-primary hover:bg-primary/20 hover:text-emerald-300 transition-all"
          >
            <BookOpen size={14} />
            <span>Learn LayerScript</span>
          </Link>
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-foreground/5 border border-border text-xs font-medium text-foreground/60 hover:text-foreground hover:bg-foreground/10 transition-all"
          >
            <LogOut size={14} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  )
}
