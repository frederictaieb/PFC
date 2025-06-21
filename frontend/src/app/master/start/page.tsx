"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import Link from "next/link";   
import Image from "next/image";

export default function RegisterPage() {
  return (
    <div className="flex flex-col items-center pt-10">
      <h1 className="text-8xl font-bold text-gray-800 pt-4">AIcebreaker</h1>
      <div className="pt-16"><Image src="/xrp-logo.svg" alt="AIcebreaker" width={100} height={100} /></div>
      <div className="pt-16"><QRCodeSVG value={`${process.env.NEXT_PUBLIC_FASTAPI_URL}/master/register`} size={256} /></div>
      <div className="pt-4 text-center">Scan the QR code to <Link href={`${process.env.NEXT_PUBLIC_FASTAPI_URL}/master/register`}>
      <div className="underline font-bold text-blue-700">register</div></Link></div>
    </div>
  );
}
