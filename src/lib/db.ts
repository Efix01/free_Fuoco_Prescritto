
import Dexie, { Table } from 'dexie';

export interface BurnRecord {
    id?: string; // UUID generato localmente
    name: string;
    location?: string;
    area_geojson?: any;
    weather_data?: any;
    status: string;
    created_at: string;
    synced: boolean; // false se offline, true se mandato al server
    user_id?: string;
    fuel_model?: string;
}

export interface PersonRecord {
    id?: string;
    name: string;
    role: string;
}

export class CFVADatabase extends Dexie {
    burns!: Table<BurnRecord>;
    personnel!: Table<PersonRecord>;

    constructor() {
        super('CFVAFuocoDB');
        this.version(2).stores({
            burns: 'id, name, created_at, synced',
            personnel: 'id, name, role'
        });
    }
}

export const db = new CFVADatabase();
