
"use client";

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Loader2, Plus, FileText } from 'lucide-react';
import { useState } from 'react';

const MapEditor = dynamic(() => import('@/components/MapEditor'), {
    loading: () => <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-[var(--primary)]" size={32} /></div>,
    ssr: false
});

export default function MapPage() {
    const [showForm, setShowForm] = useState(false);

    return (
        <div className="flex flex-col min-h-screen pt-0 pb-20 bg-[var(--background)]">
            {/* Map Section - Takes most of the screen */}
            <div className="flex-1 min-h-[50vh]">
                <MapEditor />
            </div>

            {/* Quick Action Button */}
            <div className="px-4 py-4 bg-gradient-to-t from-[var(--background)] to-transparent">
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-[var(--primary)] to-green-600 text-white rounded-xl font-bold shadow-lg hover:brightness-110 active:scale-[0.98] transition-all"
                >
                    <Plus size={20} />
                    {showForm ? 'Chiudi Form' : 'Nuova Segnalazione'}
                </button>
            </div>

            {/* Collapsible Form Section */}
            {showForm && (
                <div className="px-4 pb-6 animate-in slide-in-from-bottom-4 duration-300">
                    <div className="glass-card p-5 space-y-4">
                        <div className="flex items-center gap-2 text-[var(--primary)] border-b border-black/5 pb-3">
                            <FileText size={20} />
                            <h3 className="font-bold">Inserisci Segnalazione Rapida</h3>
                        </div>

                        <p className="text-sm text-gray-600">
                            Per una segnalazione completa con analisi AI, dati meteo e gestione personale, usa il modulo dedicato.
                        </p>

                        <Link
                            href="/report"
                            className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
                        >
                            <FileText size={18} />
                            Apri Modulo Completo
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
