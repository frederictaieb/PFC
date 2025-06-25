"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { checkGameStatus } from "@/lib/api/game/checkGameStatus";
import { registerPlayer } from "@/lib/api/player/registerPlayer";
import { v4 as uuidv4 } from "uuid";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [registered, setRegistered] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [countdown, setCountdown] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const uuidRef = useRef<string>(uuidv4());

  useEffect(() => {
    const fetchStatus = async () => {
      const started = await checkGameStatus();
      setGameStarted(started);
    };
    fetchStatus();
  }, []);

  // Socket anonyme (avant enregistrement)
  useEffect(() => {
    if (registered) return;

    const anonId = uuidRef.current;
    const socket = new WebSocket(`${process.env.NEXT_PUBLIC_FASTAPI_WS}/ws/anon/${anonId}`);

    socketRef.current = socket;

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "countdown") {
          setGameStarted(true);
        }
      } catch {
        console.error("Invalid JSON received:", event.data);
      }
    };

    socket.onopen = () => console.log("WebSocket connected (anon)");
    socket.onerror = (e) => console.error("WebSocket error", e);
    socket.onclose = () => console.log("WebSocket disconnected (anon)");

    return () => socket.close();
  }, [registered]);

  // Socket joueur (après enregistrement)
  useEffect(() => {
    if (!registered || !username) return;

    const socket = new WebSocket(`${process.env.NEXT_PUBLIC_FASTAPI_WS}/ws/${username}`);
    socketRef.current = socket;

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "countdown" && ["1", "2", "3", "GO"].includes(data.value)) {
          setCountdown(data.value);
          if (data.value === "GO") {
            setTimeout(() => {
              router.push(`/player/game?username=${encodeURIComponent(username)}`);
            }, 1000);
          }
        }
      } catch {
        console.error("Invalid JSON received:", event.data);
      }
    };

    socket.onopen = () => console.log("WebSocket connected (user)");
    socket.onerror = (e) => console.error("WebSocket error", e);
    socket.onclose = () => console.log("WebSocket disconnected (user)");

    return () => socket.close();
  }, [registered, username, router]);

  const handleRegister = async () => {
    setClicked(true);
    const result = await registerPlayer(username);
  
    if (result.success && result.user) {
      console.log("User registered successfully:", result.user);
      setUser(result.user);
      localStorage.setItem("user", JSON.stringify(result.user));
      setRegistered(true);
    } else {
      alert(result.error);
      setClicked(false);
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
          disabled={clicked || gameStarted || countdown !== null}
        />
        <button
          disabled={clicked || gameStarted || countdown !== null}
          onClick={handleRegister}
          className={`px-8 py-4 rounded-xl text-lg w-64 text-center font-bold text-white shadow transition-all disabled:opacity-50
            ${registered && !countdown ? "bg-orange-300 hover:bg-orange-400" :
              gameStarted || countdown ? "bg-red-400" :
              "bg-blue-600 hover:bg-blue-700"}`}
        >
          {countdown || (registered ? "Waiting..." : gameStarted ? "Game in progress" : "Register")}
        </button>
      </div>
    </div>
  );
}
