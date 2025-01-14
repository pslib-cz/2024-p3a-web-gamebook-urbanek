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

interface PlayerStats {
    health: number;
    force: number;
    obiWanRelationship: number;
    item: string[];
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
    const [playerStats, setPlayerStats] = useState<PlayerStats>({
        health: 100,
        force: 50,
        obiWanRelationship: 25,
        item: []
    });

    const API_BASE_URL = 'http://localhost:5193/api';

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            navigate('/login');
            return;
        }
    }, [navigate]);

    const fetchScene = useCallback(async (sceneId: string) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                navigate('/login');
                return;
            }

            console.log('Fetching scene...', sceneId);
            const response = await fetch(`${API_BASE_URL}/Scenes/${sceneId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
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
    }, [API_BASE_URL, navigate]);

    const fetchSceneOptions = async (sceneId: string) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await fetch(`${API_BASE_URL}/Scenes/options/${sceneId}`, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Failed to fetch scene options');
            const options = await response.json();
            setSceneOptions(options);
            console.log('Scene options:', options); // Debug log
        } catch (error) {
            console.error('Error fetching scene options:', error);
        }
    };

    const loadSavedProgress = useCallback(() => {
        const email = localStorage.getItem('currentUserEmail');
        if (email) {
            const savedProgress = localStorage.getItem(`gameProgress_${email}`);
            if (savedProgress) {
                const gameState = JSON.parse(savedProgress);
                if (gameState.playerStats) {
                    setPlayerStats(gameState.playerStats);
                    return true;
                }
            }
        }
        return false;
    }, []);

    const fetchPlayerStats = useCallback(async () => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                navigate('/login');
                return;
            }

            if (!loadSavedProgress()) {
                const response = await fetch(`${API_BASE_URL}/Scenes/player-stats`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) throw new Error('Failed to fetch stats');
                const stats = await response.json();
                setPlayerStats(stats);
            }
        } catch (error) {
            console.error('Error fetching player stats:', error);
        }
    }, [API_BASE_URL, navigate, loadSavedProgress]);

    const handleOptionClick = async (option: DecisionOption) => {
        try {
            if (option.effect) {
                // Convert colon format to plus/minus format
                let formattedEffect = option.effect;
                if (option.effect.includes(':')) {
                    const [stat, value] = option.effect.split(':');
                    // If value is negative, keep the minus sign, otherwise add plus
                    const sign = value.startsWith('-') ? '' : '+';
                    formattedEffect = `${stat}${sign}${value}`;
                }

                console.log('Sending effect:', formattedEffect);

                const response = await fetch('http://localhost:5193/api/Scenes/apply-effect', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                    },
                    body: JSON.stringify({ 
                        Effect: formattedEffect.toLowerCase()
                    })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Effect response:', errorText);
                    console.error('Effect sent:', formattedEffect);
                } else {
                    const result = await response.json();
                    // Update stats in state without saving to localStorage
                    setPlayerStats({
                        health: result.player.health,
                        force: result.player.force,
                        obiWanRelationship: result.player.obiWanRelationship,
                        item: result.player.item || []
                    });
                }
            }

            // Navigate to next scene
            setIsTransitioning(true);
            setTimeout(() => {
                navigate(`/scenes/${option.nextSceneId}`);
            }, 300);
        } catch (error) {
            console.error('Error applying effect:', error);
        }
    };

    const handleItemPickup = async (itemId: number) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await fetch(`${API_BASE_URL}/Scenes/item`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    action: 'pickup',
                    itemId: itemId 
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error picking up item:', errorText);
                return;
            }

            // Refresh player stats to update inventory
            await fetchPlayerStats();
            
            // Refresh scene to update item availability
            if (id) {
                await fetchScene(id);
            }
        } catch (error) {
            console.error('Error picking up item:', error);
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
        const email = localStorage.getItem('currentUserEmail');
        if (email && id) {
            const gameState = {
                email,
                currentSceneId: id,
                playerStats: playerStats  // Save current stats
            };
            localStorage.setItem(`gameProgress_${email}`, JSON.stringify(gameState));
            
            // Also save to server
            saveToServer(gameState);
            alert('Progress saved!');
        }
    };

    const saveToServer = async (gameState: any) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) return;

            await fetch(`${API_BASE_URL}/Scenes/save-progress`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    sceneId: gameState.currentSceneId,
                    stats: gameState.playerStats
                })
            });
        } catch (error) {
            console.error('Error saving to server:', error);
        }
    };

    useEffect(() => {
        const loadSavedProgress = async () => {
            const email = getCurrentUserEmail();
            if (email) {
                const userProgressKey = `gameProgress_${email}`;
                const savedProgress = localStorage.getItem(userProgressKey);
                if (savedProgress) {
                    const gameState = JSON.parse(savedProgress);
                    // First set the stats
                    if (gameState.playerStats) {
                        setPlayerStats(gameState.playerStats);
                        // Also reset the server stats to match saved stats
                        await resetServerStats(gameState.playerStats);
                    }
                    // Then navigate to the scene
                    if (gameState.currentSceneId && gameState.currentSceneId !== id) {
                        navigate(`/scenes/${gameState.currentSceneId}`);
                    }
                }
            }
        };

        loadSavedProgress();
    }, []);

    // Add new function to reset server stats
    const resetServerStats = async (stats: PlayerStats) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) return;

            await fetch(`${API_BASE_URL}/Scenes/sync-stats`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(stats)
            });
        } catch (error) {
            console.error('Error syncing stats with server:', error);
        }
    };

    // Remove or modify the fetchPlayerStats useEffect to avoid overwriting saved stats
    useEffect(() => {
        if (!id) return;
        
        const email = getCurrentUserEmail();
        const savedProgress = localStorage.getItem(`gameProgress_${email}`);
        
        // Only fetch from server if there's no saved progress
        if (!savedProgress) {
            fetchPlayerStats();
        }
    }, [id, fetchPlayerStats]);

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

    const exportProgress = () => {
        const email = getCurrentUserEmail();
        if (!email) {
            alert('Please log in to export progress');
            navigate('/');
            return;
        }

        const gameState = {
            email: email, // Include email to verify correct user on import
            currentSceneId: id,
            sceneData: currentScene,
            options: sceneOptions,
            timestamp: new Date().toISOString()
        };
        
        // Create blob and download file
        const blob = new Blob([JSON.stringify(gameState, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `stinsily-progress-${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
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
            <button className={styles['export-button']} onClick={exportProgress}>
                Export Progress
            </button>
            <button className={styles['save-button']} onClick={saveProgress}>
                Save Progress
            </button>
            <div className={styles['stats-panel']}>
                <div className={styles['stat-item']}>
                    <span className={styles['stat-label']}>Health:</span>
                    <span className={styles['stat-value']}>{playerStats.health}</span>
                </div>
                <div className={styles['stat-item']}>
                    <span className={styles['stat-label']}>Force:</span>
                    <span className={styles['stat-value']}>{playerStats.force}</span>
                </div>
                <div className={styles['stat-item']}>
                    <span className={styles['stat-label']}>Obi-Wan:</span>
                    <span className={styles['stat-value']}>{playerStats.obiWanRelationship}</span>
                </div>
                {playerStats.item.length > 0 && (
                    <div className={styles['items-container']}>
                        <span className={styles['stat-label']}>Items:</span>
                        <div className={styles['items-list']}>
                            {playerStats.item.map((item, index) => (
                                <span key={index} className={styles['item']}>{item}</span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
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
            {currentScene?.itemID && (
                <div className={styles['item-pickup-container']}>
                    <button 
                        className={styles['pickup-button']}
                        onClick={() => handleItemPickup(currentScene.itemID!)}
                    >
                        Sebrat předmět
                    </button>
                </div>
            )}
        </div>
    );
};

export default Scene;