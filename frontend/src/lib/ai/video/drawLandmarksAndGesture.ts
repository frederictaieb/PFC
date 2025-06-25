import type { Results, NormalizedLandmarkList } from "@mediapipe/hands";
import detectGesture from "./detectGesture";

// Typage précis des fonctions de dessin
type DrawConnectorsFn = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmarkList,
  connections: Array<[number, number]>,
  style?: { color?: string; lineWidth?: number }
) => void;

type DrawLandmarksFn = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmarkList,
  style?: { color?: string; radius?: number }
) => void;

export default function drawLandmarksAndGesture(
  ctx: CanvasRenderingContext2D,
  results: Results,
  HAND_CONNECTIONS: Array<[number, number]>,
  drawConnectors: DrawConnectorsFn,
  drawLandmarks: DrawLandmarksFn
): "pierre" | "feuille" | "ciseau" | "inconnu" | null {
  const canvas = ctx.canvas;
  let gestureDetected: "pierre" | "feuille" | "ciseau" | "inconnu" | null = null;

  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

  if (results.multiHandLandmarks) {
    for (const landmarks of results.multiHandLandmarks) {
      drawConnectors(ctx, landmarks, HAND_CONNECTIONS, { color: "#00FF00", lineWidth: 1 });
      drawLandmarks(ctx, landmarks, { color: "#FF0000", radius: 3 });

      const gesture = detectGesture(landmarks);
      gestureDetected = gesture;
    }
  }

  ctx.restore();

  if (gestureDetected) {
    const emojiMap: Record<string, string> = {
      pierre: "🪨",
      feuille: "🍃",
      ciseau: "✂️",
      inconnu: "❓",
    };

    const emoji = emojiMap[gestureDetected];
    const padding = 20;

    ctx.textAlign = "right";
    ctx.fillStyle = "#000000";
    ctx.font = "64px serif";
    ctx.fillText(emoji, canvas.width - padding, 60);
  }

  return gestureDetected;
}
