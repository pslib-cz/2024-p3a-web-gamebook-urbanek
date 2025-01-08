import { useEffect, useState } from "react";
import styles from '../Modules/AdminPanel.module.css';
import { useNavigate } from "react-router-dom";

interface Scene {
    sceneID: number;
    choicesConnectionsID: number;
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
    requiredItemID?: number;
    miniGameID?: number;
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
    const [newScene, setNewScene] = useState<Scene>({ sceneID: 0, choicesConnectionsID: 0, title: '', description: '', image: '' });
    const [newConnection, setNewConnection] = useState<ChoiceConnection>({
        choicesConnectionsID: 0,
        sceneFromID: 0,
        sceneToID: 0,
        text: '',
        effect: ''
    });
    const [newItem, setNewItem] = useState<Item>({ itemID: 0, name: '', description: '', healthModifier: 0, forceModifier: 0, obiWanRelationshipModifier: 0 });

    useEffect(() => {
        const checkAdmin = async () => {
            // Zkontrolujeme email uložený při přihlášení
            const currentUserEmail = localStorage.getItem('currentUserEmail');
            
            if (currentUserEmail === 'admin@admin.com') {
                setIsAdmin(true);
                // Načtení dat po potvrzení admin role
                fetchScenes();
                fetchConnections();
                fetchItems();
            } else {
                navigate('/scenes/1');
            }
        };

        checkAdmin();
    }, [navigate]);

