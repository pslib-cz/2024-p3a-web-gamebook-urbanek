import { useState } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import Login from './Components/Login';
import HomePage from './Components/HomePage';
import Scene from './Components/Scene';

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const handleLoginSuccess = () => {
        setIsLoggedIn(true);
    };

    const router = createBrowserRouter([
        {
            path: "/",
            element: !isLoggedIn ? (
                <div className="login-container">
                    <h1>Welcome to the Game</h1>
                    <Login onLoginSuccess={handleLoginSuccess} />
                </div>
            ) : (
                <HomePage />
            ),
        },
        {
            path: "/scenes",
            element: isLoggedIn ? <Scene /> : <Navigate to="/" />,
        },
    ]);

    return <RouterProvider router={router} />;
}

export default App;