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
        { id: 1, name: 'Hydrospanner', icon: '🔧' },
        { id: 2, name: 'Fusion Welder', icon: '⚡' },
        { id: 3, name: 'Power Calibrator', icon: '🔌' },
        { id: 4, name: 'Shield Aligner', icon: '🛡️' }
    ]);
    const [timeLeft, setTimeLeft] = useState(timeLimit);
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        // Generate random parts based on difficulty
        const generateParts = () => {
            const numParts = 3 + difficulty;
            const newParts: Part[] = [];
            for (let i = 0; i < numParts; i++) {
                newParts.push({
                    id: i,
                    name: `Part ${i + 1}`,
                    isFixed: false,
                    position: {
                        x: Math.random() * 80 + 10, // 10-90%
                        y: Math.random() * 80 + 10  // 10-90%
                    },
                    requiredTools: tools
                        .sort(() => Math.random() - 0.5)
                        .slice(0, 1 + Math.floor(difficulty / 2))
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
            onComplete(false);
        }
    }, [timeLeft, isComplete]);

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
                    <h2>Space Fighter Repair</h2>
                    <div className={styles.timer}>Time: {timeLeft}s</div>
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
                        <img 
                            src="/spaceship.png" 
                            alt="Space Fighter" 
                            className={styles.shipImage}
                        />
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