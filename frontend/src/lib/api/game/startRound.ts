export async function startRound() {
    console.log("startRound");
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_FASTAPI_URL}/api/game/startRound`, {
            method: "POST",
        });
        if (!response.ok) throw new Error("Erreur lors du démarrage du jeu");
    } catch (err) {
        console.error("Erreur dans startRound:", err);
    }
  }