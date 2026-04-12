import {Button} from "@/components/ui/button"
import {ArrowRight} from "lucide-react"
import {useNavigate} from "react-router"

export default function Home () {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <main className="flex flex-col items-center text-center max-w-3xl">

        {/* Headline */}
        <h2 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-tight">
          Think visually.
        </h2>

        {/* Subtext */}
        <p className="mt-6 text-lg text-zinc-400 max-w-xl">
          A minimal whiteboard tool to organize ideas and bring clarity to your thoughts.
        </p>

        {/* CTA */}
        <div className="mt-10">
          <Button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-6 py-5 text-base font-semibold 
            bg-white text-black hover:bg-zinc-200 
            transition-all duration-200 rounded-lg shadow-sm hover:shadow-md"
          >
            Try Layer
            <ArrowRight size={18} />
          </Button>
        </div>

      </main>
    </div>
  )
}