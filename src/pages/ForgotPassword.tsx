import {ForgotPasswordCard} from "@/components/Cards/ForgotPasswordCard"

function ForgotPassword () {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-xl">
        <ForgotPasswordCard />
      </div>
    </div>
  )
}

export default ForgotPassword
