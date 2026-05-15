import {LogOut, Plus, Layout, Clock, ChevronRight, BookOpen, Trash2, LayoutGrid, List, FileText} from "lucide-react"
import {useEffect, useState} from "react"
import {useNavigate, Link} from "react-router"
import {useAuthStore, type User} from "@/store/useAuthStore"
import LoadingScreen from "@/components/ui/LoadingScreen"
import { CreateCanvasDialog } from "@/components/ui/CreateCanvasDialog"
import { DeleteCanvasDialog } from "@/components/ui/DeleteCanvasDialog"
import { toast } from "sonner"
import { useCanvasStore } from "@/store/useCanvasStore"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

type Canvas = {
  _id: string
  title: string
  createdAt: string
}

// ─── Header Component ────────────────────────────────────────────────────────
function Header ({user, onLogout}: {user: User | null, onLogout: () => void}) {
  return (
    <header className="sticky top-0 z-50 bg-black border-b border-white/5 px-6">
      <div className="max-w-6xl mx-auto h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-emerald-700 flex items-center justify-center text-xs font-bold text-white border border-emerald-500/20">
            {user?.fullName?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-bold text-white">{user?.fullName || 'User'}</p>
            <p className="text-[10px] text-white/40">Personal Workspace</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link 
            to="/learn"
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 transition-all"
          >
            <BookOpen size={14} />
            <span>Learn LayerScript</span>
          </Link>
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-white/60 hover:text-white hover:bg-white/10 transition-all"
          >
            <LogOut size={14} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  )
}

// ─── Canvas Card (Grid) ──────────────────────────────────────────────────────
function CanvasCard ({canvas, onClick, onDelete}: {canvas: Canvas, onClick: () => void, onDelete: () => void}) {
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
      <div className="absolute top-4 right-4 z-10">
        <Tooltip>
          <TooltipTrigger render={
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-2 rounded-lg bg-red-500/10 text-red-500/50 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-500 transition-all duration-200"
            >
              <Trash2 size={16} />
            </button>
          } />
          <TooltipContent side="top" className="bg-zinc-900 text-white border-zinc-800">
            Delete Canvas
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="aspect-video mb-5 rounded-xl bg-black border border-white/5 flex items-center justify-center overflow-hidden">
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
          <h3 className="text-white font-semibold text-base mb-1 group-hover:text-emerald-400 transition-colors line-clamp-1">
            {canvas.title}
          </h3>
          <div className="flex items-center gap-2 text-white/30 text-xs">
            <Clock size={12} />
            <span>{formattedDate}</span>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
          <ChevronRight size={14} className="text-white/60" />
        </div>
      </div>
    </div>
  )
}

// ─── Canvas Row (List) ───────────────────────────────────────────────────────
function CanvasRow ({canvas, onClick, onDelete}: {canvas: Canvas, onClick: () => void, onDelete: () => void}) {
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(canvas.createdAt))

  return (
    <div 
      onClick={onClick}
      className="group flex items-center justify-between p-4 bg-white/2 border border-white/8 rounded-xl hover:border-white/20 hover:bg-white/4 transition-all duration-200 cursor-pointer mb-3"
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-black border border-white/10 flex items-center justify-center text-emerald-500/50 group-hover:text-emerald-500 transition-colors">
          <FileText size={20} />
        </div>
        <div>
          <h3 className="text-white font-medium group-hover:text-emerald-400 transition-colors">
            {canvas.title}
          </h3>
          <p className="text-white/20 text-[10px] flex items-center gap-1">
            <Clock size={10} />
            Updated {formattedDate}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-2 rounded-lg text-white/20 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
        >
          <Trash2 size={16} />
        </button>
        <div className="w-8 h-8 flex items-center justify-center text-white/20 group-hover:text-white/60">
          <ChevronRight size={16} />
        </div>
      </div>
    </div>
  )
}

