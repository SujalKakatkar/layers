import { useTheme } from "@/components/ThemeProvider"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CheckCircle, Info, AlertTriangle, AlertCircle, Loader2 } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <CheckCircle strokeWidth={2} className="size-4" />
        ),
        info: (
          <Info strokeWidth={2} className="size-4" />
        ),
        warning: (
          <AlertTriangle strokeWidth={2} className="size-4" />
        ),
        error: (
          <AlertCircle strokeWidth={2} className="size-4" />
        ),
        loading: (
          <Loader2 strokeWidth={2} className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
