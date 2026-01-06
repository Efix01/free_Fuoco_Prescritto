'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { db } from '@/lib/db';
import { ArrowLeft, FileText, Calendar, MapPin, Loader2, Trash2, Eye } from 'lucide-react';
import Link from 'next/link';

interface BurnRecord {
    id: string;
    name: string;
    location_name?: string;
    location?: string;
    status: string;
    created_at: string;
    fuel_model?: string;
    synced?: boolean;
    ai_report?: string;
    weather_data?: any;
}

export default function RegistroPage() {
    const [burns, setBurns] = useState<BurnRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState<BurnRecord | null>(null);

    useEffect(() => {
        fetchBurns();
    }, []);

    const fetchBurns = async () => {
        setLoading(true);

        try {
            let allBurns: BurnRecord[] = [];

            // 1. Fetch from Supabase (online)
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                const { data, error } = await supabase
                    .from('burns')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (!error && data) {
                    allBurns = data.map(b => ({
                        ...b,
                        synced: true,
                        location_name: b.location_name || 'Posizione sconosciuta'
                    }));
                }
            }

            // 2. Fetch from local DB (Dexie)
            const localBurns = await db.burns.toArray();
            const unsyncedBurns = localBurns
                .filter(b => !b.synced)
                .map(b => ({
                    ...b,
                    id: b.id!,
                    location_name: b.location || 'Posizione sconosciuta',
                    created_at: b.created_at,
                    status: b.status || 'planning',
                    fuel_model: b.fuel_model || 'N/D',
                    synced: false
                }));

            // Merge: unsynced first, then synced
            setBurns([...unsyncedBurns, ...allBurns]);

        } catch (error) {
            console.error('Errore caricamento rapporti:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, isSynced: boolean) => {
        if (!confirm('Vuoi eliminare questo rapporto?')) return;

        try {
            if (isSynced) {
                // Delete from Supabase
                const { error } = await supabase
                    .from('burns')
                    .delete()
                    .eq('id', id);

                if (error) throw error;
            } else {
                // Delete from local DB
                await db.burns.delete(id);
            }

            // Refresh list
            fetchBurns();
        } catch (error) {
            console.error('Errore eliminazione:', error);
            alert('Errore durante l\'eliminazione');
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
                <Loader2 className="animate-spin text-green-700" size={32} />
            </div>
        );
    }

    // Detail View
    if (selectedReport) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 pb-24">
                <header className="bg-green-800 text-white p-4 sticky top-0 z-40 shadow-lg">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSelectedReport(null)}
                            className="p-2 hover:bg-green-700 rounded-full transition-colors"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold">{selectedReport.name}</h1>
                            <p className="text-green-200 text-sm">Dettagli Operazione</p>
                        </div>
                    </div>
                </header>

                <div className="p-4 space-y-4">
                    {/* Info Card */}
                    <div className="bg-white rounded-xl p-4 shadow-md">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-gray-500 text-xs">Località</p>
                                <p className="font-semibold">{selectedReport.location_name}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 text-xs">Stato</p>
                                <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${selectedReport.status === 'planning'
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-green-100 text-green-800'
                                    }`}>
                                    {selectedReport.status.toUpperCase()}
                                </span>
                            </div>
                            <div>
                                <p className="text-gray-500 text-xs">Data</p>
                                <p className="font-semibold">
                                    {new Date(selectedReport.created_at).toLocaleDateString('it-IT')}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-500 text-xs">Combustibile</p>
                                <p className="font-semibold">{selectedReport.fuel_model || 'N/D'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Weather Data */}
                    {selectedReport.weather_data && (
                        <div className="bg-white rounded-xl p-4 shadow-md">
                            <h3 className="font-bold mb-3">Dati Meteo</h3>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <p className="text-gray-500 text-xs">Temperatura</p>
                                    <p className="font-semibold">{selectedReport.weather_data.temp}°C</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 text-xs">Umidità</p>
                                    <p className="font-semibold">{selectedReport.weather_data.humidity}%</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 text-xs">Vento</p>
                                    <p className="font-semibold">{selectedReport.weather_data.wind} km/h</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 text-xs">Pendenza</p>
                                    <p className="font-semibold">{selectedReport.weather_data.slope}%</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* AI Report */}
                    {selectedReport.ai_report && (
                        <div className="bg-white rounded-xl p-4 shadow-md">
                            <h3 className="font-bold mb-3 text-green-700">Analisi AI</h3>
                            <div className="text-sm whitespace-pre-wrap text-gray-700">
                                {selectedReport.ai_report}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // List View
    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 pb-24">
            <header className="bg-green-800 text-white p-4 sticky top-0 z-40 shadow-lg">
                <div className="flex items-center gap-3">
                    <Link href="/report" className="p-2 hover:bg-green-700 rounded-full transition-colors">
                        <ArrowLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold">Registro Operazioni</h1>
                        <p className="text-green-200 text-sm">{burns.length} rapporti totali</p>
                    </div>
                </div>
            </header>

            <div className="p-4">
                {burns.length === 0 ? (
                    <div className="bg-white rounded-xl p-8 text-center shadow-md">
                        <FileText size={48} className="mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500">Nessun rapporto salvato</p>
                        <Link
                            href="/report"
                            className="mt-4 inline-block px-6 py-2 bg-green-700 text-white rounded-lg font-semibold"
                        >
                            Crea Nuovo Rapporto
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {burns.map((burn) => (
                            <div
                                key={burn.id}
                                className={`bg-white rounded-xl p-4 shadow-md ${!burn.synced ? 'border-l-4 border-yellow-500' : ''
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-bold text-gray-800">{burn.name}</h3>
                                        {!burn.synced && (
                                            <span className="text-xs text-yellow-600 font-bold">
                                                DA SINCRONIZZARE
                                            </span>
                                        )}
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-1 rounded ${burn.status === 'planning'
                                            ? 'bg-blue-100 text-blue-800'
                                            : 'bg-green-100 text-green-800'
                                        }`}>
                                        {burn.status.toUpperCase()}
                                    </span>
                                </div>

                                <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                                    <div className="flex items-center gap-1">
                                        <MapPin size={12} />
                                        <span>{burn.location_name}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Calendar size={12} />
                                        <span>{new Date(burn.created_at).toLocaleDateString('it-IT')}</span>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setSelectedReport(burn)}
                                        className="flex-1 bg-green-700 text-white py-2 rounded-lg text-sm font-semibold hover:bg-green-800 flex items-center justify-center gap-2"
                                    >
                                        <Eye size={16} />
                                        Visualizza
                                    </button>
                                    <button
                                        onClick={() => handleDelete(burn.id, burn.synced || false)}
                                        className="bg-red-100 text-red-600 px-4 rounded-lg hover:bg-red-200 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