// ─── Empty State ─────────────────────────────────────────────────────────────
function EmptyState ({onCreate}: {onCreate: () => void}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 rounded-3xl bg-white/3 border border-white/8 flex items-center justify-center mb-6">
        <Layout size={40} className="text-white/10" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-3">No diagrams yet</h2>
      <p className="text-white/40 mb-8 max-w-xs">
        Your canvas is a blank slate. Start by creating your first technical diagram.
      </p>
      <button
        onClick={onCreate}
        className="flex items-center gap-2 rounded-xl px-6 py-3 font-semibold bg-emerald-700 text-white hover:bg-emerald-600 transition-all duration-200"
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
  const { canvases, listAllCanvases, removeCanvas, loading: isLoading } = useCanvasStore()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [canvasToDelete, setCanvasToDelete] = useState<Canvas | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    return (localStorage.getItem('dashboardViewMode') as 'grid' | 'list') || 'grid'
  })
  const navigate = useNavigate()

  useEffect(() => {
    localStorage.setItem('dashboardViewMode', viewMode)
  }, [viewMode])

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

  const handleConfirmDelete = async () => {
    if (!canvasToDelete) return
    try {
      await removeCanvas(canvasToDelete._id)
      toast.success("Canvas deleted successfully")
      setCanvasToDelete(null)
    } catch (err) {
      console.error("Failed to delete canvas", err)
      toast.error("Failed to delete canvas")
    }
  }

  if (isLoading && canvases.length === 0) return <LoadingScreen />

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col">
      <Header user={user} onLogout={handleLogout} />
      
      <main className="flex-grow max-w-6xl w-full mx-auto px-6 py-12">
        {/* Create Section */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold tracking-tight">Create New</h2>
          </div>
          <button 
            onClick={() => setIsDialogOpen(true)}
            className="w-full h-40 group relative overflow-hidden rounded-2xl border-2 border-dashed border-white/10 hover:border-emerald-500/40 hover:bg-emerald-500/2 transition-all duration-300 flex flex-col items-center justify-center gap-4"
          >
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-emerald-700 group-hover:border-emerald-600 transition-all">
              <Plus size={24} className="text-white/40 group-hover:text-white" />
            </div>
            <div className="text-center">
              <span className="block text-white/60 font-medium group-hover:text-white transition-colors">Blank Canvas</span>
              <span className="text-white/20 text-xs">Start a technical diagram from scratch</span>
            </div>
          </button>
        </section>

        {/* History Section */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold tracking-tight">Recent Diagrams</h2>
              <span className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] font-mono text-white/40">
                {canvases.length}
              </span>
            </div>

            {canvases.length > 0 && (
              <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-emerald-600 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                >
                  <LayoutGrid size={16} />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-emerald-600 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                >
                  <List size={16} />
                </button>
              </div>
            )}
          </div>

          {canvases.length === 0 ? (
            <EmptyState onCreate={() => setIsDialogOpen(true)} />
          ) : (
            <>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {canvases.map(canvas => (
                    <CanvasCard 
                      key={canvas._id} 
                      canvas={canvas} 
                      onClick={() => navigate(`/canvas/${canvas._id}`)} 
                      onDelete={() => setCanvasToDelete(canvas)}
                    />
                  ))}
                </div>
              ) : (
                <div className="w-full">
                  {canvases.map(canvas => (
                    <CanvasRow 
                      key={canvas._id} 
                      canvas={canvas} 
                      onClick={() => navigate(`/canvas/${canvas._id}`)} 
                      onDelete={() => setCanvasToDelete(canvas)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </main>
      
      <footer className="py-8 border-t border-white/5 text-center">
        <p className="text-white/20 text-xs">Layer Dashboard v1.0 — Productivity for thinkers.</p>
      </footer>

      <CreateCanvasDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        onSuccess={listAllCanvases}
      />

      <DeleteCanvasDialog
        open={!!canvasToDelete}
        onOpenChange={(open) => !open && setCanvasToDelete(null)}
        onConfirm={handleConfirmDelete}
        canvasTitle={canvasToDelete?.title || ""}
      />
    </div>
  )
}

export default Dashboard