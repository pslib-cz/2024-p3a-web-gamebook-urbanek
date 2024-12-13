import { useNavigate } from "react-router-dom";

export default function HomePage() {
    const navigate = useNavigate();

    const handleStart = () => {
        navigate("/scenes");
    };

    return (
        <div>
            <button onClick={handleStart}>Start</button>
        </div>
    );
}
