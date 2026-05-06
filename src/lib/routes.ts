// lib/routes.ts
export const PUBLIC_ROUTES = [
    "/",
    "/auth/sign-in",
    "/auth/sign-up",
    "/auth/forgot-password",
    "/reset-password",
]

export function isPublicRoute (pathname: string) {
    if (pathname.startsWith('/shared/')) return true;
    return PUBLIC_ROUTES.includes(pathname)
}