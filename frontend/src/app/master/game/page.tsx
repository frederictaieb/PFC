'use client'

import { useState, useEffect } from 'react'
import { startRound } from '@/lib/api/game/startRound'
import { useRouter } from 'next/navigation';
import { IncrementRound } from '@/lib/api/game/incrementRound';
import { getRound } from '@/lib/api/game/getRound';

export default function GamePage() {
    const [message, setMessage] = useState<{ type: string, value: string | number } | null>(null);
    const [showEmoji, setShowEmoji] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [hasPlayed, setHasPlayed] = useState(false);
    const [roundNumber, setRoundNumber] = useState(0);
    const router = useRouter();

    // Fonction utilitaire locale pour base64 → Blob
    function base64ToBlob(base64: string, mime = "audio/wav") {
        const byteChars = atob(base64);
        const byteNumbers = new Array(byteChars.length).fill(0).map((_, i) => byteChars.charCodeAt(i));
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: mime });
    }

    useEffect(() => {
        // Charger le numéro du round actuel
        fetch(`${process.env.NEXT_PUBLIC_FASTAPI_URL}/api/game/round`)
            .then(res => res.json())
            .then(data => setRoundNumber(data.round));

        // WebSocket
        const socket = new WebSocket(`${process.env.NEXT_PUBLIC_FASTAPI_WS}/ws/master`);

        socket.onmessage = async (event) => {
            const data = JSON.parse(event.data);
        
            if (data.type === "announcement") {
                console.log("announcement", data);
                if (data.audio_base64) {
                    const audioBlob = base64ToBlob(data.audio_base64);
                    const audioUrl = URL.createObjectURL(audioBlob);
                    const audio = new Audio(audioUrl);
                    audio.play();
                }
            } else if (data.type === "countdown") {
                console.log("countdown", data);
                if (data.audio_base64) {
                    const audioBlob = base64ToBlob(data.audio_base64);
                    const audioUrl = URL.createObjectURL(audioBlob);
                    const audio = new Audio(audioUrl);
                    audio.play();
                }
                setMessage(data);
                setShowEmoji(false);

            } else if (data.type === "result") {
                console.log("result", data);
                if (data.audio_base64) {
                    const audioBlob = base64ToBlob(data.audio_base64);
                    const audioUrl = URL.createObjectURL(audioBlob);
                    const audio = new Audio(audioUrl);
                    audio.play();
                }
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
            }
        };

        return () => {
            socket.close();
        };

    }, []);


    useEffect(() => {
        const resetState = () => {
            setHasPlayed(false);
            setIsPlaying(false);
            setMessage(null);
            setShowEmoji(false);
        };

        resetState();

        window.addEventListener('focus', resetState);
        return () => window.removeEventListener('focus', resetState);
    }, []);

    const handleStartRound = async () => {
        try {
            setIsPlaying(true);
            setHasPlayed(false);

            await IncrementRound();
            const round = await getRound();
            if (typeof round === "number") setRoundNumber(round);

            await startRound();
        } catch (err) {
            console.error(err);
            setIsPlaying(false);
        }
    };

    const handleLeaderboard = async () => {

        await fetch(`${process.env.NEXT_PUBLIC_FASTAPI_URL}/api/userpool/collect_pool_xrp`)
        .then(res => res.json())
        .then(data => console.log(data));

        await fetch(`${process.env.NEXT_PUBLIC_FASTAPI_URL}/api/userpool/dispatch_pool_xrp`)
        .then(res => res.json())
        .then(data => console.log(data))

        router.push('/master/game/results');
    };

    const getEmoji = () => {
        if (message?.type === "result") {
            switch (Number(message.value)) {
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
                    disabled={isPlaying || hasPlayed}
                    className="text-2xl mt-8 px-8 py-4 rounded-xl bg-blue-600 text-white font-bold shadow hover:bg-blue-700 transition-all disabled:opacity-50 w-64">
                    Start
                </button>

                <button 
                    onClick={handleLeaderboard}
                    disabled={!hasPlayed}
                    className="text-2xl mt-8 px-8 py-4 rounded-xl bg-green-600 text-white font-bold shadow hover:bg-green-700 transition-all disabled:opacity-50 w-64">
                    Scores
                </button>
            </div>
        </div>
    );
}
