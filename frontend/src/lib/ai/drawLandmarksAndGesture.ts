import detectGesture from "./detectGesture";

export default function drawLandmarksAndGesture(
  ctx: CanvasRenderingContext2D,
  results: any,
  HAND_CONNECTIONS: any,
  drawConnectors: any,
  drawLandmarks: any
) {
  const canvas = ctx.canvas;

  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

  if (results.multiHandLandmarks) {
    for (const landmarks of results.multiHandLandmarks) {
      drawConnectors(ctx, landmarks, HAND_CONNECTIONS, {
        color: "#00FF00",
        lineWidth: 1,
      });

      for (const point of landmarks) {
        const x = point.x * canvas.width;
        const y = point.y * canvas.height;
        ctx.beginPath();
        ctx.arc(x, y, 3.1, 0, 2 * Math.PI);
        ctx.fillStyle = "#FF0000";
        ctx.fill();
      }

      const gesture = detectGesture(landmarks);
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
}
