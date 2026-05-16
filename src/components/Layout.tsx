import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, User, Home as HomeIcon, Settings, GraduationCap, Palette, AlertTriangle } from 'lucide-react';
import { cn } from './Button';
import SettingsModal from './SettingsModal';
import ThemeSelector from './ThemeSelector';
import ConnectionBanner from './ConnectionBanner';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="flex flex-col min-h-screen font-inter selection:bg-[var(--accent-primary-muted)]"
             style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
            <ConnectionBanner />
            <Navbar />
            <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-6 lg:p-8 pb-24 md:pb-8 animate-in">
                {children}
            </main>
            <Footer />
        </div>
    );
};

const NavItem = ({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) => {
    const location = useLocation();
    const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
    return (
        <Link
            to={to}
            className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-1 rounded-xl transition-all duration-300 w-full md:w-auto relative",
                isActive
                    ? "font-semibold"
                    : ""
            )}
            style={{
                color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                background: isActive ? 'var(--accent-primary-muted)' : 'transparent',
            }}
        >
            <Icon className={cn("w-6 h-6 md:w-5 md:h-5 transition-transform duration-200", isActive && "stroke-[2.5px]")} />
            <span className="text-[10px] md:text-xs font-medium uppercase tracking-wider">{label}</span>
            {isActive && (
                <div className="absolute -bottom-1 w-1 h-1 rounded-full" style={{ background: 'var(--accent-primary)' }} />
            )}
        </Link>
    );
};

const Navbar = () => {
    const [showSettings, setShowSettings] = React.useState(false);

    return (
        <>
            {/* Top Navigation (Desktop Header) */}
            <header
                className="sticky top-0 z-50 w-full hidden md:block"
                style={{
                    borderBottom: '1px solid var(--border-default)',
                    background: 'var(--glass)',
                    backdropFilter: 'blur(12px)',
                }}
            >
                <div className="max-w-5xl mx-auto flex h-16 items-center justify-between px-6">
                    <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
                        <span style={{ color: 'var(--accent-primary)' }} className="font-black italic">
                            Profesoria
                        </span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <nav className="flex items-center gap-1">
                            <NavItem to="/" icon={HomeIcon} label="Home" />
                            <NavItem to="/academy" icon={GraduationCap} label="Academy" />
                            <NavItem to="/practice" icon={BookOpen} label="Practice" />
                            <NavItem to="/errors" icon={AlertTriangle} label="Errors" />
                            <NavItem to="/profile" icon={User} label="Profile" />
                        </nav>

                        <div className="flex items-center gap-1 pl-2" style={{ borderLeft: '1px solid var(--border-default)' }}>
                            <ThemeSelector />
                            <button
                                onClick={() => setShowSettings(true)}
                                className="p-2.5 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95"
                                style={{ color: 'var(--text-muted)' }}
                                title="Settings"
                            >
                                <Settings className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Header */}
            <header
                className="md:hidden sticky top-0 z-50 flex h-14 items-center justify-between px-4"
                style={{
                    borderBottom: '1px solid var(--border-default)',
                    background: 'var(--glass)',
                    backdropFilter: 'blur(12px)',
                }}
            >
                <Link to="/" className="font-bold text-lg tracking-tight">
                    <span style={{ color: 'var(--accent-primary)' }} className="font-black italic">
                        Profesoria
                    </span>
                </Link>
                <div className="flex items-center gap-1">
                    <ThemeSelector />
                    <button
                        onClick={() => setShowSettings(true)}
                        className="p-2"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        <Settings className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* Bottom Navigation (Mobile) */}
            <nav
                className="md:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe"
                style={{
                    borderTop: '1px solid var(--border-default)',
                    background: 'var(--glass)',
                    backdropFilter: 'blur(16px)',
                }}
            >
                <div className="flex justify-around items-center h-16 px-1">
                    <NavItem to="/" icon={HomeIcon} label="Home" />
                    <NavItem to="/academy" icon={GraduationCap} label="Academy" />
                    <NavItem to="/practice" icon={BookOpen} label="Practice" />
                    <NavItem to="/errors" icon={AlertTriangle} label="Errors" />
                    <NavItem to="/profile" icon={User} label="Profile" />
                </div>
            </nav>

            <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
        </>
    );
};

const Footer = () => (
    <footer className="hidden md:block py-6 md:py-8" style={{ borderTop: '1px solid var(--border-default)' }}>
        <div className="max-w-5xl mx-auto px-4 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            <p>© {new Date().getFullYear()} Profesoria AI. Powered by Gemini.</p>
        </div>
    </footer>
);

export default Layout;