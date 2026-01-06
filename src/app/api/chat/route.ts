import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = process.env.GROQ_API_KEY
    ? new Groq({ apiKey: process.env.GROQ_API_KEY })
    : null;

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();

        if (!groq) {
            return NextResponse.json({
                error: 'API non configurata. Configura GROQ_API_KEY per abilitare il Training Simulator.'
            }, { status: 503 });
        }

        const systemPrompt = {
            role: 'system',
            content: `Sei un esperto istruttore GAUF (Gruppo Analisi Uso Fuoco) del Corpo Forestale della Sardegna.

COMPETENZE:
- Fuoco prescritto e Campbell Prediction System (CPS)
- Comportamento del fuoco (ROS, lunghezza fiamma, intensità)
- Allineamento forze (pendenza, vento, esposizione solare)
- Sicurezza operativa (LACES - Lookouts, Anchor points, Communications, Escape routes, Safety zones)
- Meteorologia operativa (umidità, temperatura, vento)
- Modelli di combustibile mediterraneo

ISTRUZIONI:
- Rispondi in italiano tecnico ma accessibile
- Fornisci esempi pratici e scenari reali della Sardegna
- Cita sempre principi tecnici quando rilevante
- Se non sei sicuro di qualcosa, dillo chiaramente
- Usa markdown per formattazione (elenchi puntati, grassetto, titoli)
- Priorità assoluta: SICUREZZA degli operatori

FORMATO RISPOSTE:
- Per calcoli: mostra formule e passaggi
- Per scenari: descrivi condizioni e decisioni operative
- Per concetti teorici: spiega + esempio pratico concreto
- Sii conciso ma completo

ESEMPI TEMATICHE:
- Campbell Prediction System (CPS)
- Calcolo ROS (Rate of Spread)
- Valutazione allineamento forze
- Prescrizioni operative LACES
- Condizioni meteo critiche
- Classificazione combustibili
- Zone sicurezza e vie di fuga`
        };

        const completion = await groq.chat.completions.create({
            messages: [systemPrompt, ...messages],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.7,
            max_tokens: 1500,
        });

        const aiMessage = completion.choices[0]?.message?.content;

        if (!aiMessage) {
            throw new Error('Nessuna risposta dall\'AI');
        }

        return NextResponse.json({
            message: aiMessage
        });

    } catch (error: any) {
        console.error('Chat API Error:', error);

        return NextResponse.json({
            error: 'Errore durante la comunicazione con l\'AI. Riprova più tardi.',
            details: error.message
        }, { status: 500 });
    }
}
