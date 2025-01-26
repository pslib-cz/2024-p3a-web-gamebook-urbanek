import { useEffect, useState } from "react";
import styles from '../Modules/AdminPanel.module.css';
import { useNavigate } from "react-router-dom";
import { FiHome, FiLink, FiBox, FiSettings } from 'react-icons/fi';
import { FaGamepad } from "react-icons/fa";

interface Scene {
    sceneID: number;
    connectionID: number;
    title: string;
    description: string;
    imageURL?: string;
    itemID?: number | null;
    type: 'Normal' | 'Decision';
}

interface ChoiceConnection {
    choicesConnectionsID: number;
    sceneFromID: number;
    sceneToID: number;
    text: string;
    effect: string;  // Format: "health:+10" or "force:-5" or "obiwan:+15" or "scene:5"
    requiredItemID?: number | null;
    miniGameID?: number | null;
}

interface Item {
    itemID: number;
    name: string;
    description: string;
    healthModifier: number;
    forceModifier: number;
    obiWanRelationshipModifier: number;
}

interface MiniGame {
    miniGameID: number;
    type: 'SpaceJetRepair' | 'LightsaberDuel' | 'SyndicateInfiltration';
    title: string;
    description: string;
    difficulty: number;
    timeLimit: number;
    isActive: boolean;
}

