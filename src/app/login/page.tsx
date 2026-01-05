
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

import SplashScreen from '@/components/SplashScreen';

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [splashFinished, setSplashFinished] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Sanitize Input (Crucial fix for mobile keyboards)
        const cleanEmail = email.trim().toLowerCase();

        try {
            // Login con Supabase
            const { data, error } = await supabase.auth.signInWithPassword({
                email: cleanEmail,
                password,
            });

            if (error) throw error;

            // Se successo, vai alla Home
            router.push('/');

        } catch (error: any) {
            alert("Errore di accesso: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">

            {/* --- SPLASH SCREEN --- */}
            {!splashFinished && <SplashScreen onFinish={() => setSplashFinished(true)} />}

            {/* --- PAGINA LOGIN (Appare dopo lo splash) --- */}
            <div className={`transition-opacity duration-1000 w-full max-w-sm ${splashFinished ? 'opacity-100' : 'opacity-0'}`}>
                <div className="bg-white rounded-2xl shadow-xl w-full p-8 text-center animate-in fade-in zoom-in duration-500">

                    {/* Header Logo */}
                    <div className="relative w-24 h-24 mx-auto mb-4 bg-green-50 rounded-full p-2 border-2 border-green-100">
                        <Image
                            src="/logo-cfv.png"
                            alt="Logo CFVA"
                            fill
                            className="object-contain"
                        />
                    </div>

                    <h1 className="text-2xl font-bold text-gray-800 mb-1">CFVA Accesso</h1>
                    <p className="text-xs text-gray-500 mb-6">Sistema Operativo Fuoco Prescritto</p>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="text-left">
                            <label className="text-xs font-bold text-gray-600 uppercase">Email</label>
                            <input
                                type="email"
                                value={email} onChange={(e) => setEmail(e.target.value)}
                                className="w-full border-b-2 border-gray-200 p-2 focus:border-green-600 outline-none transition-colors"
                                placeholder="nome.cognome@forestas.it"
                                required
                            />
                        </div>

                        <div className="text-left">
                            <label className="text-xs font-bold text-gray-600 uppercase">Password</label>
                            <input
                                type="password"
                                value={password} onChange={(e) => setPassword(e.target.value)}
                                className="w-full border-b-2 border-gray-200 p-2 focus:border-green-600 outline-none transition-colors"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button
                            disabled={loading}
                            className="w-full bg-green-800 text-white font-bold py-3 rounded-lg shadow-lg hover:bg-green-700 transition-all active:scale-95 flex justify-center items-center gap-2"
                        >
                            {loading ? 'Accesso...' : 'ENTRA'}
                        </button>
                    </form>

                    <div className="mt-8 text-sm">
                        <p className="text-gray-600">Non hai un account?</p>
                        <a href="/register" className="text-green-700 font-bold hover:underline">Richiedi Registrazione</a>
                    </div>

                    <p className="mt-6 text-[10px] text-gray-400">
                        Accesso riservato al personale autorizzato.
                    </p>
                </div>
            </div>
        </div>
    );
}
