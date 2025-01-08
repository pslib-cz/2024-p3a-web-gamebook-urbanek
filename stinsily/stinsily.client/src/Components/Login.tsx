import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../Modules/Login.module.css' 

const API_BASE_URL = 'http://localhost:5193';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        try {
            console.log('Attempting login with:', { email, password });
            
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ 
                    email: email, 
                    password: password,
                    useCookies: false
                }),
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', Object.fromEntries(response.headers.entries()));

            if (!response.ok) {
                setError('Invalid credentials or user not registered');
                return;
            }

            const data = await response.json();
            console.log('Response data:', data);

            // Store email
            localStorage.setItem('currentUserEmail', email);
            
            // Store token - MapCustomIdentityApi returns it as accessToken
            if (data.accessToken) {
                localStorage.setItem('authToken', data.accessToken);
                console.log('Token stored in localStorage');
            } else {
                console.log('No token found in response');
                setError('No authentication token received');
                return;
            }
            
            if (email === 'admin@admin.com') {
                navigate('/admin');
            } else {
                // Check for user-specific saved progress
                const userProgressKey = `gameProgress_${email}`;
                const savedProgress = localStorage.getItem(userProgressKey);
                
                if (savedProgress) {
                    const gameState = JSON.parse(savedProgress);
                    navigate(`/scenes/${gameState.currentSceneId}`);
                } else {
                    navigate('/scenes/1');
                }
            }
        } catch (err) {
            console.error('Login error:', err);
            setError(`An error occurred during login: ${err instanceof Error ? err.message : String(err)}`);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        try {
            const response = await fetch(`${API_BASE_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    email: email,
                    password: password,
                    secured: 'abcXYZ'
                })
            });
            
            if (response.ok) {
                setError('Registration successful! You can now log in.');
                setEmail('');
                setPassword('');
            } else {
                const errorData = await response.json();
                console.log('Registration error data:', errorData); // Debug log
                
                if (errorData.errors?.DuplicateEmail || errorData.errors?.DuplicateUserName) {
                    setError('This email is already registered. Please try logging in instead.');
                } else if (errorData.errors?.Password) {
                    setError(`Password requirements not met: ${errorData.errors.Password.join(', ')}`);
                } else if (errorData.errors?.Email) {
                    setError(`Email error: ${errorData.errors.Email.join(', ')}`);
                } else {
                    setError('Registration failed. Please check your input and try again.');
                }
            }
        } catch (error) {
            console.error('Registration error:', error);
            setError(`An error occurred during registration: ${error instanceof Error ? error.message : String(error)}`);
        }
    };

    // Add a logout function to clear the token
    const handleLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUserEmail');
        navigate('/login');
    };

    return (
        <div className="login-form">
            {error && <div className={error.includes('successful') ? styles['success-message'] : styles['error-message']}>
                {error}
            </div>}
            <form>
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
                <div className={styles['button-group']}>
                    <button type="button" onClick={handleLogin}>
                        Login
                    </button>
                    <button type="button" onClick={handleRegister}>
                        Register
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Login;