    const fetchScenes = async () => {
        try {
            const response = await fetch("http://localhost:5193/api/Scenes", {
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    "X-User-Email": "admin@admin.com"
                }
            });
            if (!response.ok) throw new Error('Failed to fetch scenes');
            const data = await response.json();
            setScenes(data);
        } catch (error) {
            console.error('Error fetching scenes:', error);
        }
    };

    const fetchConnections = async () => {
        const response = await fetch("http://localhost:5193/api/ChoicesConnections", {
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            }
        });
        const data = await response.json();
        setConnections(data);
    };

    const fetchItems = async () => {
        const response = await fetch("http://localhost:5193/api/Items", {
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            }
        });
        const data = await response.json();
        setItems(data);
    };

    // CRUD operace pro scény
    const addScene = async () => {
        console.log('Adding new scene:', newScene);
        try {
            const response = await fetch("http://localhost:5193/api/Scenes", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    sceneID: newScene.sceneID,
                    title: newScene.title,
                    description: newScene.description,
                    choicesConnectionsID: newScene.choicesConnectionsID,
                    image: newScene.image
                })
            });
            
            console.log('Add scene response:', response.status);
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Failed to add scene:', errorText);
                return;
            }
            
            await fetchScenes();
            setNewScene({ sceneID: 0, choicesConnectionsID: 0, title: '', description: '', image: '' });
        } catch (error) {
            console.error('Error adding scene:', error);
        }
    };

    const updateScene = async (scene: Scene) => {
        try {
            const response = await fetch(`http://localhost:5193/api/Scenes/${scene.sceneID}`, {
                method: "PUT",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    sceneID: scene.sceneID,
                    title: scene.title,
                    description: scene.description,
                    choicesConnectionsID: scene.choicesConnectionsID,
                    image: scene.image
                })
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Failed to update scene:', errorText);
                return;
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
                credentials: "include"
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Failed to delete scene:', errorText);
                return;
            }
            
            await fetchScenes();
        } catch (error) {
            console.error('Error deleting scene:', error);
        }
    };

    // CRUD operace pro spojení
    const addConnection = async () => {
        await fetch("http://localhost:5193/api/ChoicesConnections", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newConnection)
        });
        fetchConnections();
        setNewConnection({
            choicesConnectionsID: 0,
            sceneFromID: 0,
            sceneToID: 0,
            text: '',
            effect: ''
        });
    };

    const updateConnection = async (connection: ChoiceConnection) => {
        await fetch(`http://localhost:5193/api/ChoicesConnections/${connection.choicesConnectionsID}`, {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(connection)
        });
        fetchConnections();
    };

    const deleteConnection = async (id: number) => {
        await fetch(`http://localhost:5193/api/ChoicesConnections/${id}`, {
            method: "DELETE",
            credentials: "include"
        });
        fetchConnections();
    };

    // CRUD operace pro předměty
    const addItem = async () => {
        try {
            const response = await fetch("http://localhost:5193/api/Items", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
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
                console.error('Failed to add item:', errorText);
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
            const response = await fetch(`http://localhost:5193/api/Items/${item.itemID}`, {
                method: "PUT",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
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
                return;
            }
            
            await fetchItems();
        } catch (error) {
            console.error('Error updating item:', error);
        }
    };

    const deleteItem = async (id: number) => {
        try {
            const response = await fetch(`http://localhost:5193/api/Items/${id}`, {
                method: "DELETE",
                credentials: "include"
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Failed to delete item:', errorText);
                return;
            }
            
            await fetchItems();
        } catch (error) {
            console.error('Error deleting item:', error);
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
                        <h2>Choices Connections ID</h2>
                        <input
                            type="number"
                            placeholder="Choices Connections ID"
                            value={newScene.choicesConnectionsID}
                            onChange={(e) => setNewScene({...newScene, choicesConnectionsID: parseInt(e.target.value)})}
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
                            type="file"
                            placeholder="Image"
                            value={newScene.image}
                            onChange={(e) => setNewScene({...newScene, image: e.target.value})}
                        />
                        <button onClick={addScene}>Add Scene</button>
                    </div>
                    <div className={styles['items-list']}>
                        {scenes.map(scene => (
                            <div key={scene.sceneID} className={styles.item}>
                                <input
                                    value={scene.title}
                                    onChange={(e) => updateScene({...scene, title: e.target.value})}
                                />
                                <textarea
                                    value={scene.description}
                                    onChange={(e) => updateScene({...scene, description: e.target.value})}
                                />
                                <button onClick={() => deleteScene(scene.sceneID)}>Delete</button>
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
                            onChange={(e) => setNewConnection({...newConnection, requiredItemID: parseInt(e.target.value)})}
                        />
                        <button onClick={addConnection}>Add Connection</button>
                    </div>
                    <div className={styles['items-list']}>
                        {connections.map(connection => (
                            <div key={connection.choicesConnectionsID} className={styles.item}>
                                <input
                                    type="number"
                                    value={connection.sceneFromID}
                                    onChange={(e) => updateConnection({...connection, sceneFromID: parseInt(e.target.value)})}
                                />
                                <input
                                    type="number"
                                    value={connection.sceneToID}
                                    onChange={(e) => updateConnection({...connection, sceneToID: parseInt(e.target.value)})}
                                />
                                <input
                                    value={connection.text}
                                    onChange={(e) => updateConnection({...connection, text: e.target.value})}
                                />
                                <button onClick={() => deleteConnection(connection.choicesConnectionsID)}>Delete</button>
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
                        <h2>Obi Wan Relationship Modifier</h2>
                        <input
                            type="number"
                            placeholder="Obi Wan Relationship Modifier"
                            value={newItem.obiWanRelationshipModifier}
                            onChange={(e) => setNewItem({...newItem, obiWanRelationshipModifier: parseInt(e.target.value)})}
                        />
                        <button onClick={addItem}>Add Item</button>
                    </div>
                    <div className={styles['items-list']}>
                        {items.map(item => (
                            <div key={item.itemID} className={styles.item}>
                                <input
                                    value={item.name}
                                    onChange={(e) => updateItem({...item, name: e.target.value})}
                                />
                                <textarea
                                    value={item.description}
                                    onChange={(e) => updateItem({...item, description: e.target.value})}
                                />
                                <button onClick={() => deleteItem(item.itemID)}>Delete</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;
