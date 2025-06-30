'use client'

import { useReducer, useEffect, useCallback } from 'react'
import { startRound } from '@/lib/api/game/startRound'
import { IncrementRound } from '@/lib/api/game/incrementRound'
import { getRound } from '@/lib/api/game/getRound'
import { useRouter } from 'next/navigation'

// Types
interface Message {
  type: string
  value: string | number
}

interface State {
  message: Message | null
  showEmoji: boolean
  isPlaying: boolean
  hasPlayed: boolean
  roundNumber: number
}

type Action =
  | { type: 'SET_MESSAGE'; payload: Message }
  | { type: 'SHOW_EMOJI'; payload: boolean }
  | { type: 'SET_IS_PLAYING'; payload: boolean }
  | { type: 'SET_HAS_PLAYED'; payload: boolean }
  | { type: 'SET_ROUND_NUMBER'; payload: number }
  | { type: 'RESET' }

// Reducer
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_MESSAGE':
      return { ...state, message: action.payload }
    case 'SHOW_EMOJI':
      return { ...state, showEmoji: action.payload }
    case 'SET_IS_PLAYING':
      return { ...state, isPlaying: action.payload }
    case 'SET_HAS_PLAYED':
      return { ...state, hasPlayed: action.payload }
    case 'SET_ROUND_NUMBER':
      return { ...state, roundNumber: action.payload }
    case 'RESET':
      return { ...state, message: null, showEmoji: false, isPlaying: false, hasPlayed: false }
    default:
      return state
  }
}

export default function GamePage() {
  const router = useRouter()

  const [state, dispatch] = useReducer(reducer, {
    message: null,
    showEmoji: false,
    isPlaying: false,
    hasPlayed: false,
    roundNumber: 0
  })

  const { message, showEmoji, isPlaying, hasPlayed, roundNumber } = state

  const base64ToBlob = useCallback((base64: string, mime = "audio/wav") => {
    const byteChars = atob(base64)
    const byteNumbers = new Array(byteChars.length)
    for (let i = 0; i < byteChars.length; i++) {
      byteNumbers[i] = byteChars.charCodeAt(i)
    }
    return new Blob([new Uint8Array(byteNumbers)], { type: mime })
  }, [])

  useEffect(() => {
    const abortController = new AbortController()

    async function fetchRound() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_FASTAPI_URL}/api/game/round`, {
          signal: abortController.signal
        })
        if (!res.ok) throw new Error('Failed to fetch round')
        const data = await res.json()
        dispatch({ type: 'SET_ROUND_NUMBER', payload: data.round })
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') console.error(err)
      }
    }

    fetchRound()

    const socket = new WebSocket(`${process.env.NEXT_PUBLIC_FASTAPI_WS}/ws/master`)

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data)

      const playAudio = (base64: string) => {
        const blob = base64ToBlob(base64)
        const url = URL.createObjectURL(blob)
        const audio = new Audio(url)
        audio.play()
        audio.onended = () => URL.revokeObjectURL(url)
      }

      if (data.audio_base64) {
        playAudio(data.audio_base64)
      }

      if (data.type === 'announcement' || data.type === 'countdown') {
        dispatch({ type: 'SET_MESSAGE', payload: data })
        dispatch({ type: 'SHOW_EMOJI', payload: false })
      } else if (data.type === 'result') {
        dispatch({ type: 'SET_MESSAGE', payload: data })
        dispatch({ type: 'SHOW_EMOJI', payload: false })

        requestAnimationFrame(() => {
          dispatch({ type: 'SHOW_EMOJI', payload: true })
        })

        setTimeout(() => {
          dispatch({ type: 'SET_IS_PLAYING', payload: false })
        }, 3000)

        dispatch({ type: 'SET_HAS_PLAYED', payload: true })
      }
    }

    return () => {
      abortController.abort()
      socket.close()
    }
  }, [base64ToBlob])

  const handleStartRound = async () => {
    try {
      dispatch({ type: 'SET_IS_PLAYING', payload: true })
      dispatch({ type: 'SET_HAS_PLAYED', payload: false })

      await IncrementRound()
      const round = await getRound()
      if (typeof round === 'number') {
        dispatch({ type: 'SET_ROUND_NUMBER', payload: round })
      }

      await startRound()
    } catch (err) {
      console.error(err)
      dispatch({ type: 'SET_IS_PLAYING', payload: false })
    }
  }

  const handleLeaderboard = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_FASTAPI_URL}/api/userpool/collect_pool_xrp`)
      await fetch(`${process.env.NEXT_PUBLIC_FASTAPI_URL}/api/userpool/dispatch_pool_xrp`)
      router.push('/master/game/results')
    } catch (err) {
      console.error(err)
    }
  }

  const getEmoji = () => {
    if (message?.type === 'result') {
      switch (Number(message.value)) {
        case 0: return "🪨"
        case 1: return "🍃"
        case 2: return "✂️"
        default: return null
      }
    }
    return null
  }

  return (
    <div className="flex flex-col items-center pt-10">
      <h1 className="text-4xl font-bold">Round {roundNumber}</h1>

      <div className="h-64 w-64 flex items-center justify-center text-9xl font-bold border border-black rounded-xl">
        {message?.type === "result" && (
          <div
            className={`mb-4 transition-opacity duration-[3000ms] ease-in-out ${
              showEmoji ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {getEmoji()}
          </div>
        )}

        {message?.type === "countdown" && (
          <div id="countdown" className="text-9xl font-bold">
            {message.value}
          </div>
        )}
      </div>

      <button
        onClick={handleStartRound}
        disabled={isPlaying || hasPlayed}
        className="text-2xl mt-8 px-8 py-4 rounded-xl bg-blue-600 text-white font-bold shadow hover:bg-blue-700 transition-all disabled:opacity-50 w-64"
      >
        Start
      </button>

      <button
        onClick={handleLeaderboard}
        disabled={!hasPlayed}
        className="text-2xl mt-8 px-8 py-4 rounded-xl bg-green-600 text-white font-bold shadow hover:bg-green-700 transition-all disabled:opacity-50 w-64"
      >
        Scores
      </button>
    </div>
  )
}
