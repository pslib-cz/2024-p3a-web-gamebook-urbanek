import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../Modules/HomeScreen.module.css';

const HomeScreen = () => {
    const navigate = useNavigate();

    // Check if user is logged in
    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            navigate('/login');
        }
    }, [navigate]);

    const handleNewGame = () => {
        // Clear any existing game progress
        const email = localStorage.getItem('currentUserEmail');
        if (email) {
            localStorage.removeItem(`gameProgress_${email}`);
        }
        // Navigate to the first scene
        navigate('/scenes/1');
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
                    Načíst hru
                </button>
                
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