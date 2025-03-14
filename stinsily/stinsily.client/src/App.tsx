import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import HomeScreen from './Components/HomeScreen';
import Login from './Components/Login';
import Scene from './Components/Scene';
import AdminPanel from './Components/AdminPanel';

const API_BASE_URL = 'http://localhost:5193';

// Helper function to check if user is authenticated
const isAuthenticated = () => {
    return !!localStorage.getItem('authToken');
};

// Helper function to check if user is admin
const isAdmin = () => {
    const email = localStorage.getItem('currentUserEmail');
    return email?.toLowerCase() === 'admin@admin.com';
};

function App() {
    const router = createBrowserRouter([
        {
            path: "/",
            element: isAuthenticated() ? <Navigate to="/home" /> : <Navigate to="/login" />,
        },
        {
            path: "/login",
            element: <Login />,
        },
        {
            path: "/home",
            element: isAuthenticated() ? <HomeScreen /> : <Navigate to="/login" />,
        },
        {
            path: "/scenes/:id",
            element: isAuthenticated() ? <Scene /> : <Navigate to="/login" />,
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
            element: isAuthenticated() && isAdmin() ? 
                <AdminPanel /> : 
                <Navigate to="/login" />,
        }
    ]);

    return <RouterProvider router={router} />;
}

export default App;