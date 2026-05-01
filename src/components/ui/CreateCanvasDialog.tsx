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
}

export function CreateCanvasDialog({ open, onOpenChange }: CreateCanvasDialogProps) {
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
      onOpenChange(false)
      navigate(`/canvas/${id}`)
    } catch (error: any) {
      console.error("Failed to create canvas", error)
      toast.error(error.response?.data?.message || "Failed to create canvas")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-[#09090b] border-white/10">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">Create New Canvas</DialogTitle>
          <DialogDescription className="text-white/40">
            Give your diagram a name to get started.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name" className="text-xs font-semibold text-white/60 uppercase tracking-wider">
              Canvas Name
            </Label>
            <Input
              id="name"
              ref={inputRef}
              placeholder="e.g. System Architecture"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-emerald-500/50 h-11"
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
            className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-bold h-11 transition-all"
          >
            {isLoading ? "Creating..." : "Create Canvas"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
