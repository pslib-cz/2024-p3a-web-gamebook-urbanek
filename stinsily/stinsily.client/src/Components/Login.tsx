import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../Modules/Login.module.css' 
import { API_BASE_URL } from '../config/api';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        try {
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

            if (!response.ok) {
                setError('Invalid credentials or user not registered');
                return;
            }

            const data = await response.json();

            // Store email and token
            localStorage.setItem('currentUserEmail', email);
            
            if (data.accessToken) {
                localStorage.setItem('authToken', data.accessToken);
                
                // Check if user is admin and redirect accordingly
                if (email.toLowerCase() === 'admin@admin.com') {
                    console.log('Admin user detected, redirecting to admin panel');
                    navigate('/admin');
                } else {
                    console.log('Regular user detected, redirecting to home');
                    navigate('/home');
                }
            } else {
                setError('No authentication token received');
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

    return (
        <div className={styles['login-form']}>
            {error && <div className={error.includes('successful') ? styles['success-message'] : styles['error-message']}>
                {error}
            </div>}
            <form onSubmit={handleLogin}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <div className={styles['button-container']}>
                    <button type="submit">Login</button>
                    <button type="button" onClick={handleRegister}>Register</button>
                </div>
            </form>
        </div>
    );
};

export default Login;