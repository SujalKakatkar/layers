import {SignupCard} from '@/components/Cards/SignupCard'

function Signup() {
  return (
    <div className="dark flex min-h-svh flex-col items-center justify-center  bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <SignupCard />
      </div>
    </div>
  )
}

export default Signup
