import { useEffect, useState } from "react";

interface Scene {
  id: number;
  title: string;
  description: string;
  playerInventoryItems: PlayerInventoryItem[];
}

interface SceneOption {
  id: number;
  targetSceneId: number;
  actionText: string;
  requiredItems?: Item[];
}

interface PlayerInventoryItem {
  id: number;
  itemId: number;
  playerId: number;
  item: Item;
}

interface Item {
  id: number;
  name: string;
}

const Scene = () => {
  const [currentScene, setCurrentScene] = useState<Scene | null>(null);
  const [options, setOptions] = useState<SceneOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchCurrentScene = async () => {
    try {
      setLoading(true);
      console.log("Fetching current scene...");
      const response = await fetch("/api/Scenes/current-scene", {
        method: "GET",
        credentials: "include",
      });
  
      console.log("Response status:", response.status);
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Unauthorized: Please log in.");
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      console.log("Received data:", data);
  
      if (!data || !data.SceneID) {
        throw new Error("Invalid data received from server.");
      }
  
      setCurrentScene(data);
    } catch (err) {
      console.error("Error fetching scene:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  const fetchSceneOptions = async () => {
    try {
      console.log("Fetching scene options...");
      const response = await fetch("/api/Scenes/options", {
        method: "GET",
        credentials: "include",
      });
  
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Unauthorized: Please log in.");
        }
        throw new Error(`Failed to fetch scene options. Status: ${response.status}`);
      }
  
      const data = await response.json();
      console.log("Options received:", data);
  
      if (!data || !Array.isArray(data.Options)) {
        throw new Error("Invalid options data received.");
      }
  
      setOptions(data.Options);
    } catch (err) {
      console.error("Error fetching scene options:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    }
  };
  
  const moveToScene = async (targetSceneId: number) => {
    if (!targetSceneId) {
      setError("Invalid target scene ID.");
      return;
    }
  
    try {
      console.log(`Moving to scene ID: ${targetSceneId}`);
      const response = await fetch("/api/Scenes/move-to-scene", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(targetSceneId),
        credentials: "include",
      });
  
      if (!response.ok) {
        if (response.status === 400) {
          const errorData = await response.json();
          throw new Error(errorData.Message || "Failed to move to target scene.");
        }
        throw new Error("Failed to move to target scene.");
      }
  
      const successMessage = await response.json();
      console.log(successMessage);
  
      // Aktualizace dat po přesunu
      await fetchCurrentScene();
      await fetchSceneOptions();
    } catch (err) {
      console.error("Error moving to scene:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    }
  };  

  useEffect(() => {
    fetchCurrentScene();
    fetchSceneOptions();
  }, []);

  return (
    <div>
      {loading ? (
        <p>Loading current scene...</p>
      ) : error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : currentScene ? (
        <>
          <h1>{currentScene.title}</h1>
          <p>{currentScene.description}</p>
  
          <h2>Options:</h2>
          <ul>
            {options.map((option) => (
              <li key={option.id}>
                <button
                  onClick={() => moveToScene(option.targetSceneId)}
                  disabled={
                    option.requiredItems &&
                    !option.requiredItems.some((requiredItem) =>
                      currentScene.playerInventoryItems.some(
                        (inventoryItem) => inventoryItem.itemId === requiredItem.id
                      )
                    )
                  }
                >
                  {option.actionText}
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );  
}
export default Scene;