
import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

// Inizializza Groq solo se c'è la chiave
const groqApiKey = process.env.GROQ_API_KEY;
const groq = groqApiKey ? new Groq({ apiKey: groqApiKey }) : null;

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { temp, humidity, wind, slope, fuelModel, location, fuelMoisture, aspect } = body;

        // --- SIMULAZIONE / FALLBACK (Se non c'è API Key) ---
        if (!groq) {
            console.log("GROQ_API_KEY mancante, uso simulazione locale.");
            const simulatedAnalysis = generateMockAnalysis({ temp, humidity, wind, slope, fuelModel, location, fuelMoisture, aspect });
            return NextResponse.json({ result: simulatedAnalysis });
        }

        // --- CHIAMATA AI REALE (Se c'è API Key) ---
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
        // Fallback in caso di errore API (es. quota superata)
        return NextResponse.json({
            result: "⚠️ **Errore servizio AI**\n\nImpossibile contattare l'intelligenza artificiale al momento. Riprova più tardi o verifica la connessione.\n\n_Nota: Questa è una risposta automatica di errore._"
        });
    }
}

// Funzione helper per generare una risposta plausibile senza AI
function generateMockAnalysis(data: any) {
    const { temp, humidity, wind, slope, fuelModel, location } = data;

    // Logica semplice per determinare il rischio simulato
    let riskLevel = "Basso";
    let ros = "Lento (< 1 m/min)";
    let fl = "Bassa (< 0.5 m)";

    const t = parseFloat(temp) || 20;
    const h = parseFloat(humidity) || 50;
    const w = parseFloat(wind) || 0;
    const s = parseFloat(slope) || 0;

    // Regole empiriche base per la simulazione
    if (t > 30 || w > 20 || (s > 30 && w > 10)) {
        riskLevel = "Alto";
        ros = "Veloce (3-10 m/min)";
        fl = "Alta (> 1.5 m)";
    } else if (t > 25 || w > 10 || s > 20) {
        riskLevel = "Medio";
        ros = "Moderato (1-3 m/min)";
        fl = "Media (0.5 - 1.5 m)";
    }

    return `
### 🌲 Analisi Simulata (Modalità Offline)

**⚠️ Nota:** Questa è un'analisi automatica basata su regole deterministiche (AI non configurata).

#### 1. Livello di Rischio: **${riskLevel}**

#### 2. Allineamento delle Forze
*   **Vento/Pendenza:** ${w > 10 && s > 10 ? "Allineati (Fattore critico)" : "Non critico"}
*   **Comportamento Stimato:**
    *   **ROS (Velocità):** ${ros}
    *   **Lunghezza Fiamma:** ${fl}

#### 3. Prescrizione Operativa (LAKES)
*   **L (Lookout):** Mantenere vedetta costante.
*   **A (Anchor Point):** Partire sempre da zona sicura (es. strada, zona bruciata).
*   **C (Communications):** Radio test prima dell'accensione.
*   **E (Escape Routes):** Identificare vie di fuga per ogni operatore.
*   **S (Safety Zones):** Zone sicure accessibili in meno di 2 minuti.

_Configura una API Key per ottenere analisi AI dettagliate._
    `.trim();
}
