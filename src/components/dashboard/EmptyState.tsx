import { Layout, Plus } from "lucide-react"

interface EmptyStateProps {
  onCreate: () => void
}

export function EmptyState({ onCreate }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 rounded-3xl bg-foreground/3 border border-border flex items-center justify-center mb-6">
        <Layout size={40} className="text-foreground/10" />
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-3">No diagrams yet</h2>
      <p className="text-foreground/40 mb-8 max-w-xs">
        Your canvas is a blank slate. Start by creating your first technical diagram.
      </p>
      <button
        onClick={onCreate}
        className="flex items-center gap-2 rounded-xl px-6 py-3 font-semibold bg-primary text-primary-foreground hover:bg-primary transition-all duration-200"
      >
        <Plus size={18} />
        Create Canvas
      </button>
    </div>
  )
}
