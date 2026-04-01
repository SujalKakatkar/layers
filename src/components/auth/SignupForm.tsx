
import {Button} from "@/components/ui/button"

import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
    FieldSeparator,
} from "@/components/ui/field"
import {Input} from "@/components/ui/input"
import {signupSchema, type SignupSchemaType} from "@/schemas/signupSchema"
import {useAuthStore} from "@/store/useAuthStore"
import {zodResolver} from "@hookform/resolvers/zod"
import {useForm} from "react-hook-form"
import {Link, useNavigate} from "react-router"


function SignupForm () {

    const Signup = useAuthStore((s) => s.signUp)
    const googleSignUp = useAuthStore((s)=>s.signInWithGoogle)
    const navigate = useNavigate()

    const {register, handleSubmit, formState: {errors}} = useForm<SignupSchemaType>({
        resolver: zodResolver(signupSchema)
    })

    const handleSignup = async (data: SignupSchemaType) => {
        const {email, password} = data;

        const {error} = await Signup(email, password)

        if(error) {
            console.error(error.message);
            return
        }

        console.log("signup successfull");

        navigate("/dashboard")

    }



    return (
        <form onSubmit={handleSubmit(handleSignup)} className="p-6 md:p-8">
            <FieldGroup>
                <div className="flex flex-col items-center gap-2 text-center">
                    <h1 className="text-2xl font-bold">Create your account</h1>
                    <p className="text-sm text-balance text-muted-foreground">
                        Enter your email below to create your account
                    </p>
                </div>
                <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                        id="email"
                        type="email"
                        placeholder="m@example.com"
                        {...register("email")}

                    />
                    <FieldDescription>
                        We&apos;ll use this to contact you. We will not share your
                        email with anyone else.
                    </FieldDescription>
                </Field>
                <Field>
                    <Field className="grid grid-cols-2 gap-4">
                        <Field>
                            <FieldLabel htmlFor="password">Password</FieldLabel>
                            <Input id="password" type="password"
                                {...register("password")}
                            />
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="confirm-password">
                                Confirm Password
                            </FieldLabel>
                            <Input
                                {...register("confirmPassword")}
                                id="confirm-password" type="password" />
                        </Field>
                    </Field>
                    <FieldDescription>
                        Must be at least 8 characters long.
                    </FieldDescription>
                </Field>
                <Field>
                    <Button type="submit">Create Account</Button>
                </Field>
                <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                    Or continue with
                </FieldSeparator>
                <Field className="grid grid-cols-1 ">

                    <Button variant="outline" type="button" onClick={googleSignUp}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                            <path
                                d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                                fill="currentColor"
                            />
                        </svg>
                        <span className="sr-only">Sign up with Google</span>
                        <span>Sign up with google</span>
                    </Button>

                </Field>
                <FieldDescription className="text-center">
                    Already have an account? <Link to="/auth/sign-in">Sign in</Link>
                </FieldDescription>
            </FieldGroup>
        </form>
    )
}

export default SignupForm
