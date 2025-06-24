// pages/index.tsx
"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation';
import { useLeaderboard } from "@/app/context/LeaderBoardContext";
import { useLeaderboardUpdater } from "@/app/hooks/useLeaderboardUpdater";
import LeaderboardTrombinoscope from "@/app/components/LeaderboardTrombinoscope";


export default function Home() {

const [roundNumber, setRoundNumber] = useState(0);
const router = useRouter();
const { state } = useLeaderboard();

useEffect(() => {
  fetch(`${process.env.NEXT_PUBLIC_FASTAPI_URL}/api/game/round`)
  .then(res => res.json())
  .then(data => setRoundNumber(data.round));
}, []);

const handleClose = () => {
  
  const losers = state.leaderboard.filter((player) => player.result === -1);
  console.log("Losers: ", losers);
  
  for (const loser of losers) {
    try {
      fetch(`${process.env.NEXT_PUBLIC_FASTAPI_URL}/api/user/eliminate_user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: loser.username }),
      });
      console.log(`✅ Eliminated: ${loser.username}`);
    } catch (error) {
      console.error(`❌ Failed to eliminate ${loser.username}`, error);
    }
  }
  router.push('/master/game');
}
  
return (
  <div className="min-h-screen bg-gray-50">
     <div className="p-4 flex justify-between items-center">
      <h1 className="text-3xl font-bold">Leaderboard - Round {roundNumber}</h1>
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        onClick={handleClose}
      >
        Close
     </button>
    </div>
    <LeaderboardTrombinoscope />
  </div>
  );
}