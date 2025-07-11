'use client'

import { useState, useEffect } from 'react'
import { startRound } from '@/lib/api/game/startRound'
import { useRouter } from 'next/navigation';
import { IncrementRound } from '@/lib/api/game/incrementRound';
import { getRound } from '@/lib/api/game/getRound';
import { Howl } from 'howler';

export default function GamePage() {
    const [message, setMessage] = useState<{ type: string, value: string | number } | null>(null);
    const [showEmoji, setShowEmoji] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [hasPlayed, setHasPlayed] = useState(false);
    const [roundNumber, setRoundNumber] = useState(0);
    const [voice, setVoice] = useState<"1" | "2">("1");
    const router = useRouter();

    const sounds = {
        n1_1: new Howl({ src: ['/sounds/voice1/1.mp3'] }),
        n2_1: new Howl({ src: ['/sounds/voice1/2.mp3'] }),
        n3_1: new Howl({ src: ['/sounds/voice1/3.mp3'] }),
        n4_1: new Howl({ src: ['/sounds/voice1/4.mp3'] }),
        n5_1: new Howl({ src: ['/sounds/voice1/5.mp3'] }),
        n6_1: new Howl({ src: ['/sounds/voice1/6.mp3'] }),
        n7_1: new Howl({ src: ['/sounds/voice1/7.mp3'] }),
        n8_1: new Howl({ src: ['/sounds/voice1/8.mp3'] }),
        n9_1: new Howl({ src: ['/sounds/voice1/9.mp3'] }),
        n10_1: new Howl({ src: ['/sounds/voice1/10.mp3'] }),
        attention_1: new Howl({ src: ['/sounds/voice1/attention.mp3'] }),
        beready_1: new Howl({ src: ['/sounds/voice1/beready.mp3'] }),
        nextround_1: new Howl({ src: ['/sounds/voice1/nextround.mp3'] }),
        paper_1: new Howl({ src: ['/sounds/voice1/paper.mp3'] }),
        scissors_1: new Howl({ src: ['/sounds/voice1/scissors.mp3'] }),
        rock_1: new Howl({ src: ['/sounds/voice1/rock.mp3'] }),

        // voice 2
        n1_2: new Howl({ src: ['/sounds/voice2/1.mp3'] }),
        n2_2: new Howl({ src: ['/sounds/voice2/2.mp3'] }),
        n3_2: new Howl({ src: ['/sounds/voice2/3.mp3'] }),
        n4_2: new Howl({ src: ['/sounds/voice2/4.mp3'] }),
        n5_2: new Howl({ src: ['/sounds/voice2/5.mp3'] }),
        n6_2: new Howl({ src: ['/sounds/voice2/6.mp3'] }),
        n7_2: new Howl({ src: ['/sounds/voice2/7.mp3'] }),
        n8_2: new Howl({ src: ['/sounds/voice2/8.mp3'] }),
        n9_2: new Howl({ src: ['/sounds/voice2/9.mp3'] }),
        n10_2: new Howl({ src: ['/sounds/voice2/10.mp3'] }),
        attention_2: new Howl({ src: ['/sounds/voice2/attention.mp3'] }),
        beready_2: new Howl({ src: ['/sounds/voice2/beready.mp3'] }),
        nextround_2: new Howl({ src: ['/sounds/voice2/nextround.mp3'] }),
        paper_2: new Howl({ src: ['/sounds/voice2/paper.mp3'] }),
        scissors_2: new Howl({ src: ['/sounds/voice2/scissors.mp3'] }),
        rock_2: new Howl({ src: ['/sounds/voice2/rock.mp3'] }),
        round_2: new Howl({ src: ['/sounds/voice2/round.mp3'] }),
      };

    useEffect(() => {
        setVoice("2");
      }, []);

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
                if (data.value.startsWith("Round")) {
                    if (voice === "1") {
                        sounds.nextround_1.play();
                    } else {
                        sounds.nextround_2.play();
                    }
                } else if (data.value === "Attention! Game is starting!") {
                    if (voice === "1") {
                        sounds.attention_1.play();
                    } else {
                        sounds.attention_2.play();
                    }
                } else if (data.value === "Be ready!") {
                    if (voice === "1") {
                        sounds.beready_1.play();
                    } else {
                        sounds.beready_2.play();
                    }
                } 
                /*
                if (data.audio_base64) {
                    const audioBlob = base64ToBlob(data.audio_base64);
                    const audioUrl = URL.createObjectURL(audioBlob);
                    const audio = new Audio(audioUrl);
                    audio.play();
                }
                */
            } else if (data.type === "countdown") {
                console.log("countdown", data);
                if (data.value === "1") {
                    if (voice === "1") {
                        sounds.n1_1.play();
                    } else {
                        sounds.n1_2.play();
                    }
                } else if (data.value === "2") {
                    if (voice === "1") {
                        sounds.n2_1.play();
                    } else {
                        sounds.n2_2.play();
                    }
                } else if (data.value === "3") {
                    if (voice === "1") {
                        sounds.n3_1.play();
                    } else {
                        sounds.n3_2.play();
                    }
                }

                /*
                if (data.audio_base64) {
                    const audioBlob = base64ToBlob(data.audio_base64);
                    const audioUrl = URL.createObjectURL(audioBlob);
                    const audio = new Audio(audioUrl);
                    audio.play();
                }
                */
                setMessage(data);
                setShowEmoji(false);

            } else if (data.type === "result") {
                console.log("result", data);
                if (data.value === "0") {
                    if (voice === "1") {
                        sounds.rock_1.play();
                    } else {
                        sounds.rock_2.play();
                    }
                } else if (data.value === "1") {
                    if (voice === "1") {
                        sounds.paper_1.play();
                    } else {
                        sounds.paper_2.play();
                    }
                } else if (data.value === "2") {
                    if (voice === "1") {
                        sounds.scissors_1.play();
                    } else {
                        sounds.scissors_2.play();
                    }
                }
                /*
                if (data.audio_base64) {
                    const audioBlob = base64ToBlob(data.audio_base64);
                    const audioUrl = URL.createObjectURL(audioBlob);
                    const audio = new Audio(audioUrl);
                    audio.play();
                }*/
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

    }, [voice]);


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

        console.log("triggering collect_pool_xrp");
        await fetch(`${process.env.NEXT_PUBLIC_FASTAPI_URL}/api/userpool/collect_pool_xrp`)
        .then(res => res.json())
        .then(data => console.log(data));

        console.log("triggering collect_pool_xrp");
        await fetch(`${process.env.NEXT_PUBLIC_FASTAPI_URL}/api/userpool/dispatch_pool_xrp`)
        .then(res => res.json())
        .then(data => console.log(data))

        // Update Balances
        console.log("triggering refresh_balances");
        await fetch(`${process.env.NEXT_PUBLIC_FASTAPI_URL}/api/game/refresh_balances`)
        .then(res => res.json())
        .then(data => console.log(data));

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
