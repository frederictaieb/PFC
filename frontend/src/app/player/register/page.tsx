"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { checkGameStatus } from "@/api/game";

export default function RegisterPage() {

  const router = useRouter();
  const [username, setUsername] = useState("");
  const [registered, setRegistered] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      const started = await checkGameStatus();
      setGameStarted(started);
    };
  
    fetchStatus();
  }, []);

  const handleRegister = async () => {
    setClicked(true);

    const res = await fetch(`${process.env.NEXT_PUBLIC_FASTAPI_URL}/api/player/register_player`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });

    if (res.ok) {
      setRegistered(true);
    } else {
      alert("Erreur : nom déjà utilisé ?");
    }
  };

  useEffect(() => {
    if (!registered) return;

    const socket = new WebSocket(`${process.env.NEXT_PUBLIC_FASTAPI_WS}/ws/${username}`);

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "start_game") {
        router.push('/game');
      }
    };

    return () => socket.close();
  }, [registered]);

  return (
    <div className="flex flex-col items-center pt-10 min-h-screen bg-gray-50 space-y-8">
      <div className="flex flex-col space-y-4">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="px-4 py-4 border rounded-xl text-lg w-64 text-center"
          placeholder="Enter username"
          disabled={clicked || gameStarted}
        />
        <button 
          disabled={clicked || gameStarted}
          onClick={handleRegister} 
          className="px-8 py-4 rounded-xl text-lg w-64 text-center font-bold text-white bg-blue-600 hover:bg-blue-700 shadow transition-all disabled:opacity-50"
        >
          {registered ? "Waiting..." : gameStarted ? "Game in progress" : "Register"}
        </button>
      </div>
    </div>
  );
}
