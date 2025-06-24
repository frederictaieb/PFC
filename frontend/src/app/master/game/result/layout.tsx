// src/app/layout.tsx
import "@/app/globals.css"
import { LeaderboardProvider } from "@/app/context/LeaderBoardContext"

export const metadata = {
  title: "Leaderboard",
  description: "Trombinoscope temps réel",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <LeaderboardProvider>
          {children}
        </LeaderboardProvider>
      </body>
    </html>
  )
}
