import type { NormalizedLandmarkList } from "@mediapipe/hands";

export default function detectGesture(
  landmarks: NormalizedLandmarkList
): "pierre" | "feuille" | "ciseau" | "inconnu" {
  try {
    const isFingerUp = (tipIdx: number, pipIdx: number) =>
      landmarks[tipIdx].y < landmarks[pipIdx].y;

    const indexUp = isFingerUp(8, 6);
    const middleUp = isFingerUp(12, 10);
    const ringUp = isFingerUp(16, 14);
    const pinkyUp = isFingerUp(20, 18);

    if (!indexUp && !middleUp && !ringUp && !pinkyUp) return "pierre";
    if (indexUp && middleUp && ringUp && pinkyUp) return "feuille";
    if (indexUp && middleUp && !ringUp && !pinkyUp) return "ciseau";

    return "inconnu";
  } catch (err) {
    console.warn("Erreur dans la détection du geste :", err);
    return "inconnu";
  }
}
