'use client';

import { LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';

export default function TopHeader() {
    const router = useRouter();
    const pathname = usePathname();

    // Hide on landing, login, register pages
    const hiddenRoutes = ['/', '/landing', '/login', '/register'];
    if (hiddenRoutes.includes(pathname)) {
        return null;
    }

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Logout error:', error);
            alert('Errore durante il logout');
        } else {
            router.push('/login');
        }
    };

    return (
        <header className="fixed top-0 left-0 right-0 bg-green-800 text-white px-4 py-3 shadow-lg z-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <Image
                    src="/logo-cfv.png"
                    alt="Logo CFVA"
                    width={40}
                    height={40}
                />
                <div>
                    <h1 className="font-bold text-sm md:text-base">Corpo Forestale e di V.A.</h1>
                    <p className="text-[10px] text-green-200">Fuoco Prescritto</p>
                </div>
            </div>

            <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-3 py-2 rounded-lg text-xs font-bold transition-colors"
            >
                <LogOut size={16} />
                <span className="hidden sm:inline">ESCI</span>
            </button>
        </header>
    );
}
