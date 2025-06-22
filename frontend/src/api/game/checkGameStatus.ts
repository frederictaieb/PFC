export const checkGameStatus = async (): Promise<boolean> => {
    console.log("checkGameStatus");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_FASTAPI_URL}/api/game/status`);
      const data = await res.json();
      console.log(data);
      return data.game_started;
    } catch (err) {
      console.error("Erreur lors de la récupération du statut de jeu :", err);
      return false;
    }
};