
'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from "next/link";
import Image from "next/image";
import { ClipboardList, Loader2, Sparkles, Send, MapPin, Save, User, FileText, Wind, ShieldAlert } from "lucide-react";
import BottomNav from '@/components/BottomNav';
import SafetyModule from '@/components/SafetyModule';
import PersonnelManager, { PersonnelData } from '@/components/PersonnelManager';
import { supabase } from '@/lib/supabase';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import type { MapEditorHandle } from '@/components/MapEditor';

// Dynamic import for Map to avoid SSR issues
const MapEditor = dynamic(() => import('@/components/MapEditor'), {
  loading: () => <div className="h-[400px] w-full flex items-center justify-center bg-gray-100 rounded-xl"><Loader2 className="animate-spin text-green-700" size={32} /></div>,
  ssr: false
});

export default function Home() {
  // 1. Navigation State
  const [activeTab, setActiveTab] = useState('map'); // Default to Map/Home

  // 2. Report/Analysis State
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
  const [userProfile, setUserProfile] = useState<{ name: string; rank: string } | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.user_metadata) {
        setUserProfile({
          name: `${user.user_metadata.first_name || ''} ${user.user_metadata.last_name || ''}`,
          rank: user.user_metadata.rank || 'Operatore'
        });
      }
    };
    getUser();
  }, []);

  const mapRef = useRef<MapEditorHandle>(null); // Ref for Map Capture

  // --- LOGIC HANDLERS (From ReportPage) ---
  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocalizzazione non supportata.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
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
          alert("Meteo sincronizzato! Campi compilati automaticamente.");
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
    const burnID = uuidv4();
    const burnData = {
      id: burnID,
      name: formData.name || 'Operazione Senza Nome',
      status: 'planning',
      location: formData.location,
      fuel_model: formData.fuelModel,
      weather_data: {
        temp: formData.temp,
        humidity: formData.humidity,
        wind: formData.wind,
        slope: formData.slope,
        fuel_moisture: formData.fuelMoisture,
        aspect: formData.aspect
      },
      area_geojson: null,
      created_at: new Date().toISOString(),
      synced: false,
      personnel_hours: workLog
    };

    try {
      const isOnline = navigator.onLine;
      if (isOnline) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { error } = await supabase.from('burns').insert([{
            user_id: user.id,
            name: burnData.name,
            status: burnData.status,
            location_name: burnData.location,
            fuel_model: burnData.fuel_model,
            weather_data: burnData.weather_data,
            ai_report: report,
          }]);
          if (error) {
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
        await db.burns.add({ ...burnData, synced: false });
        alert("NESSUNA CONNESSIONE.\nReport salvato in locale.");
      }
    } catch (error: any) {
      alert("Errore grave salvataggio: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      // Cattura la mappa come immagine base64
      let mapImageBase64: string | null = null;
      if (mapRef.current) {
        mapImageBase64 = await mapRef.current.captureMap();
      }

      const mod = await import('@/utils/generatePDF');
      await mod.generateOperationalReport({
        name: formData.name || "Operazione Senza Nome",
        location: formData.location || "N/D",
        status: "Planning",
        aiReport: report,
        personnel: workLog,
        author: userProfile,
        mapImageBase64: mapImageBase64
      });
    } catch (error) {
      console.error("Errore export PDF:", error);
      alert("Errore durante l'esportazione PDF.");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- RENDER ---
  return (
    <main className="min-h-screen bg-gray-50 font-sans pb-24 text-gray-900">

      {/* --- HEADER CON LOGO --- */}
      <header className="bg-green-800 text-white p-3 sticky top-0 z-40 shadow-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between">

          {/* Sezione Logo + Titolo */}
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 bg-white rounded-full p-1 shadow-sm">
              {/* Il logo adatterà le dimensioni al contenitore */}
              <Image
                src="/logo-cfv.png"
                alt="Logo Corpo Forestale"
                fill
                className="object-contain"
              />
            </div>
            <div className="leading-tight">
              <h1 className="text-sm font-bold uppercase tracking-wide">Corpo Forestale e di V.A.</h1>
              <p className="text-[10px] opacity-80">Regione Sardegna - GAUF</p>
            </div>
          </div>

          {/* Indicatore Stato + Logout */}
          <div className="flex items-center gap-3">
            {/* Pulsante ESCI */}
            <button
              onClick={async () => {
                try {
                  await supabase.auth.signOut();
                  // Pulisce cache locale per evitare "finti" login
                  localStorage.clear();
                  sessionStorage.clear();
                  // Forza il redirect ricaricando la pagina
                  window.location.replace('/login');
                } catch (error) {
                  console.error("Errore logout:", error);
                  window.location.href = '/login';
                }
              }}
              className="text-xs font-bold text-white border border-white/50 px-4 py-2 rounded-lg hover:bg-white/10 active:bg-white/20 active:scale-95 transition-all touch-manipulation"
            >
              ESCI
            </button>

            <div className="flex items-center gap-2 bg-green-900/50 px-3 py-1 rounded-full text-xs border border-green-600/30">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              <span className="font-medium">Online</span>
            </div>
          </div>
        </div>
      </header>

      {/* --- CONTENT AREA --- */}
      <div className="max-w-5xl mx-auto p-4">

        {/* TAB 1: MAPPA + ANALISI */}
        {activeTab === 'map' && (
          <div className="space-y-6 animate-in fade-in duration-300">

            {/* Map Section */}
            <div className="bg-white p-1 rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div
                id="map-print-capture"
                style={{
                  backgroundColor: '#ffffff',
                  height: '400px',
                  width: '100%',
                  position: 'relative',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}
              >
                {/* MapEditor is loaded dynamically here */}
                <MapEditor ref={mapRef} />
              </div>
              <div className="p-2 text-xs text-center text-gray-400">
                Mappa Operativa Interattiva
              </div>
            </div>

            {/* Analysis Form Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-100 text-green-700 rounded-lg">
                  <ClipboardList size={20} />
                </div>
                <h2 className="text-xl font-bold text-gray-800">Nuova Analisi</h2>
              </div>
              <button
                onClick={handleGeolocation}
                disabled={isLocating}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-50"
              >
                {isLocating ? <Loader2 className="animate-spin" size={14} /> : <MapPin size={14} />}
                {isLocating ? 'Cercando...' : 'Rileva Posizione'}
              </button>
            </div>

            {/* Analysis Form */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 space-y-4">
              {/* General Data */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Nome Operazione</label>
                  <input name="name" value={formData.name} onChange={handleChange} placeholder="Es. Lotto A" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Località</label>
                  <input name="location" value={formData.location} onChange={handleChange} placeholder="Es. Foresta Burgos" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition-all" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Modello Combustibile</label>
                <select name="fuelModel" value={formData.fuelModel} onChange={handleChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none appearance-none">
                  <option value="">Seleziona...</option>
                  <option value="Bosco">Bosco</option>
                  <option value="Macchia Alta">Macchia Alta</option>
                  <option value="Macchia bassa">Macchia bassa</option>
                  <option value="Sottobosco">Sottobosco</option>
                  <option value="Pascolo">Pascolo</option>
                  <option value="Pascolo Alberato">Pascolo Alberato</option>
                  <option value="Pascolo cespugliato">Pascolo cespugliato</option>
                  <option value="Lettiera">Lettiera di Aghi/Foglie</option>
                </select>
              </div>

              <div className="h-px bg-gray-100 my-2"></div>

              {/* Weather & CPS Data */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Temp. (°C)</label>
                  <input name="temp" type="number" value={formData.temp} onChange={handleChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none" placeholder="24" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Umidità (%)</label>
                  <input name="humidity" type="number" value={formData.humidity} onChange={handleChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none" placeholder="45" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Vento (km/h)</label>
                  <input name="wind" type="number" value={formData.wind} onChange={handleChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none" placeholder="12" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Pendenza (%)</label>
                  <input name="slope" type="number" value={formData.slope} onChange={handleChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none" placeholder="15" />
                </div>
                <div>
                  <label className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-1 block">Umidità Comb.</label>
                  <input name="fuelMoisture" type="number" value={formData.fuelMoisture} onChange={handleChange} className="w-full p-3 bg-orange-50 border border-orange-200 rounded-lg outline-none" placeholder="8" />
                </div>
                <div>
                  <label className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-1 block">Esposizione</label>
                  <select name="aspect" value={formData.aspect} onChange={handleChange} className="w-full p-3 bg-orange-50 border border-orange-200 rounded-lg outline-none appearance-none">
                    <option value="">Seleziona...</option>
                    <option value="N">Nord (N)</option>
                    <option value="S">Sud (S)</option>
                    <option value="E">Est (E)</option>
                    <option value="W">Ovest (W)</option>
                    <option value="NW">Nord-Ovest</option>
                    <option value="NE">Nord-Est</option>
                    <option value="SW">Sud-Ovest</option>
                    <option value="SE">Sud-Est</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="flex-1 py-3 bg-gradient-to-r from-green-700 to-emerald-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                  {isLoading ? 'Analisi...' : 'Genera Analisi AI'}
                </button>
                {report && (
                  <button
                    onClick={handleSaveToDB}
                    disabled={isSaving}
                    className="px-4 py-3 bg-gray-800 text-white rounded-xl font-bold hover:bg-gray-700 transition-all"
                  >
                    {isSaving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                  </button>
                )}
              </div>
            </div>

            {/* AI Report Result */}
            {report && (
              <div className="bg-white p-5 rounded-xl shadow-lg border-2 border-green-500 animate-in slide-in-from-bottom-5">
                <div className="flex items-center gap-2 mb-3 text-green-700 border-b pb-2">
                  <Send size={20} />
                  <h3 className="font-bold">Analisi Tattica (CPS)</h3>
                </div>
                <div className="prose prose-sm max-w-none text-gray-700 bg-gray-50 p-3 rounded-lg">
                  <div className="whitespace-pre-wrap leading-relaxed">{report}</div>
                </div>
                <button
                  onClick={handleExportPDF}
                  className="w-full mt-4 py-3 bg-gray-800 text-white font-bold rounded-lg hover:bg-gray-900 transition-all flex justify-center items-center gap-2"
                >
                  <FileText size={18} /> ESPORTA PDF
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MODULI */}
        {activeTab === 'forms' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                <ClipboardList className="text-green-600" /> Moduli Operativi
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Compila i moduli richiesti per la documentazione dell&apos;intervento.
              </p>

              <div className="grid grid-cols-1 gap-3">
                {[
                  { href: '/progetto_fuoco.html', title: 'Progetto di Fuoco', desc: 'Dati generali del progetto' },
                  { href: '/fase_preparazione.html', title: 'Fase Preparazione', desc: 'Preparazione e prescrizioni meteo' },
                  { href: '/checklist_pre_esecuzione.html', title: 'Pre-Esecuzione', desc: 'Checklist prima dell\'intervento' },
                  { href: '/checklist_attrezzature.html', title: 'Attrezzature', desc: 'Checklist materiali e mezzi' },
                  { href: '/piano_operativo.html', title: 'Piano Operativo', desc: 'Squadra e piano di esecuzione' },
                  { href: '/piano_notifica.html', title: 'Piano Notifica', desc: 'Notifiche e contatti' },
                  { href: '/checklist_vado_non_vado.html', title: 'Vado/Non Vado', desc: 'Decisione finale operativa' },
                ].map((mod) => (
                  <a
                    key={mod.href}
                    href={mod.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 bg-gray-50 hover:bg-green-50 border border-gray-200 hover:border-green-300 rounded-lg transition-all group"
                  >
                    <div>
                      <h3 className="font-bold text-gray-800 group-hover:text-green-700">{mod.title}</h3>
                      <p className="text-xs text-gray-500">{mod.desc}</p>
                    </div>
                    <span className="text-gray-400 group-hover:text-green-600 text-xl">→</span>
                  </a>
                ))}
              </div>

              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
                <strong>💡 Nota:</strong> I dati inseriti nei moduli vengono salvati automaticamente nel browser e saranno inclusi nel PDF finale.
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SAFETY */}
        {activeTab === 'safety' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                <ShieldAlert className="text-orange-500" /> Protocolli di Sicurezza
              </h2>
              <SafetyModule onPhaseChange={(phase) => console.log(phase)} />
            </div>
          </div>
        )}

        {/* TAB 3: TEAM */}
        {activeTab === 'team' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                <User className="text-blue-500" /> Squadra Operativa
              </h2>
              <PersonnelManager onHoursUpdate={(data) => setWorkLog(data)} />
            </div>
          </div>
        )}

        {/* TAB 4: HISTORY */}
        {activeTab === 'history' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center">
              <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Archivio Operazioni</h2>
              <p className="text-gray-500 mb-6">Visualizza lo storico completo delle operazioni.</p>
              <Link href="/profile" className="inline-block px-6 py-3 bg-[var(--primary)] text-white font-bold rounded-xl hover:opacity-90 transition-all">
                Vai allo Storico Completo
              </Link>
            </div>
          </div>
        )}

      </div>

      {/* --- BOTTOM NAVIGATION --- */}
      <BottomNav currentTab={activeTab} setTab={setActiveTab} />

    </main>
  );
}
