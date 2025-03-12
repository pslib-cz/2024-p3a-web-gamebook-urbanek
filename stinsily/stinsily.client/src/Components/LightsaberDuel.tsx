import { useState, useEffect, useRef } from 'react';
import styles from '../Modules/LightsaberDuel.module.css';

interface Props {
    difficulty: number;
    onComplete: (success: boolean) => void;
    onClose: () => void;
}

interface Point {
    x: number;
    y: number;
}

const calculateAccuracy = (playerPath: Point[], pattern: Point[]): number => {
    if (playerPath.length === 0) return 0;

    // Sample points along both paths at regular intervals
    const samplePoints = 100;
    const sampledPlayer = samplePath(playerPath, samplePoints);
    const sampledPattern = samplePath(pattern, samplePoints);

    // Calculate average deviation
    let totalDeviation = 0;
    for (let i = 0; i < samplePoints; i++) {
        const distance = Math.sqrt(
            Math.pow(sampledPlayer[i].x - sampledPattern[i].x, 2) + 
            Math.pow(sampledPlayer[i].y - sampledPattern[i].y, 2)
        );
        totalDeviation += distance;
    }

    const avgDeviation = totalDeviation / samplePoints;
    // Convert deviation to accuracy percentage (max deviation assumed to be 100px)
    const accuracy = Math.max(0, Math.min(100, 100 - (avgDeviation / 100) * 100));
    return accuracy;
};

// Helper function to sample points along a path
const samplePath = (path: Point[], numSamples: number): Point[] => {
    const result: Point[] = [];
    const pathLength = path.length;

    for (let i = 0; i < numSamples; i++) {
        const index = Math.min(Math.floor((i / numSamples) * pathLength), pathLength - 1);
        result.push(path[index]);
    }

    return result;
};

