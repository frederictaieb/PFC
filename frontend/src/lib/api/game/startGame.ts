export const startGame= async () => {
    console.log("startGame");
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_FASTAPI_URL}/api/game/startGame`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Erreur lors du démarrage du jeu");
    } catch (err) {
      console.error(err);
    } finally {
    }
  };