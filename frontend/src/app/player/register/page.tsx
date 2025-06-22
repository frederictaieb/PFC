"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { checkGameStatus } from "@/api/game";
import { registerPlayer } from "@/api/player";
import { v4 as uuidv4 } from "uuid";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [registered, setRegistered] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [countdown, setCountdown] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const uuidRef = useRef<string>(uuidv4());

  useEffect(() => {
    const fetchStatus = async () => {
      const started = await checkGameStatus();
      setGameStarted(started);
    };
    fetchStatus();
  }, []);

  useEffect(() => {
    let socket: WebSocket;
    if (!registered) {
      const anonId = uuidRef.current;
      socket = new WebSocket(`${process.env.NEXT_PUBLIC_FASTAPI_WS}/ws/anon/${anonId}`);
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "countdown") {
            setGameStarted(true);
          }
        } catch (err) {
          console.error("Invalid JSON received:", event.data);
        }
      };
    } else {
      socket = new WebSocket(`${process.env.NEXT_PUBLIC_FASTAPI_WS}/ws/${username}`);
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "start_game") {
            router.push("/game");
          }

          if (data.type === "countdown" && ["1", "2", "3", "GO"].includes(data.value)) {
            setCountdown(data.value);
            if (data.value === "GO") {
              setTimeout(() => router.push("/game"), 1000);
            }
          }
        } catch (err) {
          console.error("Invalid JSON received:", event.data);
        }
      };
    }

    socketRef.current = socket;

    socket.onopen = () => console.log("WebSocket connected");
    socket.onerror = (e) => console.error("WebSocket error", e);
    socket.onclose = () => console.log("WebSocket disconnected");

    return () => socket.close();
  }, [registered, username, router]);

  const handleRegister = async () => {
    setClicked(true);
    const result = await registerPlayer(username);

    if (result.success) {
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
          className="px-8 py-4 rounded-xl text-lg w-64 text-center font-bold text-white bg-blue-600 hover:bg-blue-700 shadow transition-all disabled:opacity-50"
        >
          {countdown || (registered ? "Waiting..." : gameStarted ? "Game in progress" : "Register")}
        </button>
      </div>
    </div>
  );
}
