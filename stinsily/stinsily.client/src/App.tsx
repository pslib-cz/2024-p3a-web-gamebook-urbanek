import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Login from './Components/Login';
import Scene from './Components/Scene';

function App() {

    const router = createBrowserRouter([
        {
            path: "/",
            element: <Login />,
        },
        {
            path: "/scenes/:id",
            element: <Scene />,
        }
    ]);

    return <RouterProvider router={router} />;
}

export default App;