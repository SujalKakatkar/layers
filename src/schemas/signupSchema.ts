import {z} from "zod";

export const signupSchema = z
    .object({

        email: z
            .string()
            .email("Invalid email address"),

        password: z
            .string()
            .min(6, "Password must be at least 6 characters")
            .max(100),

        confirmPassword: z
            .string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"], 
    });

export type SignupSchemaType = z.infer<typeof signupSchema>;