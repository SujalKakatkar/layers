import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field"
import {Input} from "@/components/ui/input"
import {Button} from "@/components/ui/button"
import {Link, useNavigate, useSearchParams} from "react-router"
import {useForm} from 'react-hook-form'
import {useAuthStore} from "@/store/useAuthStore"
import {toast} from "sonner"

function ResetPasswordForm () {
    const {register, handleSubmit} = useForm()
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const navigate = useNavigate();
    const {resetPassword} = useAuthStore();

    const handleResetPassword = async (data: Record<string, string>) => {
        if (data.password !== data.confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        if (!token) {
            toast.error("Invalid reset token");
            return;
        }

        const {error} = await resetPassword(token, data.password);
        
        if (error) {
            toast.error("Failed to reset password", {
                description: error
            });
            return;
        }

        toast.success("Password Reset Successful", {
            description: "You can now login with your new password."
        });
        navigate("/auth/sign-in");
    }

    return (
        <form onSubmit={handleSubmit(handleResetPassword)} className="p-6 md:p-8">
            <FieldGroup>
                <div className="flex flex-col items-center gap-2 text-center">
                    <h1 className="text-2xl font-bold text-emerald-600">Reset Password</h1>
                    <p className="text-balance text-muted-foreground">
                        Enter your new password below.
                    </p>
                </div>
                <Field>
                    <Field className="grid grid-cols-1 gap-4">
                        <Field>
                            <FieldLabel htmlFor="password">New Password</FieldLabel>
                            <Input id="password" type="password"
                                {...register("password")}
                                required
                                className="focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20"
                            />
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="confirm-password">
                                Confirm Password
                            </FieldLabel>
                            <Input
                                {...register("confirmPassword")}
                                id="confirm-password" type="password" 
                                required
                                className="focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20"
                            />
                        </Field>
                    </Field>
                    <FieldDescription>
                        Must be at least 8 characters long.
                    </FieldDescription>
                </Field>
                <Field>
                    <Button type="submit" className="w-full bg-emerald-700 text-white hover:bg-emerald-600 focus:ring-2 focus:ring-emerald-500">Reset Password</Button>
                </Field>
                <FieldDescription className="text-center mt-4">
                    Remembered your password? <Link to="/auth/sign-in" className="text-emerald-600 hover:text-emerald-500 font-medium">Sign in</Link>
                </FieldDescription>
            </FieldGroup>
        </form>
    )
}

export default ResetPasswordForm
