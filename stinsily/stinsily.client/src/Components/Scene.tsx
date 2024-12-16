import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface Scene {
    sceneID: number;
    title: string;
    description: string;
}

interface SceneOption {
    optionId: number;
    text: string;
    nextSceneId: number;
}

const Scene = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [currentScene, setCurrentScene] = useState<Scene | null>(null);
    const [sceneOptions, setSceneOptions] = useState<SceneOption[]>([]);
    const [loading, setLoading] = useState(true);

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
            setCurrentScene(sceneData);

            // Fetch options for this scene
            const optionsResponse = await fetch(`${API_BASE_URL}/Scenes/options/${sceneId}`, {
                credentials: 'include'
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
    }, [navigate]);

    const handleOptionClick = (nextSceneId: number) => {
        navigate(`/scenes/${nextSceneId}`);
    };

    useEffect(() => {
        if (id) {
            fetchScene(id);
        }
    }, [id, fetchScene]);

    if (loading) return <div>Loading...</div>;
    if (!currentScene) return <div>No scene found</div>;

    return (
        <div>
            <h2>{currentScene.title}</h2>
            <p>{currentScene.description}</p>
            <div>
                {sceneOptions.map(option => (
                    <button 
                        key={option.optionId} 
                        onClick={() => handleOptionClick(option.nextSceneId)}
                    >
                        {option.text}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default Scene;