import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, User, Home as HomeIcon, Settings, GraduationCap } from 'lucide-react';
import { cn } from './Button';
import SettingsModal from './SettingsModal';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="flex flex-col min-h-screen bg-gray-950 text-gray-100 font-inter selection:bg-indigo-500/30">
            <Navbar />
            <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-6 lg:p-8 pb-20 md:pb-8 animate-in fade-in duration-500">
                {children}
            </main>
            <Footer />
        </div>
    );
};

const NavItem = ({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) => {
    const location = useLocation();
    const isActive = location.pathname === to;
    return (
        <Link
            to={to}
            className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-1 rounded-xl transition-all duration-300 w-full md:w-auto",
                isActive
                    ? "text-indigo-400 font-semibold bg-indigo-500/10"
                    : "text-gray-400 hover:text-white"
            )}
        >
            <Icon className={cn("w-6 h-6 md:w-5 md:h-5", isActive && "stroke-[2.5px]")} />
            <span className="text-[10px] md:text-xs font-medium uppercase tracking-wider">{label}</span>
        </Link>
    );
};

const Navbar = () => {
    const [showSettings, setShowSettings] = React.useState(false);

    return (
        <>
            {/* Top Navigation (Desktop Header) */}
            <header className="sticky top-0 z-50 w-full border-b border-gray-800 bg-gray-950/80 backdrop-blur supports-[backdrop-filter]:bg-gray-950/60 hidden md:block">
                <div className="max-w-5xl mx-auto flex h-16 items-center justify-between px-6">
                    <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
                        <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                            Profesoria
                        </span>
                    </Link>
                    <div className="flex items-center gap-6">
                        <nav className="flex items-center gap-2">
                            <NavItem to="/" icon={HomeIcon} label="Home" />
                            <NavItem to="/academy" icon={GraduationCap} label="Academy" />
                            <NavItem to="/practice" icon={BookOpen} label="Practice" />
                            <NavItem to="/profile" icon={User} label="Profile" />
                        </nav>

                        <button
                            onClick={() => setShowSettings(true)}
                            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors"
                            title="Settings"
                        >
                            <Settings className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Header (Simplified) */}
            <header className="md:hidden sticky top-0 z-50 flex h-14 items-center justify-between px-4 border-b border-gray-800 bg-gray-950/90 backdrop-blur">
                <Link to="/" className="font-bold text-lg tracking-tight">
                    <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                        Profesoria
                    </span>
                </Link>
                <button
                    onClick={() => setShowSettings(true)}
                    className="p-2 text-gray-400"
                >
                    <Settings className="w-5 h-5" />
                </button>
            </header>

            {/* Bottom Navigation (Mobile Only) */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-lg border-t border-gray-800 pb-safe">
                <div className="flex justify-around items-center h-16 px-1">
                    <NavItem to="/" icon={HomeIcon} label="Home" />
                    <NavItem to="/academy" icon={GraduationCap} label="Academy" />
                    <NavItem to="/practice" icon={BookOpen} label="Practice" />
                    <NavItem to="/profile" icon={User} label="Profile" />
                </div>
            </nav>

            <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
        </>
    );
};

const Footer = () => (
    <footer className="border-t border-gray-800 py-6 md:py-8">
        <div className="max-w-5xl mx-auto px-4 text-center text-sm text-gray-500">
            <p>© {new Date().getFullYear()} Profesoria AI. Powered by Gemini.</p>
        </div>
    </footer>
);

export default Layout;
