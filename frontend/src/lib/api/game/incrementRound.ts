  export const IncrementRound = async () => {
    console.log("Increment Round");
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_FASTAPI_URL}/api/game/round/increment`, {
        method: "POST"
      });
      if (!response.ok) throw new Error("Erreur lors de l'incrementation du round");
    } catch (err) {
      console.error("Erreur récupération round :", err);
    }
  };

