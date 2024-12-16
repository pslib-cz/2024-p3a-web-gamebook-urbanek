import { useNavigate } from "react-router-dom";

export default function HomePage() {
    const navigate = useNavigate();

    const handleStart = () => {
        navigate("/scenes/1");
    };

    return (
        <div>
            <button onClick={handleStart}>Start</button>
        </div>
    );
}
