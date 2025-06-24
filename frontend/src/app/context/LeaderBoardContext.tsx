// context/LeaderboardContext.tsx
"use client"
import React, { createContext, useContext, useReducer, ReactNode, useEffect } from "react";

export type LeaderboardEntry = {
  username: string;
  result: number;
  last_evi: number
  last_photo: string;
  balance: number;
};

type State = {
  leaderboard: LeaderboardEntry[];
  round: number;
};

type Action =
  | { type: "SET_LEADERBOARD"; payload: LeaderboardEntry[] }
  | { type: "NEXT_ROUND" };

const LeaderboardContext = createContext<
  { state: State; dispatch: React.Dispatch<Action> } | undefined
>(undefined);

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_LEADERBOARD":
      return { ...state, leaderboard: action.payload };
    case "NEXT_ROUND":
      return { ...state, round: state.round + 1 };
    default:
      return state;
  }
}

export function LeaderboardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { leaderboard: [], round: 0 });

  // 🔁 Injection de données de test pour le développement UI
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_FASTAPI_URL}/api/user/to_results`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
  
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
  
        const data: LeaderboardEntry[] = await res.json();
        dispatch({ type: "SET_LEADERBOARD", payload: data });
      } catch (error) {
        console.error("❌ Failed to fetch leaderboard:", error);
      }
    };
  
    fetchLeaderboard();
  }, []);

  return (
    <LeaderboardContext.Provider value={{ state, dispatch }}>
      {children}
    </LeaderboardContext.Provider>
  );
}

export function useLeaderboard() {
  const context = useContext(LeaderboardContext);
  if (!context) throw new Error("useLeaderboard must be used within Provider");
  return context;
}
