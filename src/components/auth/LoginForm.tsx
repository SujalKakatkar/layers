import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
    FieldSeparator,
} from "@/components/ui/field"
import {Input} from "@/components/ui/input"
import {Button} from "@/components/ui/button"
import {Link, useNavigate} from "react-router"
import {SigninSchema, type SigninSchemaType} from "@/schemas/signinSchema"
import {useForm} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import {useAuthStore} from "@/store/useAuthStore"

import {toast} from "sonner"

function LoginForm () {
    const navigate = useNavigate()
    const {register, handleSubmit, formState: {errors}} = useForm<SigninSchemaType>({
        resolver: zodResolver(SigninSchema)
    })

    const login = useAuthStore((s) => s.login);

    const handleSignin = async (data: SigninSchemaType) => {
        const {error} = await login(data.email, data.password);
        
        if (error) {
            toast.error("Login failed", {
                description: typeof error === 'string' ? error : "Invalid email or password."
            });
            return;
        }
        
        navigate('/dashboard', {replace: true});
    }

    return (
        <form onSubmit={handleSubmit(handleSignin)} className="p-6 md:p-8">
            <FieldGroup>
                <div className="flex flex-col items-center gap-2 text-center">
                    <h1 className="text-2xl font-bold text-primary">Welcome back</h1>
                    <p className="text-balance text-muted-foreground">
                        Login to your Acme Inc account
                    </p>
                </div>
                <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                        id="email"
                        type="email"
                        placeholder="m@example.com"
                        {...register("email")}
                        className="focus-visible:border-primary focus-visible:ring-primary/20"
                    />
                    {errors.email && (
                        <p className="text-xs text-destructive mt-1">{errors.email.message}</p>
                    )}
                </Field>
                <Field>
                    <div className="flex items-center">
                        <FieldLabel htmlFor="password">Password</FieldLabel>
                        <Link
                            to="/auth/forgot-password"
                            className="ml-auto text-sm text-primary hover:text-primary font-medium underline-offset-2 hover:underline"
                        >
                            Forgot your password?
                        </Link>
                    </div>
                    <Input
                        {...register("password")}
                        id="password" type="password" 
                        className="focus-visible:border-primary focus-visible:ring-primary/20"
                    />
                    {errors.password && (
                        <p className="text-xs text-destructive mt-1">{errors.password.message}</p>
                    )}
                </Field>
                <Field>
                    <Button type="submit" className="w-full bg-primary text-foreground hover:bg-primary focus:ring-2 focus:ring-primary">Login</Button>
                </Field>
                <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                    Or continue with
                </FieldSeparator>
                <Field className="grid grid-cols-1 gap-4">

                    <Button variant="outline" type="button" >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                            <path
                                d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                                fill="currentColor"
                            />
                        </svg>
                        <span className="sr-only">Login with Google</span>
                        <span className="">Login with Google</span>
                    </Button>

                </Field>
                <FieldDescription className="text-center">
                    Don&apos;t have an account? <Link to="/auth/sign-up" className="text-primary hover:text-primary font-medium">Sign up</Link>
                </FieldDescription>
            </FieldGroup>
        </form>
    )
}

export default LoginForm
