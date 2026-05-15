import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field"
import {Input} from "@/components/ui/input"
import {Button} from "@/components/ui/button"
import {Link} from "react-router"
import {useForm} from 'react-hook-form'
import {useAuthStore} from "@/store/useAuthStore"
import {toast} from "sonner"

function ForgotPasswordForm () {
    const {register, handleSubmit} = useForm<{email: string}>()
    const {forgotPassword} = useAuthStore();

    const handleForgotPassword = async (data: {email: string}) => {
        const {error} = await forgotPassword(data.email);
        
        if (error) {
            toast.error("Error", {
                description: error
            });
            return;
        }

        toast.success("Reset Link Sent", {
            description: "If an account exists, a password reset link has been sent to your email."
        });
    }

    return (
        <form onSubmit={handleSubmit(handleForgotPassword)} className="p-6 md:p-8">
            <FieldGroup>
                <div className="flex flex-col items-center gap-2 text-center">
                    <h1 className="text-2xl font-bold text-emerald-600">Forgot Password</h1>
                    <p className="text-balance text-muted-foreground">
                        Enter your email address and we'll send you a link to reset your password.
                    </p>
                </div>
                <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                        id="email"
                        type="email"
                        placeholder="m@example.com"
                        {...register("email")}
                        required
                        className="focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20"
                    />
                </Field>
                
                <Field>
                    <Button type="submit" className="w-full bg-emerald-700 text-white hover:bg-emerald-600 focus:ring-2 focus:ring-emerald-500">Send Reset Link</Button>
                </Field>
                <FieldDescription className="text-center mt-4">
                    Remembered your password? <Link to="/auth/sign-in" className="text-emerald-600 hover:text-emerald-500 font-medium">Sign in</Link>
                </FieldDescription>
            </FieldGroup>
        </form>
    )
}

export default ForgotPasswordForm
