// hooks/useLeaderboardUpdater.ts
"use client"
import { useEffect } from "react";
import { useLeaderboard } from "@/app/context/LeaderBoardContext";


export function useLeaderboardUpdater() {
  const { state, dispatch } = useLeaderboard();

  useEffect(() => {
    async function fetchData() {
      //const res = await fetch(`http://localhost:8000/api/get_lastround_result?round=${state.round}`);
      const res = await fetch(`${process.env.NEXT_PUBLIC_FASTAPI_URL}/api/user/to_results`);
      const data = await res.json();
      dispatch({ type: "SET_LEADERBOARD", payload: data });
    }

    fetchData();
  }, [state.round, dispatch]);
}