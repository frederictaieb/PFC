"use client";

import { useRef, useEffect, useState } from "react";
import setupCameraAndHands from "@/lib/ai/useHandDetection";
import { useSearchParams } from "next/navigation";
import { getPlayer } from "@/lib/api/player/getPlayer";

export default function GamePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const searchParams = useSearchParams();
  const usernameParam = searchParams.get("username");

  const [countdown, setCountdown] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const [playerInfo, setPlayerInfo] = useState<null | {
    username: string;
    wallet: {
      address: string;
      public_key: string;
      balance: string;
    };
  }>(null);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    alert(usernameParam);
    const init = async () => {
      if (usernameParam) {
        const result = await getPlayer(usernameParam);
        if (result.success) {
          setPlayerInfo(result.data);
        } else {
          setError(result.error);
          console.error(result.error);
        }
      }

      if (videoRef.current && canvasRef.current) {
        setupCameraAndHands(videoRef.current, canvasRef.current);
      }
    };

    init();
  }, [usernameParam]);

  useEffect(() => {
    if (playerInfo) {
      const socket = new WebSocket(`${process.env.NEXT_PUBLIC_FASTAPI_WS}/ws/${playerInfo.username}`);
      
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "countdown" && ["1", "2", "3"].includes(data.value)) {
            setCountdown(data.value);
          }
          if (data.type === "result") {
            setResult(data.value);
          }

        } catch (err) {
          console.error("Invalid JSON received:", event.data);
        }
      };
      
    }
  }, [playerInfo]);

  
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: "20px",
      }}
    >
      {playerInfo && (
        <div style={{ marginBottom: "10px", textAlign: "center" }}>
          <div><strong>Utilisateur :</strong> {playerInfo.username}</div>
          <div><strong>Balance :</strong> {playerInfo.wallet.balance} XRP</div>
        </div>
      )}
      {error && (
        <div style={{ marginBottom: "10px", color: "red" }}>
          {error}
        </div>
      )}

      <video
        ref={videoRef}
        style={{ display: "none" }}
        autoPlay
        playsInline
        muted
        width={480}
        height={480}
      />
      <canvas
        ref={canvasRef}
        width={480}
        height={480}
        style={{
          width: "480px",
          height: "480px",
          borderRadius: "12px",
          border: "0.5px solid #ccc",
        }}
      />
      <div><strong>Countdown :</strong> {countdown}</div>
      <div><strong>Result :</strong> {result}</div>
    </div>
  );
}
