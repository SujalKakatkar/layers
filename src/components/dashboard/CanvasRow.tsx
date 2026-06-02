import { Clock, ChevronRight, Trash2, FileText } from "lucide-react"
import type { Canvas } from "@/types/types"

interface CanvasRowProps {
  canvas: Canvas
  onClick: () => void
  onDelete: () => void
}

export function CanvasRow({ canvas, onClick, onDelete }: CanvasRowProps) {
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(canvas.createdAt))

  return (
    <div 
      onClick={onClick}
      className="group flex items-center justify-between p-4 bg-foreground/2 border border-border rounded-xl hover:border-border hover:bg-foreground/4 transition-all duration-200 cursor-pointer mb-3"
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center text-primary/50 group-hover:text-primary transition-colors">
          <FileText size={20} />
        </div>
        <div>
          <h3 className="text-foreground font-medium group-hover:text-primary transition-colors">
            {canvas.title}
          </h3>
          <p className="text-foreground/20 text-[10px] flex items-center gap-1">
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
          className="p-2 rounded-lg text-foreground/20 hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100"
        >
          <Trash2 size={16} />
        </button>
        <div className="w-8 h-8 flex items-center justify-center text-foreground/20 group-hover:text-foreground/60">
          <ChevronRight size={16} />
        </div>
      </div>
    </div>
  )
}
