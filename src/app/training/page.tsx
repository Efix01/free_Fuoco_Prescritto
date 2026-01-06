'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, GraduationCap, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export default function TrainingPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const exampleQuestions = [
        "Come si calcola il ROS nel Campbell Prediction System?",
        "Cosa significa LACES e come si applica sul campo?",
        "Quali sono i fattori chiave per l'allineamento delle forze?",
        "Come valutare l'umidità del combustibile fine?",
    ];

    const sendMessage = async (content?: string) => {
        const messageContent = content || input.trim();
        if (!messageContent || isLoading) return;

        const userMessage: Message = { role: 'user', content: messageContent };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, userMessage].map(m => ({
                        role: m.role,
                        content: m.content
                    }))
                })
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            const aiMessage: Message = {
                role: 'assistant',
                content: data.message
            };

            setMessages(prev => [...prev, aiMessage]);
        } catch (error: any) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `❌ Errore: ${error.message || 'Impossibile contattare il servizio AI.'}`
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gradient-to-br from-green-50 to-green-100">
            {/* Header */}
            <header className="bg-green-800 text-white p-4 shadow-lg flex items-center gap-3">
                <Link href="/report" className="p-2 hover:bg-green-700 rounded-full transition-colors">
                    <ArrowLeft size={24} />
                </Link>
                <GraduationCap size={28} />
                <div>
                    <h1 className="text-xl font-bold">Training Simulator</h1>
                    <p className="text-green-200 text-xs">Istruttore AI GAUF</p>
                </div>
            </header>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 pb-32">
                {messages.length === 0 && (
                    <div className="max-w-2xl mx-auto">
                        <div className="bg-white rounded-xl p-6 shadow-md mb-4">
                            <h2 className="font-bold text-lg mb-2 text-gray-800">👋 Benvenuto al Training Simulator</h2>
                            <p className="text-sm text-gray-600 mb-4">
                                Sono un istruttore AI specializzato in fuoco prescritto e Campbell Prediction System.
                                Fai domande su tecniche operative, sicurezza, calcoli o scenari reali.
                            </p>
                            <p className="text-xs text-gray-500">Prova con una di queste domande:</p>
                        </div>

                        <div className="space-y-2">
                            {exampleQuestions.map((question, i) => (
                                <button
                                    key={i}
                                    onClick={() => sendMessage(question)}
                                    className="w-full bg-white hover:bg-green-50 text-left p-3 rounded-lg shadow-sm border border-gray-200 transition-colors text-sm"
                                >
                                    💡 {question}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={`mb-4 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[85%] md:max-w-[70%] rounded-2xl p-4 shadow-md ${msg.role === 'user'
                                    ? 'bg-green-700 text-white'
                                    : 'bg-white text-gray-800'
                                }`}
                        >
                            {msg.role === 'assistant' && (
                                <div className="flex items-center gap-2 mb-2 text-green-700 font-semibold text-sm">
                                    <GraduationCap size={16} />
                                    <span>Istruttore GAUF</span>
                                </div>
                            )}
                            <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                                {msg.content}
                            </div>
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start mb-4">
                        <div className="bg-white rounded-2xl p-4 shadow-md">
                            <div className="flex items-center gap-2 text-gray-500">
                                <Loader2 className="animate-spin" size={16} />
                                <span className="text-sm">L'istruttore sta pensando...</span>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area - Fixed Bottom */}
            <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
                <div className="max-w-4xl mx-auto flex gap-2">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Scrivi la tua domanda..."
                        className="flex-1 resize-none border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-green-600 text-sm"
                        rows={1}
                        disabled={isLoading}
                    />
                    <button
                        onClick={() => sendMessage()}
                        disabled={!input.trim() || isLoading}
                        className="bg-green-700 text-white p-3 rounded-xl hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                    </button>
                </div>
            </div>
        </div>
    );
}
