
'use client';

import { Map, ShieldCheck, Users, History, ClipboardList } from 'lucide-react';

interface BottomNavProps {
    currentTab: string;
    setTab: (id: string) => void;
}

export default function BottomNav({ currentTab, setTab }: BottomNavProps) {
    const tabs = [
        { id: 'map', icon: Map, label: 'Mappa' },
        { id: 'forms', icon: ClipboardList, label: 'Moduli' },
        { id: 'safety', icon: ShieldCheck, label: 'Sicurezza' },
        { id: 'team', icon: Users, label: 'Team' },
        { id: 'history', icon: History, label: 'Storico' },
    ];

    return (
        <nav className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50 pb-safe">
            <div className="flex justify-around items-center h-16 px-2">
                {tabs.map((tab) => {
                    const isActive = currentTab === tab.id;
                    const Icon = tab.icon;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => setTab(tab.id)}
                            className={`flex flex-col items-center justify-center w-full h-full transition-all duration-300 group relative
                ${isActive ? 'text-green-700' : 'text-gray-400 hover:text-green-600'}
              `}
                        >
                            {/* Indicatore Active (Pallino animato) */}
                            {isActive && (
                                <span className="absolute -top-1 w-1 h-1 bg-green-500 rounded-full animate-ping"></span>
                            )}

                            <div className={`mb-1 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}>
                                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                            </div>

                            <span className={`text-[10px] font-medium tracking-wide uppercase ${isActive ? 'font-bold' : ''}`}>
                                {tab.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
