'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

export default function Home() {
    const [registering, setRegistering] = useState(false);
    const [code, setCode] = useState(["", "", "", ""]);
    const [isCorrect, setIsCorrect] = useState(false);
    const router = useRouter();

    const inputRefs = useRef<HTMLInputElement[]>([]);

    useEffect(() => {
        const inputCode = code.join('');
        const correctPin = process.env.NEXT_PUBLIC_PIN_CODE;
        setIsCorrect(inputCode === correctPin);
    }, [code]);

    const handleChange = (index: number, value: string) => {
        if (!/^\d?$/.test(value)) return; // autorise seulement un chiffre ou vide

        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);

        if (value && index < 3) {
            inputRefs.current[index + 1]?.focus(); // passe au champ suivant
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Backspace' && code[index] === '' && index > 0) {
            inputRefs.current[index - 1]?.focus(); // revient au champ précédent
        }
    };

    const handleStart = async () => {
        setRegistering(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_FASTAPI_URL}/api/master/register_master`);
            const data = await res.json();
            console.log(data);
            router.push('/master/start');
        } catch (err) {
            console.error("Erreur lors de la création du master :", err);
        }
    };

    return (
        <div className="flex flex-col items-center pt-10 space-y-6">
            <div className="flex space-x-4">
                {code.map((digit, index) => (
                    <input
                        key={index}
                        type="password"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        ref={(el) => {
                            if (el) inputRefs.current[index] = el;
                        }}
                        className="w-12 h-12 text-center text-2xl border rounded"
                    />
                ))}
            </div>
            <button
                onClick={handleStart}
                disabled={!isCorrect || registering}
                className="text-2xl px-8 py-4 rounded-xl bg-blue-600 text-white font-bold shadow hover:bg-blue-700 transition-all disabled:opacity-50 w-64"
            >
                {registering ? 'Registering...' : 'Enter'}
            </button>
        </div>
    );
}