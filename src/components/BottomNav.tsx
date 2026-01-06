'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, ClipboardList, Home, Users, GraduationCap } from 'lucide-react';

export default function BottomNav() {
    const pathname = usePathname();

    // Hide on landing, login, register, and root (if redirects)
    const hiddenRoutes = ['/', '/landing', '/login', '/register'];

    // Also hide if strictly one of these
    if (hiddenRoutes.includes(pathname)) {
        return null;
    }

    // Define navigation items: Home, Checklist, Team, Training, Profilo
    const navItems = [
        {
            name: 'Home',
            href: '/report',
            icon: Home
        },
        {
            name: 'Checklist',
            href: '/checklist',
            icon: ClipboardList
        },
        {
            name: 'Team',
            href: '/team',
            icon: Users
        },
        {
            name: 'Training',
            href: '/training',
            icon: GraduationCap
        },
        {
            name: 'Profilo',
            href: '/profile',
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
