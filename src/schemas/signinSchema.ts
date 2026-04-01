import z from "zod";

export const SigninSchema = z.object({
    email: z.string().email("email is required"),
    password: z.string().min(6, "password should be 6 digit log")
})

export type SigninSchemaType = z.infer<typeof SigninSchema>