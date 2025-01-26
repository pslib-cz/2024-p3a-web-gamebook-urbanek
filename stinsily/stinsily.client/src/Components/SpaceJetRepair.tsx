import { useState, useEffect } from 'react';
import styles from '../Modules/SpaceJetRepair.module.css';

interface Part {
    id: number;
    name: string;
    isFixed: boolean;
    position: { x: number; y: number };
    requiredTools: string[];
}

interface Tool {
    id: number;
    name: string;
    icon: string;
}

interface Props {
    miniGameId: number;
    difficulty: number;
    timeLimit: number;
    onComplete: (success: boolean) => void;
    onClose: () => void;
}

const SpaceJetRepair = ({ miniGameId, difficulty, timeLimit, onComplete, onClose }: Props) => {
    const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
    const [parts, setParts] = useState<Part[]>([]);
    const [tools] = useState<Tool[]>([
        { id: 1, name: 'Klíč', icon: '🔧' },
        { id: 2, name: 'Svářečka', icon: '⚡' },
        { id: 3, name: 'Elektřina', icon: '🔌' },
        { id: 4, name: 'Štít', icon: '🛡️' }
    ]);
    const [timeLeft, setTimeLeft] = useState(timeLimit);
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        // Generate random parts based on difficulty
        const generateParts = () => {
            const numParts = Math.min(3 + difficulty, 6); // Cap max parts at 6 for mobile
            const newParts: Part[] = [];
            for (let i = 0; i < numParts; i++) {
                newParts.push({
                    id: i,
                    name: `Part ${i + 1}`,
                    isFixed: false,
                    position: {
                        x: Math.random() * 60 + 20, // 20-80% for better visibility
                        y: Math.random() * 60 + 20  // 20-80% for better visibility
                    },
                    requiredTools: tools
                        .sort(() => Math.random() - 0.5)
                        .slice(0, Math.min(1 + Math.floor(difficulty / 2), 2)) // Cap required tools at 2 for mobile
                        .map(t => t.name)
                });
            }
            return newParts;
        };

        setParts(generateParts());
    }, [difficulty]);

    useEffect(() => {
        if (timeLeft > 0 && !isComplete) {
            const timer = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
            return () => clearInterval(timer);
        } else if (timeLeft === 0) {
            // When time runs out:
            // 1. Show failure message
            alert("Čas vypršel! Zkus to znovu.");
            // 2. Close minigame and return to previous scene
            onClose();
            // 3. Signal failure to parent
            onComplete(false);
        }
    }, [timeLeft, isComplete, onComplete, onClose]);

    const handlePartClick = (part: Part) => {
        if (!selectedTool) return;

        if (part.requiredTools.includes(selectedTool.name)) {
            const updatedParts = parts.map(p => 
                p.id === part.id ? { ...p, isFixed: true } : p
            );
            setParts(updatedParts);

            if (updatedParts.every(p => p.isFixed)) {
                setIsComplete(true);
                onComplete(true);
            }
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.gameContainer}>
                <div className={styles.header}>
                    <h2>Oprava stíhačky</h2>
                    <div className={styles.timer}>Čas: {timeLeft}s</div>
                </div>

                <div className={styles.gameArea}>
                    <div className={styles.shipContainer}>
                        {parts.map(part => (
                            <div
                                key={part.id}
                                className={`${styles.part} ${part.isFixed ? styles.fixed : ''}`}
                                style={{
                                    left: `${part.position.x}%`,
                                    top: `${part.position.y}%`
                                }}
                                onClick={() => handlePartClick(part)}
                            >
                                {part.isFixed ? '✅' : '❌'}
                                <div className={styles.partTooltip}>
                                    {part.name}<br/>
                                    Needs: {part.requiredTools.join(', ')}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className={styles.toolbox}>
                        {tools.map(tool => (
                            <button
                                key={tool.id}
                                className={`${styles.tool} ${selectedTool?.id === tool.id ? styles.selected : ''}`}
                                onClick={() => setSelectedTool(tool)}
                            >
                                {tool.icon} {tool.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SpaceJetRepair; 