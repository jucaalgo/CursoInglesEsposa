import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';
import { Sparkles, ArrowRight, BookOpen, Globe } from 'lucide-react';

const Landing: React.FC = () => {
    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4 space-y-12 animate-in-up">
            {/* Hero Section */}
            <div className="space-y-6 max-w-4xl mx-auto mt-12">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mx-auto"
                     style={{ background: 'var(--accent-primary-muted)', color: 'var(--accent-primary)' }}>
                    <Sparkles className="w-4 h-4" />
                    Profesoria
                </div>
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-tight" style={{ color: 'var(--text-primary)' }}>
                    CURSO DE INGLÉS DISEÑADO POR <br className="hidden md:block" />
                    <span style={{ color: 'var(--accent-primary)' }}>JUAN ALVARADO</span>
                </h1>
                <p className="text-lg md:text-2xl max-w-2xl mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    Domina el inglés de forma natural y acelerada con lecciones interactivas, práctica conversacional con IA y un plan de estudios estructurado.
                </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-lg mx-auto pt-4">
                <Link to="/signup" className="w-full">
                    <Button size="lg" className="w-full h-16 text-xl rounded-2xl shadow-xl group" style={{ background: 'var(--accent-primary)', boxShadow: 'var(--shadow-accent)' }}>
                        Comenzar Ahora <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </Link>
                <Link to="/login" className="w-full">
                    <Button variant="secondary" size="lg" className="w-full h-16 text-xl rounded-2xl" style={{ border: '2px solid var(--border-default)' }}>
                        Ya tengo cuenta
                    </Button>
                </Link>
            </div>

            {/* Features Preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-16 max-w-4xl mx-auto w-full pb-12">
                <div className="p-8 rounded-3xl text-left card-hover card-glow" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
                    <BookOpen className="w-10 h-10 mb-4" style={{ color: 'var(--accent-primary)' }} />
                    <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Metodología Probada</h3>
                    <p style={{ color: 'var(--text-secondary)' }} className="leading-relaxed">Aprende paso a paso con una estructura diseñada para resultados reales y rápidos.</p>
                </div>
                <div className="p-8 rounded-3xl text-left card-hover card-glow" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
                    <Globe className="w-10 h-10 mb-4" style={{ color: 'var(--accent-secondary)' }} />
                    <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Inglés del Mundo Real</h3>
                    <p style={{ color: 'var(--text-secondary)' }} className="leading-relaxed">Enfócate en vocabulario y expresiones que usarás en tu vida diaria desde el primer día.</p>
                </div>
            </div>
        </div>
    );
};

export default Landing;
