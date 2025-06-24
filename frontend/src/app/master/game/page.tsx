'use client'

import { useState, useEffect } from 'react'
import { startRound } from '@/lib/api/game/startRound'
import { useRouter } from 'next/navigation';
import { IncrementRound } from '@/lib/api/game/incrementRound';
import { getRound } from '@/lib/api/game/getRound';

export default function GamePage() {
    const [message, setMessage] = useState<{ type: string, value: string | number } | null>(null);
    const [showEmoji, setShowEmoji] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false); // 🔹 nouvel état
    const [hasPlayed, setHasPlayed] = useState(false);
    const [roundNumber, setRoundNumber] = useState(0);
    const router = useRouter();

    useEffect(() => {

        fetch(`${process.env.NEXT_PUBLIC_FASTAPI_URL}/api/game/round`)
        .then(res => res.json())
        .then(data => setRoundNumber(data.round));



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
                setHasPlayed(true);
            } else if (data.type === "player_result") {
                console.log("Résultat du joueur :", data.value);
                // Tu peux afficher le geste, la victoire et l'image ici
                // Exemple d'affichage temporaire (à adapter à ton UI) :
                //alert(data.value.username + " a " + (data.value.hasWin ? "gagné" : "perdu"))
            }

        };
    }, []);

    const handleStartRound = async () => {
        try {
            setHasPlayed(false);
            setIsPlaying(true);
            
            await IncrementRound();
            const round = await getRound();  
            if (typeof round === "number") {
                setRoundNumber(round);
            }
    
            await startRound();
        } catch (err) {
            console.error(err);
            setIsPlaying(false);
        }
    };

    const handleLeaderboard = async () => {
        router.push('/master/game/results');
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
            <div className="flex flex-col items-center">
            <h1 className="text-4xl font-bold">Round {roundNumber}</h1>
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
    
            {hasPlayed && <button 
              onClick={handleLeaderboard}
              disabled={isPlaying}
              className="text-2xl mt-8 px-8 py-4 rounded-xl bg-green-600 text-white font-bold shadow hover:bg-green-700 transition-all disabled:opacity-50 w-64">
              Scores
            </button>}
            </div>
        </div>
    );
}
