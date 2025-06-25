'use client';

import { useState } from 'react';

export default function HumeTTSPage() {
  const [text, setText] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const speak = async () => {
    setLoading(true);
    const res = await fetch('/api/hume-tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    setAudioUrl(url);
    setLoading(false);
  };

  return (
    <div className="p-6 flex flex-col items-center space-y-4">
      <h1 className="text-2xl font-bold">Hume.ai - Text to Speech</h1>
      <textarea
        className="border p-2 w-full max-w-lg rounded"
        rows={4}
        placeholder="Entrez un texte en français..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button
        onClick={speak}
        disabled={loading}
        className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
      >
        {loading ? 'Génération...' : 'Parler'}
      </button>

      {audioUrl && <audio controls autoPlay src={audioUrl} className="mt-4" />}
    </div>
  );
}
