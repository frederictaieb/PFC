export default function detectGesture(
    landmarks: any[]
  ): "pierre" | "feuille" | "ciseau" | "inconnu" {
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
  }
  