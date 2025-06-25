"use client";

// pages/camera.tsx
import { useEffect, useRef } from "react";

export default function CameraPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const setup = async () => {
      // Import locally installed MediaPipe packages
      const { Hands, HAND_CONNECTIONS } = await import('@mediapipe/hands');
      const { drawConnectors, drawLandmarks } = await import('@mediapipe/drawing_utils');
      const { Camera } = await import('@mediapipe/camera_utils');

      const video = videoRef.current!;
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d')!;

      const hands = new Hands({
        locateFile: (file: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      // Use the correct type from the MediaPipe library
      hands.onResults((results) => {
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
        if (results.multiHandLandmarks) {
          for (const landmarks of results.multiHandLandmarks) {
            drawConnectors(ctx, landmarks, HAND_CONNECTIONS, {
              color: "#00FF00",
              lineWidth: 2,
            });
            drawLandmarks(ctx, landmarks, {
              color: "#FF0000",
              lineWidth: 1,
            });
          }
        }
        ctx.restore();
      });

      const camera = new Camera(video, {
        onFrame: async () => {
          await hands.send({ image: video });
        },
        width: 1280,
        height: 720,
      });

      camera.start();
    };

    setup();
  }, []);

  return (
    <div>
      <video
        ref={videoRef}
        style={{ display: "none" }}
        autoPlay
        playsInline
        muted
        width="1280"
        height="720"
      />
      <canvas
        ref={canvasRef}
        width={1280}
        height={720}
        style={{
          width: "100vw",
          height: "100vh",
          objectFit: "cover",
        }}
      />
    </div>
  );
} 