export async function startRound() {
    console.log("Starting Round");
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_FASTAPI_URL}/api/game/startRound`, {
            method: "POST",
        });
        if (!response.ok) throw new Error("Erreur du démarrage du round");
    } catch (err) {
        console.error("Erreur dans startRound:", err);
    }
  }