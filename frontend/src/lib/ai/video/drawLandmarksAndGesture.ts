import detectGesture from "./detectGesture";

export default function drawLandmarksAndGesture(
  ctx: CanvasRenderingContext2D,
  results: any,
  HAND_CONNECTIONS: any,
  drawConnectors: any,
  drawLandmarks: any
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

      const emojiMap: Record<string, string> = {
        pierre: "🪨",
        feuille: "🍃",
        ciseau: "✂️",
        inconnu: "❓",
      };
      const emoji = emojiMap[gesture];

      ctx.font = "64px serif";
      ctx.fillStyle = "#000000";
      ctx.fillText(emoji, 20, 60);

    }
  }

  ctx.restore();
  return gestureDetected;
}
