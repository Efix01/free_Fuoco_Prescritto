
"use client";

import { useState, useEffect, useRef } from 'react';
import { ClipboardList, Loader2, Sparkles, Send, MapPin, Save, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import Link from 'next/link';
import SafetyModule from '@/components/SafetyModule';
import PersonnelManager, { PersonnelData } from '@/components/PersonnelManager';
import dynamic from 'next/dynamic';

const MapEditor = dynamic(() => import('@/components/MapEditor'), {
    loading: () => <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-[var(--primary)]" size={32} /></div>,
    ssr: false
});

export default function ReportPage() {
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        fuelModel: '',
        temp: '',
        humidity: '',
        wind: '',
        slope: '',
        fuelMoisture: '',
        aspect: ''
    });

    const [isLoading, setIsLoading] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [report, setReport] = useState<string | null>(null);
    const [workLog, setWorkLog] = useState<PersonnelData>({ details: {}, total: 0 });

    const handleGeolocation = () => {
        if (!navigator.geolocation) {
            alert("Geolocalizzazione non supportata dal tuo browser.");
            return;
        }

        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            // Update location with coords temporarily
            setFormData(prev => ({ ...prev, location: `${lat.toFixed(4)}, ${lon.toFixed(4)}` }));

            try {
                const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m`);
                const data = await res.json();

                if (data.current) {
                    setFormData(prev => ({
                        ...prev,
                        temp: data.current.temperature_2m.toString(),
                        humidity: data.current.relative_humidity_2m.toString(),
                        wind: data.current.wind_speed_10m.toString()
                    }));
                }
            } catch (error) {
                console.error("Errore meteo:", error);
                alert("Impossibile recuperare i dati meteo.");
            } finally {
                setIsLocating(false);
            }

        }, (error) => {
            console.error("Errore GPS:", error);
            alert("Impossibile rilevare la posizione.");
            setIsLocating(false);
        });
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        setReport(null);

        try {
            const res = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setReport(data.result);

        } catch (error) {
            console.error(error);
            alert("Errore durante l'analisi: " + error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveToDB = async () => {
        setIsSaving(true);
        const burnID = uuidv4(); // Generate local ID

        // Prepare data object
        const burnData = {
            id: burnID,
            name: formData.name || 'Operazione Senza Nome',
            status: 'planning',
            location: formData.location, // Mapping 'location' string to object field if needed, or stick to schema
            // db.ts defines 'location', schema defines 'location_name'. Let's align to schema logic or use flexible local db.
            // Converting to the structure expected by BOTH db.ts and Supabase
            fuel_model: formData.fuelModel,
            weather_data: {
                temp: formData.temp,
                humidity: formData.humidity,
                wind: formData.wind,
                slope: formData.slope,
                fuel_moisture: formData.fuelMoisture,
                aspect: formData.aspect
            },
            area_geojson: null, // ReportPage doesn't have drawing yet
            created_at: new Date().toISOString(),
            synced: false, // Default false
            personnel_hours: workLog
        };

        try {
            const isOnline = navigator.onLine;

            if (isOnline) {
                // --- ONLINE SCENARIO ---
                const { data: { user } } = await supabase.auth.getUser();

                if (user) {
                    // Try Supabase insert
                    const { error } = await supabase.from('burns').insert([{
                        user_id: user.id,
                        name: burnData.name,
                        status: burnData.status,
                        location_name: burnData.location,
                        fuel_model: burnData.fuel_model,
                        weather_data: burnData.weather_data,
                        ai_report: report,
                        // area_geojson: null
                    }]);

                    if (error) {
                        console.error("Errore Cloud, fallback locale:", error);
                        alert("Errore Server. Salvataggio in locale (Offline).");
                        await db.burns.add({ ...burnData, user_id: user.id, synced: false });
                    } else {
                        alert("Report salvato su Cloud (Archivio Centrale).");
                    }
                } else {
                    alert("Utente non loggato. Salvataggio in locale.");
                    await db.burns.add({ ...burnData, synced: false });
                }
            } else {
                // --- OFFLINE SCENARIO ---
                await db.burns.add({ ...burnData, synced: false });
                alert("NESSUNA CONNESSIONE.\nReport salvato in locale.\nVerrà inviato appena sarai online.");
            }

        } catch (error: any) {
            console.error("Errore salvataggio:", error);
            alert("Errore grave salvataggio: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    // --- SYNC LOGIC ---
    useEffect(() => {
        const handleOnline = async () => {
            console.log("Back Online. Syncing...");
            const unsynced = await db.burns.where('synced').equals(0).toArray(); // Dexie treats boolean as 0/1 in index sometimes, but here explicit false. 
            // Note: Dexie stores boolean as-is usually. 
            // Let's filter manually if index fails or use .equals(0) if mapped.
            // Safer:
            const all = await db.burns.toArray();
            const pending = all.filter(b => !b.synced);

            if (pending.length > 0) {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                let syncedCount = 0;
                for (const burn of pending) {
                    const { error } = await supabase.from('burns').insert([{
                        user_id: user.id,
                        name: burn.name,
                        status: burn.status,
                        location_name: burn.location,
                        fuel_model: burn.fuel_model,
                        weather_data: burn.weather_data,
                        created_at: burn.created_at
                    }]);

                    if (!error) {
                        await db.burns.update(burn.id!, { synced: true });
                        syncedCount++;
                    }
                }
                if (syncedCount > 0) {
                    alert(`${syncedCount} report sincronizzati con il server!`);
                }
            }
        };

        window.addEventListener('online', handleOnline);
        return () => window.removeEventListener('online', handleOnline);
    }, []);


    const mapRef = useRef<HTMLDivElement>(null); // Ref for Map Capture

    const handleExportPDF = async () => {
        try {
            const mod = await import('@/utils/generatePDF');
            await mod.generateOperationalReport({
                name: formData.name || "Operazione Senza Nome",
                location: formData.location || "N/D",
                status: "Planning",
                aiReport: report,
                personnel: workLog,
            });
        } catch (error) {
            console.error("Errore export PDF:", error);
            alert("Errore durante l'esportazione PDF.");
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-start pt-8 pb-24 px-4 bg-[var(--background)]">

            {/* Mappa Operativa - In cima */}
            <div className="w-full max-w-lg mb-6">
                <div className="bg-white/40 p-2 rounded-t-xl mb-1 ml-2">
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Mappa Operativa</h2>
                </div>
                <div className="h-72 rounded-xl overflow-hidden border border-[var(--glass-border)] shadow-lg">
                    <MapEditor />
                </div>
            </div>

            <div className="w-full max-w-lg mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-3 glass rounded-full text-[var(--primary)] shadow-sm">
                        <ClipboardList size={24} />
                    </div>
                    <h1 className="text-2xl font-bold text-[var(--foreground)]">Nuova Analisi</h1>
                </div>

                <div className="flex gap-2">
                    <Link href="/login" className="p-2 glass rounded-full opacity-60 hover:opacity-100">
                        <User size={20} />
                    </Link>
                    <button
                        onClick={handleGeolocation}
                        disabled={isLocating}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--secondary)] text-[var(--secondary-foreground)] text-xs font-semibold hover:brightness-95 transition-all"
                    >
                        {isLocating ? <Loader2 className="animate-spin" size={14} /> : <MapPin size={14} />}
                        {isLocating ? 'Meteo' : 'Meteo'}
                    </button>
                </div>
            </div>

            <div className="w-full max-w-lg glass-card space-y-4">

                {/* Dati Generali */}
                <div className="grid grid-cols-6 gap-4">
                    <div className="col-span-4">
                        <label className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-1 block">Nome Operazione</label>
                        <input name="name" value={formData.name} onChange={handleChange} placeholder="Es. Lotto A" className="input-field" />
                    </div>
                    <div className="col-span-6">
                        <label className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-1 block">Località</label>
                        <input name="location" value={formData.location} onChange={handleChange} placeholder="Es. Foresta Burgos" className="input-field" />
                    </div>
                    <div className="col-span-6">
                        <label className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-1 block">Combustibile</label>
                        <select name="fuelModel" value={formData.fuelModel} onChange={handleChange} className="input-field appearance-none">
                            <option value="">Seleziona...</option>
                            <option value="Macchia Alta">Macchia Alta</option>
                            <option value="Macchia bassa">Macchia bassa</option>
                            <option value="Sottobosco">Sottobosco</option>
                            <option value="Bosco">Bosco</option>
                            <option value="Pineta">Pineta</option>
                            <option value="Pascolo">Pascolo</option>
                            <option value="Pascolo Alberato">Pascolo Alberato</option>
                            <option value="Lettiera">Lettiera di Aghi/Foglie</option>
                        </select>
                    </div>
                </div>

                <div className="h-px bg-black/10 dark:bg-white/10 my-4"></div>

                {/* Dati Meteo */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-1 block">Temp. (°C)</label>
                        <input name="temp" type="number" value={formData.temp} onChange={handleChange} placeholder="24" className="input-field" />
                    </div>
                    <div>
                        <label className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-1 block">Umidità Aria (%)</label>
                        <input name="humidity" type="number" value={formData.humidity} onChange={handleChange} placeholder="45" className="input-field" />
                    </div>
                    <div>
                        <label className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-1 block">Vento (km/h)</label>
                        <input name="wind" type="number" value={formData.wind} onChange={handleChange} placeholder="12" className="input-field" />
                    </div>
                    <div>
                        <label className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-1 block">Pendenza (%)</label>
                        <input name="slope" type="number" value={formData.slope} onChange={handleChange} placeholder="15" className="input-field" />
                    </div>
                    <div>
                        <label className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-1 block text-orange-600">Umidità Comb. (%)</label>
                        <input name="fuelMoisture" type="number" value={formData.fuelMoisture} onChange={handleChange} placeholder="Es. 8" className="input-field border-orange-200" />
                    </div>
                    <div>
                        <label className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-1 block text-orange-600">Esposizione (CPS)</label>
                        <select name="aspect" value={formData.aspect} onChange={handleChange} className="input-field appearance-none border-orange-200">
                            <option value="">Seleziona...</option>
                            <option value="N">Nord (N)</option>
                            <option value="NE">Nord-Est (NE)</option>
                            <option value="E">Est (E)</option>
                            <option value="SE">Sud-Est (SE)</option>
                            <option value="S">Sud (S)</option>
                            <option value="SW">Sud-Ovest (SW)</option>
                            <option value="W">Ovest (W)</option>
                            <option value="NW">Nord-Ovest (NW)</option>
                            <option value="FLAT">Pianeggiante</option>
                        </select>
                    </div>
                </div>

                <div className="flex gap-2 mt-6">
                    {report && (
                        <button
                            onClick={handleSaveToDB}
                            disabled={isSaving}
                            className="flex-1 py-4 bg-white/50 text-[var(--foreground)] border border-[var(--glass-border)] rounded-xl font-bold hover:bg-white/80 transition-all flex items-center justify-center gap-2"
                        >
                            {isSaving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                            Salva
                        </button>
                    )}

                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="flex-[2] py-4 bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white rounded-xl font-bold shadow-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
                        {isLoading ? 'Analisi...' : (report ? 'Rigenera AI' : 'Genera Report AI')}
                    </button>
                </div>

            </div>

            {/* Report Result */}
            {report && (
                <div className="w-full max-w-lg mt-6 glass-card border-[var(--primary)] animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-2 mb-4 text-[var(--primary)] border-b border-black/5 pb-2">
                        <Send size={20} />
                        <h3 className="font-bold">Analisi Tattica Generata</h3>
                    </div>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                        <div className="whitespace-pre-wrap">{report}</div>
                    </div>
                </div>
            )}

            {/* Safety Module */}
            <div className="w-full max-w-lg mt-8 mb-6">
                <SafetyModule onPhaseChange={(phase) => console.log('Phase changed:', phase)} />
            </div>

            {/* Personnel Manager */}
            <div className="w-full max-w-lg mb-10">
                <div className="bg-white/40 p-1 rounded-t-xl mb-1 ml-2">
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Risorse Umane</h2>
                </div>
                <PersonnelManager onHoursUpdate={(data) => setWorkLog(data)} />
            </div>

            <button
                onClick={handleExportPDF}
                disabled={!report}
                className="w-full max-w-lg mb-12 bg-gray-800 hover:bg-gray-900 text-white font-bold py-4 rounded-xl shadow-lg flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
                <Save size={20} /> ESPORTA REPORT PDF
            </button>

            <style jsx>{`
        .input-field {
            width: 100%;
            padding: 0.75rem;
            border-radius: 0.75rem;
            background: rgba(255,255,255,0.5);
            border: 1px solid var(--glass-border);
            outline: none;
            transition: all 0.2s;
        }
        .input-field:focus {
            background: rgba(255,255,255,0.8);
            border-color: var(--primary);
            box-shadow: 0 0 0 3px rgba(45, 106, 79, 0.1);
        }
        @media (prefers-color-scheme: dark) {
            .input-field {
                background: rgba(0,0,0,0.2);
            }
            .input-field:focus {
                background: rgba(0,0,0,0.4);
            }
        }
      `}</style>
        </div >
    );
}
