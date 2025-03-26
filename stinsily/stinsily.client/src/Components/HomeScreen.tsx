import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../Modules/HomeScreen.module.css';
import { API_BASE_URL } from '../config/api';

const HomeScreen = () => {
    const navigate = useNavigate();

    // Check if user is logged in
    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            navigate('/login');
        }
    }, [navigate]);

    const handleNewGame = async () => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                navigate('/login');
                return;
            }

            // Reset stats on server
            const response = await fetch(`${API_BASE_URL}/scenes/reset-stats`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to reset stats');
            }

            // Clear local storage progress
            const email = localStorage.getItem('currentUserEmail');
            if (email) {
                localStorage.removeItem(`gameProgress_${email}`);
            }

            // Navigate to the first scene
            navigate('/scenes/1');
        } catch (error) {
            console.error('Error starting new game:', error);
            alert('Error starting new game. Please try again.');
        }
    };

    const handleResumeGame = () => {
        const email = localStorage.getItem('currentUserEmail');
        if (!email) {
            alert('Please log in to resume your game');
            navigate('/login');
            return;
        }

        const savedProgress = localStorage.getItem(`gameProgress_${email}`);
        if (savedProgress) {
            const gameState = JSON.parse(savedProgress);
            navigate(`/scenes/${gameState.currentSceneId}`);
        } else {
            alert('No saved game found. Starting new game...');
            navigate('/scenes/1');
        }
    };

    const handleSettings = () => {
        const email = localStorage.getItem('currentUserEmail');
        // Check if user is admin
        if (email === 'admin@admin.com') {
            navigate('/admin');
        } else {
            handleLogout();
        }
    };

    const handleLogout = () => {
        // Clear all authentication and game data
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUserEmail');
        const email = localStorage.getItem('currentUserEmail');
        if (email) {
            localStorage.removeItem(`gameProgress_${email}`);
        }
        navigate('/login');
    };

    const handleImportProgress = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const currentEmail = localStorage.getItem('currentUserEmail');
        if (!currentEmail) {
            alert('Please log in first');
            navigate('/login');
            return;
        }

        try {
            const text = await file.text();
            const gameState = JSON.parse(text);

            // Verify the save file belongs to the current user
            if (gameState.email !== currentEmail) {
                alert('This save file belongs to a different account');
                return;
            }

            // Save the imported progress
            localStorage.setItem(`gameProgress_${currentEmail}`, JSON.stringify(gameState));
            alert('Progress imported successfully!');
            navigate(`/scenes/${gameState.currentSceneId}`);
        } catch (error) {
            alert('Error importing save file. Make sure it\'s a valid save file.');
            console.error('Import error:', error);
        }
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Stín Síly</h1>
            
            <div className={styles.buttonContainer}>
                <button 
                    className={`${styles.button} ${styles.newGame}`}
                    onClick={handleNewGame}
                >
                    Nová hra
                </button>
                
                <button 
                    className={`${styles.button} ${styles.resumeGame}`}
                    onClick={handleResumeGame}
                >
                    Pokračovat
                </button>
                
                <label className={`${styles.button} ${styles.importGame}`}>
                    Nahrát hru
                    <input
                        type="file"
                        accept=".json"
                        style={{ display: 'none' }}
                        onChange={handleImportProgress}
                    />
                </label>

                <button 
                    className={`${styles.button} ${styles.settings}`}
                    onClick={handleSettings}
                >
                    Odhlásit se
                </button>
            </div>
            
            <div className={styles.author}>
                Autor: Adam Urbánek
            </div>
        </div>
    );
};

export default HomeScreen;