const LightsaberDuel = ({ difficulty, onComplete, onClose }: Props) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [playerHealth, setPlayerHealth] = useState(100);
    const [enemyHealth, setEnemyHealth] = useState(50);
    const [isDrawing, setIsDrawing] = useState(false);
    const [pattern, setPattern] = useState<Point[]>([]);
    const [playerPath, setPlayerPath] = useState<Point[]>([]);
    const [turn, setTurn] = useState<'player' | 'enemy'>('player');
    const [accuracy, setAccuracy] = useState(0);
    const [canvasSize, setCanvasSize] = useState({ width: 800, height: 400 });

    const generateNewPattern = () => {
        const points: Point[] = [];
        const segments = 5 + difficulty * 2;
        
        // Random starting position within the canvas
        let x = Math.random() * (canvasSize.width * 0.6) + (canvasSize.width * 0.2); // 20-80% of width
        let y = Math.random() * (canvasSize.height * 0.6) + (canvasSize.height * 0.2); // 20-80% of height
        
        points.push({ x, y });
        
        // Generate random direction for the pattern
        const baseAngle = Math.random() * Math.PI * 2; // Random base angle
        
        for (let i = 0; i < segments; i++) {
            // Create smoother transitions with controlled randomness
            const angleVariation = (Math.random() * Math.PI / 2) - (Math.PI / 4); // ±45 degrees
            const angle = baseAngle + angleVariation;
            
            // Scale radius based on canvas size but keep it more consistent
            const minRadius = Math.min(canvasSize.width, canvasSize.height) * 0.05;
            const maxRadius = Math.min(canvasSize.width, canvasSize.height) * 0.12;
            const radius = minRadius + Math.random() * (maxRadius - minRadius);
            
            x += Math.cos(angle) * radius;
            y += Math.sin(angle) * radius;
            
            // Bounce off edges if needed
            const padding = Math.min(canvasSize.width, canvasSize.height) * 0.1;
            if (x < padding) {
                x = padding;
            } else if (x > canvasSize.width - padding) {
                x = canvasSize.width - padding;
            }
            if (y < padding) {
                y = padding;
            } else if (y > canvasSize.height - padding) {
                y = canvasSize.height - padding;
            }
            
            points.push({ x, y });
        }
        
        setPattern(points);
    };

    // Generate initial pattern
    useEffect(() => {
        generateNewPattern();
    }, [difficulty]);

    // Draw pattern and player path
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw pattern with smooth curves
        ctx.beginPath();
        ctx.strokeStyle = '#007bff';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Draw smooth curve through points
        if (pattern.length > 0) {
            ctx.moveTo(pattern[0].x, pattern[0].y);
            for (let i = 1; i < pattern.length - 2; i++) {
                const xc = (pattern[i].x + pattern[i + 1].x) / 2;
                const yc = (pattern[i].y + pattern[i + 1].y) / 2;
                ctx.quadraticCurveTo(pattern[i].x, pattern[i].y, xc, yc);
            }
            // Handle the last two points
            if (pattern.length > 2) {
                ctx.quadraticCurveTo(
                    pattern[pattern.length - 2].x,
                    pattern[pattern.length - 2].y,
                    pattern[pattern.length - 1].x,
                    pattern[pattern.length - 1].y
                );
            }
        }
        ctx.stroke();

        // Draw player path with smooth curves
        if (playerPath.length > 1) {
            ctx.beginPath();
            ctx.strokeStyle = '#32CD32';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            ctx.moveTo(playerPath[0].x, playerPath[0].y);
            for (let i = 1; i < playerPath.length - 2; i++) {
                const xc = (playerPath[i].x + playerPath[i + 1].x) / 2;
                const yc = (playerPath[i].y + playerPath[i + 1].y) / 2;
                ctx.quadraticCurveTo(playerPath[i].x, playerPath[i].y, xc, yc);
            }
            // Handle the last two points
            if (playerPath.length > 2) {
                ctx.quadraticCurveTo(
                    playerPath[playerPath.length - 2].x,
                    playerPath[playerPath.length - 2].y,
                    playerPath[playerPath.length - 1].x,
                    playerPath[playerPath.length - 1].y
                );
            }
            ctx.stroke();
        }
    }, [pattern, playerPath]);

    const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
        if (turn !== 'player') return;
        
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        let x, y;

        if ('touches' in e) {
            x = e.touches[0].clientX - rect.left;
            y = e.touches[0].clientY - rect.top;
        } else {
            x = (e as React.MouseEvent).clientX - rect.left;
            y = (e as React.MouseEvent).clientY - rect.top;
        }

        setIsDrawing(true);
        setPlayerPath([{ x, y }]);
    };

    const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        let x, y;

        if ('touches' in e) {
            e.preventDefault(); // Prevent scrolling while drawing
            x = e.touches[0].clientX - rect.left;
            y = e.touches[0].clientY - rect.top;
        } else {
            x = (e as React.MouseEvent).clientX - rect.left;
            y = (e as React.MouseEvent).clientY - rect.top;
        }

        setPlayerPath(prev => [...prev, { x, y }]);
    };

    const handleMouseUp = () => {
        if (!isDrawing) return;
        setIsDrawing(false);

        // Calculate accuracy
        const totalAccuracy = calculateAccuracy(playerPath, pattern);
        setAccuracy(totalAccuracy);

        // Calculate damage based on accuracy
        const damage = Math.floor((totalAccuracy / 100) * 50); // Max damage is 50
        setEnemyHealth(prev => Math.max(0, prev - damage));

        // Clear player path
        setPlayerPath([]);

        // Switch to enemy turn
        setTurn('enemy');

        // Enemy attack after delay
        setTimeout(() => {
            setPlayerHealth(prev => Math.max(0, prev - 20)); // Enemy always does 20 damage
            setTurn('player');
            generateNewPattern(); // Generate new pattern for next turn
        }, 1500);
    };

    // Check win/lose conditions
    useEffect(() => {
        if (enemyHealth <= 0) {
            onComplete(true);
        } else if (playerHealth <= 0) {
            onComplete(false);
            onClose();
        }
    }, [enemyHealth, playerHealth, onComplete, onClose]);

    // Add resize handler
    useEffect(() => {
        const handleResize = () => {
            const isMobile = window.innerWidth < 768;
            setCanvasSize({
                width: isMobile ? 300 : 800,
                height: isMobile ? 200 : 400
            });
        };

        handleResize(); // Set initial size
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className={styles.overlay}>
            <div className={styles.gameContainer}>
                <div className={styles.header}>
                    <h2>SOUBOJ</h2>
                    <div className={styles.healthBars}>
                        <div className={styles.healthBar}>
                            <span>Kael: {playerHealth}</span>
                            <div className={styles.barContainer}>
                                <div 
                                    className={styles.barFill} 
                                    style={{ width: `${playerHealth}%` }}
                                />
                            </div>
                        </div>
                        <div className={styles.healthBar}>
                            <span>Stormtrooper: {enemyHealth}</span>
                            <div className={styles.barContainer}>
                                <div 
                                    className={styles.barFill} 
                                    style={{ width: `${enemyHealth * 2}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.gameArea}>
                    <canvas
                        ref={canvasRef}
                        width={canvasSize.width}
                        height={canvasSize.height}
                        className={styles.duelCanvas}
                        onMouseDown={handleStart}
                        onMouseMove={handleMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onTouchStart={handleStart}
                        onTouchMove={handleMove}
                        onTouchEnd={handleMouseUp}
                    />
                    {turn === 'player' ? (
                        <div className={styles.instruction}>
                            {window.innerWidth < 768 
                                ? 'Táhni prstem po modré čáře'
                                : 'Drž levé tlačítko myši a táhni abys kopíroval linii modré čáry'
                            }
                        </div>
                    ) : (
                        <div className={styles.instruction}>
                            Tah oponenta
                        </div>
                    )}
                    <div className={styles.accuracy}>
                        Přesnost posledního útoku: {accuracy.toFixed(1)}%
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LightsaberDuel; 