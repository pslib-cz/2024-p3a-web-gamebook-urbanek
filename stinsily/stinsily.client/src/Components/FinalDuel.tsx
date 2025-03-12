import { useState, useEffect, useRef } from 'react';
import styles from '../Modules/FinalDuel.module.css';

interface Props {
    miniGameId: number;
    difficulty: number;
    timeLimit: number;
    onComplete: (success: boolean) => void;
}

interface Point {
    x: number;
    y: number;
}

const FinalDuel = ({ difficulty, onComplete }: Props) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [playerHealth, setPlayerHealth] = useState(100);
    const [vaderHealth, setVaderHealth] = useState(200);
    const [pattern, setPattern] = useState<Point[]>([]);
    const [playerPath, setPlayerPath] = useState<Point[]>([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [turn, setTurn] = useState<'player' | 'vader'>('player');
    const [accuracy, setAccuracy] = useState(0);
    const [canvasSize] = useState({ width: 800, height: 400 });
    const [gameOver, setGameOver] = useState(false);
    const [vaderWeakened, setVaderWeakened] = useState(false);
    const [lastAccuracy, setLastAccuracy] = useState(0);

    const generateVaderPattern = () => {
        const patterns = [
            // Cross slash
            [[200, 100], [600, 300], [200, 300], [600, 100]],
            // Force choke pattern
            [[400, 100], [400, 300], [200, 200], [600, 200], [400, 100]],
            // Aggressive combo
            [[200, 100], [600, 100], [600, 300], [200, 300], [200, 100]],
            // Saber throw
            [[200, 200], [600, 200], [400, 100], [400, 300], [200, 200]],
        ];

        const selectedPattern = patterns[Math.floor(Math.random() * patterns.length)];
        return selectedPattern.map(([x, y]) => ({ x, y }));
    };

    const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
        if (turn !== 'player' || gameOver) return;
        setIsDrawing(true);
        setPlayerPath([]);
        const point = getEventPoint(e);
        setPlayerPath([point]);
    };

    const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || turn !== 'player' || gameOver) return;
        const point = getEventPoint(e);
        setPlayerPath(prev => [...prev, point]);
    };

    const handleEnd = () => {
        if (!isDrawing || turn !== 'player' || gameOver) return;
        setIsDrawing(false);
        calculateAccuracy();
    };

    const getEventPoint = (e: React.MouseEvent | React.TouchEvent): Point => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();
        const x = ('touches' in e) 
            ? e.touches[0].clientX - rect.left
            : e.clientX - rect.left;
        const y = ('touches' in e)
            ? e.touches[0].clientY - rect.top
            : e.clientY - rect.top;

        return { x, y };
    };

    const calculateAccuracy = () => {
        if (playerPath.length < 2 || pattern.length < 2) return;

        let totalPoints = 0;
        let maxPoints = playerPath.length;
        
        // Sample points along the pattern path
        const patternSegments: { start: Point; end: Point }[] = [];
        for (let i = 0; i < pattern.length - 1; i++) {
            patternSegments.push({
                start: pattern[i],
                end: pattern[i + 1]
            });
        }

        // Check each player point against pattern segments
        playerPath.forEach(point => {
            let minDist = Infinity;
            patternSegments.forEach(segment => {
                const dist = pointToLineDistance(point, segment.start, segment.end);
                minDist = Math.min(minDist, dist);
            });

            // Award points based on distance
            if (minDist < 10) {
                totalPoints += 1;
            } else if (minDist < 20) {
                totalPoints += 0.5;
            } else if (minDist < 30) {
                totalPoints += 0.25;
            }
        });

        // Calculate final accuracy percentage
        const acc = (totalPoints / maxPoints) * 100;
        const finalAccuracy = Math.min(100, Math.max(0, acc));
        setAccuracy(finalAccuracy);
        setLastAccuracy(finalAccuracy);

        // Apply damage and weakness based on accuracy
        if (finalAccuracy > 90) {
            const damage = 40 + difficulty * 5;
            setVaderHealth(prev => Math.max(0, prev - damage));
            setVaderWeakened(true);
            console.log('Perfect hit!', { 
                accuracy: finalAccuracy, 
                damage, 
                setWeakness: true 
            });
        } else if (finalAccuracy > 80) {
            const damage = 30 + difficulty * 3;
            setVaderHealth(prev => Math.max(0, prev - damage));
            console.log('Good hit!', { accuracy: finalAccuracy, damage });
        } else if (finalAccuracy > 60) {
            const damage = 25 + difficulty * 3;
            setVaderHealth(prev => Math.max(0, prev - damage));
            console.log('Hit!', { accuracy: finalAccuracy, damage });
        } else {
            console.log('Miss!', { accuracy: finalAccuracy });
        }

        // Vader's turn with delay
        setTimeout(() => {
            setTurn('vader');
            handleVaderAttack();
            setPlayerPath([]); // Clear path after accuracy is calculated
        }, 1000);
    };

    const handleVaderAttack = () => {
        console.log('Vader attack starting', { 
            currentWeakness: vaderWeakened,
            lastAccuracy 
        });

        const baseDamage = 15 + difficulty * 5;
        const damage = vaderWeakened ? Math.floor(baseDamage * 0.5) : baseDamage;
        
        console.log('Vader attacks!', { 
            baseDamage, 
            actualDamage: damage, 
            isWeakened: vaderWeakened 
        });
        
        setPlayerHealth(prev => Math.max(0, prev - damage));
        
        // Reset weakness after attack
        if (vaderWeakened) {
            console.log('Resetting Vader weakness');
            setVaderWeakened(false);
        }
        
        // Clear player path when Vader attacks
        setPlayerPath([]);
        
        setTimeout(() => {
            setPattern(generateVaderPattern());
            setTurn('player');
        }, 1500);
    };

    const pointToLineDistance = (p: Point, a: Point, b: Point) => {
        const A = p.x - a.x;
        const B = p.y - a.y;
        const C = b.x - a.x;
        const D = b.y - a.y;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;

        if (lenSq !== 0) {
            param = dot / lenSq;
        }

        let xx, yy;

        if (param < 0) {
            xx = a.x;
            yy = a.y;
        } else if (param > 1) {
            xx = b.x;
            yy = b.y;
        } else {
            xx = a.x + param * C;
            yy = a.y + param * D;
        }

        const dx = p.x - xx;
        const dy = p.y - yy;

        return Math.sqrt(dx * dx + dy * dy);
    };

    // Check for game over
    useEffect(() => {
        if (playerHealth <= 0) {
            setGameOver(true);
            onComplete(false);
        } else if (vaderHealth <= 0) {
            setGameOver(true);
            onComplete(true);
        }
    }, [playerHealth, vaderHealth, onComplete]);

    // Draw game
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw pattern
        if (pattern.length > 1) {
            ctx.beginPath();
            ctx.strokeStyle = vaderWeakened ? '#800000' : '#ff0000'; // Darker red when weakened
            ctx.lineWidth = 3;
            ctx.moveTo(pattern[0].x, pattern[0].y);
            pattern.forEach(point => {
                ctx.lineTo(point.x, point.y);
            });
            ctx.stroke();
        }

        // Draw player path
        if (playerPath.length > 1) {
            ctx.beginPath();
            ctx.strokeStyle = '#4169E1';
            ctx.lineWidth = 3;
            ctx.moveTo(playerPath[0].x, playerPath[0].y);
            playerPath.forEach(point => {
                ctx.lineTo(point.x, point.y);
            });
            ctx.stroke();
        }

        // Draw Vader's saber effect during his turn
        if (turn === 'vader') {
            ctx.beginPath();
            ctx.fillStyle = vaderWeakened ? 
                'rgba(128, 0, 0, 0.3)' : // Darker red when weakened
                'rgba(255, 0, 0, 0.3)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

    }, [pattern, playerPath, turn, vaderWeakened]);

    // Initialize first pattern
    useEffect(() => {
        setPattern(generateVaderPattern());
    }, []);

    // Update the pattern effect to clear player path
    useEffect(() => {
        setPlayerPath([]); // Clear player path when pattern changes
    }, [pattern]);

    return (
        <div className={styles.overlay}>
            <div className={styles.gameContainer}>
                <div className={styles.header}>
                    <h2>SOUBOJ S VADEREM</h2>
                    {vaderWeakened && (
                        <div className={styles.weaknessIndicator}>
                            VADER JE OSLABEN!
                        </div>
                    )}
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
                            <span>Darth Vader: {vaderHealth}</span>
                            <div className={styles.barContainer}>
                                <div 
                                    className={styles.barFill} 
                                    style={{ width: `${vaderHealth / 2}%` }}
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
                        onMouseUp={handleEnd}
                        onMouseLeave={handleEnd}
                        onTouchStart={handleStart}
                        onTouchMove={handleMove}
                        onTouchEnd={handleEnd}
                    />
                    {turn === 'player' ? (
                        <div className={styles.instruction}>
                            {window.innerWidth < 768 
                                ? 'Táhni prstem po červené čáře'
                                : 'Drž levé tlačítko myši a táhni abys kopíroval linii červené čáry'
                            }
                        </div>
                    ) : (
                        <div className={styles.instruction}>
                            {vaderWeakened ? 
                                'Vaderův útok je oslaben!' :
                                'Vaderův útok!'
                            }
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

export default FinalDuel; 