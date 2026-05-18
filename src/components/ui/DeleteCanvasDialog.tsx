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
      <DialogContent className="sm:max-w-[400px] bg-background border-border p-0 overflow-hidden rounded-3xl">
        <div className="p-6 pt-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle size={32} className="text-destructive" />
          </div>
          
          <DialogHeader className="items-center text-center gap-3">
            <DialogTitle className="text-2xl font-bold text-foreground">Delete Canvas?</DialogTitle>
            <DialogDescription className="text-foreground/40 text-base max-w-[280px]">
              You're about to delete <span className="text-foreground font-semibold">"{canvasTitle}"</span>. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-3 p-6 pt-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="flex-1 bg-foreground/5 border-border text-foreground hover:bg-foreground/10 hover:border-border h-12 rounded-xl transition-all"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isDeleting}
            className="flex-1 bg-destructive hover:bg-destructive text-foreground font-bold h-12 rounded-xl transition-all shadow-[0_0_20px_rgba(220,38,38,0.2)]"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
