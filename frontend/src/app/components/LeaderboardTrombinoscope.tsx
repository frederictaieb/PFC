"use client"

import { useState } from "react";
import { useLeaderboard, LeaderboardEntry } from "@/app/context/LeaderBoardContext";

const IPFS_GATEWAY = process.env.NEXT_PUBLIC_IPFS_URL;

const ipfsToUrl = (cid: string) => `${IPFS_GATEWAY}${cid}`;

const XRP_LOGO_URL = "/xrp-logo.svg";

const getPlayerBorder = (result: number): string => {
  switch (result) {
    case 1:
      return "border-green-500 hover:border-green-600";
    case 0:
      return "border-black hover:border-black";
    case -1:
      return "border-red-500 hover:border-red-600";
    default:
      return "border-gray-300";
  }
};

function PlayerCard({ player, onClick }: { player: LeaderboardEntry; onClick: () => void }) {
  const [showAlt, setShowAlt] = useState(false);

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg p-4 text-center border transition transform hover:scale-105 cursor-pointer ${getPlayerBorder(player.result)}`}
      onMouseEnter={() => setShowAlt(true)}
      onMouseLeave={() => setShowAlt(false)}
    >
      <h3 className="font-semibold text-lg mb-2 text-black">{player.username.charAt(0).toUpperCase() + player.username.slice(1)}</h3>
      <div className="relative">
        <img
          src={ipfsToUrl(player.last_photo)}
          alt={`photo de ${player.username}`}
          className="w-full h-32 object-cover rounded"
        />
      </div>
      <p className="font-medium text-black mt-1 flex items-center justify-center gap-1">
        {player.balance}
        <img src={XRP_LOGO_URL} alt="XRP" className="w-4 h-4" />
      </p>
    </div>
  );
}

function PlayerModal({ player, onClose }: { player: LeaderboardEntry; onClose: () => void }) {
  return (
    <div
      className="absolute inset-0 bg-white/20 backdrop-blur-[1px] flex items-center justify-center z-50 transition-opacity duration-500 animate-fade-in"
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
        <h2 className="text-xl font-bold mb-4 text-center">{player.username.charAt(0).toUpperCase() + player.username.slice(1)}</h2>
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

function PlayerGrid({ group, title, onSelect }: {
  group: LeaderboardEntry[];
  title: string;
  onSelect: (p: LeaderboardEntry) => void;
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

export default function LeaderboardTrombinoscope() {
  const { state } = useLeaderboard();
  const [selectedPlayer, setSelectedPlayer] = useState<LeaderboardEntry | null>(null);

  const upper = state.leaderboard.filter((p) => p.result >= 0).sort((a, b) => {
    if (a.result !== b.result) return b.result - a.result;
    return b.balance - a.balance;
  });
  const losers = state.leaderboard.filter((p) => p.result < 0).sort((a, b) => b.balance - a.balance);

  return (
    <div className="relative p-4">
      {selectedPlayer && (
        <PlayerModal player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />
      )}
      <PlayerGrid group={upper} title="🏆 Winners & Neutrals" onSelect={setSelectedPlayer} />
      <PlayerGrid group={losers} title="🪀 Losers" onSelect={setSelectedPlayer} />
    </div>
  );
}
