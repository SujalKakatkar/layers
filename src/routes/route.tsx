import {createBrowserRouter} from "react-router";
import Canvas from "../pages/Canvas";
import Mainlayout from "../layouts/Mainlayout";
import Home from "../pages/Home";
import Canvaslayout from "../layouts/Canvaslayout";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import Dashboard from "../pages/Dashboard";
import Blanklayout from "../layouts/Blanklayout";
import AuthLayout from "@/layouts/AuthLayout";
import ProtectedRoute from "@/providers/ProtectedRoute";
import PublicRoute from "@/providers/PublicRoute";
import NotFound from "../pages/NotFound";

export const routes = createBrowserRouter([
    {
        element: (
            <PublicRoute>
                <Mainlayout />
            </PublicRoute>
        ),
        children: [
            {
                path: '/',
                element: <Home />
            },
        ]
    },
    {
        element: (
            <ProtectedRoute>
                <Blanklayout />
            </ProtectedRoute>
        ),
        children: [
            {
                path: '/dashboard',
                element: <Dashboard />
            }
        ]
    },
    {
        element: (
            <ProtectedRoute>
                <Canvaslayout />
            </ProtectedRoute>
        ),
        children: [
            {
                path: '/canvas/:id',
                element: <Canvas />
            }
        ]
    },
    {
        element: (
            <Canvaslayout />
        ),
        children: [
            {
                path: '/shared/:token',
                element: <Canvas />
            }
        ]
    },
    {
        element: (
            <PublicRoute>
                <AuthLayout />
            </PublicRoute>
        ),
        children: [
            {
                path: '/auth/sign-in',
                element: <Login />
            },
            {
                path: '/auth/sign-up',
                element: <Signup />
            },
        ]
    },
    {
        path: '*',
        element: <NotFound />
    }
])