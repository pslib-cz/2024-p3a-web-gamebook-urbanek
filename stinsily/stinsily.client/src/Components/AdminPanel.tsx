import { useEffect, useState } from "react";
import styles from '../Modules/AdminPanel.module.css';
import { useNavigate } from "react-router-dom";

interface Scene {
    sceneID: number;
    connectionID: number;
    title: string;
    description: string;
    image: string;
}

interface ChoiceConnection {
    choicesConnectionsID: number;
    sceneFromID: number;
    sceneToID: number;
    text: string;
    effect: string;
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

const AdminPanel = () => {
    const [isAdmin, setIsAdmin] = useState(false);
    const [scenes, setScenes] = useState<Scene[]>([]);
    const [connections, setConnections] = useState<ChoiceConnection[]>([]);
    const [items, setItems] = useState<Item[]>([]);
    const [activeTab, setActiveTab] = useState<'scenes' | 'connections' | 'items'>('scenes');
    const navigate = useNavigate();
    
    // Nové scény, spojení a předměty
    const [newScene, setNewScene] = useState<Scene>({ sceneID: 0, connectionID: 0, title: '', description: '', image: '' });
    const [newConnection, setNewConnection] = useState<ChoiceConnection>({
        choicesConnectionsID: 0,
        sceneFromID: 0,
        sceneToID: 0,
        text: '',
        effect: ''
    });
    const [newItem, setNewItem] = useState<Item>({ itemID: 0, name: '', description: '', healthModifier: 0, forceModifier: 0, obiWanRelationshipModifier: 0 });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

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

    // CRUD operace pro scény
    const addScene = async () => {
        try {
            const formData = new FormData();
            formData.append('sceneID', newScene.sceneID.toString());
            formData.append('connectionID', newScene.connectionID.toString());
            formData.append('title', newScene.title);
            formData.append('description', newScene.description);
            
            if (selectedFile) {
                formData.append('image', selectedFile);
            }

            const token = localStorage.getItem('authToken');
            
            console.log('Starting file upload...');
            
            try {
                const response = await fetch("http://localhost:5193/api/Scenes", {
                    method: "POST",
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });

                console.log('Upload response status:', response.status);

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Failed to add scene. Status:', response.status, 'Error:', errorText);
                    return;
                }

                const result = await response.json();
                console.log('Scene added successfully:', result);
                
                await fetchScenes();
                setNewScene({ sceneID: 0, connectionID: 0, title: '', description: '', image: '' });
                setSelectedFile(null);
            } catch (error) {
                console.error('Network or parsing error:', error);
                throw error; // Re-throw to be caught by outer try-catch
            }
        } catch (error) {
            console.error('Error in addScene:', error);
            // You might want to show this error to the user
            alert('Failed to upload scene. Please try again.');
        }
    };

