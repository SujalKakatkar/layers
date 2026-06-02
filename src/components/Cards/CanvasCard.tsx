import { Clock, ChevronRight, Trash2 } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { Canvas } from "@/types/types"

interface CanvasCardProps {
  canvas: Canvas
  onClick: () => void
  onDelete: () => void
}

export function CanvasCard({ canvas, onClick, onDelete }: CanvasCardProps) {
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(canvas.createdAt))

  return (
    <div 
      onClick={onClick}
      className="group relative bg-foreground/2 border border-border rounded-2xl p-5 hover:border-border hover:bg-foreground/4 transition-all duration-300 cursor-pointer hover:-translate-y-1"
    >
      <div className="absolute top-4 right-4 z-10">
        <Tooltip>
          <TooltipTrigger render={
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-2 rounded-lg bg-destructive/10 text-destructive/50 opacity-0 group-hover:opacity-100 hover:bg-destructive/20 hover:text-destructive transition-all duration-200"
            >
              <Trash2 size={16} />
            </button>
          } />
          <TooltipContent side="top" className="bg-muted text-foreground border-border">
            Delete Canvas
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="aspect-video mb-5 rounded-xl bg-background border border-border flex items-center justify-center overflow-hidden">
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
          <h3 className="text-foreground font-semibold text-base mb-1 group-hover:text-primary transition-colors line-clamp-1">
            {canvas.title}
          </h3>
          <div className="flex items-center gap-2 text-foreground/30 text-xs">
            <Clock size={12} />
            <span>{formattedDate}</span>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-foreground/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
          <ChevronRight size={14} className="text-foreground/60" />
        </div>
      </div>
    </div>
  )
}
