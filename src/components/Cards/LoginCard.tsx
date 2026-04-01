import {cn} from "@/lib/utils"
import {Card, CardContent} from "@/components/ui/card"
import {FieldDescription} from "@/components/ui/field"
import LoginForm from "../auth/LoginForm"


export function LoginCard ({
    className,
    ...props
}: React.ComponentProps<"div">) {
    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card className="overflow-hidden p-0">
                <CardContent className="grid p-0 md:grid-cols-2">
                    <LoginForm/>
                    <div className="relative hidden bg-muted md:block">
                        <img
                            src="/cardimage.webp"
                            alt="Image"
                            className="absolute inset-0 h-full w-full object-cover "
                        />
                    </div>
                </CardContent>
            </Card>
            <FieldDescription className="px-6 text-center">
                By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
                and <a href="#">Privacy Policy</a>.
            </FieldDescription>
        </div>
    )
}
