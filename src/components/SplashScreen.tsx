'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface SplashScreenProps {
    onFinish?: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        // L'animazione dura 2.5 secondi poi svanisce
        const timer = setTimeout(() => {
            setVisible(false);
            if (onFinish) onFinish();
        }, 2500);

        return () => clearTimeout(timer);
    }, [onFinish]);

    if (!visible) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-green-800 to-green-600 text-white animate-fade-out pointer-events-none">

            {/* Animazione del contenuto: Scoppio dal centro + Opacità */}
            <div className="flex flex-col items-center animate-scale-up">

                {/* Cerchio Pulsante (Effetto Radar/Sentinella) */}
                <div className="relative flex items-center justify-center w-32 h-32 mb-6">

                    {/* Cerchi dietro (Effetto Eco) */}
                    <div className="absolute inset-0 rounded-full border-2 border-green-400/30 animate-ping"></div>
                    <div className="absolute inset-2 rounded-full border-2 border-green-300/40 animate-ping" style={{ animationDelay: '0.5s' }}></div>

                    {/* Scudo Centrale o Logo */}
                    <div className="relative w-24 h-24 bg-white rounded-full p-2 shadow-2xl flex items-center justify-center z-10">
                        <div className="relative w-full h-full">
                            <Image
                                src="/logo-cfv.png"
                                alt="Logo CFVA"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>
                    </div>
                </div>

                {/* Testo Digitale */}
                <h1 className="text-3xl font-bold tracking-widest uppercase drop-shadow-lg text-center">
                    CFVA
                </h1>
                <p className="text-green-100 text-sm tracking-[0.2em] mt-2 opacity-0 animate-fade-in-delay text-center">
                    FUOCO PRESCRITTO
                </p>

                {/* Loader Lineare Sottile */}
                <div className="w-48 h-1 bg-green-900/30 rounded-full mt-8 overflow-hidden">
                    <div className="h-full bg-white w-1/2 animate-pulse"></div>
                </div>

            </div>
        </div>
    );
}
