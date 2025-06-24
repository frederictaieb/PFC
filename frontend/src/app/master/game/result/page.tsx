// pages/index.tsx
"use client"
import { useLeaderboard } from "@/app/context/LeaderBoardContext";
import { useLeaderboardUpdater } from "@/app/hooks/useLeaderboardUpdater";
import LeaderboardTrombinoscope from "@/app/components/LeaderboardTrombinoscope";

export default function Home() {
  const { dispatch, state } = useLeaderboard();
  useLeaderboardUpdater();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Leaderboard - Round {state.round}</h1>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={() => dispatch({ type: "NEXT_ROUND" })}
        >
          Prochain round
        </button>
      </div>
      <LeaderboardTrombinoscope />
    </div>
  );
}