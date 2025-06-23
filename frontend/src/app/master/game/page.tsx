'use client'

import { useState, useEffect } from 'react'
import { startRound } from '@/lib/api/game/startRound'

export default function GamePage() {
    const [message, setMessage] = useState<{ type: string, value: string | number } | null>(null);
    const [showEmoji, setShowEmoji] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false); // 🔹 nouvel état

    useEffect(() => {
        const socket = new WebSocket(`${process.env.NEXT_PUBLIC_FASTAPI_WS}/ws/master`);
        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log(data);

            if (data.type === "countdown") {
                setMessage(data);
                setShowEmoji(false);
            } else if (data.type === "result") {
                setMessage(data);
                setShowEmoji(false);

                // lancer le fade-in
                setTimeout(() => {
                    setShowEmoji(true);

                    // désactiver isPlaying après la transition (3s)
                    setTimeout(() => {
                        setIsPlaying(false);
                    }, 3000);
                }, 10);
            } else if (data.type === "player_result") {
                console.log("Résultat du joueur :", data.value);
                // Tu peux afficher le geste, la victoire et l'image ici
                // Exemple d'affichage temporaire (à adapter à ton UI) :
                alert("coucou")
                alert(`Geste : ${data.value.gesture}\nVictoire : ${data.value.hasWin ? "Oui" : "Non"}`);
            }

        };
    }, []);

    const handleStartRound = async () => {
        try {
            setIsPlaying(true); // 🔹 désactive bouton
            await startRound();
        } catch (err) {
            console.error(err);
            setIsPlaying(false); // sécurité
        }
    };

    const getEmoji = () => {
        if (message?.type === "result") {
            switch (message.value) {
                case 0: return "🪨";
                case 1: return "🍃";
                case 2: return "✂️";
                default: return null;
            }
        }
        return null;
    };

    return (
        <div className="flex flex-col items-center pt-10">
            <div className="h-64 w-64 flex items-center justify-center text-9xl font-bold border border-black border-[1px] rounded-xl">
                {message?.type === "result" && (
                    <div
                        className={`mb-4 transition-opacity duration-[3000ms] ease-in-out ${
                            showEmoji ? 'opacity-100' : 'opacity-0'
                        }`}
                    >
                        {getEmoji()}
                    </div>
                )}

                {message?.type === "countdown" && (
                    <div id="countdown" className="text-9xl font-bold">
                        {message.value}
                    </div>
                )}
            </div>

            <button 
                onClick={handleStartRound}
                disabled={isPlaying} // 🔹 désactivation ici
                className="text-2xl mt-8 px-8 py-4 rounded-xl bg-blue-600 text-white font-bold shadow hover:bg-blue-700 transition-all disabled:opacity-50 w-64">
                Start
            </button>
        </div>
    );
}
