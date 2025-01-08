import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import Login from './Components/Login';
import Scene from './Components/Scene';
import AdminPanel from './Components/AdminPanel';

const API_BASE_URL = 'http://localhost:5193';

function App() {
    const router = createBrowserRouter([
        {
            path: "/",
            element: <Navigate to="/login" />,
        },
        {
            path: "/login",
            element: <Login />,
        },
        {
            path: "/scenes/:id",
            element: <Scene />,
            loader: async () => {
                const response = await fetch(`${API_BASE_URL}/api/scenes`, {
                    credentials: 'include'
                });
                
                if (!response.ok) {
                    throw new Error('Unauthorized');
                }
                return null;
            },
            errorElement: <Navigate to="/login" />
        },
        {
            path: "/admin",
            element: <AdminPanel />
        }
    ]);

    return <RouterProvider router={router} />;
}

export default App;