import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, User, Home as HomeIcon, Settings, GraduationCap } from 'lucide-react';
import { cn } from './Button';
import SettingsModal from './SettingsModal';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="flex flex-col min-h-screen bg-gray-950 text-gray-100 font-inter selection:bg-indigo-500/30">
            <Navbar />
            <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-6 lg:p-8 animate-in fade-in duration-500">
                {children}
            </main>
            <Footer />
        </div>
    );
};

const Navbar = () => {
    const location = useLocation();

    const NavItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => {
        const isActive = location.pathname === to;
        return (
            <Link
                to={to}
                className={cn(
                    "flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-3 py-2 rounded-md transition-all duration-200 w-full md:w-auto",
                    isActive
                        ? "text-indigo-400 font-medium"
                        : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                )}
            >
                <Icon className={cn("w-5 h-5 md:w-4 md:h-4", isActive && "fill-current/20")} />
                <span className="text-[10px] md:text-sm">{label}</span>
            </Link>
        );
    };

    const [showSettings, setShowSettings] = React.useState(false);

    return (
        <>
            {/* Top Navigation (Desktop & Mobile Header) */}
            <header className="sticky top-0 z-50 w-full border-b border-gray-800 bg-gray-950/80 backdrop-blur supports-[backdrop-filter]:bg-gray-950/60">
                <div className="max-w-5xl mx-auto flex h-14 items-center justify-between px-4">
                    <Link to="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
                        <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                            Profesoria
                        </span>
                    </Link>
                    <div className="flex items-center gap-4">
                        {/* Desktop Nav Links */}
                        <nav className="hidden md:flex items-center gap-4">
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

            {/* Bottom Navigation (Mobile Only) */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gray-950/90 backdrop-blur border-t border-gray-800 pb-safe">
                <div className="flex justify-around items-center h-16 px-2">
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