const AdminPanel = () => {
    const [isAdmin, setIsAdmin] = useState(false);
    const [scenes, setScenes] = useState<Scene[]>([]);
    const [connections, setConnections] = useState<ChoiceConnection[]>([]);
    const [items, setItems] = useState<Item[]>([]);
    const [activeTab, setActiveTab] = useState<'scenes' | 'connections' | 'items' | 'minigames'>('scenes');
    const navigate = useNavigate();
    
    // Nové scény, spojení a předměty
    const [newScene, setNewScene] = useState<Scene>({
        sceneID: 0,
        connectionID: 0,
        title: '',
        description: '',
        imageURL: '',
        itemID: null,
        type: 'Normal'
    });
    const [newConnection, setNewConnection] = useState<ChoiceConnection>({
        choicesConnectionsID: 0,
        sceneFromID: 0,
        sceneToID: 0,
        text: '',
        effect: '',
        miniGameID: null
    });
    const [newItem, setNewItem] = useState<Item>({ itemID: 0, name: '', description: '', healthModifier: 0, forceModifier: 0, obiWanRelationshipModifier: 0 });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [miniGames, setMiniGames] = useState<MiniGame[]>([]);
    const [newMiniGame, setNewMiniGame] = useState<MiniGame>({
        miniGameID: 0,
        type: 'SpaceJetRepair',
        title: '',
        description: '',
        difficulty: 1,
        timeLimit: 60,
        isActive: true
    });

    useEffect(() => {
        const checkAdmin = async () => {
            // Get both email and token
            const currentUserEmail = localStorage.getItem('currentUserEmail');
            const token = localStorage.getItem('authToken');
            
            if (currentUserEmail === 'admin@admin.com' && token) {
                setIsAdmin(true);
                // Načtení dat po potvrzení admin role
                fetchScenes();
                fetchConnections();
                fetchItems();
                fetchMiniGames();
            } else {
                navigate('/login');
            }
        };

        checkAdmin();
    }, [navigate]);

    // Helper function to get headers with auth token
    const getHeaders = () => {
        const token = localStorage.getItem('authToken');
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    };

    const fetchScenes = async () => {
        try {
            const response = await fetch("http://localhost:5193/api/Scenes", {
                headers: getHeaders()
            });
            if (!response.ok) throw new Error('Failed to fetch scenes');
            const data = await response.json();
            setScenes(data);
        } catch (error) {
            console.error('Error fetching scenes:', error);
        }
    };

    const fetchConnections = async () => {
        try {
            const response = await fetch("http://localhost:5193/api/ChoicesConnections", {
                headers: getHeaders()
            });
            if (!response.ok) throw new Error('Failed to fetch connections');
            const data = await response.json();
            setConnections(data);
        } catch (error) {
            console.error('Error fetching connections:', error);
        }
    };

    const fetchItems = async () => {
        try {
            const response = await fetch("http://localhost:5193/api/Items", {
                headers: getHeaders()
            });
            if (!response.ok) throw new Error('Failed to fetch items');
            const data = await response.json();
            setItems(data);
        } catch (error) {
            console.error('Error fetching items:', error);
        }
    };

    const fetchMiniGames = async () => {
        try {
            const response = await fetch("http://localhost:5193/api/MiniGames", {
                headers: getHeaders()
            });
            if (!response.ok) throw new Error('Failed to fetch mini games');
            const data = await response.json();
            setMiniGames(data);
        } catch (error) {
            console.error('Error fetching mini games:', error);
        }
    };

    // CRUD operace pro scény
    const addScene = async () => {
        try {
            const formData = new FormData();
            formData.append('sceneID', newScene.sceneID.toString());
            formData.append('connectionID', newScene.connectionID.toString());
            formData.append('title', newScene.title);
            formData.append('description', newScene.description || '');
            
            if (newScene.itemID !== undefined && newScene.itemID !== null) {
                formData.append('itemID', newScene.itemID.toString());
            }
            if (selectedFile) {
                formData.append('image', selectedFile);
            }

            const token = localStorage.getItem('authToken');
            const response = await fetch("http://localhost:5193/api/Scenes", {
                method: "POST",
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) throw new Error('Failed to add scene');
            fetchScenes();
        } catch (error) {
            console.error('Error adding scene:', error);
        }
    };

    const updateScene = async (scene: Scene) => {
        try {
            const formData = new FormData();
            formData.append('sceneID', scene.sceneID.toString());
            formData.append('connectionID', scene.connectionID.toString());
            formData.append('title', scene.title);
            formData.append('description', scene.description ?? '');
            
            if (scene.itemID !== undefined && scene.itemID !== null) {
                formData.append('itemID', scene.itemID.toString());
            }

            // Handle image upload if present
            const fileInput = document.querySelector(`#file-input-${scene.sceneID}`) as HTMLInputElement;
            if (fileInput?.files?.[0]) {
                formData.append('image', fileInput.files[0]);
            }

            const token = localStorage.getItem('authToken');
            const response = await fetch(`http://localhost:5193/api/Scenes/${scene.sceneID}`, {
                method: "PUT",
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server error: ${errorText}`);
            }

            await fetchScenes();
        } catch (error) {
            console.error('Error updating scene:', error);
        }
    };

    const deleteScene = async (id: number) => {
        try {
            const response = await fetch(`http://localhost:5193/api/Scenes/${id}`, {
                method: "DELETE",
                headers: getHeaders()
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Failed to delete scene. Status:', response.status, 'Error:', errorText);
                return;
            }
            
            await fetchScenes();
        } catch (error) {
            console.error('Error deleting scene:', error);
        }
    };

    // CRUD operace pro spojení
    const addConnection = async () => {
        try {
            const response = await fetch("http://localhost:5193/api/ChoicesConnections", {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify(newConnection)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Failed to add connection. Status:', response.status, 'Error:', errorText);
                return;
            }
            
            await fetchConnections();
            setNewConnection({
                choicesConnectionsID: 0,
                sceneFromID: 0,
                sceneToID: 0,
                text: '',
                effect: '',
                miniGameID: null
            });
        } catch (error) {
            console.error('Error adding connection:', error);
        }
    };

    const updateConnection = async (connection: ChoiceConnection) => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`http://localhost:5193/api/ChoicesConnections/${connection.choicesConnectionsID}`, {
                method: "PUT",
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    choicesConnectionsID: connection.choicesConnectionsID,
                    sceneFromID: connection.sceneFromID,
                    sceneToID: connection.sceneToID,
                    text: connection.text || '',
                    effect: connection.effect || '',
                    requiredItemID: connection.requiredItemID,
                    miniGameID: connection.miniGameID
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Failed to update connection:', errorText);
                alert('Failed to update connection');
                return;
            }

            await fetchConnections();
        } catch (error) {
            console.error('Error updating connection:', error);
            alert('Failed to update connection');
        }
    };

    const deleteConnection = async (id: number) => {
        try {
            const response = await fetch(`http://localhost:5193/api/ChoicesConnections/${id}`, {
                method: "DELETE",
                headers: getHeaders()
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Failed to delete connection. Status:', response.status, 'Error:', errorText);
                return;
            }
            
            await fetchConnections();
        } catch (error) {
            console.error('Error deleting connection:', error);
        }
    };

    // CRUD operace pro předměty
    const addItem = async () => {
        try {
            const headers = getHeaders();
            console.log('Request headers:', headers);

            const response = await fetch("http://localhost:5193/api/Items", {
                method: "POST",
                headers: headers,
                body: JSON.stringify({
                    itemID: newItem.itemID,
                    name: newItem.name,
                    description: newItem.description,
                    healthModifier: newItem.healthModifier,
                    forceModifier: newItem.forceModifier,
                    obiWanRelationshipModifier: newItem.obiWanRelationshipModifier
                })
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Failed to add item. Status:', response.status, 'Error:', errorText);
                return;
            }
            
            await fetchItems();
            setNewItem({ itemID: 0, name: '', description: '', healthModifier: 0, forceModifier: 0, obiWanRelationshipModifier: 0 });
        } catch (error) {
            console.error('Error adding item:', error);
        }
    };

    const updateItem = async (item: Item) => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`http://localhost:5193/api/Items/${item.itemID}`, {
                method: "PUT",
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    itemID: item.itemID,
                    name: item.name,
                    description: item.description,
                    healthModifier: item.healthModifier,
                    forceModifier: item.forceModifier,
                    obiWanRelationshipModifier: item.obiWanRelationshipModifier
                })
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Failed to update item:', errorText);
                alert('Failed to update item');
                return;
            }
            
            await fetchItems();
        } catch (error) {
            console.error('Error updating item:', error);
            alert('Failed to update item');
        }
    };

    const deleteItem = async (id: number) => {
        try {
            const response = await fetch(`http://localhost:5193/api/Items/${id}`, {
                method: "DELETE",
                headers: getHeaders()
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Failed to delete item. Status:', response.status, 'Error:', errorText);
                return;
            }
            
            await fetchItems();
        } catch (error) {
            console.error('Error deleting item:', error);
        }
    };

    // Add this new function to handle image updates
    const updateSceneWithImage = async (sceneId: number, formData: FormData) => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`http://localhost:5193/api/Scenes/${sceneId}/image`, {
                method: "PUT",
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Failed to update scene image:', errorText);
                return;
            }

            await fetchScenes();
        } catch (error) {
            console.error('Error updating scene image:', error);
        }
    };

    // Add validation function
    const validateMiniGame = (game: MiniGame): boolean => {
        if (!game.title.trim()) {
            alert('Title is required');
            return false;
        }
        if (!game.description.trim()) {
            alert('Description is required');
            return false;
        }
        if (game.difficulty < 1 || game.difficulty > 3) {
            alert('Difficulty must be between 1 and 3');
            return false;
        }
        if (game.timeLimit < 30) {
            alert('Time limit must be at least 30 seconds');
            return false;
        }

        // Specific validations per game type
        switch (game.type) {
            case 'SyndicateInfiltration':
                if (game.timeLimit > 180) {
                    alert('Infiltration missions cannot exceed 3 minutes');
                    return false;
                }
                break;
            case 'LightsaberDuel':
                if (game.timeLimit > 300) {
                    alert('Duels cannot exceed 5 minutes');
                    return false;
                }
                break;
            case 'SpaceJetRepair':
                if (game.timeLimit > 120) {
                    alert('Repairs cannot exceed 2 minutes');
                    return false;
                }
                break;
        }
        return true;
    };

    // CRUD operace pro minigamy
    const handleAddMiniGame = async (miniGame: MiniGame) => {
        try {
            if (!validateMiniGame(miniGame)) return;

            const response = await fetch("http://localhost:5193/api/MiniGames", {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify(miniGame)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to add mini game: ${errorText}`);
            }
            
            // Reset form and refresh list
            setNewMiniGame({
                miniGameID: 0,
                type: 'SpaceJetRepair',
                title: '',
                description: '',
                difficulty: 1,
                timeLimit: 60,
                isActive: true
            });
            await fetchMiniGames();
        } catch (error) {
            console.error('Error adding mini game:', error);
            alert('Failed to add mini game');
        }
    };

    const updateMiniGame = async (game: MiniGame) => {
        try {
            if (!validateMiniGame(game)) return;

            const response = await fetch(`http://localhost:5193/api/MiniGames/${game.miniGameID}`, {
                method: "PUT",
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify(game)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to update mini game: ${errorText}`);
            }
            await fetchMiniGames();
        } catch (error) {
            console.error('Error updating mini game:', error);
            alert('Failed to update mini game');
        }
    };

    const deleteMiniGame = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this mini game? This action cannot be undone.')) return;

        try {
            const response = await fetch(`http://localhost:5193/api/MiniGames/${id}`, {
                method: "DELETE",
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to delete mini game: ${errorText}`);
            }
            await fetchMiniGames();
        } catch (error) {
            console.error('Error deleting mini game:', error);
            alert('Failed to delete mini game');
        }
    };

    // Add helper text components
    const getTimeDescription = (type: string): string => {
        switch (type) {
            case 'SyndicateInfiltration':
                return 'Time to collect required data (30-180 seconds)';
            case 'LightsaberDuel':
                return 'Maximum duel duration (30-300 seconds)';
            case 'SpaceJetRepair':
                return 'Time to repair all components (30-120 seconds)';
            default:
                return 'Time limit in seconds';
        }
    };

    const getDifficultyDescription = (type: string): string => {
        switch (type) {
            case 'SyndicateInfiltration':
                return 'Affects number of guards and data points';
            case 'LightsaberDuel':
                return 'Affects pattern complexity and damage';
            case 'SpaceJetRepair':
                return 'Affects number of parts and time limit';
            default:
                return 'Difficulty level (1-3)';
        }
    };

    if (!isAdmin) return null;

    return (
        <div className={styles['admin-panel']}>
            <div className={styles.sidebar}>
                <div className={styles['sidebar-header']}>
                    <h1>Admin Dashboard</h1>
                </div>
                <div className={styles.tabs}>
                    <button 
                        className={`${styles.tab} ${activeTab === 'scenes' ? styles.active : ''}`}
                        onClick={() => setActiveTab('scenes')}
                    >
                        <FiHome /> Scenes
                    </button>
                    <button 
                        className={`${styles.tab} ${activeTab === 'connections' ? styles.active : ''}`}
                        onClick={() => setActiveTab('connections')}
                    >
                        <FiLink /> Connections
                    </button>
                    <button 
                        className={`${styles.tab} ${activeTab === 'items' ? styles.active : ''}`}
                        onClick={() => setActiveTab('items')}
                    >
                        <FiBox /> Items
                    </button>
                    <button 
                        className={`${styles.tab} ${activeTab === 'minigames' ? styles.active : ''}`}
                        onClick={() => setActiveTab('minigames')}
                    >
                        <FaGamepad /> Mini Games
                    </button>
                </div>
            </div>

            <div className={styles['main-content']}>
                {activeTab === 'scenes' && (
                    <div className={styles['content-section']}>
                        <div className={styles['add-form']}>
                            <h2>Add New Scene</h2>
                            <div className={styles['form-group']}>
                                <label>Scene ID</label>
                                <input
                                    type="number"
                                    className={styles['form-control']}
                                    value={newScene.sceneID}
                                    onChange={(e) => setNewScene({...newScene, sceneID: parseInt(e.target.value)})}
                                />
                            </div>
                            <div className={styles['form-group']}>
                                <label>Connection ID</label>
                                <input
                                    type="number"
                                    className={styles['form-control']}
                                    value={newScene.connectionID}
                                    onChange={(e) => setNewScene({...newScene, connectionID: parseInt(e.target.value)})}
                                />
                            </div>
                            <div className={styles['form-group']}>
                                <label>Title</label>
                                <input
                                    type="text"
                                    className={styles['form-control']}
                                    value={newScene.title}
                                    onChange={(e) => setNewScene({...newScene, title: e.target.value})}
                                />
                            </div>
                            <div className={styles['form-group']}>
                                <label>Description</label>
                                <textarea
                                    className={styles['form-control']}
                                    value={newScene.description}
                                    onChange={(e) => setNewScene({...newScene, description: e.target.value})}
                                />
                            </div>
                            <div className={styles['form-group']}>
                                <label>Scene Item</label>
                                <select
                                    className={styles['form-control']}
                                    value={newScene.itemID || ''}
                                    onChange={(e) => setNewScene({
                                        ...newScene, 
                                        itemID: e.target.value ? parseInt(e.target.value) : null
                                    })}
                                >
                                    <option value="">No Item</option>
                                    {items.map(item => (
                                        <option key={item.itemID} value={item.itemID}>
                                            {item.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className={styles['form-group']}>
                                <label>Scene Image</label>
                                <div className={styles['file-upload']}>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                    />
                                    {selectedFile && (
                                        <div className={styles['image-preview']}>
                                            <img 
                                                src={URL.createObjectURL(selectedFile)} 
                                                alt="Preview" 
                                                style={{ maxWidth: '200px' }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button className={styles['add-button']} onClick={addScene}>
                                Add Scene
                            </button>
                        </div>

                        <div className={styles['items-grid']}>
                            {scenes.map(scene => (
                                <div key={scene.sceneID} className={styles['item-card']}>
                                    <div className={styles['form-group']}>
                                        <label>Scene ID</label>
                                        <input
                                            type="number"
                                            value={scene.sceneID}
                                            onChange={(e) => updateScene({...scene, sceneID: parseInt(e.target.value)})}
                                        />
                                    </div>
                                    <div className={styles['form-group']}>
                                        <label>Connection ID</label>
                                        <input
                                            type="number"
                                            value={scene.connectionID || ''}
                                            onChange={(e) => updateScene({...scene, connectionID: parseInt(e.target.value)})}
                                        />
                                    </div>
                                    <div className={styles['form-group']}>
                                        <label>Title</label>
                                        <input
                                            type="text"
                                            value={scene.title}
                                            onChange={(e) => updateScene({...scene, title: e.target.value})}
                                        />
                                    </div>
                                    <div className={styles['form-group']}>
                                        <label>Description</label>
                                        <textarea
                                            value={scene.description ?? ''}
                                            onChange={(e) => updateScene({...scene, description: e.target.value || ""})}
                                        />
                                    </div>
                                    <div className={styles['form-group']}>
                                        <label>Scene Item</label>
                                        <select
                                            value={scene.itemID || ''}
                                            onChange={(e) => updateScene({
                                                ...scene, 
                                                itemID: e.target.value ? parseInt(e.target.value) : undefined
                                            })}
                                        >
                                            <option value="">No Item</option>
                                            {items.map(item => (
                                                <option key={item.itemID} value={item.itemID}>
                                                    {item.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className={styles['form-group']}>
                                        <label>Scene Image</label>
                                        <div className={styles['file-upload']}>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        const formData = new FormData();
                                                        formData.append('image', file);
                                                        await updateSceneWithImage(scene.sceneID, formData);
                                                    }
                                                }}
                                            />
                                        </div>
                                        {scene.imageURL && (
                                            <div className={styles['image-preview']}>
                                                <img 
                                                    src={`http://localhost:5193${scene.imageURL}`}
                                                    alt="Scene preview"
                                                    style={{ maxWidth: '200px' }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <div className={styles['button-group']}>
                                        <button 
                                            className={styles['delete-button']} 
                                            onClick={() => deleteScene(scene.sceneID)}
                                        >
                                            Delete
                                        </button>
                                        <button 
                                            className={styles['save-button']} 
                                            onClick={() => updateScene(scene)}
                                        >
                                            Save
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'connections' && (
                    <div className={styles['content-section']}>
                        <div className={styles['add-form']}>
                            <h2>Add New Connection</h2>
                            <div className={styles['form-group']}>
                                <label>From Scene ID</label>
                                <input
                                    type="number"
                                    value={newConnection.sceneFromID || ''}
                                    onChange={(e) => setNewConnection({...newConnection, sceneFromID: parseInt(e.target.value)})}
                                />
                            </div>
                            <div className={styles['form-group']}>
                                <label>To Scene ID</label>
                                <input
                                    type="number"
                                    value={newConnection.sceneToID || ''}
                                    onChange={(e) => setNewConnection({...newConnection, sceneToID: parseInt(e.target.value)})}
                                />
                            </div>
                            <div className={styles['form-group']}>
                                <label>Text (Decision Response)</label>
                                <textarea
                                    value={newConnection.text}
                                    onChange={(e) => setNewConnection({...newConnection, text: e.target.value})}
                                />
                            </div>
                            <div className={styles['form-group']}>
                                <label>
                                    Effect Type
                                    <span className={styles.tooltip} data-tip="Choose how this choice affects the game">ⓘ</span>
                                </label>
                                <div className={styles['effect-group']}>
                                    <select
                                        value={newConnection.effect.split(':')[0]}
                                        onChange={(e) => {
                                            const currentValue = newConnection.effect.split(':')[1] || '0';
                                            setNewConnection({
                                                ...newConnection,
                                                effect: `${e.target.value}:${currentValue}`
                                            });
                                        }}
                                    >
                                        <option value="scene">Go to Scene</option>
                                        <option value="health">Modify Health</option>
                                        <option value="force">Modify Force</option>
                                        <option value="obiwan">Modify Obi-Wan Relationship</option>
                                    </select>
                                    
                                    <div className={styles['effect-value']} data-prefix={newConnection.effect.startsWith('scene') ? '#' : '±'}>
                                        <input
                                            type="number"
                                            value={newConnection.effect.split(':')[1] || '0'}
                                            onChange={(e) => {
                                                const effectType = newConnection.effect.split(':')[0] || 'scene';
                                                setNewConnection({
                                                    ...newConnection,
                                                    effect: `${effectType}:${e.target.value}`
                                                });
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className={styles['form-group']}>
                                <label>Required Item ID (Optional)</label>
                                <input
                                    type="number"
                                    value={newConnection.requiredItemID || ''}
                                    onChange={(e) => setNewConnection({
                                        ...newConnection, 
                                        requiredItemID: e.target.value ? parseInt(e.target.value) : null
                                    })}
                                />
                            </div>
                            <div className={styles['form-group']}>
                                <label>Mini Game ID</label>
                                <input
                                    type="number"
                                    value={newConnection.miniGameID || ''}
                                    onChange={(e) => setNewConnection({...newConnection, miniGameID: parseInt(e.target.value) || null})}
                                />
                            </div>
                            <button className={styles['add-button']} onClick={addConnection}>
                                Add Connection
                            </button>
                        </div>

                        <div className={styles['items-grid']}>
                            {connections.map(connection => (
                                <div key={connection.choicesConnectionsID} className={styles['item-card']}>
                                    <div className={styles['form-group']}>
                                        <label>Connection ID</label>
                                        <input
                                            type="number"
                                            value={connection.choicesConnectionsID}
                                            onChange={(e) => updateConnection({...connection, choicesConnectionsID: parseInt(e.target.value)})}
                                        />
                                    </div>
                                    <div className={styles['form-group']}>
                                        <label>From Scene ID</label>
                                        <input
                                            type="number"
                                            value={connection.sceneFromID}
                                            onChange={(e) => updateConnection({...connection, sceneFromID: parseInt(e.target.value)})}
                                        />
                                    </div>
                                    <div className={styles['form-group']}>
                                        <label>To Scene ID</label>
                                        <input
                                            type="number"
                                            value={connection.sceneToID}
                                            onChange={(e) => updateConnection({...connection, sceneToID: parseInt(e.target.value)})}
                                        />
                                    </div>
                                    <div className={styles['form-group']}>
                                        <label>Text</label>
                                        <input
                                            type="text"
                                            value={connection.text}
                                            onChange={(e) => updateConnection({...connection, text: e.target.value})}
                                        />
                                    </div>
                                    <div className={styles['form-group']}>
                                        <label>Effect Type</label>
                                        <select
                                            value={connection.effect.split(':')[0]}
                                            onChange={(e) => {
                                                const currentValue = connection.effect.split(':')[1] || '0';
                                                updateConnection({
                                                    ...connection,
                                                    effect: `${e.target.value}:${currentValue}`
                                                });
                                            }}
                                        >
                                            <option value="scene">Go to Scene</option>
                                            <option value="health">Modify Health</option>
                                            <option value="force">Modify Force</option>
                                            <option value="obiwan">Modify Obi-Wan Relationship</option>
                                        </select>
                                    </div>
                                    <div className={styles['form-group']}>
                                        <label>Effect Value</label>
                                        <div className={styles['effect-input']}>
                                            <input
                                                type="number"
                                                value={connection.effect.split(':')[1] || '0'}
                                                onChange={(e) => {
                                                    const effectType = connection.effect.split(':')[0] || 'scene';
                                                    updateConnection({
                                                        ...connection,
                                                        effect: `${effectType}:${e.target.value}`
                                                    });
                                                }}
                                            />
                                            <span className={styles['effect-hint']}>
                                                {connection.effect.startsWith('scene') 
                                                    ? '(Scene ID to navigate to)'
                                                    : '(Use + or - for increase/decrease)'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className={styles['form-group']}>
                                        <label>Required Item ID</label>
                                        <input
                                            type="number"
                                            value={connection.requiredItemID || ''}
                                            onChange={(e) => updateConnection({...connection, requiredItemID: parseInt(e.target.value) || null})}
                                        />
                                    </div>
                                    <div className={styles['form-group']}>
                                        <label>Mini Game ID</label>
                                        <input
                                            type="number"
                                            value={connection.miniGameID || ''}
                                            onChange={(e) => updateConnection({...connection, miniGameID: parseInt(e.target.value) || null})}
                                        />
                                    </div>
                                    <div className={styles['button-group']}>
                                        <button 
                                            className={styles['delete-button']} 
                                            onClick={() => deleteConnection(connection.choicesConnectionsID)}
                                        >
                                            Delete
                                        </button>
                                        <button 
                                            className={styles['save-button']} 
                                            onClick={() => updateConnection(connection)}
                                        >
                                            Save
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'items' && (
                    <div className={styles['content-section']}>
                        <div className={styles['add-form']}>
                            <h2>Add New Item</h2>
                            <div className={styles['form-group']}>
                                <label>Item ID</label>
                                <input
                                    type="number"
                                    value={newItem.itemID}
                                    onChange={(e) => setNewItem({...newItem, itemID: parseInt(e.target.value)})}
                                />
                            </div>
                            <div className={styles['form-group']}>
                                <label>Name</label>
                                <input
                                    type="text"
                                    value={newItem.name}
                                    onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                                />
                            </div>
                            <div className={styles['form-group']}>
                                <label>Description</label>
                                <textarea
                                    value={newItem.description}
                                    onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                                />
                            </div>
                            <div className={styles['form-group']}>
                                <label>Health Modifier</label>
                                <input
                                    type="number"
                                    value={newItem.healthModifier}
                                    onChange={(e) => setNewItem({...newItem, healthModifier: parseInt(e.target.value)})}
                                />
                            </div>
                            <div className={styles['form-group']}>
                                <label>Force Modifier</label>
                                <input
                                    type="number"
                                    value={newItem.forceModifier}
                                    onChange={(e) => setNewItem({...newItem, forceModifier: parseInt(e.target.value)})}
                                />
                            </div>
                            <div className={styles['form-group']}>
                                <label>Obi-Wan Relationship Modifier</label>
                                <input
                                    type="number"
                                    value={newItem.obiWanRelationshipModifier}
                                    onChange={(e) => setNewItem({...newItem, obiWanRelationshipModifier: parseInt(e.target.value)})}
                                />
                            </div>
                            <button className={styles['add-button']} onClick={addItem}>
                                Add Item
                            </button>
                        </div>

                        <div className={styles['items-grid']}>
                            {items.map(item => (
                                <div key={item.itemID} className={styles['item-card']}>
                                    <div className={styles['form-group']}>
                                        <label>Item ID</label>
                                        <input
                                            type="number"
                                            value={item.itemID}
                                            onChange={(e) => updateItem({...item, itemID: parseInt(e.target.value)})}
                                        />
                                    </div>
                                    <div className={styles['form-group']}>
                                        <label>Name</label>
                                        <input
                                            type="text"
                                            value={item.name}
                                            onChange={(e) => updateItem({...item, name: e.target.value})}
                                        />
                                    </div>
                                    <div className={styles['form-group']}>
                                        <label>Description</label>
                                        <textarea
                                            value={item.description}
                                            onChange={(e) => updateItem({...item, description: e.target.value})}
                                        />
                                    </div>
                                    <div className={styles['form-group']}>
                                        <label>Health Modifier</label>
                                        <input
                                            type="number"
                                            value={item.healthModifier}
                                            onChange={(e) => updateItem({...item, healthModifier: parseInt(e.target.value)})}
                                        />
                                    </div>
                                    <div className={styles['form-group']}>
                                        <label>Force Modifier</label>
                                        <input
                                            type="number"
                                            value={item.forceModifier}
                                            onChange={(e) => updateItem({...item, forceModifier: parseInt(e.target.value)})}
                                        />
                                    </div>
                                    <div className={styles['form-group']}>
                                        <label>Obi-Wan Relationship Modifier</label>
                                        <input
                                            type="number"
                                            value={item.obiWanRelationshipModifier}
                                            onChange={(e) => updateItem({...item, obiWanRelationshipModifier: parseInt(e.target.value)})}
                                        />
                                    </div>
                                    <div className={styles['button-group']}>
                                        <button 
                                            className={styles['delete-button']} 
                                            onClick={() => deleteItem(item.itemID)}
                                        >
                                            Delete
                                        </button>
                                        <button 
                                            className={styles['save-button']} 
                                            onClick={() => updateItem(item)}
                                        >
                                            Save
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'minigames' && (
                    <div className={styles['content-section']}>
                        <h2>Mini Games</h2>
                        <div className={styles['add-form']}>
                            <div className={styles['effect-group']}>
                                <label>Type</label>
                                <select
                                    value={newMiniGame.type}
                                    onChange={(e) => setNewMiniGame({
                                        ...newMiniGame,
                                        type: e.target.value as 'SpaceJetRepair' | 'LightsaberDuel' | 'SyndicateInfiltration'
                                    })}
                                >
                                    <option value="SpaceJetRepair">Space Jet Repair</option>
                                    <option value="LightsaberDuel">Lightsaber Duel</option>
                                    <option value="SyndicateInfiltration">Syndicate Infiltration</option>
                                </select>
                            </div>
                            <div className={styles['form-group']}>
                                <label>Title</label>
                                <input
                                    type="text"
                                    value={newMiniGame.title}
                                    onChange={(e) => setNewMiniGame({...newMiniGame, title: e.target.value})}
                                />
                            </div>
                            <div className={styles['form-group']}>
                                <label>Description</label>
                                <textarea
                                    value={newMiniGame.description}
                                    onChange={(e) => setNewMiniGame({...newMiniGame, description: e.target.value})}
                                />
                            </div>
                            <div className={styles['form-group']}>
                                <label>Difficulty (1-3)</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="3"
                                    value={newMiniGame.difficulty}
                                    onChange={(e) => setNewMiniGame({...newMiniGame, difficulty: parseInt(e.target.value)})}
                                />
                                <span className={styles['help-text']}>
                                    {getDifficultyDescription(newMiniGame.type)}
                                </span>
                            </div>
                            <div className={styles['form-group']}>
                                <label>Time Limit (seconds)</label>
                                <input
                                    type="number"
                                    min="30"
                                    max={
                                        newMiniGame.type === 'SyndicateInfiltration' ? 180 :
                                        newMiniGame.type === 'LightsaberDuel' ? 300 : 120
                                    }
                                    value={newMiniGame.timeLimit}
                                    onChange={(e) => setNewMiniGame({...newMiniGame, timeLimit: parseInt(e.target.value)})}
                                />
                                <span className={styles['help-text']}>
                                    {getTimeDescription(newMiniGame.type)}
                                </span>
                            </div>
                            <button 
                                className={styles['save-button']} 
                                onClick={() => handleAddMiniGame(newMiniGame)}
                            >
                                Add Mini Game
                            </button>
                        </div>

                        <div className={styles['items-grid']}>
                            {miniGames.map(game => (
                                <div key={game.miniGameID} className={styles['item-card']}>
                                    <div className={styles['form-group']}>
                                        <label>Type</label>
                                        <select
                                            value={game.type}
                                            onChange={(e) => updateMiniGame({
                                                ...game,
                                                type: e.target.value as 'SpaceJetRepair' | 'LightsaberDuel' | 'SyndicateInfiltration'
                                            })}
                                        >
                                            <option value="SpaceJetRepair">Space Jet Repair</option>
                                            <option value="LightsaberDuel">Lightsaber Duel</option>
                                            <option value="SyndicateInfiltration">Syndicate Infiltration</option>
                                        </select>
                                    </div>
                                    <div className={styles['form-group']}>
                                        <label>Title</label>
                                        <input
                                            type="text"
                                            value={game.title}
                                            onChange={(e) => updateMiniGame({...game, title: e.target.value})}
                                        />
                                    </div>
                                    <div className={styles['form-group']}>
                                        <label>Description</label>
                                        <textarea
                                            value={game.description}
                                            onChange={(e) => updateMiniGame({...game, description: e.target.value})}
                                        />
                                    </div>
                                    <div className={styles['form-group']}>
                                        <label>Difficulty</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="3"
                                            value={game.difficulty}
                                            onChange={(e) => updateMiniGame({...game, difficulty: parseInt(e.target.value)})}
                                        />
                                    </div>
                                    <div className={styles['form-group']}>
                                        <label>Time Limit</label>
                                        <input
                                            type="number"
                                            value={game.timeLimit}
                                            onChange={(e) => updateMiniGame({...game, timeLimit: parseInt(e.target.value)})}
                                        />
                                    </div>
                                    <div className={styles['button-group']}>
                                        <button 
                                            className={styles['delete-button']} 
                                            onClick={() => deleteMiniGame(game.miniGameID)}
                                        >
                                            Delete
                                        </button>
                                        <button 
                                            className={styles['save-button']} 
                                            onClick={() => updateMiniGame(game)}
                                        >
                                            Save
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPanel;