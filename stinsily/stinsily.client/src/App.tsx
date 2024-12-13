import { createBrowserRouter, RouterProvider } from "react-router-dom";
import './App.css';
import Login from './Components/Login';
import AdminPanel from './Components/AdminPanel';
import Scene from './Components/Scene';
import HomePage from './Components/HomePage';

const router = createBrowserRouter([
    {
        path: "/",
        element: <HomePage />,
    },
    {
        path: "/scenes",
        element: <Scene />,
    },
]);

export default function App() {
    return <RouterProvider router={router} />;
}