import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from '../Modules/Scene.module.css';

interface Scene {
    sceneID: number;
    title: string;
    description: string;
    imageURL?: string;
    image?: string;
    connectionID: number;
    itemID?: number;
}

interface SceneOption {
    optionId: number;
    text: string;
    nextSceneId: number;
    type: 'navigation' | 'item';
    itemId?: number;
    action?: string;
}

const Scene = () => {
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const { id } = useParams();
    const navigate = useNavigate();
    const [currentScene, setCurrentScene] = useState<Scene | null>(null);
    const [sceneOptions, setSceneOptions] = useState<SceneOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [isTransitioning, setIsTransitioning] = useState(false);

    const API_BASE_URL = 'http://localhost:5193/api';

    const fetchScene = useCallback(async (sceneId: string) => {
        try {
            console.log('Fetching scene...', sceneId);
            const response = await fetch(`${API_BASE_URL}/Scenes/${sceneId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const sceneData = await response.json();
            console.log('Full scene data:', sceneData);
            
            if (sceneData.imageURL === undefined && sceneData.image !== undefined) {
                sceneData.imageURL = sceneData.image;
            }
            
            setCurrentScene(sceneData);

            // Fetch options for this scene
            const optionsResponse = await fetch(`${API_BASE_URL}/Scenes/options/${sceneId}`, {
                credentials: 'include',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (optionsResponse.ok) {
                const optionsData = await optionsResponse.json();
                setSceneOptions(optionsData);
            }
            
            setLoading(false);
        } catch (error) {
            console.error('Error fetching scene:', error);
            setLoading(false);
        }
    }, []);

    const handleOptionClick = async (option: SceneOption) => {
        if (option.type === 'navigation' && option.nextSceneId) {
            navigate(`/scenes/${option.nextSceneId}`);
        } else if (option.type === 'item' && option.action && option.itemId) {
            try {
                const response = await fetch(`${API_BASE_URL}/Scenes/item`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        action: option.action,
                        itemId: option.itemId
                    })
                });

                if (response.ok) {
                    // Refresh the current scene to update available options
                    fetchScene(id!);
                }
            } catch (error) {
                console.error('Error handling item:', error);
            }
        }
    };

    useEffect(() => {
        if (id) {
            setIsTransitioning(true);
            fetchScene(id).finally(() => {
                setIsTransitioning(false);
            });
        }
    }, [id, fetchScene]);

    const getCurrentUserEmail = () => {
        const email = localStorage.getItem('currentUserEmail');
        setUserEmail(email);
        return email;
    };

    const saveProgress = () => {
        const email = getCurrentUserEmail();
        if (!email) {
            alert('Please log in to save progress');
            navigate('/');
            return;
        }

        const gameState = {
            currentSceneId: id,
            sceneData: currentScene,
            options: sceneOptions
        };
        
        const userProgressKey = `gameProgress_${email}`;
        localStorage.setItem(userProgressKey, JSON.stringify(gameState));
        alert('Progress saved!');
    };

    useEffect(() => {
        const loadSavedProgress = () => {
            const email = getCurrentUserEmail();
            if (email) {
                const userProgressKey = `gameProgress_${email}`;
                const savedProgress = localStorage.getItem(userProgressKey);
                if (savedProgress) {
                    const gameState = JSON.parse(savedProgress);
                    navigate(`/scenes/${gameState.currentSceneId}`);
                }
            }
        };

        loadSavedProgress();
    }, []);

    useEffect(() => {
        getCurrentUserEmail();
    }, []);

    const getBackgroundStyle = () => {
        if (!currentScene) return { backgroundColor: 'black' };
        
        const imageURL = currentScene.imageURL || currentScene.image; // Try both properties
        console.log('Raw image URL:', imageURL);
        
        if (!imageURL) return { backgroundColor: 'black' };
        
        const fullImageUrl = `http://localhost:5193/uploads/${imageURL.split('/').pop()}`;
        console.log('Full image URL:', fullImageUrl);
        
        return {
            backgroundImage: `url(${fullImageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
        };
    };

    if (!currentScene) return null;

    const backgroundStyle = getBackgroundStyle();

    console.log('Image URL:', currentScene.imageURL);
    console.log('Background style:', backgroundStyle);

    return (
        <div className={`${styles['scene-container']} ${isTransitioning ? styles['transitioning'] : ''}`}>
            <div 
                className={styles['scene-background']} 
                style={backgroundStyle}
            />
            <div className={styles['scene-title-container']}>
                <h2 className={styles['scene-title']}>{currentScene.title}</h2>
            </div>
            <button className={styles['save-button']} onClick={saveProgress}>
                Save Progress
            </button>
            <div className={styles['scene-content']}>
                <p className={styles['scene-description']}>{currentScene.description}</p>
                <div className={styles['options-container']}>
                    {sceneOptions.map(option => (
                        <button 
                            key={option.optionId} 
                            className={styles['next-button']}
                            onClick={() => handleOptionClick(option)}
                            title={option.text}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Scene;