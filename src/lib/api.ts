import axios from "axios"
import {isPublicRoute} from "./routes"

export const api = axios.create({
    baseURL: "http://localhost:8000",
    withCredentials: true,
})

let _onLogout: () => void = () => {
    window.location.replace("/auth/sign-in")
}

let isRefreshing = false
let failedQueue: {resolve: (value?: unknown) => void; reject: (reason?: unknown) => void}[] = []

const processQueue = (error: Error | null) => {
    failedQueue.forEach(({resolve, reject}) => {
        if (error) {
            reject(error);
        } else {
            resolve();
        }
    })
    failedQueue = []
}

export function registerLogoutHandler (fn: () => void) {
    _onLogout = () => {
        if(!isPublicRoute(window.location.pathname)) {
            fn()
        }
    }
}

api.interceptors.response.use(
    (response) => response,

    async (error) => {
        // ✅ handle network errors
        if(!error.response) {
            return Promise.reject(new Error("Network error"))
        }

        const originalRequest = error.config

        const isAuthRoute =
            originalRequest.url?.includes("/auth/sign-in") ||
            originalRequest.url?.includes("/auth/sign-up") ||
            originalRequest.url?.includes("/auth/refresh-token")

        if(
            error.response?.status === 401 &&
            !isAuthRoute &&
            !originalRequest._retry
        ) {
            if(isPublicRoute(window.location.pathname)) {
                return Promise.reject(error)
            }

            if(isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({resolve, reject})
                }).then(() => api(originalRequest))
            }

            originalRequest._retry = true
            isRefreshing = true

            try {
                await api.post("/auth/refresh-token")
                processQueue(null)
                return api(originalRequest)
            } catch(refreshError) {
                processQueue(refreshError as Error | null)
                _onLogout()
                return Promise.reject(refreshError)
            } finally {
                isRefreshing = false
            }
        }

        return Promise.reject(error)
    }
)