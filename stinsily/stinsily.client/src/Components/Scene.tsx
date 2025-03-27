import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from '../Modules/Scene.module.css';
import SpaceJetRepair from './SpaceJetRepair';
import LightsaberDuel from './LightsaberDuel';
import SyndicateInfiltration from './SyndicateInfiltration';
import FinalDuel from './FinalDuel';
import { API_BASE_URL, getImageUrl } from '../config/api';

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
    requiredItemID?: number;
    miniGameID?: number;
}

interface PlayerStats {
    health: number;
    force: number;
    obiWanRelationship: number;
    item: string[];
    itemId?: number | null;
}

interface Item {
    id: number;
    name: string;
    description: string;
}

const Scene = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [currentScene, setCurrentScene] = useState<Scene | null>(null);
    const [sceneOptions, setSceneOptions] = useState<DecisionOption[]>([]);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [currentDescriptionIndex, setCurrentDescriptionIndex] = useState(0);
    const [playerStats, setPlayerStats] = useState<PlayerStats>({
        health: 100,
        force: 50,
        obiWanRelationship: 25,
        item: []
    });
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [itemDetails, setItemDetails] = useState<Item | null>(null);
    const [activeMinigame, setActiveMinigame] = useState<any | null>(null);
    const [pendingChoice, setPendingChoice] = useState<DecisionOption | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            // Don't immediately redirect, let the fetch handle auth errors
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

            const response = await fetch(`${API_BASE_URL}/api/Scenes/${sceneId}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 401) {
                // Token expired or invalid
                localStorage.removeItem('authToken');
                navigate('/login');
                return;
            }

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Scene fetch error:', errorText);
                if (response.status === 404) {
                    // If scene not found, try to load from local storage first
                    const email = localStorage.getItem('currentUserEmail');
                    if (email) {
                        const savedProgress = localStorage.getItem(`gameProgress_${email}`);
                        if (savedProgress) {
                            const gameState = JSON.parse(savedProgress);
                            if (gameState.currentSceneId) {
                                navigate(`/scene/${gameState.currentSceneId}`);
                                return;
                            }
                        }
                    }
                    // If no saved progress, go to scene 1
                    navigate('/scene/1');
                    return;
                }
                throw new Error('Failed to fetch scene');
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Invalid response format. Expected JSON.');
            }

            const sceneData = await response.json();
            setCurrentScene(sceneData);

            // Fetch scene options
            const optionsResponse = await fetch(`${API_BASE_URL}/api/Scenes/options/${sceneId}`, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (optionsResponse.ok) {
                const options = await optionsResponse.json();
                setSceneOptions(options);
            }

            // If scene has an item, fetch its details
            if (sceneData.itemID) {
                await fetchItemDetails(sceneData.itemID);
            }

        } catch (error) {
            console.error('Error fetching scene:', error);
            if (error instanceof Error) {
                if (error.message.includes('Invalid response format')) {
                    // If we get HTML instead of JSON, it's likely an authentication issue
                    localStorage.removeItem('authToken');
                    navigate('/login');
                } else if (error.message.includes('404')) {
                    // If scene not found, redirect to scene 1
                    navigate('/scene/1');
                }
            }
        }
    }, [API_BASE_URL, navigate]);

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
                // Fetch basic stats
                const response = await fetch(`${API_BASE_URL}/api/Scenes/player-stats`, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.status === 401) {
                    // Token expired or invalid
                    localStorage.removeItem('authToken');
                    navigate('/login');
                    return;
                }

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Stats fetch error:', errorText);
                    throw new Error('Failed to fetch stats');
                }

                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    throw new Error('Invalid response format. Expected JSON.');
                }

                const stats = await response.json();
                console.log('Player stats:', stats); // Debug log
                
                // Fetch item separately using ItemsController if itemId exists
                if (stats.itemId) {
                    const itemResponse = await fetch(`${API_BASE_URL}/api/Items/${stats.itemId}`, {
                        method: 'GET',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (itemResponse.ok) {
                        const item = await itemResponse.json();
                        stats.item = [item.name];
                    } else {
                        const errorText = await itemResponse.text();
                        console.error('Item fetch error:', errorText);
                    }
                } else {
                    stats.item = [];
                }

                setPlayerStats(stats);
            }
        } catch (error) {
            console.error('Error fetching player stats:', error);
            if (error instanceof Error && error.message.includes('Invalid response format')) {
                localStorage.removeItem('authToken');
                navigate('/login');
            }
        }
    }, [API_BASE_URL, navigate, loadSavedProgress]);

    const fetchMiniGame = async (miniGameId: number) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/MiniGames/${miniGameId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            if (!response.ok) throw new Error('Failed to fetch minigame');
            return await response.json();
        } catch (error) {
            console.error('Error fetching minigame:', error);
            return null;
        }
    };
    
    const handleMinigameComplete = async (success: boolean) => {
        if (!pendingChoice) return;

        if (success) {
            setActiveMinigame(null);
            await handleChoice(pendingChoice);
        } else {
            // Just close the minigame and stay on current scene
            setActiveMinigame(null);
            setPendingChoice(null);
        }
    };

    const handleOptionClick = async (option: DecisionOption) => {
        if (option.miniGameID) {
            setPendingChoice(option);
            const miniGame = await fetchMiniGame(option.miniGameID);
            if (miniGame) {
                setActiveMinigame(miniGame);
            }
            return;
        }
        await handleChoice(option);
    };

    const handleChoice = async (option: DecisionOption) => {
        try {
            if (option.effect) {
                let formattedEffect = option.effect;
                if (option.effect.includes(':')) {
                    const [stat, value] = option.effect.split(':');
                    const sign = value.startsWith('-') ? '' : '+';
                    formattedEffect = `${stat}${sign}${value}`;
                }

                const response = await fetch(`${API_BASE_URL}/api/scenes/apply-effect`, {
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
                    console.error('Effect response:', await response.text());
                    console.error('Effect sent:', formattedEffect);
                } else {
                    const result = await response.json();
                    setPlayerStats(prev => ({
                        health: result.player.health,
                        force: result.player.force,
                        obiWanRelationship: result.player.obiWanRelationship,
                        item: prev.item,
                        itemId: prev.itemId
                    }));
                }
            }

            setIsTransitioning(true);
            setTimeout(() => {
                navigate(`/scene/${option.nextSceneId}`);
            }, 300);
        } catch (error) {
            console.error('Error applying effect:', error);
        }
    };

    const handleItemPickup = async (itemId: number) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) return;

            const response = await fetch(`${API_BASE_URL}/api/scenes/item`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    Action: 'pickup',
                    ItemId: itemId 
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error picking up item:', errorText);
                throw new Error('Failed to pick up item');
            }
            
            const itemResponse = await fetch(`${API_BASE_URL}/api/Items/${itemId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (itemResponse.ok) {
                const item = await itemResponse.json();
                setPlayerStats(prev => ({
                    ...prev,
                    item: [item.name],
                    itemId: itemId
                }));
            }

            // Get the current scene options again
            const sceneOptionsResponse = await fetch(`${API_BASE_URL}/api/scenes/options/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (sceneOptionsResponse.ok) {
                const newOptions = await sceneOptionsResponse.json();
                setSceneOptions(newOptions);
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
        return email;
    };

    const saveProgress = () => {
        const email = localStorage.getItem('currentUserEmail');
        if (email && id) {
            const gameState = {
                email,
                currentSceneId: id,
                playerStats: playerStats  // This now includes item state
            };
            localStorage.setItem(`gameProgress_${email}`, JSON.stringify(gameState));
            
            // Save to server
            saveToServer(gameState);
            alert('Progress saved!');
        }
    };

    const saveToServer = async (gameState: any) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) return;

            await fetch(`${API_BASE_URL}/api/scenes/save-progress`, {
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
                        navigate(`/scene/${gameState.currentSceneId}`);
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

            await fetch(`${API_BASE_URL}/api/scenes/sync-stats`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...stats,
                    itemId: stats.itemId || null
                })
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
        
        if (!imageURL) return { backgroundColor: 'black' };
        
        // Use the full URL directly since it already includes /uploads/
        const fullImageUrl = `${API_BASE_URL}${imageURL}`;
        
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

    const fetchItemDetails = async (itemId: number) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) return;

            const response = await fetch(`${API_BASE_URL}/api/Items/${itemId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch item details');
            const item = await response.json();
            setItemDetails(item);
        } catch (error) {
            console.error('Error fetching item details:', error);
        }
    };

    const handleBackToMenu = () => {
        navigate('/home');
    };

    if (!currentScene) return null;

    const backgroundStyle = getBackgroundStyle();

    // Add check for required items when displaying options
    const shouldShowOption = (option: DecisionOption) => {
        if (!option.requiredItemID) return true;
        
        return playerStats.itemId === option.requiredItemID;
    };

    return (
        <div className={`${styles['scene-container']} ${isTransitioning ? styles['transitioning'] : ''}`}>
            <div className={styles['menu-container']}>
                <button 
                    className={styles['hamburger-button']}
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
                <div className={`${styles['dropdown-menu']} ${isMenuOpen ? styles.open : ''}`}>
                    <button onClick={saveProgress}>
                        Uložit hru
                    </button>
                    <hr />
                    <button onClick={exportProgress}>
                        Exportovat hru
                    </button>
                    <hr />
                    <button onClick={handleBackToMenu}>
                        Hlavní menu
                    </button>
                    <hr className={styles['stats-divider']}/>
                    <div className={styles['stats-panel']}>
                        <div className={styles['stat-item']}>
                            <span className={styles['stat-label']}>Health:</span>
                            <span className={styles['stat-value']}>{playerStats.health}</span>
                        </div>
                        <div className={styles['stat-item']}>
                            <span className={styles['stat-label']}>Síla:</span>
                            <span className={styles['stat-value']}>{playerStats.force}</span>
                        </div>
                        <div className={styles['stat-item']}>
                            <span className={styles['stat-label']}>Vztah s Obi-Wanem:</span>
                            <span className={styles['stat-value']}>{playerStats.obiWanRelationship}</span>
                        </div>
                        {playerStats.item.length > 0 && (
                            <div className={styles['items-container']}>
                                <span className={styles['stat-label']}>Itemy:</span>
                                <div className={styles['items-list']}>
                                    {playerStats.item.map((item, index) => (
                                        <span key={index} className={styles['item']}>{item}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div 
                className={styles['scene-background']} 
                style={backgroundStyle}
            />
            <div className={styles['scene-title-container']}>
                <h2 className={styles['scene-title']}>{currentScene.title}</h2>
            </div>
            <div className={styles['stats-panel']}>
                <div className={styles['stat-item']}>
                    <span className={styles['stat-label']}>Health:</span>
                    <span className={styles['stat-value']}>{playerStats.health}</span>
                </div>
                <div className={styles['stat-item']}>
                    <span className={styles['stat-label']}>Síla:</span>
                    <span className={styles['stat-value']}>{playerStats.force}</span>
                </div>
                <div className={styles['stat-item']}>
                    <span className={styles['stat-label']}>Vztah s Obi-Wanem:</span>
                    <span className={styles['stat-value']}>{playerStats.obiWanRelationship}</span>
                </div>
                {playerStats.item.length > 0 && (
                    <div className={styles['items-container']}>
                        <span className={styles['stat-label']}>Itemy:</span>
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
                        {currentScene?.itemID && (
                            <button 
                                className={styles['pickup-button']}
                                onClick={() => handleItemPickup(currentScene.itemID!)}
                            >
                                {itemDetails?.description || 'Sebrat předmět'}
                            </button>
                        )}
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
                            sceneOptions.map((option) => {
                                // Only render option if it meets requirements
                                if (!shouldShowOption(option)) return null;

                                return (
                                    <button
                                        key={option.optionId}
                                        className={styles['_decision-option']}
                                        onClick={() => handleOptionClick(option)}
                                    >
                                        {option.text}
                                    </button>
                                );
                            })
                        )}
                    </div>
                )}
            </div>
            {activeMinigame && (
                activeMinigame.type === 'SpaceJetRepair' ? (
                    <SpaceJetRepair
                        difficulty={activeMinigame.difficulty}
                        timeLimit={activeMinigame.timeLimit}
                        onComplete={handleMinigameComplete}
                        onClose={() => setActiveMinigame(null)}
                    />
                ) : activeMinigame.type === 'LightsaberDuel' ? (
                    <LightsaberDuel
                        difficulty={activeMinigame.difficulty}
                        onComplete={handleMinigameComplete}
                        onClose={() => setActiveMinigame(null)}
                    />
                ) : activeMinigame.type === 'SyndicateInfiltration' ? (
                    <SyndicateInfiltration
                        difficulty={activeMinigame.difficulty}
                        timeLimit={activeMinigame.timeLimit}
                        onComplete={handleMinigameComplete}
                        onClose={() => setActiveMinigame(null)}
                    />
                ) : activeMinigame.type === 'FinalDuel' ? (
                    <FinalDuel
                        miniGameId={activeMinigame.miniGameID}
                        difficulty={activeMinigame.difficulty}
                        timeLimit={activeMinigame.timeLimit}
                        onComplete={handleMinigameComplete}
                    />
                ) : null
            )}
        </div>
    );
};

export default Scene;