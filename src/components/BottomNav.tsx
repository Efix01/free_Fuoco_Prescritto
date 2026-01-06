'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Map, FileText, Home } from 'lucide-react';

export default function BottomNav() {
    const pathname = usePathname();

    // Hide on landing, login, register, and root (if redirects)
    const hiddenRoutes = ['/', '/landing', '/login', '/register'];

    // Also hide if strictly one of these
    if (hiddenRoutes.includes(pathname)) {
        return null;
    }

    // Define navigation items
    const navItems = [
        {
            name: 'Home',
            href: '/profile', // Profile acts as Dashboard/Home
            icon: Home
        },
        {
            name: 'Mappa',
            href: '/map',
            icon: Map
        },
        {
            name: 'Segnalazione',
            href: '/report',
            icon: FileText
        },
        {
            name: 'Profilo',
            href: '/profile', // Redundant if Home is Profile, but requested. 
            // User asked for "Home, Mappa, Segnalazione, Profilo".
            // If Home = Profile, maybe we point Home to a Dashboard if we had one.
            // For now, let's make Home point to Profile, and Profile point to Profile.
            // Or better: Home -> /profile, and Profile -> /profile (maybe with anchor?)
            // Actually, having two buttons go to the same place is confusing.
            // Let's look at what the user said: "Barra di Navigazione in basso (con le icone Home, Mappa, Segnalazione, Profilo)"
            // Since we don't have a distinct "Dashboard" yet, maybe I'll just use Profile as Home.
            // I will implement all 4 but maybe Home and Profile link to same place or I just skip Profile if it's dup.
            // Let's stick to the 3 main ones: Dashboard(Profile), Map, Report. 
            // BUT the user explicitly approved "Home, Mappa, Segnalazione, Profilo". 
            // I'll add them all. Maybe Profilo can open a settings modal later?
            // For now both go to /profile.
            icon: User
        }
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-200 pb-safe z-50">
            <div className="flex justify-around items-center h-16">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    // Special case for duplicates to distinguish visual active state if needed, 
                    // but here strict path matching works.

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-green-700' : 'text-gray-400 hover:text-green-600'
                                }`}
                        >
                            <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                            <span className="text-[10px] font-medium">{item.name}</span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
