"use client";

import { useRef, useEffect } from "react";
import setupCameraAndHands from "@/lib/ai/useHandDetection";

export default function GamePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (videoRef.current && canvasRef.current) {
      setupCameraAndHands(videoRef.current, canvasRef.current);
    }
  }, []);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
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
    </div>
  );
}
