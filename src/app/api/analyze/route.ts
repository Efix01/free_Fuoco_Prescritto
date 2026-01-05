
import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || '',
});

export async function POST(req: Request) {
    if (!process.env.GROQ_API_KEY) {
        return NextResponse.json({ error: 'GROQ_API_KEY non configurata' }, { status: 500 });
    }

    try {
        const body = await req.json();
        const { temp, humidity, wind, slope, fuelModel, location, fuelMoisture, aspect } = body;

        const prompt = `
        Agisci come un esperto GAUF (Gruppo Analisi Uso Fuoco) della Sardegna.
        Esegui un'analisi tattica basata sul **Campbell Prediction System (CPS)**.

        DATI AMBIENTALI:
        - Località: ${location}
        - Temperatura: ${temp}°C
        - Umidità Relativa Aria: ${humidity}%
        - Vento: ${wind} km/h
        - Pendenza: ${slope}%
        - Modello Combustibile: ${fuelModel}
        - Umidità Combustibile (Fine Dead Fuel): ${fuelMoisture}%
        - Esposizione (Aspect): ${aspect}

        RICHIESTA:
        1. Valuta l'**Allineamento delle Forze** (Pendenza, Vento, Preriscaldamento Solare).
        2. Determina se l'esposizione (${aspect}) è "In Allineamento" o "Fuori Allineamento" con il momento della giornata (assumi orario attuale).
        3. Stima il Comportamento del Fuoco (ROS stimato e Lunghezza Fiamma).
        4. Fornisci la Prescrizione Operativa di sicurezza base LACES.

        Calcola una stima della velocità di propagazione (ROS) e dai un parere sulla sicurezza dell'operazione.
        Fornisci:
        1. Livello di Rischio (Basso, Medio, Alto, Estremo)
        2. Analisi tecnica sintetica
        3. Prescrizione operativa (cosa fare/non fare)

        Rispondi in italiano tecnico ma chiaro. Formatta la risposta in Markdown leggero.
        `;

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            model: 'llama-3.3-70b-versatile',
        });

        const aiText = completion.choices[0]?.message?.content || "Nessuna risposta generata.";

        return NextResponse.json({ result: aiText });

    } catch (error) {
        console.error('Groq API Error:', error);
        return NextResponse.json({ error: 'Errore durante l\'analisi AI' }, { status: 500 });
    }
}
