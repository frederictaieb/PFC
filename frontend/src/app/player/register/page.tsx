"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { checkGameStatus } from "@/api/game";
import { registerPlayer } from "@/api/player";

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

  const handleRegister = async () => {
    setClicked(true);

    const result = await registerPlayer(username);
  
    if (result.success) {
      setRegistered(true);
    } else {
      alert(result.error);
      setClicked(false); // Permet de réessayer
    }
  };

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
