import {cn} from "@/lib/utils"
import {Card, CardContent} from "@/components/ui/card"
import ForgotPasswordForm from "../auth/ForgotPasswordForm"

export function ForgotPasswordCard ({
    className,
    ...props
}: React.ComponentProps<"div">) {
    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card className="overflow-hidden p-0 ">
                <CardContent className="grid p-0">
                    <ForgotPasswordForm/>
                </CardContent>
            </Card>
        </div>
    )
}
