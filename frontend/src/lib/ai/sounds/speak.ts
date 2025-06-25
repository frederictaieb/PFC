// /src/lib/ai/sounds/speaker.tts.ts

export async function speak(text: string, description: string): Promise<void> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_FASTAPI_URL}/api/hume/tts_wav`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, description }),
    });

    if (!res.ok) {
      console.error("Erreur de synthèse vocale :", await res.text());
      return;
    }

    const blob = await res.blob();
    const audioUrl = URL.createObjectURL(blob);
    const audio = new Audio(audioUrl);

    await new Promise<void>((resolve, reject) => {
      audio.onended = () => resolve();
      audio.onerror = () => reject(new Error("Erreur de lecture audio"));
      audio.play().catch(reject);
    });

  } catch (err) {
    console.error("Erreur lors de la lecture audio :", err);
  }
}
