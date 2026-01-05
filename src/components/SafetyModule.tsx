
'use client';

import { useState } from 'react';
import { safetyData } from '../data/checklists';
import { Eye, Anchor, Radio, Route, ShieldCheck, CheckCircle, Lock, LifeBuoy } from 'lucide-react';

const icons: Record<string, any> = {
    Eye, Anchor, Radio, Route, ShieldCheck
};

export default function SafetyModule({ onPhaseChange }: { onPhaseChange?: (phaseId: string) => void }) {
    const [activePhase, setActivePhase] = useState(0); // 0: Briefing, 1: Accensione, 2: Bonifica
    const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

    // Gestione spunta checkbox
    const handleCheck = (phaseId: string, index: number) => {
        const key = `${phaseId}-${index}`;
        setCheckedItems(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    // Controlla se tutti gli item di una fase sono spuntati
    const isPhaseComplete = (phaseIndex: number) => {
        const phase = safetyData.phases[phaseIndex];
        return phase.items.every((_, idx) => checkedItems[`${phase.id}-${idx}`]);
    };

    // Passa alla fase successiva
    const nextPhase = () => {
        if (activePhase < safetyData.phases.length - 1) {
            const next = activePhase + 1;
            setActivePhase(next);
            if (onPhaseChange) onPhaseChange(safetyData.phases[next].id);
        } else {
            alert("Operazione Completata e Sicura!");
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* --- SEZIONE LACES (VISUALE) --- */}
            <div className="bg-red-50/80 p-4 rounded-xl shadow-sm border-l-4 border-red-600">
                <h3 className="font-bold text-lg text-red-800 mb-4 flex items-center gap-2">
                    <LifeBuoy className="text-red-600" /> Protocollo LACES
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
                    {safetyData.laces.map((item) => {
                        const Icon = icons[item.icon];
                        return (
                            <div key={item.id} className="bg-white p-3 rounded-lg border border-red-100 shadow-sm flex flex-col items-center">
                                <div className="mb-2 p-2 bg-red-100 rounded-full">
                                    <Icon className="text-red-700" size={20} />
                                </div>
                                <div className="font-bold text-red-900 text-lg">{item.id}</div>
                                <div className="text-[10px] text-red-800 leading-tight mt-1">{item.desc}</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* --- CHECKLIST DINAMICHE --- */}
            <div className="bg-white/80 backdrop-blur-md rounded-xl shadow border border-white/20 overflow-hidden">
                {/* Tabs Fasi */}
                <div className="flex border-b border-gray-200 overflow-x-auto">
                    {safetyData.phases.map((phase, idx) => {
                        const isActive = idx === activePhase;
                        const isComplete = isPhaseComplete(idx);
                        const isLocked = idx > activePhase;

                        return (
                            <button
                                key={phase.id}
                                disabled={isLocked}
                                onClick={() => { if (!isLocked) setActivePhase(idx) }}
                                className={`flex-1 min-w-[120px] py-4 text-sm font-bold transition-all relative
                  ${isActive ? 'bg-[var(--primary)] text-white' :
                                        isLocked ? 'bg-gray-100 text-gray-400 cursor-not-allowed' :
                                            isComplete ? 'bg-green-100 text-green-800' : 'bg-gray-50 text-gray-600'}
                `}
                            >
                                <div className="flex flex-col items-center gap-1 z-10 relative">
                                    <span className="text-xs uppercase tracking-wider opacity-90">{phase.title.split('.')[1]}</span>
                                    {isComplete && !isActive && <CheckCircle size={16} className="text-green-600" />}
                                    {isLocked && <Lock size={16} className="text-gray-400" />}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Contenuto Checklist Attiva */}
                <div className="p-6">
                    <div className="mb-6">
                        <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold text-white mb-2 uppercase tracking-widest shadow-sm
               ${activePhase === 0 ? 'bg-blue-600' : activePhase === 1 ? 'bg-orange-600' : 'bg-green-600'}`}>
                            Fase {activePhase + 1}: {safetyData.phases[activePhase].color.toUpperCase()} ZONE
                        </span>
                        <p className="text-sm text-gray-600">Completa tutti i punti per sbloccare la fase successiva.</p>
                    </div>

                    <ul className="space-y-3">
                        {safetyData.phases[activePhase].items.map((item, idx) => {
                            const key = `${safetyData.phases[activePhase].id}-${idx}`;
                            const isChecked = checkedItems[key];

                            return (
                                <li key={idx}
                                    onClick={() => handleCheck(safetyData.phases[activePhase].id, idx)}
                                    className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all active:scale-[0.99]
                    ${isChecked ? 'bg-green-50/50 border-green-200' : 'bg-white border-gray-200 hover:border-[var(--primary)]'}`}>
                                    <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors
                      ${isChecked ? 'bg-green-600 border-green-600' : 'border-gray-300 bg-white'}`}>
                                        {isChecked && <CheckCircle size={14} className="text-white" />}
                                    </div>
                                    <label className={`cursor-pointer select-none text-sm font-medium ${isChecked ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                                        {item}
                                    </label>
                                </li>
                            );
                        })}
                    </ul>

                    {/* Pulsante Prosegui */}
                    <div className="mt-8 flex justify-end">
                        <button
                            onClick={nextPhase}
                            disabled={!isPhaseComplete(activePhase)}
                            className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg
                ${isPhaseComplete(activePhase)
                                    ? 'bg-green-600 hover:bg-green-500 text-white transform hover:-translate-y-1'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
              `}
                        >
                            {activePhase === safetyData.phases.length - 1 ? 'CONCLUDI OPERAZIONE' : 'PROSEGUI'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
