export const getRound = async (): Promise<number> => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_FASTAPI_URL}/api/game/round`);
    if (!res.ok) throw new Error("Failed to fetch round");
    const data = await res.json();
    return data.round;
  };