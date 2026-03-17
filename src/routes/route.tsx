import {createBrowserRouter} from "react-router";
import Canvas from "../pages/Canvas";
import Mainlayout from "../layouts/Mainlayout";
import Home from "../pages/Home";
import Canvaslayout from "../layouts/Canvaslayout";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import Dashboard from "../pages/Dashboard";
import Blanklayout from "../layouts/Blanklayout";

export const routes = createBrowserRouter([
    {
        element: <Mainlayout />,
        children: [
            {
                path: '/',
                element: <Home />
            },
            {
                path: '/login',
                element: <Login />
            },
            {
                path: '/signup',
                element: <Signup />
            },


        ]
    },
    {
        element: <Blanklayout />,
        children: [
            {
                path: '/dashboard',
                element: <Dashboard />
            }
        ]
    },
    {
        element: <Canvaslayout />,
        children: [
            {
                path: '/canvas/:id',
                element: <Canvas />
            }
        ]
    }
])