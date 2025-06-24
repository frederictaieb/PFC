// src/app/layout.tsx
import "@/app/globals.css"
import { LeaderboardProvider } from "@/app/context/LeaderBoardContext"

export const metadata = {
  title: "Leaderboard",
  description: "Trombinoscope temps réel",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="results-layout">
      <LeaderboardProvider>
        {children}
      </LeaderboardProvider>
    </div>
  )
}
