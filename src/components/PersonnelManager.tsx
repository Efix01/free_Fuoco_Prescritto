
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { Users, Plus, Trash2, Check, Search, UserPlus } from 'lucide-react';

export interface PersonnelData {
    details: Record<string, string>;
    total: number;
    activeCount?: number;
    participants?: { id: string; name: string; role: string }[];
}

interface Person {
    id?: string;
    name: string;
    role: string;
}

export default function PersonnelManager({ onHoursUpdate }: { onHoursUpdate: (data: PersonnelData) => void }) {
    const [allPersonnel, setAllPersonnel] = useState<Person[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [hoursLog, setHoursLog] = useState<Record<string, string>>({});

    // Stati per aggiungere nuovi operatori
    const [newName, setNewName] = useState('');
    const [newRole, setNewRole] = useState('Operatore Gauf');
    const [searchTerm, setSearchTerm] = useState('');

    // 1. Carica Personale all'avvio
    useEffect(() => {
        const loadPersonnel = async () => {
            const allPeople = await db.personnel.toArray();
            setAllPersonnel(allPeople);
        };
        loadPersonnel();
    }, []);

    // 2. Aggiungi Nuovo Operatore (e selezionalo automaticamente)
    const addPerson = async () => {
        if (!newName) return;

        const newPerson: Person = {
            id: uuidv4(),
            name: newName,
            role: newRole
        };

        await db.personnel.add(newPerson);
        const updatedList = [...allPersonnel, newPerson];
        setAllPersonnel(updatedList);

        // Aggiungiamo automaticamente al Set dei selezionati
        setSelectedIds(prev => new Set(prev).add(newPerson.id!));

        setNewName('');
    };

    // 3. Rimuovi Operatore
    const removePerson = async (id: string) => {
        await db.personnel.delete(id);
        setAllPersonnel(allPersonnel.filter(p => p.id !== id));
        // Rimuovi anche dai selezionati
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
        });
        // Rimuovi le ore
        setHoursLog(prev => {
            const newLog = { ...prev };
            delete newLog[id];
            return newLog;
        });
    };

    // 4. Toggle Selezione
    const toggleSelection = (id: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
                // Rimuovi anche le ore registrate
                setHoursLog(prevLog => {
                    const newLog = { ...prevLog };
                    delete newLog[id];
                    return newLog;
                });
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    // 5. Aggiorna Ore
    const handleHoursChange = (id: string, hours: string) => {
        const updatedLog = { ...hoursLog, [id]: hours };
        setHoursLog(updatedLog);

        // Calcola totale solo per i selezionati
        const totalHours = Object.keys(updatedLog)
            .filter(key => selectedIds.has(key))
            .reduce((acc, key) => acc + (parseFloat(updatedLog[key]) || 0), 0);

        // Include i partecipanti selezionati
        const participants = allPersonnel
            .filter(p => p.id && selectedIds.has(p.id))
            .map(p => ({ id: p.id!, name: p.name, role: p.role }));

        onHoursUpdate({
            details: updatedLog,
            total: totalHours,
            activeCount: selectedIds.size,
            participants
        });
    };

    // Aggiorna quando cambia la selezione
    useEffect(() => {
        const totalHours = Object.keys(hoursLog)
            .filter(key => selectedIds.has(key))
            .reduce((acc, key) => acc + (parseFloat(hoursLog[key]) || 0), 0);

        const participants = allPersonnel
            .filter(p => p.id && selectedIds.has(p.id))
            .map(p => ({ id: p.id!, name: p.name, role: p.role }));

        onHoursUpdate({
            details: hoursLog,
            total: totalHours,
            activeCount: selectedIds.size,
            participants
        });
    }, [selectedIds, allPersonnel]);

    // Filtro ricerca
    const filteredPersonnel = allPersonnel.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'Direttore Operazioni':
            case 'Supervisore': return 'bg-purple-600';
            case 'Torcista': return 'bg-orange-600';
            case 'Addetto Pompe': return 'bg-blue-600';
            case 'Autista': return 'bg-slate-600';
            default: return 'bg-green-600';
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* --- SEZIONE AGGIUNTA OPERATORE --- */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <UserPlus className="text-green-700" size={18} /> Aggiungi al Database
                </h3>
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Nome e Cognome"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addPerson()}
                        className="flex-1 border border-gray-200 p-2.5 rounded-lg text-sm focus:border-green-600 focus:ring-1 focus:ring-green-600 outline-none"
                    />
                    <select
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value)}
                        className="border border-gray-200 p-2.5 rounded-lg text-sm bg-gray-50 w-36"
                    >
                        <option value="Operatore Gauf">Operatore Gauf</option>
                        <option value="Torcista">Torcista</option>
                        <option value="Addetto Pompe">Addetto Pompe</option>
                        <option value="Autista">Autista</option>
                        <option value="Supervisore">Supervisore</option>
                        <option value="Direttore Operazioni">Direttore Ops</option>
                    </select>
                    <button
                        onClick={addPerson}
                        disabled={!newName}
                        className="bg-green-700 text-white px-4 rounded-lg hover:bg-green-800 disabled:opacity-50 transition-all"
                    >
                        <Plus size={20} />
                    </button>
                </div>
            </div>

            {/* --- SEZIONE SQUADRA (CHECKLIST UNICA) --- */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <Users className="text-[var(--primary)]" size={18} />
                        Squadra Operativa
                        <span className="bg-green-600 text-white text-xs px-2 py-0.5 rounded-full">
                            {selectedIds.size}
                        </span>
                    </h3>
                    {/* Barra di ricerca */}
                    <div className="relative">
                        <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Cerca..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="text-xs border border-gray-200 py-1.5 pl-7 pr-2 rounded-lg w-32 focus:w-40 transition-all focus:border-green-500 outline-none"
                        />
                    </div>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                    {filteredPersonnel.length === 0 && (
                        <div className="text-sm text-gray-400 text-center py-8 flex flex-col items-center">
                            <UserPlus size={32} className="mb-2 opacity-30" />
                            {allPersonnel.length === 0
                                ? "Nessun operatore registrato."
                                : "Nessun risultato per la ricerca."}
                        </div>
                    )}

                    {filteredPersonnel.map((person) => {
                        const isSelected = person.id ? selectedIds.has(person.id) : false;

                        return (
                            <div
                                key={person.id}
                                className={`p-3 flex items-center justify-between transition-all duration-200
                                    ${isSelected
                                        ? 'bg-green-50 border-l-4 border-green-600'
                                        : 'bg-white hover:bg-gray-50 border-l-4 border-transparent'}
                                `}
                            >
                                {/* Colonna Sinistra: Checkbox + Info */}
                                <div className="flex items-center gap-3 flex-1">
                                    {/* Checkbox */}
                                    <div
                                        onClick={() => person.id && toggleSelection(person.id)}
                                        className={`w-6 h-6 rounded border-2 flex items-center justify-center cursor-pointer transition-all
                                            ${isSelected
                                                ? 'bg-green-600 border-green-600 text-white'
                                                : 'border-gray-300 text-transparent hover:border-green-400'}
                                        `}
                                    >
                                        <Check size={14} strokeWidth={3} />
                                    </div>

                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${getRoleColor(person.role)}`}>
                                        {person.name.charAt(0).toUpperCase()}
                                    </div>

                                    <div>
                                        <div className={`font-bold text-sm ${isSelected ? 'text-green-900' : 'text-gray-700'}`}>
                                            {person.name}
                                        </div>
                                        <div className="text-[10px] text-gray-500 uppercase tracking-wider">{person.role}</div>
                                    </div>
                                </div>

                                {/* Colonna Destra: Ore (SOLO se spuntato) */}
                                {isSelected && (
                                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-200">
                                        <input
                                            type="number"
                                            step="0.5"
                                            min="0"
                                            placeholder="0"
                                            value={hoursLog[person.id!] || ''}
                                            onChange={(e) => person.id && handleHoursChange(person.id, e.target.value)}
                                            className="w-20 border border-gray-200 p-1.5 rounded-lg text-right text-sm font-bold focus:border-green-600 outline-none"
                                        />
                                        <span className="text-xs text-gray-500 font-medium">h</span>
                                    </div>
                                )}

                                {/* Pulsante Elimina */}
                                <button
                                    onClick={() => person.id && removePerson(person.id)}
                                    className="ml-2 text-gray-300 hover:text-red-500 p-1.5 hover:bg-red-50 rounded transition-colors"
                                    title="Rimuovi dal database"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Info Box */}
            {selectedIds.size > 0 && (
                <div className="text-xs text-center text-green-700 bg-green-50 py-2.5 rounded-lg border border-green-100 font-medium">
                    ✅ {selectedIds.size} operatore/i attivo/i nell'intervento
                </div>
            )}
        </div>
    );
}
