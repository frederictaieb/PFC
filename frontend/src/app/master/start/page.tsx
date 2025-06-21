"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import Link from "next/link";   
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function StartPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState<number | string | null>(null)

  const handleStart = async () => {
    try {

      const response = await fetch("https://pfc.frederictaieb.com/api/game/start", {
        method: "POST",
      })

      // 1. Appel API
      if (!response.ok) throw new Error('Erreur lors du démarrage du jeu')
      console.log(response);

      // 2. Décompte
      const steps = [3, 2, 1, 'GO']
      for (let i = 0; i < steps.length; i++) {
        setCountdown(steps[i])
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      // 3. Redirection
      router.push('/game')
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="flex flex-col items-center pt-10">
      <h1 className="text-6xl md:text-8xl font-bold text-gray-800 pt-4">AIcebreaker</h1>
      <div className="pt-8"><Image src="/xrp-logo.svg" alt="AIcebreaker" width={100} height={100} /></div>
      <div className="pt-8"><QRCodeSVG value={`${process.env.NEXT_PUBLIC_FASTAPI_URL}/master/register`} size={256} /></div>
      <div className="pt-4 text-center">Scan the QR code to <Link href={`${process.env.NEXT_PUBLIC_FASTAPI_URL}/master/register`}>
      <div className="underline font-bold text-blue-700">register</div></Link></div>
      <button
          onClick={handleStart}
          disabled={loading}
          className={`text-2xl mt-8 px-8 py-4 rounded-xl ${countdown !== null  ? "bg-red-600" : "bg-blue-600"} text-white font-bold shadow hover:bg-blue-700 transition-all disabled:opacity-50 w-64`}
        >
        {countdown !== null ? countdown : "Start"}
        </button>
    </div>
  );
}
