
export const safetyData = {
    laces: [
        { id: 'L', title: 'Lookout', desc: 'Vedetta sempre attiva e in posizione dominante.', icon: 'Eye' },
        { id: 'A', title: 'Anchor', desc: 'Punto di ancoraggio sicuro e definito (barriera naturale o artificiale).', icon: 'Anchor' },
        { id: 'C', title: 'Communication', desc: 'Comunicazioni radio chiare, testate e frequenze condivise.', icon: 'Radio' },
        { id: 'E', title: 'Escape', desc: 'Vie di fuga note e pulite verso la zona di sicurezza.', icon: 'Route' },
        { id: 'S', title: 'Safety', desc: 'Zone di sicurezza (oasi) accessibili rapidamente dal personale.', icon: 'ShieldCheck' }
    ],
    phases: [
        {
            id: 'briefing',
            title: '1. BRIEFING PRE-OPERATIVO',
            color: 'blue',
            items: [
                'Analisi meteo locale (vento, umidità) effettuata.',
                'Definizione e condivisione del Protocollo LACES con la squadra.',
                'Verifica DPI per tutto il personale (guanti, caschi, radio).',
                'Controllo carburante e attrezzature antincendio.'
            ]
        },
        {
            id: 'ignition',
            title: '2. FASE DI ACCENSIONE',
            color: 'orange',
            items: [
                'Esecuzione "Test Fuoco" in area sicura per verifica ROS.',
                'Comunicazione inizio operazioni confermata dalla Sala Operativa.',
                'Mantenimento costante dell\'Ancor Point sicuro.',
                'Rispetto della direzione del vento (accensione dal basso).'
            ]
        },
        {
            id: 'mopup',
            title: '3. BONIFICA E DEBRIEFING',
            color: 'green',
            items: [
                'Bonifica completa del perimetro (acqua e mezzi manuali).',
                'Verifica assenza di "fumaioli" attivi nel raggio di 30m.',
                'Raffreddamento punti caldi interni.',
                'Debriefing finale con la squadra e chiusura operazione.'
            ]
        }
    ]
};
