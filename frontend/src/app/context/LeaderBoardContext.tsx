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
    const fakeData: LeaderboardEntry[] = [
      {
        username: "Alice",
        result: 1,
        last_evi: 0.0,
        last_photo: "bafybeibfaakepic1",
        balance: 300,
      },
      {
        username: "Bob",
        result: 1,
        last_evi: 0.33,
        last_photo: "bafybeibfaakepic2",
        balance: 300,
      },
      {
        username: "Charlie",
        result: 0,
        last_evi: 0.66,
        last_photo: "bafybeibfaakepic3",
        balance: 420,
      },
      {
        username: "Dora",
        result: -1,
        last_evi: 0.33,
        last_photo: "bafybeibfaakepic4",
        balance: 0,
      },
      {
        username: "Eve",
        result: -1,
        last_evi: 0.0,
        last_photo: "bafybeibfaakepic5",
        balance: 10,
      },
      {
        username: "Frank",
        result: 0,
        last_evi: 0.0,
        last_photo: "bafybeibfaakepic6",
        balance: 100,
      },
      {
        username: "Gina",
        result: 0,
        last_evi: 0.66,
        last_photo: "bafybeibfaakepic7",
        balance: 5,
      },
    ];
    dispatch({ type: "SET_LEADERBOARD", payload: fakeData });
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
