"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import Link from "next/link";   
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function StartPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState<number | string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ws = new WebSocket(`${process.env.NEXT_PUBLIC_FASTAPI_WS}/ws/master`);
  
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
  
      if (data?.type === "countdown" && ["1", "2", "3", "GO"].includes(data.value)) {
        setCountdown(data.value);
        if (data.value === "GO") {
          setTimeout(() => router.push("/master/game"), 1000);
        }
      }
  
      // Tu peux aussi logguer les autres types ici si besoin
      if (data?.type === "info") {
        console.log("INFO:", data.value);
      }
    };
  
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    }
  }, [router]);

  const handleStart = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_FASTAPI_URL}/api/game/start`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Erreur lors du démarrage du jeu");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center pt-10">
      <h1 className="text-6xl md:text-8xl font-bold text-gray-800 pt-4">AIcebreaker</h1>

      <div className="pt-8">
        <Image src="/xrp-logo.svg" alt="AIcebreaker" width={100} height={100} />
      </div>

      <div className="pt-8">
        <QRCodeSVG
          value={`${process.env.NEXT_PUBLIC_FASTAPI_URL}/player/register`}
          size={256}
        />
      </div>

      <div className="pt-4 text-center">
        Scan the QR code to{" "}
        <Link href={`${process.env.NEXT_PUBLIC_FASTAPI_URL}/player/register`}>
          <div className="underline font-bold text-blue-700">register</div>
        </Link>
      </div>

      <button
        onClick={handleStart}
        disabled={loading || countdown !== null}
        className="text-2xl mt-8 px-8 py-4 rounded-xl bg-blue-600 text-white font-bold shadow hover:bg-blue-700 transition-all disabled:opacity-50 w-64"
      >
        {countdown || "Start"}
      </button>

    </div>
  );
}
