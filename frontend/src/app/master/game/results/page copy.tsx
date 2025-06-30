// pages/index.tsx
"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation';
import LeaderboardTrombinoscope from "@/app/components/LeaderboardTrombinoscope";


export default function Home() {

const [roundNumber, setRoundNumber] = useState(0);
const router = useRouter();

useEffect(() => {
  fetch(`${process.env.NEXT_PUBLIC_FASTAPI_URL}/api/game/round`)
  .then(res => res.json())
  .then(data => setRoundNumber(data.round));
}, []);

const handleClose = () => {
  
  // Reset the round
  try {
    fetch(`${process.env.NEXT_PUBLIC_FASTAPI_URL}/api/game/round_reset`, {
      method: "POST",
    });
    console.log("🔁 Broadcast reset envoyé");
  } catch (err) {
    console.error("Erreur lors du broadcast reset", err);
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