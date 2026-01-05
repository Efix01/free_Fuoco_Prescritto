import Link from 'next/link';
import { Home, Map, ClipboardList, User } from 'lucide-react';

export default function Navbar() {
    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-t-[var(--glass-border)] pb-safe">
            <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
                <NavLink href="/" icon={<Home size={24} />} label="Home" />
                <NavLink href="/map" icon={<Map size={24} />} label="Mappa" />
                <NavLink href="/report" icon={<ClipboardList size={24} />} label="Report" />
                <NavLink href="/profile" icon={<User size={24} />} label="Profilo" />
            </div>
        </nav>
    );
}

function NavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
    return (
        <Link href={href} className="flex flex-col items-center justify-center w-full h-full text-foreground/70 hover:text-primary active:text-primary transition-colors gap-1">
            {icon}
            <span className="text-[10px] font-medium">{label}</span>
        </Link>
    );
}
