'use client';

import Link from 'next/link';
import { ArrowLeft, FileCheck, Flame, Cloud, Wrench, ClipboardList, Bell, AlertTriangle } from 'lucide-react';

const checklists = [
    {
        title: 'Progetto di Fuoco',
        description: 'Modulo generale con informazioni anagrafiche, catasto e notifiche.',
        href: '/progetto_fuoco.html',
        icon: Flame,
        color: '#27ae60'
    },
    {
        title: 'Fase di Preparazione',
        description: 'Pianificazione meteo, schermatura fumo e condizioni del combustibile.',
        href: '/fase_preparazione.html',
        icon: Cloud,
        color: '#3498db'
    },
    {
        title: 'Checklist Pre-Esecuzione',
        description: 'Controlli su strutture, sicurezza e dati meteo osservati prima dell\'avvio.',
        href: '/checklist_pre_esecuzione.html',
        icon: FileCheck,
        color: '#e74c3c'
    },
    {
        title: 'Checklist Attrezzature',
        description: 'Elenco e verifica disponibilità di attrezzature e mezzi necessari.',
        href: '/checklist_attrezzature.html',
        icon: Wrench,
        color: '#f39c12'
    },
    {
        title: 'Piano Operativo',
        description: 'Squadra, piano di accensione e checklist Vado-Non Vado.',
        href: '/piano_operativo.html',
        icon: ClipboardList,
        color: '#9b59b6'
    },
    {
        title: 'Piano di Notifica',
        description: 'Notifica proprietari, contatti istituzionali e dettagli intervento.',
        href: '/piano_notifica.html',
        icon: Bell,
        color: '#3498db'
    },
    {
        title: 'Vado / Non Vado',
        description: 'Checklist di sicurezza critica (Allegato 2). Da compilare prima dell\'accensione.',
        href: '/checklist_vado_non_vado.html',
        icon: AlertTriangle,
        color: '#c0392b'
    }
];

export default function ChecklistPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 pb-24">
            {/* Header */}
            <header className="bg-green-800 text-white p-4 sticky top-0 z-40 shadow-lg">
                <div className="flex items-center gap-3">
                    <Link href="/report" className="p-2 hover:bg-green-700 rounded-full transition-colors">
                        <ArrowLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold">Checklist Operative</h1>
                        <p className="text-green-200 text-sm">Moduli Digitali Operativi</p>
                    </div>
                </div>
            </header>

            {/* Checklist Grid */}
            <div className="p-4 grid gap-4">
                {checklists.map((item) => (
                    <a
                        key={item.title}
                        href={item.href}
                        className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all hover:-translate-y-1 flex items-start gap-4 border-l-4"
                        style={{ borderLeftColor: item.color }}
                    >
                        <div
                            className="p-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: `${item.color}20` }}
                        >
                            <item.icon size={24} style={{ color: item.color }} />
                        </div>
                        <div>
                            <h2 className="font-semibold text-gray-800 text-lg">{item.title}</h2>
                            <p className="text-gray-500 text-sm mt-1">{item.description}</p>
                        </div>
                    </a>
                ))}
            </div>
        </div>
    );
}
