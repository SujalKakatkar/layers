import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

interface DeleteCanvasDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  canvasTitle: string
}

export function DeleteCanvasDialog({ open, onOpenChange, onConfirm, canvasTitle }: DeleteCanvasDialogProps) {
  const [isDeleting, setIsDeleting] = React.useState(false)

  const handleConfirm = async () => {
    setIsDeleting(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] bg-[#09090b] border-white/10 p-0 overflow-hidden rounded-3xl">
        <div className="p-6 pt-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle size={32} className="text-red-500" />
          </div>
          
          <DialogHeader className="items-center text-center gap-3">
            <DialogTitle className="text-2xl font-bold text-white">Delete Canvas?</DialogTitle>
            <DialogDescription className="text-white/40 text-base max-w-[280px]">
              You're about to delete <span className="text-white font-semibold">"{canvasTitle}"</span>. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-3 p-6 pt-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20 h-12 rounded-xl transition-all"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isDeleting}
            className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold h-12 rounded-xl transition-all shadow-[0_0_20px_rgba(220,38,38,0.2)]"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
