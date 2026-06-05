import { Plus, LayoutGrid, List } from "lucide-react"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { useAuthStore } from "@/store/useAuthStore"
import LoadingScreen from "@/components/ui/LoadingScreen"
import { CreateCanvasDialog } from "@/components/ui/CreateCanvasDialog"
import { DeleteCanvasDialog } from "@/components/ui/DeleteCanvasDialog"
import { toast } from "sonner"
import { useCanvasStore } from "@/store/useCanvasStore"

import type { Canvas } from "@/types/types"
import { Header } from "@/components/dashboard/Header"
import { CanvasCard } from "@/components/Cards/CanvasCard"
import { CanvasRow } from "@/components/dashboard/CanvasRow"
import { EmptyState } from "@/components/dashboard/EmptyState"


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
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      <Header user={user} onLogout={handleLogout} />
      
      <main className="grow max-w-6xl w-full mx-auto px-6 py-12">
        {/* Create Section */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold tracking-tight">Create New</h2>
          </div>
          <button 
            onClick={() => setIsDialogOpen(true)}
            className="w-full h-40 group relative overflow-hidden rounded-2xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/2 transition-all duration-300 flex flex-col items-center justify-center gap-4"
          >
            <div className="w-12 h-12 rounded-full bg-foreground/5 border border-border flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-all">
              <Plus size={24} className="text-foreground/40 group-hover:text-primary-foreground" />
            </div>
            <div className="text-center">
              <span className="block text-foreground/60 font-medium group-hover:text-foreground transition-colors">Blank Canvas</span>
              <span className="text-foreground/20 text-xs">Start a technical diagram from scratch</span>
            </div>
          </button>
        </section>

        {/* History Section */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold tracking-tight">Recent Diagrams</h2>
              <span className="px-2 py-0.5 rounded-md bg-foreground/5 text-[10px] font-mono text-foreground/40">
                {canvases.length}
              </span>
            </div>

            {canvases.length > 0 && (
              <div className="flex items-center bg-foreground/5 p-1 rounded-xl border border-border">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-foreground/40 hover:text-foreground'}`}
                >
                  <LayoutGrid size={16} />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-foreground/40 hover:text-foreground'}`}
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
      
      <footer className="py-8 border-t border-border text-center">
        <p className="text-foreground/20 text-xs">Layer Dashboard v1.0 — Productivity for thinkers.</p>
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