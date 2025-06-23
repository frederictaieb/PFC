import drawLandmarksAndGesture from "./drawLandmarksAndGesture";

export default async function setupCameraAndHands(
  videoElement: HTMLVideoElement,
  canvasElement: HTMLCanvasElement,
  onGestureDetected?: (gesture: string) => void
) {
  const { Hands, HAND_CONNECTIONS } = await import("@mediapipe/hands");
  const { drawConnectors, drawLandmarks } = await import("@mediapipe/drawing_utils");
  const { Camera } = await import("@mediapipe/camera_utils");

  const ctx = canvasElement.getContext("2d");
  if (!ctx) {
    console.warn("Impossible d'obtenir le contexte 2D du canvas.");
    return;
  }

  const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
  });

  hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });

  hands.onResults((results: any) => {
    const gesture = drawLandmarksAndGesture(
      ctx,
      results,
      HAND_CONNECTIONS,
      drawConnectors,
      drawLandmarks
    );
    if (gesture && onGestureDetected) {
      console.log("Geste détecté :", gesture);
      onGestureDetected(gesture);
    }
  });

  const camera = new Camera(videoElement, {
    onFrame: async () => {
      await hands.send({ image: videoElement });
    },
    width: 480,
    height: 480,
  });

  camera.start();
}
