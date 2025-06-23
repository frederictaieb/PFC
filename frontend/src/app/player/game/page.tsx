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
  const [isWinner, setIsWinner] = useState<boolean | null>(null);

  const [myGesture, setMyGesture] = useState<"pierre" | "feuille" | "ciseau" | null>(null);
  const [masterGestureNum, setMasterGestureNum] = useState<number | null>(null);
  const [myGestureNum, setMyGestureNum] = useState<number | null>(null);

  const [playerInfo, setPlayerInfo] = useState<null | {
    username: string;
    wallet: {
      address: string;
      public_key: string;
      balance: string;
    };
  }>(null);

  const [error, setError] = useState<string | null>(null);

  function captureImageFromCanvas(canvas: HTMLCanvasElement): string {
    return canvas.toDataURL("image/jpeg");
  }

  function hasWin(me: number, opponent: number): boolean {
    if (me === opponent) return false;
    return (me - opponent + 3) % 3 === 1;
  }

  useEffect(() => {
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
        setupCameraAndHands(videoRef.current, canvasRef.current, (g) => {
          if (["pierre", "feuille", "ciseau"].includes(g)) {
            setMyGesture(g as "pierre" | "feuille" | "ciseau");
          } else {
            setMyGesture(null);
            console.warn("Geste non reconnu :", g);
          }
        });
      }
    };

    init();
  }, [usernameParam]);

  useEffect(() => {
    if (!playerInfo) return;

    const socket = new WebSocket(`${process.env.NEXT_PUBLIC_FASTAPI_WS}/ws/${playerInfo.username}`);

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "countdown" && ["1", "2", "3"].includes(data.value)) {
          setCountdown(data.value);
        }

        if (data.type === "result") {
          const gestureMap = { pierre: 0, feuille: 1, ciseau: 2 };

          if (!myGesture || !(myGesture in gestureMap)) {
            console.warn("Geste invalide ou non défini :", myGesture);
            return;
          }

          const myNum = gestureMap[myGesture];
          const masterNum = parseInt(data.value);

          setMyGestureNum(myNum);
          setMasterGestureNum(masterNum);

          const win = hasWin(myNum, masterNum);
          setIsWinner(win);

          if (canvasRef.current) {
            const imageBase64 = captureImageFromCanvas(canvasRef.current);

            socket.send(
              JSON.stringify({
                type: "player_result",
                value: {
                  username: playerInfo.username,
                  gesture: myGesture,
                  hasWin: win,
                  image: imageBase64,
                },
              })
            );

            console.log("Image envoyée :", imageBase64);
          } else {
            console.warn("canvasRef.current est null");
          }
        }
      } catch (err) {
        console.error("Invalid JSON received:", event.data);
      }
    };

    return () => {
      socket.close();
    };
  }, [playerInfo, myGesture]);

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
        <div style={{ marginBottom: "10px", color: "red" }}>{error}</div>
      )}

      <video
        ref={videoRef}
        style={{ display: "none" }}
        autoPlay
        playsInline
        muted
        width={360}
        height={360}
      />
      <canvas
        ref={canvasRef}
        width={360}
        height={360}
        style={{
          width: "320px",
          height: "320px",
          borderRadius: "12px",
          border: "0.5px solid #ccc",
        }}
      />
      <div><strong>Geste détecté :</strong> {myGesture ?? "En attente..."}</div>
      <div><strong>Countdown :</strong> {countdown}</div>
      <div><strong>My Result :</strong> {myGestureNum}</div>
      <div><strong>Master Result :</strong> {masterGestureNum}</div>
      <div><strong>Win :</strong> {isWinner === null ? "En attente..." : isWinner ? "Oui" : "Non"}</div>
    </div>
  );
}
