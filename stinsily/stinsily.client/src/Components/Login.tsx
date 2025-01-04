import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:5193';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const seedUsers = async () => {
        try {
            const response = await fetch('http://localhost:5193/api/auth/seed-users', {
                method: 'POST',
                credentials: 'include'
            });
            if (response.ok) {
                alert('Users seeded successfully');
            }
        } catch (error) {
            console.error('Seeding error:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        try {
            console.log('Attempting login...');
            const response = await fetch(`${API_BASE_URL}/login?useCookies=true`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ 
                    email: email, 
                    password: password
                }),
            });

            console.log('Response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Login failed:', errorText);
                setError(`Login failed: ${response.status} - ${errorText}`);
                return;
            }

            navigate('/scenes/1');
        } catch (err) {
            console.error('Login error:', err);
            setError(`An error occurred during login: ${err instanceof Error ? err.message : String(err)}`);
        }
    };

    return (
        <div className="login-form">
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmit}>
                <div>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email"
                        required
                    />
                </div>
                <div>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        required
                    />
                </div>
                <button type="submit">Login</button>
            </form>
            <button onClick={seedUsers}>Initialize Users</button>
        </div>
    );
};

export default Login;