import drawLandmarksAndGesture from "./drawLandmarksAndGesture";

export default async function setupCameraAndHands(
  videoElement: HTMLVideoElement,
  canvasElement: HTMLCanvasElement
) {
  const { Hands, HAND_CONNECTIONS } = await import("@mediapipe/hands");
  const { drawConnectors, drawLandmarks } = await import("@mediapipe/drawing_utils");
  const { Camera } = await import("@mediapipe/camera_utils");

  const ctx = canvasElement.getContext("2d")!;
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
    drawLandmarksAndGesture(ctx, results, HAND_CONNECTIONS, drawConnectors, drawLandmarks);
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
