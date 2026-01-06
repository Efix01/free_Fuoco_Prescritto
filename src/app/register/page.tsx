
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function RegisterPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Stati per i campi
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        nome: '',
        cognome: '',
        grado: 'Superv. Gauf' // Valore di default
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { email, password, nome, cognome, grado } = formData;

        // Sanitize email: remove ALL spaces, lowercase
        const cleanEmail = email.replace(/\s+/g, '').toLowerCase();

        // Frontend Regex Validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(cleanEmail)) {
            alert(`L'email "${cleanEmail}" non sembra valida. Controlla che non ci siano spazi o caratteri strani.`);
            setLoading(false);
            return;
        }

        try {
            // 1. Registrazione su Supabase con Metadati extra
            const { data, error } = await supabase.auth.signUp({
                email: cleanEmail,
                password,
                options: {
                    emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/` : undefined,
                    data: {
                        first_name: nome,
                        last_name: cognome,
                        rank: grado
                    }
                }
            });

            if (error) {
                console.error("Supabase Error:", error);
                if (error.message.includes("already registered") || error.message.includes("unique constraint")) {
                    alert("Questa email è già registrata! Prova ad accedere o recuperare la password.");
                } else {
                    alert(`Errore Tecnico [${error.status || 'Unknown'}]: ${error.message}`);
                }
                return;
            }

            alert("Registrazione effettuata! Controlla la tua email per confermare l'account.");
            router.push('/login'); // Rimanda al login

        } catch (error: any) {
            console.error(error);
            alert(`Errore Imprevisto: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 animate-in fade-in zoom-in duration-500">

                {/* Header Logo */}
                <div className="text-center mb-6">
                    <div className="relative w-16 h-16 mx-auto mb-2 bg-green-50 rounded-full p-1 border border-green-100">
                        <Image
                            src="/logo-cfv.png"
                            alt="Logo CFVA"
                            fill
                            className="object-contain"
                        />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800">Registrazione Personale</h1>
                    <p className="text-xs text-gray-500">Corpo Forestale e di V.A. Sardegna</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">

                    {/* Dati Anagrafici */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-600 uppercase">Nome</label>
                            <input
                                type="text" name="nome" required onChange={handleChange}
                                className="w-full border-b-2 border-gray-200 p-2 focus:border-green-600 outline-none"
                                placeholder="Mario"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-600 uppercase">Cognome</label>
                            <input
                                type="text" name="cognome" required onChange={handleChange}
                                className="w-full border-b-2 border-gray-200 p-2 focus:border-green-600 outline-none"
                                placeholder="Rossi"
                            />
                        </div>
                    </div>

                    {/* Grado */}
                    <div>
                        <label className="text-xs font-bold text-gray-600 uppercase">Grado / Ruolo</label>
                        <select
                            name="grado" onChange={handleChange}
                            className="w-full border-b-2 border-gray-200 p-2 bg-white focus:border-green-600 outline-none"
                        >
                            <option value="Superv. Gauf">Superv. Gauf</option>
                            <option value="Dirett. Operaz.">Dirett. Operaz.</option>
                            <option value="Agente">Agente</option>
                            <option value="Assist.C.">Assist.C.</option>
                            <option value="Ispettore">Ispettore</option>
                            <option value="Ispettore S.">Ispettore S.</option>
                            <option value="Ufficiale">Ufficiale</option>
                        </select>
                    </div>

                    <div className="border-t my-4"></div>

                    {/* Dati Accesso */}
                    <div>
                        <label className="text-xs font-bold text-gray-600 uppercase">Email Istituzionale</label>
                        <input
                            type="email" name="email" required onChange={handleChange}
                            className="w-full border-b-2 border-gray-200 p-2 focus:border-green-600 outline-none"
                            placeholder="mario.rossi@forestas.it"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-600 uppercase">Password</label>
                        <input
                            type="password" name="password" required onChange={handleChange}
                            className="w-full border-b-2 border-gray-200 p-2 focus:border-green-600 outline-none"
                            placeholder="••••••••"
                            minLength={6}
                        />
                    </div>

                    <button
                        disabled={loading}
                        className="w-full bg-green-800 text-white font-bold py-3 rounded-lg mt-6 shadow-lg hover:bg-green-700 transition-all active:scale-95"
                    >
                        {loading ? 'Creazione Account...' : 'REGISTRATI ORA'}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm">
                    <span className="text-gray-600">Hai già un account? </span>
                    <Link href="/login" className="text-green-700 font-bold hover:underline">Accedi</Link>
                </div>
            </div>
        </div>
    );
}
