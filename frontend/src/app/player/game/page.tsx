"use client";

import { useRef, useEffect, useState } from "react";
import setupCameraAndHands from "@/lib/ai/video/useHandDetection";
import { useSearchParams } from "next/navigation";
import { getPlayer } from "@/lib/api/player/getPlayer";
import { getRound } from "@/lib/api/game/getRound";
import { IncrementRound } from "@/lib/api/game/incrementRound";

export default function GamePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const myGestureRef = useRef<"pierre" | "feuille" | "ciseau" | null>(null);

  const searchParams = useSearchParams();
  const usernameParam = searchParams.get("username");

  const [countdown, setCountdown] = useState<string | null>(null);
  const [loseWinNeutralResult, setLoseWinNeutralResult] = useState(0);
  const [isWinner, setIsWinner] = useState<boolean | null>(null);
  const [roundNumber, setRoundNumber] = useState(0);
  const [myGesture, setMyGesture] = useState<"pierre" | "feuille" | "ciseau" | null>(null);
  const [masterGestureNum, setMasterGestureNum] = useState<number | null>(null);
  const [myGestureNum, setMyGestureNum] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  

  const [playerInfo, setPlayerInfo] = useState<null | {
    username: string;
    wallet: {
      address: string;
      public_key: string;
      balance: string;
    };
  }>(null);

  // Toujours garder myGesture à jour dans la ref
  useEffect(() => {
    myGestureRef.current = myGesture;
  }, [myGesture]);

  //useEffect(() => {
  //  alert(getRound());
  //}, [roundNumber]);

  // Setup détection + récupération player info
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
            setMyGesture("ciseau");
          }
        });
      }
    };
    init();
  }, [usernameParam]);



  // Socket stable (ouvre 1 fois quand playerInfo est dispo)
  useEffect(() => {
    if (!playerInfo) return;

    const socket = new WebSocket(`${process.env.NEXT_PUBLIC_FASTAPI_WS}/ws/${playerInfo.username}`);
    socketRef.current = socket;

    socket.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type !== "result") return; // 🔒 Ignore les autres types
        
        const round = await getRound();
        const gestureMap = { pierre: 0, feuille: 1, ciseau: 2 };
        const currentGesture = myGestureRef.current;

        if (!currentGesture || !(currentGesture in gestureMap)) {
          console.warn("Geste invalide ou non défini :", currentGesture);
          return;
        }

        const myNum = gestureMap[currentGesture];
        setMyGestureNum(myNum);
        const masterNum = parseInt(data.value);
        setMasterGestureNum(masterNum);
        
        const result = computeResult(myNum, masterNum);
        
        const win = hasWin(myNum, masterNum);
        setIsWinner(win);

        if (!canvasRef.current) {
          console.warn("Canvas non dispo");
          return;
        }

        const imageBase64 = captureImageFromCanvas(canvasRef.current);

        const json_data = {
          type: "player_result",
          value: {
            username: playerInfo.username,
            gesture: currentGesture,
            result: result,
            round: round,
            hasWin: win,
            image: imageBase64,
          },
        };

        console.log("JSON Data :", json_data);
        socket.send(JSON.stringify(json_data));
      } catch (err) {
        console.error("Erreur parsing JSON reçu :", event.data);
      }
    };

    return () => {
      socket.close();
    };
  }, [playerInfo, roundNumber]);

  function captureImageFromCanvas(canvas: HTMLCanvasElement): string {
    return canvas.toDataURL("image/jpeg");
  }

  function computeResult(me: number, opponent: number): number {
    if (me === opponent) return 0; // égalité
    if ((me - opponent + 3) % 3 === 1) return 1; // victoire
    return -1; // défaite
  }

  function hasWin(me: number, opponent: number): boolean {
    return computeResult(me, opponent) === 1 || computeResult(me, opponent) === 0;
  }

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
      {error && <div style={{ marginBottom: "10px", color: "red" }}>{error}</div>}

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
