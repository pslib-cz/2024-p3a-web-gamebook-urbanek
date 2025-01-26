import { useState, useEffect, useRef } from 'react';
import styles from '../Modules/SyndicateInfiltration.module.css';

interface Props {
    miniGameId: number;
    difficulty: number;
    timeLimit: number;
    onComplete: (success: boolean) => void;
    onClose: () => void;
}

interface Guard {
    position: Point;
    path: Point[];
    currentPathIndex: number;
    direction: number;
}

interface DataPoint {
    id: number;
    position: Point;
    isCollected: boolean;
    value: number;
}

interface Point {
    x: number;
    y: number;
}

const SyndicateInfiltration = ({ difficulty, timeLimit, onComplete, onClose }: Props) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [player, setPlayer] = useState<Point>({ x: 50, y: 50 });
    const [guards, setGuards] = useState<Guard[]>([]);
    const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(timeLimit);
    const [isHidden, setIsHidden] = useState(false);
    const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
    const [gameOver, setGameOver] = useState(false);
    const [playerVelocity, setPlayerVelocity] = useState({ x: 0, y: 0 });
    const [keysPressed, setKeysPressed] = useState<{ [key: string]: boolean }>({});
    const PLAYER_SPEED = 5;
    const REQUIRED_SCORE = 100; // Points needed to win

    // Initialize game
    useEffect(() => {
        const initializeGame = () => {
            // More guards at higher difficulties
            const numGuards = difficulty + 2;
            const newGuards: Guard[] = [];
            
            for (let i = 0; i < numGuards; i++) {
                const patrolPath = generatePatrolPath();
                newGuards.push({
                    position: { ...patrolPath[0] },
                    path: patrolPath,
                    currentPathIndex: 0,
                    direction: 1
                });
            }
            
            // Adjust number of data points based on difficulty
            const numDataPoints = difficulty * 4 + 3;
            const newDataPoints: DataPoint[] = [];
            
            for (let i = 0; i < numDataPoints; i++) {
                newDataPoints.push({
                    id: i,
                    position: {
                        x: Math.random() * (canvasSize.width - 100) + 50,
                        y: Math.random() * (canvasSize.height - 100) + 50
                    },
                    isCollected: false,
                    value: Math.floor(Math.random() * 15) + 10 // 10-25 points per data point
                });
            }
            
            setGuards(newGuards);
            setDataPoints(newDataPoints);
        };

        initializeGame();
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleGameOver();
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [difficulty]);

    const generatePatrolPath = (): Point[] => {
        const numPoints = Math.floor(Math.random() * 3) + 3;
        const path: Point[] = [];
        
        // Start at a random point
        let x = Math.random() * (canvasSize.width - 100) + 50;
        let y = Math.random() * (canvasSize.height - 100) + 50;
        path.push({ x, y });
        
        // Generate subsequent points with smoother transitions
        for (let i = 1; i < numPoints; i++) {
            // Random angle between -60 and 60 degrees from previous direction
            const angle = Math.random() * Math.PI / 1.5 - Math.PI / 3;
            const distance = 100 + Math.random() * 100; // Random distance between 100-200 pixels
            
            // Calculate new point
            x += Math.cos(angle) * distance;
            y += Math.sin(angle) * distance;
            
            // Keep within bounds
            x = Math.max(50, Math.min(canvasSize.width - 50, x));
            y = Math.max(50, Math.min(canvasSize.height - 50, y));
            
            path.push({ x, y });
        }
        
        return path;
    };

    // Add keyboard controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (['w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(e.key)) {
                e.preventDefault();
                setKeysPressed(prev => ({ ...prev, [e.key.toLowerCase()]: true }));
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (['w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(e.key)) {
                setKeysPressed(prev => ({ ...prev, [e.key.toLowerCase()]: false }));
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    // Update player position based on keyboard input
    useEffect(() => {
        const movePlayer = () => {
            let dx = 0;
            let dy = 0;

            if (keysPressed['w']) dy -= PLAYER_SPEED;
            if (keysPressed['s']) dy += PLAYER_SPEED;
            if (keysPressed['a']) dx -= PLAYER_SPEED;
            if (keysPressed['d']) dx += PLAYER_SPEED;

            // Normalize diagonal movement
            if (dx !== 0 && dy !== 0) {
                dx *= 0.707; // 1/√2
                dy *= 0.707;
            }

            setPlayer(prev => {
                const newX = Math.max(10, Math.min(canvasSize.width - 10, prev.x + dx));
                const newY = Math.max(10, Math.min(canvasSize.height - 10, prev.y + dy));
                return { x: newX, y: newY };
            });
        };

        const gameLoop = setInterval(movePlayer, 16); // ~60fps
        return () => clearInterval(gameLoop);
    }, [keysPressed]);

    // Check for data point collection
    useEffect(() => {
        const checkCollisions = () => {
            dataPoints.forEach(point => {
                if (!point.isCollected) {
                    const distance = Math.sqrt(
                        Math.pow(player.x - point.position.x, 2) + 
                        Math.pow(player.y - point.position.y, 2)
                    );
                    if (distance < 15) { // Collection radius
                        collectData(point.id);
                    }
                }
            });
        };

        checkCollisions();
    }, [player, dataPoints]);

    // Check for game over conditions
    useEffect(() => {
        if (timeLeft <= 0) {
            handleGameOver();
            return;
        }

        if (score >= REQUIRED_SCORE) {
            setGameOver(true);
            onComplete(true);
            return;
        }

        // Check if player is caught by guards
        guards.forEach(guard => {
            const distance = Math.sqrt(
                Math.pow(player.x - guard.position.x, 2) + 
                Math.pow(player.y - guard.position.y, 2)
            );
            
            if (distance < 30 && !isHidden) { // Caught radius
                handleGameOver();
            }
        });
    }, [timeLeft, score, player, guards, isHidden]);

    // Update handleGameOver
    const handleGameOver = () => {
        setGameOver(true);
        if (score >= REQUIRED_SCORE) {
            onComplete(true); // Success - continue to next scene
        } else {
            onComplete(false); // Failure - return to previous scene
        }
        onClose();
    };

    // Draw game
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw shadows/lighting effect
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw data points
        dataPoints.forEach(point => {
            if (!point.isCollected) {
                ctx.beginPath();
                ctx.fillStyle = '#32CD32';
                ctx.arc(point.position.x, point.position.y, 5, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        // Draw guards and their vision cones
        guards.forEach(guard => {
            ctx.beginPath();
            ctx.fillStyle = '#D0021B';
            ctx.arc(guard.position.x, guard.position.y, 10, 0, Math.PI * 2);
            ctx.fill();

            // Draw vision cone
            const visionAngle = Math.PI / 2;
            const visionDistance = 100;
            ctx.beginPath();
            ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
            ctx.moveTo(guard.position.x, guard.position.y);
            ctx.arc(guard.position.x, guard.position.y, visionDistance, 
                    -visionAngle / 2, visionAngle / 2);
            ctx.closePath();
            ctx.fill();
        });

        // Draw player
        ctx.beginPath();
        ctx.fillStyle = isHidden ? 'rgba(0, 255, 255, 0.5)' : '#007bff';
        ctx.arc(player.x, player.y, 8, 0, Math.PI * 2);
        ctx.fill();

    }, [player, guards, dataPoints, isHidden]);

    const collectData = (pointId: number) => {
        setDataPoints(prev => prev.map(point => {
            if (point.id === pointId && !point.isCollected) {
                setScore(prevScore => prevScore + point.value);
                return { ...point, isCollected: true };
            }
            return point;
        }));
    };

    // Add guard movement effect
    useEffect(() => {
        const moveGuards = () => {
            setGuards(prevGuards => {
                return prevGuards.map(guard => {
                    const nextPoint = guard.path[guard.currentPathIndex + guard.direction];
                    if (!nextPoint) {
                        // Reverse direction at path ends
                        return {
                            ...guard,
                            direction: -guard.direction
                        };
                    }
                    
                    const speed = 2 + difficulty * 0.5; // Scale speed with difficulty
                    const dx = nextPoint.x - guard.position.x;
                    const dy = nextPoint.y - guard.position.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    // If close to target point, move to next point
                    if (distance < speed) {
                        return {
                            ...guard,
                            position: nextPoint,
                            currentPathIndex: guard.currentPathIndex + guard.direction
                        };
                    }
                    
                    // Move towards next point
                    return {
                        ...guard,
                        position: {
                            x: guard.position.x + (dx / distance) * speed,
                            y: guard.position.y + (dy / distance) * speed
                        }
                    };
                });
            });
        };

        const guardMovementLoop = setInterval(moveGuards, 16);
        return () => clearInterval(guardMovementLoop);
    }, [difficulty]);

    return (
        <div className={styles.overlay}>
            <div className={styles.gameContainer}>
                <div className={styles.header}>
                    <h2>Infiltrace Syndikátu</h2>
                    <div className={styles.stats}>
                        <div className={styles.time}>Čas: {timeLeft}s</div>
                        <div className={styles.score}>Informace: {score}/{REQUIRED_SCORE}</div>
                    </div>
                </div>

                <div className={styles.gameArea}>
                    <canvas
                        ref={canvasRef}
                        width={canvasSize.width}
                        height={canvasSize.height}
                        className={styles.gameCanvas}
                    />
                    <button
                        className={`${styles.hideButton} ${isHidden ? styles.active : ''}`}
                        onClick={() => setIsHidden(!isHidden)}
                    >
                        {isHidden ? 'Ukrytý' : 'Ukrýt se'}
                    </button>
                </div>

                <div className={styles.instructions}>
                    Použij WASD pro pohyb. Sbírej zelené datové body ({REQUIRED_SCORE} bodů pro výhru).
                    Vyhýbej se strážím a použij tlačítko pro ukrytí.
                </div>
            </div>
        </div>
    );
};

export default SyndicateInfiltration; 