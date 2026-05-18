import * as React from "react"
import { useNavigate } from "react-router"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useCanvasStore } from "@/store/useCanvasStore"

interface CreateCanvasDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreateCanvasDialog({ open, onOpenChange, onSuccess }: CreateCanvasDialogProps) {
  const [name, setName] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const navigate = useNavigate()
  const inputRef = React.useRef<HTMLInputElement>(null)
  const createCanvas = useCanvasStore((state) => state.createCanvas)

  React.useEffect(() => {
    if (open) {
      setName("")
      // Autofocus input after a short delay to ensure dialog is rendered
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  const handleCreate = async () => {
    const trimmedName = name.trim()
    if (!trimmedName) return

    setIsLoading(true)
    try {
      const id = await createCanvas(trimmedName)
      toast.success("Canvas created successfully")
      onSuccess?.()
      onOpenChange(false)
      navigate(`/canvas/${id}`)
    } catch (error: unknown) {
      console.error("Failed to create canvas", error)
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to create canvas"
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">Create New Canvas</DialogTitle>
          <DialogDescription className="text-foreground/40">
            Give your diagram a name to get started.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name" className="text-xs font-semibold text-foreground/60 uppercase tracking-wider">
              Canvas Name
            </Label>
            <Input
              id="name"
              ref={inputRef}
              placeholder="e.g. System Architecture"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-foreground/5 border-border text-foreground placeholder:text-foreground/20 focus-visible:ring-primary/50 h-11"
              onKeyDown={(e) => {
                if (e.key === "Enter" && name.trim()) {
                  handleCreate()
                }
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleCreate}
            disabled={!name.trim() || isLoading}
            className="w-full bg-primary hover:bg-primary text-foreground font-bold h-11 transition-all"
          >
            {isLoading ? "Creating..." : "Create Canvas"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
