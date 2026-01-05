
"use client";

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const MapEditor = dynamic(() => import('@/components/MapEditor'), {
    loading: () => <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-[var(--primary)]" size={32} /></div>,
    ssr: false
});

export default function MapPage() {
    return (
        <div className="flex flex-col h-screen pt-0 pb-16 bg-[var(--background)]">
            {/* 
        Navbar is fixed at bottom (z-50) and has pb-safe. 
        MapEditor takes full remaining height.
      */}
            <MapEditor />
        </div>
    );
}
