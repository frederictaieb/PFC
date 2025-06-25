import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { text } = await req.json();

  const res = await fetch('https://api.hume.ai/v0/voice/stream', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.HUME_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      voice: 'id:fr-FR-Standard-A', // voix française
      prosody: {
        pitch: 1.0,
        energy: 1.0,
        speed: 1.0
      },
      model: "base", // ou "expressive"
    }),
  });

  const buffer = await res.arrayBuffer();

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'audio/mpeg',
    },
  });
}
