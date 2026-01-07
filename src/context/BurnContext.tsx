'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { PersonnelData } from '@/components/PersonnelManager';

// Tipi per i dati del form
export interface BurnFormData {
    name: string;
    location: string;
    fuelModel: string;
    temp: string;
    humidity: string;
    wind: string;
    slope: string;
    fuelMoisture: string;
    aspect: string;
}

// Tipi per la selezione del personale
export interface TeamSelectionData {
    selectedIds: string[];
    hoursLog: Record<string, string>;
    personnelData: PersonnelData;
}

// Stato completo del Context
interface BurnContextState {
    formData: BurnFormData;
    setFormData: (data: BurnFormData | ((prev: BurnFormData) => BurnFormData)) => void;
    teamSelection: TeamSelectionData;
    setTeamSelection: (data: TeamSelectionData | ((prev: TeamSelectionData) => TeamSelectionData)) => void;
    report: string | null;
    setReport: (report: string | null) => void;
    resetAll: () => void;
}

// Valori iniziali
const initialFormData: BurnFormData = {
    name: '',
    location: '',
    fuelModel: '',
    temp: '',
    humidity: '',
    wind: '',
    slope: '',
    fuelMoisture: '',
    aspect: ''
};

const initialTeamSelection: TeamSelectionData = {
    selectedIds: [],
    hoursLog: {},
    personnelData: { details: {}, total: 0, activeCount: 0, participants: [] }
};

// Creazione del Context
const BurnContext = createContext<BurnContextState | undefined>(undefined);

// Provider Component
export function BurnProvider({ children }: { children: ReactNode }) {
    const [formData, setFormData] = useState<BurnFormData>(initialFormData);
    const [teamSelection, setTeamSelection] = useState<TeamSelectionData>(initialTeamSelection);
    const [report, setReport] = useState<string | null>(null);

    const resetAll = () => {
        setFormData(initialFormData);
        setTeamSelection(initialTeamSelection);
        setReport(null);
    };

    return (
        <BurnContext.Provider value={{
            formData,
            setFormData,
            teamSelection,
            setTeamSelection,
            report,
            setReport,
            resetAll
        }}>
            {children}
        </BurnContext.Provider>
    );
}

// Hook per usare il Context
export function useBurnContext() {
    const context = useContext(BurnContext);
    if (context === undefined) {
        throw new Error('useBurnContext must be used within a BurnProvider');
    }
    return context;
}
