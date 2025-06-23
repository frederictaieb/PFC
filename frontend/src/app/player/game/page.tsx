"use client";

import { useRef, useState, useEffect } from "react";
import setupCameraAndHands from "@/lib/ai/useHandDetection";
import { useRouter } from "next/navigation";

export default function GamePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      } catch (err) {
        console.error("Error parsing user data:", err);
        router.push("/player/register");
      }
    } else {
      // No user data found, redirect to register page
      router.push("/player/register");
    }
  }, [router]);

  useEffect(() => {
    if (videoRef.current && canvasRef.current) {
      setupCameraAndHands(videoRef.current, canvasRef.current);
    }
  }, []);

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{width: "100vw", height: "100vh", display: "flex", justifyContent: "center", alignItems: "center"}}>
      <div>
        <h1>{user.username}</h1>
      </div>
      <video ref={videoRef} style={{ display: "none" }} autoPlay playsInline muted width={480} height={480}/>
      <canvas ref={canvasRef} width={480} height={480} style={{width: "480px", height: "480px", borderRadius: "12px", border: "0.5px solid #ccc"}}/>
    </div>
  );
}
