import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, MessageCircle, BookOpen, Mic, ArrowRight } from 'lucide-react';

const features = [
    {
        icon: MessageCircle,
        title: 'Smart Practice',
        description: 'Conversational AI that adapts to your level and corrects you in real time.',
    },
    {
        icon: BookOpen,
        title: 'Academy',
        description: 'Structured lessons from grammar fundamentals to advanced fluency.',
    },
    {
        icon: Mic,
        title: 'Pronunciation',
        description: 'Speech recognition feedback to help you sound like a native speaker.',
    },
] as const;

const SplashScreen: React.FC = () => (
    <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        <Loader2
            className="w-10 h-10 animate-spin"
            style={{ color: 'var(--accent-primary)' }}
        />
    </div>
);

const LandingScreen: React.FC = () => (
    <div
        className="flex flex-col items-center justify-center min-h-screen px-6 py-12 relative overflow-hidden"
        style={{ background: 'var(--bg-primary)' }}
    >
        {/* Background gradient orb */}
        <div
            className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.07] pointer-events-none"
            style={{
                background: `radial-gradient(circle, var(--accent-primary) 0%, transparent 70%)`,
            }}
        />

        {/* Content */}
        <div className="relative z-10 w-full max-w-lg flex flex-col items-center gap-10">
            {/* Logo & tagline */}
            <div className="flex flex-col items-center gap-3 animate-in">
                <span
                    className="text-5xl md:text-6xl font-black italic tracking-tight"
                    style={{ color: 'var(--accent-primary)' }}
                >
                    Profesoria
                </span>
                <p
                    className="text-xl md:text-2xl font-semibold tracking-tight text-center"
                    style={{ color: 'var(--text-primary)' }}
                >
                    Master English with AI
                </p>
            </div>

            {/* Feature cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full stagger-children">
                {features.map(({ icon: Icon, title, description }) => (
                    <div
                        key={title}
                        className="card-hover card-glow flex flex-col items-center gap-3 p-5 rounded-2xl text-center"
                        style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-default)',
                        }}
                    >
                        <div
                            className="flex items-center justify-center w-12 h-12 rounded-xl"
                            style={{ background: 'var(--accent-primary-muted)' }}
                        >
                            <Icon className="w-6 h-6" style={{ color: 'var(--accent-primary)' }} />
                        </div>
                        <h3
                            className="font-bold text-sm uppercase tracking-wider"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            {title}
                        </h3>
                        <p
                            className="text-xs leading-relaxed"
                            style={{ color: 'var(--text-muted)' }}
                        >
                            {description}
                        </p>
                    </div>
                ))}
            </div>

            {/* CTA */}
            <div className="flex flex-col items-center gap-4 w-full animate-in">
                <Link
                    to="/signup"
                    className="w-full max-w-xs flex items-center justify-center gap-2 h-14 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                        background: 'var(--accent-primary)',
                        color: 'var(--text-primary)',
                        boxShadow: 'var(--shadow-accent)',
                    }}
                >
                    Start Learning
                    <ArrowRight className="w-5 h-5" />
                </Link>

                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Already have an account?{' '}
                    <Link
                        to="/login"
                        className="font-semibold hover:underline transition-colors duration-200"
                        style={{ color: 'var(--accent-primary)' }}
                    >
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    </div>
);

export const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <SplashScreen />;
    }

    if (!user) {
        return <LandingScreen />;
    }

    return <>{children}</>;
};

export default AuthGate;