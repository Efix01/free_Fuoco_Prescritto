'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function LandingPage() {
    // Stato per gestire il menu mobile
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        // Check for invalid session on load to clear "Invalid Refresh Token" errors
        const checkSession = async () => {
            const { error } = await supabase.auth.getSession();
            if (error) {
                console.warn("Session error detected, signing out to clear invalid tokens:", error);
                await supabase.auth.signOut();
            }
        };
        checkSession();
    }, []);

    return (
        <div className="min-h-screen bg-white text-gray-800 font-sans overflow-x-hidden">

            {/* --- NAVBAR --- */}
            <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md shadow-sm z-50 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo Area */}
                        <div className="flex-shrink-0 flex items-center gap-2">
                            <div className="relative w-12 h-12">
                                <Image
                                    src="/logo_cfva.png"
                                    alt="Logo CFVA"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                            <div>
                                <h1 className="font-bold text-green-900 leading-none">CFVA Fuoco Prescritto 2.0</h1>
                                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Corpo Forestale e di V.A. della Sardegna</p>
                            </div>
                        </div>

                        {/* Desktop Menu */}
                        <div className="hidden md:flex space-x-8">
                            <a href="#features" className="text-gray-600 hover:text-green-800 font-medium transition">Funzionalità</a>
                            <a href="#advantages" className="text-gray-600 hover:text-green-800 font-medium transition">Vantaggi</a>
                            <a href="#disclaimer" className="text-gray-600 hover:text-green-800 font-medium transition">Info</a>
                            <Link href="/login" className="bg-green-800 hover:bg-green-900 text-white px-5 py-2 rounded-full font-bold transition shadow-lg">
                                Area Riservata
                            </Link>
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="md:hidden flex items-center">
                            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-600 hover:text-green-800 focus:outline-none">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                {isMenuOpen && (
                    <div className="md:hidden bg-white border-t border-gray-100 p-4 space-y-3 shadow-lg">
                        <a href="#features" onClick={() => setIsMenuOpen(false)} className="block text-gray-600 font-medium">Funzionalità</a>
                        <a href="#advantages" onClick={() => setIsMenuOpen(false)} className="block text-gray-600 font-medium">Vantaggi</a>
                        <a href="#disclaimer" onClick={() => setIsMenuOpen(false)} className="block text-gray-600 font-medium">Info</a>
                        <Link href="/login" className="block text-center bg-green-800 text-white py-2 rounded-lg font-bold">
                            Accedi
                        </Link>
                    </div>
                )}
            </nav>

            {/* --- HERO SECTION --- */}
            <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden bg-gray-50">
                <div className="absolute inset-0 z-0 opacity-50">
                    {/* Sfondo Foresta */}
                    <Image
                        src="/images/hero-bg.jpg"
                        alt="Sfondo Foresta"
                        fill
                        className="object-cover"
                        priority
                    />
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center max-w-3xl mx-auto">
                        <span className="inline-block py-1 px-3 rounded-full bg-green-100 text-green-800 text-xs font-bold uppercase tracking-widest mb-4 shadow-sm">
                            Tecnologia al servizio della Sicurezza
                        </span>
                        <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-6 leading-tight">
                            <span className="text-green-800">Fuoco Prescritto 2.0</span><br />
                            L'Assistente Digitale per la Gestione del Fuoco in Sardegna
                        </h1>
                        <p className="mt-4 text-xl text-gray-600 leading-relaxed mb-8">
                            La nuova Progressive Web App sviluppata per il Corpo Forestale. Supporta il Nucleo GAUF e gli Operatori AIB nel pianificare interventi di prevenzione con precisione scientifica e sicurezza operativa.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Link href="/login" className="px-8 py-4 bg-green-800 text-white rounded-lg font-bold text-lg shadow-xl hover:bg-green-900 hover:shadow-2xl transition-all transform hover:-translate-y-1">
                                Accedi alla Piattaforma
                            </Link>
                            <a href="#features" className="px-8 py-4 bg-white text-green-800 border-2 border-green-800 rounded-lg font-bold text-lg hover:bg-green-50 transition-all">
                                Scopri le Funzionalità
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- TARGET AUDIENCE --- */}
            <section className="py-16 bg-white">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold text-gray-900 mb-8">Cosa è CFVA Fuoco Prescritto 2.0 ?</h2>
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="p-6 rounded-xl bg-green-50 border border-green-100 shadow-sm">
                            <div className="text-green-800 mb-3">
                                <svg className="w-10 h-10 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            </div>
                            <h3 className="text-xl font-bold mb-2">Nucleo GAUF</h3>
                            <p className="text-gray-600">Progettata specificamente per il Gruppo Analisi e Utilizzo del Fuoco. Strumento di pianificazione e monitoraggio avanzato.</p>
                        </div>
                        <div className="p-6 rounded-xl bg-orange-50 border border-orange-100 shadow-sm">
                            <div className="text-orange-800 mb-3">
                                <svg className="w-10 h-10 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 119.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                            </div>
                            <h3 className="text-xl font-bold mb-2">Operatori AIB</h3>
                            <p className="text-gray-600">L'app ideale per le squadre operative AIB. Gestione semplificata, sicura e intuitiva sul campo.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- FEATURES SECTION --- */}
            <section id="features" className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900">Punti di Forza Tecnologici</h2>
                        <p className="mt-4 text-gray-600">Il meglio della tecnologia per la prevenzione degli incendi.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="bg-white p-8 rounded-2xl shadow-md hover:shadow-xl transition duration-300 border-t-4 border-green-600">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 text-green-700">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 7m0 13V7"></path></svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">GIS Avanzato</h3>
                            <p className="text-gray-600">Mappa operativa integrata con strumenti di disegno areale e calcolo automatico dell'estensione in Ettari.</p>
                        </div>

                        {/* Feature 2 */}
                        <div className="bg-white p-8 rounded-2xl shadow-md hover:shadow-xl transition duration-300 border-t-4 border-blue-600">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 text-blue-700">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Intelligenza Artificiale</h3>
                            <p className="text-gray-600">Analisi del rischio basata su modelli fisici (Rothermel/CPS) e meteo locale per valutare la fattibilità dell'intervento.</p>
                        </div>

                        {/* Feature 3 */}
                        <div className="bg-white p-8 rounded-2xl shadow-md hover:shadow-xl transition duration-300 border-t-4 border-purple-600">
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 text-purple-700">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 3.536l3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Offline-First</h3>
                            <p className="text-gray-600">Progressive Web App (PWA) che funziona anche senza connessione internet nelle aree più impervie della boscaglia.</p>
                        </div>

                        {/* Feature 4 */}
                        <div className="bg-white p-8 rounded-2xl shadow-md hover:shadow-xl transition duration-300 border-t-4 border-red-600">
                            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4 text-red-700">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Sicurezza Operativa</h3>
                            <p className="text-gray-600">Integrazione obbligatoria dei protocolli digitali LACES e Checklist passo-passo per ogni fase dell'operazione.</p>
                        </div>

                        {/* Feature 5 */}
                        <div className="bg-white p-8 rounded-2xl shadow-md hover:shadow-xl transition duration-300 border-t-4 border-yellow-600">
                            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4 text-yellow-700">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Reportistica Automatica</h3>
                            <p className="text-gray-600">Generazione istantanea di report PDF professionali, pronti per la firma e l'invio alla Sala Operativa.</p>
                        </div>

                        {/* Feature 6 */}
                        <div className="bg-white p-8 rounded-2xl shadow-md hover:shadow-xl transition duration-300 border-t-4 border-indigo-600">
                            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4 text-indigo-700">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Sincronizzazione Cloud</h3>
                            <p className="text-gray-600">I dati raccolti offline vengono sincronizzati automaticamente non appena la connessione torna disponibile.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- ADVANTAGES SECTION --- */}
            <section id="advantages" className="py-20 bg-green-800 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-3xl font-bold mb-6">Perché scegliere CFVA Fuoco Prescritto 2.0?</h2>
                        <p className="text-green-100 mb-8 text-lg">
                            Unire la tecnologia tradizionale all'innovazione digitale significa garantire un futuro più sicuro per il territorio sardo.
                        </p>
                        <ul className="space-y-4 text-left inline-block">
                            <li className="flex items-start">
                                <svg className="w-6 h-6 mr-3 flex-shrink-0 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                <span><strong>Riduzione del rischio operativo</strong> grazie a previsioni accurate.</span>
                            </li>
                            <li className="flex items-start">
                                <svg className="w-6 h-6 mr-3 flex-shrink-0 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                <span><strong>Pianificazione rapida e precisa</strong> tramite calcoli automatici.</span>
                            </li>
                            <li className="flex items-start">
                                <svg className="w-6 h-6 mr-3 flex-shrink-0 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                <span><strong>Archiviazione storica</strong> delle operazioni per analisi future.</span>
                            </li>
                            <li className="flex items-start">
                                <svg className="w-6 h-6 mr-3 flex-shrink-0 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                <span><strong>Supporto formativo</strong> per i nuovi Operatori AIB.</span>
                            </li>
                        </ul>

                        <div className="mt-12 pt-8 border-t border-green-700/50 inline-block min-w-[250px]">
                            <p className="text-sm font-bold text-green-200 uppercase tracking-wide mb-2">Team di lavoro</p>
                            <p className="font-semibold text-white text-lg">Ass.C. Pala Efisio</p>
                            <p className="text-sm text-green-300">Gruppo Formatori GAUF</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- DISCLAIMER SECTION (ONESTÀ INTELLETTUALE) --- */}
            <section id="disclaimer" className="py-16 bg-gray-50">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-amber-50 border-l-4 border-amber-500 p-8 rounded-r-xl shadow-sm">
                        <div className="flex items-start">
                            <div className="flex-shrink-0 text-amber-500">
                                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-lg font-bold text-amber-800 mb-2">Nota Importante: Fase di Testing (Beta)</h3>
                                <p className="text-gray-800 mb-4 leading-relaxed">
                                    Per onestà intellettuale e per garantire la massima sicurezza operativa, comunichiamo che l'applicazione <strong>CFVA - Fuoco Prescritto 2.0</strong> è attualmente in <strong>fase di Beta Testing</strong>.
                                </p>
                                <p className="text-gray-700 mb-4 leading-relaxed">
                                    L'utilizzo attuale dell'applicazione da parte del personale del Nucleo GAUF e degli Operatori AIB ha lo scopo primario di <strong>verificare le capacità dell'algoritmo sul campo</strong>, raccogliere feedback diretti dagli operatori e validare l'affidabilità del sistema prima del rilascio definitivo.
                                </p>
                                <p className="text-gray-700 leading-relaxed italic mb-4">
                                    Il contributo degli operatori sul campo è essenziale per affinare l'Intelligenza Artificiale e rendere questo strumento un alleato insostituibile per la sicurezza della Sardegna.
                                </p>
                                <p className="text-gray-800 leading-relaxed font-bold mb-4">
                                    Questo progetto, attualmente in fase di approvazione, intende dimostrare come l'Intelligenza Artificiale possa costituire un valido supporto per la sicurezza operativa. È fondamentale precisare che tale tecnologia non sostituisce in alcun modo l'inestimabile esperienza maturata dal personale esperto sul campo, ma si pone l'obiettivo di affiancarlo e supportarlo.
                                </p>
                                <p className="text-sm text-amber-900 bg-amber-100 p-3 rounded-lg border border-amber-200">
                                    ⚠️ In virtù della natura sperimentale della versione Beta, potrebbero verificarsi errori tecnici o malfunzionamenti. Vi invitiamo a segnalare tempestivamente qualsiasi anomalia all'indirizzo: <a href="mailto:epala@regione.sardegna.it" className="underline font-bold hover:text-amber-700">epala@regione.sardegna.it</a>.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- FOOTER --- */}
            <footer className="bg-gray-900 text-gray-300 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 border-b border-gray-800 pb-8">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="relative w-12 h-12">
                                    <Image
                                        src="/logo_cfva.png"
                                        alt="Logo CFVA"
                                        fill
                                        className="object-contain"
                                    />
                                </div>
                                <span className="font-bold text-white text-lg">CFVA Fuoco Prescritto 2.0</span>
                            </div>
                            <p className="text-sm">Corpo Forestale e di Vigilanza Ambientale della Regione Sardegna.</p>
                        </div>
                        <div>
                            <h4 className="text-white font-bold mb-4">Link Rapidi</h4>
                            <ul className="space-y-2 text-sm">
                                <li><Link href="/login" className="hover:text-green-400">Login Personale</Link></li>
                                <li><Link href="/register" className="hover:text-green-400">Registrazione</Link></li>
                                <li><a href="#" className="hover:text-green-400">Privacy Policy</a></li>
                                <li><a href="#" className="hover:text-green-400">Note Legali</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-bold mb-4">Contatti</h4>
                            <p className="text-sm mb-2">Sede Operativa Regionale</p>
                            <p className="text-sm text-gray-500">Cagliari, Sardegna</p>
                        </div>
                    </div>
                    <div className="text-center text-xs text-gray-600">
                        &copy; {new Date().getFullYear()} Corpo Forestale e di V.A. della Sardegna. Tutti i diritti riservati.
                    </div>
                </div>
            </footer>

        </div>
    );
}
