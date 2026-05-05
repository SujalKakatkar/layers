// lib/routes.ts
export const PUBLIC_ROUTES = [
    "/",
    "/auth/sign-in",
    "/auth/sign-up",
    "/auth/forgot-password",
    "/reset-password",
]

export function isPublicRoute (pathname: string) {
    return PUBLIC_ROUTES.includes(pathname)
}