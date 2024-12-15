import { useState, useEffect } from 'react';

interface Scene {
    sceneID: number;
    connectionID: number;
    title: string;
    description: string;
}

interface SceneOption {
    connectionId: number;
    text: string;
    nextSceneId: number;
}

const Scene = () => {
    const [currentScene, setCurrentScene] = useState<Scene | null>(null);
    const [sceneOptions, setSceneOptions] = useState<SceneOption[]>([]);
    const [loading, setLoading] = useState(true);

    const API_BASE_URL = 'http://localhost:5193/api';

    const fetchCurrentScene = async () => {
        try {
            console.log('Fetching current scene...');
            const response = await fetch(`${API_BASE_URL}/Scenes/current-scene`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            console.log('Response status:', response.status);

            if (response.status === 401) {
                window.location.href = '/';
                return;
            }

            if (!response.ok) {
                const text = await response.text();
                console.error('Response text:', text);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Received data:', data);
            setCurrentScene(data.scene);
            setSceneOptions(data.availableConnections || []);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching scene:', error);
            setLoading(false);
        }
    };

    const fetchSceneOptions = async () => {
        if (!currentScene?.sceneID) return;
        
        try {
            const response = await fetch(`${API_BASE_URL}/Scenes/options/${currentScene.sceneID}`, {
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            setSceneOptions(data);
        } catch (error) {
            console.error('Error fetching options:', error);
        }
    };

    const handleOptionClick = async (nextSceneId: number) => {
        try {
            const response = await fetch(`${API_BASE_URL}/Scenes/move-to-scene`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(nextSceneId)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            await fetchCurrentScene();
        } catch (error) {
            console.error('Error navigating to scene:', error);
        }
    };

    useEffect(() => {
        fetchCurrentScene();
    }, []);

    useEffect(() => {
        if (currentScene?.sceneID) {
            fetchSceneOptions();
        }
    }, [currentScene]);

    if (loading) {
        return <div>Loading scene...</div>;
    }

    if (!currentScene) {
        return <div>No scene found</div>;
    }

    return (
        <div className="scene-container">
            <h2>{currentScene.title}</h2>
            <p>{currentScene.description}</p>
            <div className="options-container">
                {sceneOptions && sceneOptions.length > 0 ? (
                    sceneOptions.map((option) => (
                        <button 
                            key={option.connectionId}
                            onClick={() => handleOptionClick(option.nextSceneId)}
                            className="option-button"
                        >
                            {option.text}
                        </button>
                    ))
                ) : (
                    <div>
                        <p>No options available</p>
                        <button 
                            onClick={() => handleOptionClick(currentScene.sceneID + 1)}
                            className="option-button"
                        >
                            Next Scene
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Scene;