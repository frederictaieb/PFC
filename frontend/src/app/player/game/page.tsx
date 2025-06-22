"use client";

import { useEffect, useRef } from "react";

export default function CameraPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const setup = async () => {
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
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      hands.onResults((results: any) => {
        ctx.save();

        // Effet miroir
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);

        ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

        if (results.multiHandLandmarks) {
          for (const landmarks of results.multiHandLandmarks) {
            drawConnectors(ctx, landmarks, HAND_CONNECTIONS, {
              color: "#FFD700",
              lineWidth: 1,
            });
            drawLandmarks(ctx, landmarks, {
              color: "#0000BB",
              radius: 5
            });
          }
        }

        ctx.restore();
      });

      const camera = new Camera(video, {
        onFrame: async () => {
          await hands.send({ image: video });
        },
        width: 480,
        height: 480,
      });

      camera.start();
    };

    setup();
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
        }}
      />
    </div>
  );
}
