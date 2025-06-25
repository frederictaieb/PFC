"use client";

import { useRef, useEffect, useState, useCallback, Suspense } from "react";
import setupCameraAndHands from "@/lib/ai/video/useHandDetection";
import { useSearchParams } from "next/navigation";
import { getPlayer } from "@/lib/api/player/getPlayer";
import { getRound } from "@/lib/api/game/getRound";
import { useRouter } from "next/navigation";

function GamePageContent() {
  const XRP_LOGO_URL = "/xrp-logo.svg";

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const myGestureRef = useRef<"pierre" | "feuille" | "ciseau" | null>(null);

  const searchParams = useSearchParams();
  const usernameParam = searchParams.get("username");

  const [countdown] = useState<string | null>(null);
  const [isWinner, setIsWinner] = useState<boolean | null>(null);
  const isWinnerRef = useRef<boolean | null>(null);
  const [myGesture, setMyGesture] = useState<"pierre" | "feuille" | "ciseau" | null>(null);
  const [masterGestureNum, setMasterGestureNum] = useState<number | null>(null);
  const [myGestureNum, setMyGestureNum] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [showEmoji, setShowEmoji] = useState(false);
  const [emojiVisible, setEmojiVisible] = useState(false);
  const [emoji, setEmoji] = useState<string | null>(null);

  const [showResultEmoji, setShowResultEmoji] = useState(false);
  const [resultEmoji, setResultEmoji] = useState<string | null>(null);

  const [playerInfo, setPlayerInfo] = useState<null | {
    username: string;
    wallet: {
      address: string;
      public_key: string;
      balance: string;
    };
  }>(null);

  const router = useRouter();

  function captureImageFromCanvas(canvas: HTMLCanvasElement): string {
    return canvas.toDataURL("image/jpeg");
  }

  function computeResult(me: number, opponent: number): number {
    if (me === opponent) return 0;
    if ((me - opponent + 3) % 3 === 1) return 1;
    return -1;
  }

  const hasWin = useCallback((me: number, opponent: number): boolean => {
    return computeResult(me, opponent) === 1 || computeResult(me, opponent) === 0;
  }, []);

  async function resizeBase64Image(base64: string, maxWidth = 30, maxHeight = 30): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = document.createElement('img');
      img.onload = function () {
        const canvas = document.createElement('canvas');
  
        let width = img.width;
        let height = img.height;
  
        // Redimensionner tout en gardant le ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.floor((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.floor((width * maxHeight) / height);
            height = maxHeight;
          }
        }
  
        canvas.width = width;
        canvas.height = height;
  
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject("Impossible de créer le contexte canvas");
  
        ctx.drawImage(img, 0, 0, width, height);
        const resizedBase64 = canvas.toDataURL('image/jpeg', 0.7); // compression JPEG
  
        resolve(resizedBase64);
      };
  
      img.onerror = reject;
      img.src = base64;
    });
  }

  function getEmojiFromNumber(num: number): string | null {
    switch (num) {
      case 0: return "🪨";
      case 1: return "🍃";
      case 2: return "✂️";
      default: return null;
    }
  }

  useEffect(() => {
    isWinnerRef.current = isWinner;
  }, [isWinner]);

  useEffect(() => {
    myGestureRef.current = myGesture;
  }, [myGesture]);

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

  useEffect(() => {
    if (!playerInfo) return;

    const socket = new WebSocket(`${process.env.NEXT_PUBLIC_FASTAPI_WS}/ws/${playerInfo.username}`);
    socketRef.current = socket;

    socket.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "broadcast_reset") {
          // Cacher les emojis via message du serveur
          console.log("broadcast_reset received");
          console.log("Closing connection");

          setEmojiVisible(false);
          setTimeout(() => setShowEmoji(false), 1000);
          setShowResultEmoji(false);
          setResultEmoji(null);

          if (isWinnerRef.current === false) {
            // Déclenche le fondu au noir
            const overlay = document.createElement("div");
            overlay.style.position = "absolute";
            overlay.style.top = "0";
            overlay.style.left = "0";
            overlay.style.width = "100%";
            overlay.style.height = "100%";
            overlay.style.backgroundColor = "black";
            overlay.style.opacity = "0";
            overlay.style.transition = "opacity 2s ease-in-out";
            overlay.style.zIndex = "5";
            canvasRef.current?.parentElement?.appendChild(overlay);
            
            // Déclenche l'opacité à 1 pour le fondu
            requestAnimationFrame(() => {
              overlay.style.opacity = "1";
            });
          
            // Éteindre la caméra et afficher le message
            setTimeout(() => {
              if (videoRef.current?.srcObject) {
                const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
                tracks.forEach(track => track.stop());
                videoRef.current.srcObject = null;
              }
          
              overlay.innerHTML = `<div style="color: white; font-size: 2rem; display: flex; align-items: center; justify-content: center; height: 100%;">Merci d'avoir joué !🙏</div>`;
            }, 2000); // après le fondu
            router.push("/");
          }
          
          return;
        }

        if (data.type !== "result") return;

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
        const thumbnailBase64 = await resizeBase64Image(imageBase64);

        const emojiToShow = getEmojiFromNumber(masterNum);
        setEmoji(emojiToShow);
        setShowEmoji(true);
        setEmojiVisible(false);

        setTimeout(() => {
          setEmojiVisible(true);
        }, 10);

        // Affiche l'emoji de résultat
        setResultEmoji(win ? "✅" : "❌");
        setShowResultEmoji(true);

        const json_data = {
          type: "player_result",
          value: {
            username: playerInfo.username,
            gesture: currentGesture,
            result: result,
            round: round,
            hasWin: win,
            image: imageBase64,
            thumbnail: thumbnailBase64,
          },
        };

        console.log("JSON Data :", json_data);
        socket.send(JSON.stringify(json_data));
      } catch {
        console.error("Erreur parsing JSON reçu :", event.data);
      }
    };

    return () => {
      socket.close();
    };
  }, [playerInfo, router, hasWin]);

  if (!user) {
    return <div>Loading...</div>;
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
          <p className="font-medium text-black mt-1 flex items-center justify-center gap-1">
            <span>{playerInfo.wallet.balance}</span>
            <img src={XRP_LOGO_URL} alt="XRP" className="w-4 h-4" />
          </p>
        </div>
      )}
      {error && <div style={{ marginBottom: "10px", color: "red" }}>{error}</div>}

      <div style={{ position: "relative", width: "320px", height: "320px" }}>
        <video
          ref={videoRef}
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            objectFit: "cover",
            zIndex: 1,
            display: "none"
          }}
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
            position: "absolute",
            width: "100%",
            height: "100%",
            borderRadius: "12px",
            border: "0.5px solid #ccc",
            zIndex: 2
          }}
        />

        {showEmoji && emoji && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "7rem",
              opacity: emojiVisible ? 1 : 0,
              transition: "opacity 1s ease-in-out",
              zIndex: 3,
              pointerEvents: "none",
            }}
          >
            {emoji}
          </div>
        )}

        {showResultEmoji && resultEmoji && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "10rem",
              opacity: 0.5,
              transition: "opacity 0.5s ease-in-out",
              zIndex: 4,
              pointerEvents: "none",
            }}
          >
            {resultEmoji}
          </div>
        )}
      </div>

      <div><strong>Geste détecté :</strong> {myGesture ?? "En attente..."}</div>
      <div><strong>Countdown :</strong> {countdown}</div>
      <div><strong>My Result :</strong> {myGestureNum}</div>
      <div><strong>Master Result :</strong> {masterGestureNum}</div>
      <div><strong>Win :</strong> {isWinner === null ? "En attente..." : isWinner ? "Oui" : "Non"}</div>
    </div>
  );
}

export default function GamePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GamePageContent />
    </Suspense>
  );
}
