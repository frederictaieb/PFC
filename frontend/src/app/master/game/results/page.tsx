"use client"

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from 'next/navigation';

const IPFS_GATEWAY = process.env.NEXT_PUBLIC_IPFS_URL;
const XRP_LOGO_URL = "/xrp-logo.svg";

type Player = {
  username: string;
  result: number;
  last_photo: string;
  last_thumbnail: string;
  balance: number;
  group?: string; // 👈 ajout du group
};

const ipfsToUrl = (cid: string) => `${IPFS_GATEWAY}${cid}`;

const getPlayerBorder = (player: Player) => {
  switch (player.group) {
    case 'winner':
      return "border-green-500 hover:border-green-600";
    case 'neutral':
      return "border-black hover:border-black";
    case 'loser':
      return "border-red-500 hover:border-red-600";
    default:
      return "border-gray-300";
  }
};

function PlayerCard({ player, onClick }: { player: Player; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg p-4 text-center border transition transform hover:scale-105 cursor-pointer ${getPlayerBorder(player)}`}
    >
      <h3 className="font-semibold text-lg mb-2 text-black">
        {player.username.charAt(0).toUpperCase() + player.username.slice(1)}
      </h3>
      <div className="relative">
        <img
          loading="lazy"
          src={ipfsToUrl(player.last_thumbnail)}
          alt={`photo de ${player.username}`}
          className="w-full h-32 object-cover rounded"
        />
      </div>
      <p className="font-medium text-black mt-1 flex items-center justify-center gap-1">
        {player.balance}
        <Image src={XRP_LOGO_URL} alt="XRP" width={16} height={16} />
      </p>
    </div>
  );
}

function PlayerModal({ player, onClose }: { player: Player; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-white/20 backdrop-blur-[1px] flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 rounded-lg max-w-lg w-full relative shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-black"
        >
          &times;
        </button>
        <h2 className="text-xl font-bold mb-4 text-center">
          {player.username.charAt(0).toUpperCase() + player.username.slice(1)}
        </h2>
        <img
          src={ipfsToUrl(player.last_photo)}
          alt={`photo de ${player.username}`}
          className="w-full h-auto object-contain rounded mb-4"
        />
        <p className="text-center text-lg font-semibold mt-2">💰 {player.balance}</p>
      </div>
    </div>
  );
}

function PlayerGrid({
  group,
  title,
  onSelect,
}: {
  group: Player[];
  title: string;
  onSelect: (p: Player) => void;
}) {
  return (
    <div className="mb-12">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="grid justify-center grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
          {group.map((player) => (
            <PlayerCard
              key={player.username}
              player={player}
              onClick={() => onSelect(player)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [winners, setWinners] = useState<Player[]>([]);
  const [neutrals, setNeutrals] = useState<Player[]>([]);
  const [losers, setLosers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_FASTAPI_URL}/api/userpool/leaderboard`);
        if (!res.ok) throw new Error("Failed to fetch leaderboard");
        const data = await res.json();

        // 👇 Ajout du tag group
        const winnersWithGroup = data.winners.map((p: Player) => ({ ...p, group: 'winner' }));
        const neutralsWithGroup = data.neutrals.map((p: Player) => ({ ...p, group: 'neutral' }));
        const losersWithGroup = data.losers.map((p: Player) => ({ ...p, group: 'loser' }));

        setWinners(winnersWithGroup);
        setNeutrals(neutralsWithGroup);
        setLosers(losersWithGroup);

        const activeCount = data.winners.length + data.neutrals.length;
        if (activeCount === 1) {
          alert("🏆 WINNER !");
        } else if (activeCount === 0) {
          alert("💀 PERDU !");
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, []);

  const handleClose = () => {
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
    <div className="min-h-screen bg-gray-50 p-4 relative">
      {selectedPlayer && (
        <PlayerModal player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />
      )}
      <PlayerGrid
        group={[...winners, ...neutrals]}
        title="🏆 Winners & 😐 Neutrals"
        onSelect={setSelectedPlayer}
      />
      <PlayerGrid group={losers} title="💀 Losers" onSelect={setSelectedPlayer} />
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        onClick={handleClose}
      >
        Close
      </button>
    </div>
  );
}
