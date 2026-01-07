'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import PersonnelManager, { PersonnelData } from '@/components/PersonnelManager';
import { useBurnContext } from '@/context/BurnContext';

export default function TeamPage() {
    const { teamSelection, setTeamSelection } = useBurnContext();

    const handlePersonnelUpdate = (data: PersonnelData) => {
        setTeamSelection(prev => ({
            ...prev,
            personnelData: data,
            selectedIds: data.participants?.map(p => p.id) || [],
        }));
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 pb-24">
            {/* Header */}
            <header className="bg-green-800 text-white p-4 sticky top-0 z-40 shadow-lg">
                <div className="flex items-center gap-3">
                    <Link href="/report" className="p-2 hover:bg-green-700 rounded-full transition-colors">
                        <ArrowLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold">Risorse Umane</h1>
                        <p className="text-green-200 text-sm">Gestione Squadra Operativa</p>
                    </div>
                </div>
            </header>

            {/* Riepilogo */}
            {teamSelection.personnelData.activeCount && teamSelection.personnelData.activeCount > 0 ? (
                <div className="mx-4 mt-4 bg-white rounded-xl p-4 shadow-md border-l-4 border-green-600">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-sm text-gray-500">Operatori Attivi</p>
                            <p className="text-2xl font-bold text-green-700">{teamSelection.personnelData.activeCount}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-500">Ore Totali</p>
                            <p className="text-2xl font-bold text-gray-800">{teamSelection.personnelData.total}h</p>
                        </div>
                    </div>
                </div>
            ) : null}

            {/* Personnel Manager */}
            <div className="p-4">
                <PersonnelManager
                    onHoursUpdate={handlePersonnelUpdate}
                    initialSelectedIds={teamSelection.selectedIds}
                    initialHoursLog={teamSelection.hoursLog}
                />
            </div>
        </div>
    );
}

