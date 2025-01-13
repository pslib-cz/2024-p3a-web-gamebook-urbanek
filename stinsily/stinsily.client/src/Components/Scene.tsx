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
    type: 'Normal' | 'Decision';
}

interface DecisionOption {
    optionId: number;
    text: string;
    nextSceneId: number;
    effect?: string;
}

const Scene = () => {
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const { id } = useParams();
    const navigate = useNavigate();
    const [currentScene, setCurrentScene] = useState<Scene | null>(null);
    const [sceneOptions, setSceneOptions] = useState<DecisionOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [currentDescriptionIndex, setCurrentDescriptionIndex] = useState(0);

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

    const fetchSceneOptions = async (sceneId: string) => {
        try {
            const response = await fetch(`http://localhost:5193/api/Scenes/options/${sceneId}`);
            if (!response.ok) throw new Error('Failed to fetch scene options');
            const options = await response.json();
            setSceneOptions(options);
            console.log('Scene options:', options); // Debug log
        } catch (error) {
            console.error('Error fetching scene options:', error);
        }
    };

    const handleOptionClick = async (option: DecisionOption) => {
        try {
            // Apply the effect first if it exists and isn't a scene effect
            if (option.effect && !option.effect.startsWith('scene:')) {
                const response = await fetch(`${API_BASE_URL}/Scenes/apply-effect`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({ effect: option.effect })
                });
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Effect response:', errorText);
                    // Don't throw error here, just log it and continue
                    console.warn(`Failed to apply effect: ${errorText}`);
                }
            }

            // Navigate to the next scene regardless of effect success
            navigate(`/scenes/${option.nextSceneId}`);
        } catch (error) {
            console.error('Error handling option:', error);
            // Still navigate even if there's an error
            navigate(`/scenes/${option.nextSceneId}`);
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

    const descriptions = currentScene?.description?.split(';') || [];
    const isLastDescription = currentDescriptionIndex === descriptions.length - 1;

    const handleNextDescription = () => {
        if (currentDescriptionIndex < descriptions.length - 1) {
            setCurrentDescriptionIndex(prev => prev + 1);
        }
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
            <div className={`${styles['scene-content']} ${currentScene?.type === 'Decision' ? styles['decision'] : ''}`}>
                <p className={styles['scene-description']}>
                    {descriptions[currentDescriptionIndex]}
                </p>
                
                {!isLastDescription ? (
                    // Show "Next" button if there are more descriptions
                    <button 
                        className={styles['next-button']}
                        onClick={handleNextDescription}
                    >
                        Next
                    </button>
                ) : (
                    // Show choices/navigation options on last description
                    <div className={styles['decision-container']}>
                        {sceneOptions.length === 1 ? (
                            // Single option - show as arrow
                            <button
                                className={styles['next-button']}
                                onClick={() => handleOptionClick(sceneOptions[0])}
                            >
                                Next
                            </button>
                        ) : (
                            // Multiple options - show as text buttons
                            sceneOptions.map((option) => (
                                <button
                                    key={option.optionId}
                                    className={styles['_decision-option']}
                                    onClick={() => handleOptionClick(option)}
                                >
                                    {option.text}
                                </button>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Scene;