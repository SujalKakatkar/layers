import {LogOut, Plus, Layout, Clock, ChevronRight} from "lucide-react"
import {useEffect, useState} from "react"
import {useNavigate} from "react-router"
import {useAuthStore} from "@/store/useAuthStore"
import LoadingScreen from "@/components/ui/LoadingScreen"
import { CreateCanvasDialog } from "@/components/ui/CreateCanvasDialog"
import { toast } from "sonner"
import { useCanvasStore } from "@/store/useCanvasStore"

type Canvas = {
  _id: string
  title: string
  createdAt: string
}

// ─── Header Component ────────────────────────────────────────────────────────
function Header ({user, onLogout}: {user: any, onLogout: () => void}) {


  return (
    <header className="sticky top-0 z-50 bg-black border-b border-white/5 px-6">
      <div className="max-w-6xl mx-auto h-16 flex items-center justify-between">
        {/* Left: User Details */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-emerald-700 flex items-center justify-center text-xs font-bold text-white border border-emerald-500/20">
            {user.fullName[0].toUpperCase()}
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-bold text-white">{user?.fullName || 'User'}</p>
            <p className="text-[10px] text-white/40">Personal Workspace</p>
          </div>
        </div>

        {/* Right: Logout */}
        <button 
          onClick={onLogout}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-white/60 hover:text-white hover:bg-white/10 transition-all"
        >
          <LogOut size={14} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  )
}

// ─── Canvas Card ─────────────────────────────────────────────────────────────
function CanvasCard ({canvas, onClick}: {canvas: Canvas, onClick: () => void}) {
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(canvas.createdAt))

  return (
    <div 
      onClick={onClick}
      className="group relative bg-white/2 border border-white/8 rounded-2xl p-5 hover:border-white/20 hover:bg-white/4 transition-all duration-300 cursor-pointer hover:-translate-y-1"
    >
      <div className="aspect-video mb-5 rounded-xl bg-black border border-white/5 flex items-center justify-center overflow-hidden">
        {/* Placeholder for preview */}
        <div className="opacity-10 group-hover:opacity-20 transition-opacity">
           <svg width="100" height="60" viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg">
             <rect x="10" y="10" width="30" height="15" rx="2" stroke="white" strokeWidth="2"/>
             <rect x="60" y="35" width="30" height="15" rx="2" stroke="white" strokeWidth="2"/>
             <path d="M40 17.5H60" stroke="white" strokeWidth="2" strokeDasharray="4 4"/>
           </svg>
        </div>
      </div>
      
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-white font-semibold text-base mb-1 group-hover:text-emerald-400 transition-colors">
            {canvas.title}
          </h3>
          <div className="flex items-center gap-2 text-white/30 text-xs">
            <Clock size={12} />
            <span>Updated {formattedDate}</span>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
          <ChevronRight size={14} className="text-white/60" />
        </div>
      </div>
    </div>
  )
}

// ─── New Canvas Card ─────────────────────────────────────────────────────────
function NewCanvasCard ({onClick}: {onClick: () => void}) {
  return (
    <button 
      onClick={onClick}
      className="group flex flex-col items-center justify-center aspect-square md:aspect-auto md:h-full min-h-[240px] rounded-2xl border-2 border-dashed border-white/10 hover:border-emerald-500/40 hover:bg-emerald-500/[0.02] transition-all duration-300"
    >
      <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:bg-emerald-700 group-hover:border-emerald-600 transition-all">
        <Plus size={24} className="text-white/40 group-hover:text-white" />
      </div>
      <span className="text-white/40 font-medium group-hover:text-white transition-colors">Create New Canvas</span>
    </button>
  )
}

// ─── Empty State ─────────────────────────────────────────────────────────────
function EmptyState ({onCreate}: {onCreate: () => void}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 rounded-3xl bg-white/[0.03] border border-white/8 flex items-center justify-center mb-6">
        <Layout size={40} className="text-white/10" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-3">No diagrams yet</h2>
      <p className="text-white/40 mb-8 max-w-xs">
        Your canvas is a blank slate. Start by creating your first technical diagram.
      </p>
      <button
        onClick={onCreate}
        className="flex items-center gap-2 rounded-xl px-6 py-3 font-semibold
          bg-emerald-700 text-white hover:bg-emerald-600
          transition-all duration-200"
      >
        <Plus size={18} />
        Create Canvas
      </button>
    </div>
  )
}

// ─── Dashboard Main ──────────────────────────────────────────────────────────
function Dashboard () {
  const logout = useAuthStore((s) => s.logout)
  const user = useAuthStore((s) => s.user)
  const { canvases, listAllCanvases, loading: isLoading } = useCanvasStore()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    listAllCanvases().catch(err => {
      console.error("Failed to list canvases", err)
      toast.error("Failed to load canvases")
    })
  }, [listAllCanvases])

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  function openCreateDialog () {
    setIsDialogOpen(true)
  }

  if (isLoading) return <LoadingScreen />

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <Header user={user} onLogout={handleLogout} />
      
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl font-black tracking-tight mb-2">Your Canvases</h2>
            <p className="text-white/40 text-sm">Create and manage your technical diagrams.</p>
          </div>
          <div className="hidden sm:block text-xs font-mono text-white/20">
            {canvases.length} {canvases.length === 1 ? 'Canvas' : 'Canvases'}
          </div>
        </div>

        {canvases.length === 0 ? (
          <EmptyState onCreate={openCreateDialog} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <NewCanvasCard onClick={openCreateDialog} />
            {canvases.map(canvas => (
              <CanvasCard 
                key={canvas._id} 
                canvas={canvas} 
                onClick={() => navigate(`/canvas/${canvas._id}`)} 
              />
            ))}
          </div>
        )}
      </main>
      
      <footer className="mt-20 py-8 border-t border-white/5 text-center">
        <p className="text-white/20 text-xs">Layer Dashboard v1.0 — Productivity for thinkers.</p>
      </footer>

      <CreateCanvasDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
      />
    </div>
  )
}

export default Dashboard