    const updateScene = async (scene: Scene) => {
        try {
            const formData = new FormData();
            formData.append('sceneID', scene.sceneID.toString());
            formData.append('connectionID', scene.connectionID.toString());
            formData.append('title', scene.title);
            formData.append('description', scene.description);
            
            // Get the file input element for this specific scene
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
                console.error('Failed to update scene. Status:', response.status, 'Error:', errorText);
                return;
            }
            
            await fetchScenes();
            // Clear the file input after successful update
            if (fileInput) fileInput.value = '';
            
        } catch (error) {
            console.error('Error updating scene:', error);
            alert('Failed to update scene');
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
                effect: ''
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
                    text: connection.text,
                    effect: connection.effect,
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

    if (!isAdmin) return null;

    return (
        <div className={styles['admin-panel']}>
            <div className={styles.tabs}>
                <button onClick={() => setActiveTab('scenes')}>Scenes</button>
                <button onClick={() => setActiveTab('connections')}>Connections</button>
                <button onClick={() => setActiveTab('items')}>Items</button>
            </div>

            {activeTab === 'scenes' && (
                <div className={styles['scenes-section']}>
                    <h2>Scenes</h2>
                    <div className={styles['add-form']}>
                        <h2>Add Scene</h2>
                        <input
                            type="number"
                            placeholder="Scene ID"
                            value={newScene.sceneID}
                            onChange={(e) => setNewScene({...newScene, sceneID: parseInt(e.target.value)})}
                        />
                        <h2>Connection ID</h2>
                        <input
                            type="number"
                            placeholder="Connection ID"
                            value={newScene.connectionID}
                            onChange={(e) => setNewScene({...newScene, connectionID: parseInt(e.target.value)})}
                        />
                        <h2>Title</h2>
                        <input
                            type="text"
                            placeholder="Title"
                            value={newScene.title}
                            onChange={(e) => setNewScene({...newScene, title: e.target.value})}
                        />
                        <h2>Description</h2>
                        <textarea
                            placeholder="Description"
                            value={newScene.description}
                            onChange={(e) => setNewScene({...newScene, description: e.target.value})}
                        />
                        <h2>Image</h2>
                        <input
                            id={`file-input-${newScene.sceneID}`}
                            type="file"
                            accept="image/jpeg,image/png,image/gif"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    console.log('File selected:', file.name);
                                    setSelectedFile(file);
                                }
                            }}
                        />
                        {selectedFile && (
                            <div>Selected file: {selectedFile.name}</div>
                        )}
                        <button onClick={addScene}>Add Scene</button>
                    </div>
                    <div className={styles['items-list']}>
                        {scenes.map(scene => (
                            <div key={scene.sceneID} className={styles.item}>
                                <h3>Scene ID</h3>
                                <input
                                    type="number"
                                    value={scene.sceneID}
                                    onChange={(e) => updateScene({...scene, sceneID: parseInt(e.target.value)})}
                                />
                                <h3>Connection ID</h3>
                                <input
                                    type="number"
                                    value={scene.connectionID}
                                    onChange={(e) => updateScene({...scene, connectionID: parseInt(e.target.value)})}
                                />
                                <h3>Title</h3>
                                <input
                                    type="text"
                                    value={scene.title}
                                    onChange={(e) => updateScene({...scene, title: e.target.value})}
                                />
                                <h3>Description</h3>
                                <textarea
                                    value={scene.description}
                                    onChange={(e) => updateScene({...scene, description: e.target.value})}
                                />
                                <h3>Image</h3>
                                <input
                                    id={`file-input-${scene.sceneID}`}
                                    type="file"
                                    accept="image/jpeg,image/png,image/gif"
                                    onChange={(e) => {
                                        // We don't need to do anything here anymore
                                        // The file will be handled when clicking Save Changes
                                    }}
                                />
                                {scene.image && (
                                    <img 
                                        src={scene.image} 
                                        alt="Scene" 
                                        style={{ maxWidth: '200px', marginTop: '10px' }} 
                                    />
                                )}
                                <div className={styles.buttonGroup}>
                                    <button onClick={() => deleteScene(scene.sceneID)}>Delete</button>
                                    <button onClick={() => updateScene(scene)}>Save Changes</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'connections' && (
                <div className={styles['connections-section']}>
                    <h2>Connections</h2>
                    <div className={styles['add-form']}>
                        <h2>From Scene ID</h2>
                        <input
                            type="number"
                            placeholder="From Scene ID"
                            value={newConnection.sceneFromID || ''}
                            onChange={(e) => setNewConnection({...newConnection, sceneFromID: parseInt(e.target.value)})}
                        />
                        <h2>To Scene ID</h2>
                        <input
                            type="number"
                            placeholder="To Scene ID"
                            value={newConnection.sceneToID || ''}
                            onChange={(e) => setNewConnection({...newConnection, sceneToID: parseInt(e.target.value)})}
                        />
                        <h2>Text</h2>
                        <input
                            type="text"
                            placeholder="Text"
                            value={newConnection.text}
                            onChange={(e) => setNewConnection({...newConnection, text: e.target.value})}
                        />
                        <h2>Effect</h2>
                        <input
                            type="text"
                            placeholder="Effect"
                            value={newConnection.effect}
                            onChange={(e) => setNewConnection({...newConnection, effect: e.target.value})}
                        />
                        <h2>Required Item ID</h2>
                        <input
                            type="number"
                            placeholder="Required Item ID"
                            value={newConnection.requiredItemID || ''}
                            onChange={(e) => setNewConnection({...newConnection, requiredItemID: parseInt(e.target.value) || null})}
                        />
                        <h2>Mini Game ID</h2>
                        <input
                            type="number"
                            placeholder="Mini Game ID"
                            value={newConnection.miniGameID || ''}
                            onChange={(e) => setNewConnection({...newConnection, miniGameID: parseInt(e.target.value) || null})}
                        />
                        <button onClick={addConnection}>Add Connection</button>
                    </div>
                    <div className={styles['items-list']}>
                        {connections.map(connection => (
                            <div key={connection.choicesConnectionsID} className={styles.item}>
                                <h3>Connection ID</h3>
                                <input
                                    type="number"
                                    value={connection.choicesConnectionsID}
                                    onChange={(e) => updateConnection({...connection, choicesConnectionsID: parseInt(e.target.value)})}
                                />
                                <h3>From Scene ID</h3>
                                <input
                                    type="number"
                                    value={connection.sceneFromID}
                                    onChange={(e) => updateConnection({...connection, sceneFromID: parseInt(e.target.value)})}
                                />
                                <h3>To Scene ID</h3>
                                <input
                                    type="number"
                                    value={connection.sceneToID}
                                    onChange={(e) => updateConnection({...connection, sceneToID: parseInt(e.target.value)})}
                                />
                                <h3>Text</h3>
                                <input
                                    type="text"
                                    value={connection.text}
                                    onChange={(e) => updateConnection({...connection, text: e.target.value})}
                                />
                                <h3>Effect</h3>
                                <input
                                    type="text"
                                    value={connection.effect}
                                    onChange={(e) => updateConnection({...connection, effect: e.target.value})}
                                />
                                <h3>Required Item ID</h3>
                                <input
                                    type="number"
                                    value={connection.requiredItemID || ''}
                                    onChange={(e) => updateConnection({...connection, requiredItemID: parseInt(e.target.value) || null})}
                                />
                                <h3>Mini Game ID</h3>
                                <input
                                    type="number"
                                    value={connection.miniGameID || ''}
                                    onChange={(e) => updateConnection({...connection, miniGameID: parseInt(e.target.value) || null})}
                                />
                                <div className={styles.buttonGroup}>
                                    <button onClick={() => deleteConnection(connection.choicesConnectionsID)}>Delete</button>
                                    <button onClick={() => updateConnection(connection)}>Save Changes</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'items' && (
                <div className={styles['items-section']}>
                    <h2>Items</h2>
                    <div className={styles['add-form']}>
                        <h2>Item ID</h2>
                        <input
                            type="number"
                            placeholder="Item ID"
                            value={newItem.itemID}
                            onChange={(e) => setNewItem({...newItem, itemID: parseInt(e.target.value)})}
                        />
                        <h2>Name</h2>
                        <input
                            type="text"
                            placeholder="Name"
                            value={newItem.name}
                            onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                        />
                        <h2>Description</h2>
                        <textarea
                            placeholder="Description"
                            value={newItem.description}
                            onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                        />
                        <h2>Health Modifier</h2>
                        <input
                            type="number"
                            placeholder="Health Modifier"
                            value={newItem.healthModifier}
                            onChange={(e) => setNewItem({...newItem, healthModifier: parseInt(e.target.value)})}
                        />
                        <h2>Force Modifier</h2>
                        <input
                            type="number"
                            placeholder="Force Modifier"
                            value={newItem.forceModifier}
                            onChange={(e) => setNewItem({...newItem, forceModifier: parseInt(e.target.value)})}
                        />
                        <h2>Obi-Wan Relationship Modifier</h2>
                        <input
                            type="number"
                            placeholder="Obi-Wan Relationship Modifier"
                            value={newItem.obiWanRelationshipModifier}
                            onChange={(e) => setNewItem({...newItem, obiWanRelationshipModifier: parseInt(e.target.value)})}
                        />
                        <button onClick={addItem}>Add Item</button>
                    </div>
                    <div className={styles['items-list']}>
                        {items.map(item => (
                            <div key={item.itemID} className={styles.item}>
                                <h3>Item ID</h3>
                                <input
                                    type="number"
                                    value={item.itemID}
                                    onChange={(e) => updateItem({...item, itemID: parseInt(e.target.value)})}
                                />
                                <h3>Name</h3>
                                <input
                                    type="text"
                                    value={item.name}
                                    onChange={(e) => updateItem({...item, name: e.target.value})}
                                />
                                <h3>Description</h3>
                                <textarea
                                    value={item.description}
                                    onChange={(e) => updateItem({...item, description: e.target.value})}
                                />
                                <h3>Health Modifier</h3>
                                <input
                                    type="number"
                                    value={item.healthModifier}
                                    onChange={(e) => updateItem({...item, healthModifier: parseInt(e.target.value)})}
                                />
                                <h3>Force Modifier</h3>
                                <input
                                    type="number"
                                    value={item.forceModifier}
                                    onChange={(e) => updateItem({...item, forceModifier: parseInt(e.target.value)})}
                                />
                                <h3>Obi-Wan Relationship Modifier</h3>
                                <input
                                    type="number"
                                    value={item.obiWanRelationshipModifier}
                                    onChange={(e) => updateItem({...item, obiWanRelationshipModifier: parseInt(e.target.value)})}
                                />
                                <div className={styles.buttonGroup}>
                                    <button onClick={() => deleteItem(item.itemID)}>Delete</button>
                                    <button onClick={() => updateItem(item)}>Save Changes</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;