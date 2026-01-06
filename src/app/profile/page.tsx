
"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { db } from '@/lib/db';
import { User, LogOut, FileText, Calendar, MapPin, Loader2, Map } from 'lucide-react';
import Link from 'next/link';

// Define the type for the Burn record
interface BurnRecord {
    id: string;
    name: string;
    location_name: string;
    status: string;
    created_at: string;
    fuel_model: string;
    synced?: boolean;
}

export default function ProfilePage() {
    const [user, setUser] = useState<any>(null);
    const [burns, setBurns] = useState<BurnRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);

            // 1. Check Session
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user || null);

            if (session?.user) {
                // 2. Fetch Burns if logged in
                let remoteBurns: any[] = [];
                let localBurns: any[] = [];

                // Fetch Remote
                const { data, error } = await supabase
                    .from('burns')
                    .select('*')
                    .eq('user_id', session.user.id)
                    .order('created_at', { ascending: false });

                if (!error && data) {
                    remoteBurns = data.map(b => ({ ...b, synced: true }));
                } else {
                    console.error("Errore fetch burns:", error);
                }

                // Fetch Local (Unsynced)
                try {
                    // Get all unsynced items
                    // Note: Dexie might return different shape, we rely on BurnRecord interface compatibility
                    const localItems = await db.burns.where('synced').equals(0).toArray();
                    // Filter items that might be from this user (if we stored user_id locally) or just all unsynced if single user device?
                    // Let's filter by user_id if present, or just show all unsynced (assuming personal device)
                    localBurns = localItems.map(b => ({
                        ...b,
                        location_name: b.location || 'Posizione sconosciuta', // Map local 'location' to 'location_name'
                        status: b.status || 'planning',
                        fuel_model: b.fuel_model || 'N/D'
                    }));
                } catch (e) {
                    console.error("Errore Dexie:", e);
                }

                // Merge: Local first (unsynced needs attention), then Remote
                setBurns([...localBurns, ...remoteBurns]);

            }
            setLoading(false);
        };

        fetchData();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = '/login';
    };

    // Sync Helper
    const handleSync = async () => {
        // Logic similar to auto-sync, simplified trigger
        window.location.reload(); // Simple reload triggers the auto-sync in ReportPage/Root if placed there, 
        // OR we can explicit sync here. For now simpler reload to trigger 'online' check globally or just let user know.
        // Let's keeping it visual only for now as requested.
        alert("Assicurati di essere online. La sincronizzazione partirà automaticamente.");
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="animate-spin text-[var(--primary)]" size={32} />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
                <div className="p-4 glass rounded-full mb-4 text-[var(--primary)]">
                    <User size={32} />
                </div>
                <h1 className="text-xl font-bold mb-2">Accesso Richiesto</h1>
                <p className="opacity-70 mb-6 max-w-xs">Effettua il login per visualizzare il tuo profilo e lo storico delle operazioni.</p>
                <Link href="/login" className="px-6 py-3 bg-[var(--primary)] text-white rounded-lg font-bold shadow-lg hover:brightness-110">
                    Vai al Login
                </Link>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-start pt-20 pb-24 px-4 bg-[var(--background)]">

            {/* User Header */}
            <div className="w-full max-w-lg flex flex-col items-center mb-8">
                <div className="w-20 h-20 glass rounded-full flex items-center justify-center text-[var(--primary)] mb-4 border border-[var(--glass-border)]">
                    <User size={40} />
                </div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]">
                    {user.email}
                </h1>
                <p className="opacity-60 text-xs">Operatore Abilitato</p>
            </div>

            <div className="w-full max-w-lg space-y-6">

                {/* Fast Links */}
                <a href="/index.html" className="glass-card flex items-center gap-4 py-4 px-5 hover:bg-white/40 transition-colors group">
                    <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <FileText size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-[var(--foreground)]">Checklist Operative</h3>
                        <p className="text-xs opacity-60">Accedi ai moduli e strumenti di campo</p>
                    </div>
                </a>

                <Link href="/map" className="glass-card flex items-center gap-4 py-4 px-5 hover:bg-white/40 transition-colors group">
                    <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Map size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-[var(--foreground)]">Cartografia</h3>
                        <p className="text-xs opacity-60">Mappa operativa e pianificazione</p>
                    </div>
                </Link>

                <Link href="/report" className="glass-card flex items-center gap-4 py-4 px-5 hover:bg-white/40 transition-colors group">
                    <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <FileText size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-[var(--foreground)]">Segnalazione</h3>
                        <p className="text-xs opacity-60">Inserisci nuova operazione</p>
                    </div>
                </Link>

                {/* Stats */}
                <div className="glass-card flex justify-between items-center py-4">
                    <div>
                        <h3 className="font-semibold text-sm">Registro Attività</h3>
                        <p className="text-[10px] opacity-60 uppercase tracking-widest">Totale Operazioni</p>
                    </div>
                    <div className="text-3xl font-bold text-[var(--primary)]">{burns.length}</div>
                </div>

                {/* Activity List */}
                <div>
                    <div className="flex justify-between items-center mb-3 ml-1">
                        <h3 className="text-sm font-semibold opacity-80">Ultimi Rapporti</h3>
                        {burns.some(b => !b.synced) && (
                            <button onClick={handleSync} className="text-[10px] text-[var(--primary)] font-bold bg-[var(--primary)]/10 px-2 py-1 rounded">
                                SINCRONIZZA
                            </button>
                        )}
                    </div>

                    {burns.length === 0 ? (
                        <div className="text-center py-10 opacity-50 border-2 border-dashed border-gray-300 rounded-xl">
                            <p>Nessun rapporto salvato.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {burns.map((burn) => (
                                <div key={burn.id} className={`glass card p-4 rounded-xl flex flex-col gap-2 transition-colors ${!burn.synced ? 'border-l-4 border-l-yellow-500 bg-yellow-50/50' : 'hover:bg-white/40'}`}>
                                    <div className="flex justify-between items-start">
                                        <div className="flex flex-col">
                                            <h4 className="font-bold text-[var(--foreground)]">{burn.name}</h4>
                                            {!burn.synced && <span className="text-[9px] text-yellow-600 font-bold tracking-wider">DA INVIARE</span>}
                                        </div>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${burn.status === 'planning' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                            }`}>
                                            {burn.status.toUpperCase()}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-4 text-xs opacity-70">
                                        <div className="flex items-center gap-1">
                                            <MapPin size={12} />
                                            <span>{burn.location_name}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Calendar size={12} />
                                            <span>{new Date(burn.created_at).toLocaleDateString('it-IT')}</span>
                                        </div>
                                    </div>
                                    <div className="text-xs opacity-60">
                                        Modello: {burn.fuel_model}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <button
                    onClick={handleLogout}
                    className="w-full mt-4 flex items-center justify-center gap-2 py-3 text-red-600/80 text-sm font-medium hover:bg-red-50/50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                >
                    <LogOut size={16} />
                    Esci
                </button>

            </div>
        </div>
    );
}
