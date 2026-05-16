import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';
import { Sparkles, ArrowRight, BookOpen, Globe, Zap, Bot, Shield, Star, CheckCircle } from 'lucide-react';

const Landing: React.FC = () => {
    return (
        <div className="min-h-[80vh] flex flex-col items-center text-center px-4 space-y-16 animate-in-up pb-24">
            {/* Hero Section */}
            <div className="space-y-6 max-w-4xl mx-auto mt-16">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mx-auto"
                     style={{ background: 'var(--accent-primary-muted)', color: 'var(--accent-primary)' }}>
                    <Sparkles className="w-4 h-4" />
                    Powered by Gemini AI
                </div>
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-tight" style={{ color: 'var(--text-primary)' }}>
                    CURSO DE INGLES DISEÑADO POR <br className="hidden md:block" />
                    <span style={{ color: 'var(--accent-primary)' }}>JUAN ALVARADO</span>
                </h1>
                <p className="text-lg md:text-2xl max-w-2xl mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    Domina el ingles de forma natural y acelerada con lecciones interactivas, practica conversacional con IA y un plan de estudios estructurado.
                </p>
            </div>

            {/* Social Proof Badge */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm" style={{ color: 'var(--text-muted)' }}>
                {['Correccion en tiempo real', 'Niveles A1-C2', 'IA + Tutores', 'Practica conversacional'].map((badge, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium"
                          style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                        <CheckCircle className="w-3.5 h-3.5" style={{ color: 'var(--success)' }} />
                        {badge}
                    </span>
                ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-lg mx-auto">
                <Link to="/signup" className="w-full">
                    <Button size="lg" className="w-full h-16 text-xl rounded-2xl shadow-xl group animate-pulse-glow"
                            style={{ background: 'var(--accent-primary)', boxShadow: 'var(--shadow-accent)' }}>
                        Comenzar Ahora Gratis <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </Link>
                <Link to="/login" className="w-full">
                    <Button variant="secondary" size="lg" className="w-full h-16 text-xl rounded-2xl" style={{ border: '2px solid var(--border-default)' }}>
                        Ya tengo cuenta
                    </Button>
                </Link>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto w-full">
                {[
                    { icon: Bot, title: 'IA Conversacional', desc: 'Practica speaking con Gemini AI. Correccion instantanea de pronunciacion, gramatica y vocabulario.', color: 'var(--accent-primary)' },
                    { icon: Star, title: 'Plan Personalizado', desc: 'Curriculum adaptativo segun tu nivel CEFR (A1-C2) e intereses. Cada leccion es unica para ti.', color: 'var(--accent-secondary)' },
                    { icon: Shield, title: 'Feedback Inmediato', desc: 'Cada error es una oportunidad. Recibe correcciones detalladas y explicaciones gramaticales al instante.', color: 'var(--success)' },
                    { icon: Zap, title: 'Modo Practica Rapida', desc: 'Sesiones cortas de alta intensidad. 5 minutos al dia son suficientes para mejorar.', color: 'var(--warning)' },
                    { icon: BookOpen, title: 'Academia Estructurada', desc: '50 modulos progresivos. Desde principiante hasta avanzado. Lecciones interactivas con ejercicios.', color: 'var(--accent-primary)' },
                    { icon: Globe, title: 'Ingles del Mundo Real', desc: 'Vocabulario y expresiones que usaras en viajes, trabajo y vida diaria. Nada de frases irrelevantes.', color: 'var(--accent-secondary)' },
                ].map((f, i) => (
                    <div key={i}
                         className="p-6 rounded-3xl text-left card-hover card-glow"
                         style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                             style={{ background: `${f.color}15`, color: f.color }}>
                            <f.icon className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{f.title}</h3>
                        <p style={{ color: 'var(--text-secondary)' }} className="text-sm leading-relaxed">{f.desc}</p>
                    </div>
                ))}
            </div>

            {/* Final CTA */}
            <div className="text-center space-y-4 py-8">
                <h2 className="text-2xl md:text-3xl font-black" style={{ color: 'var(--text-primary)' }}>
                    Estas Listo para hablar ingles con confianza?
                </h2>
                <p style={{ color: 'var(--text-muted)' }} className="max-w-md mx-auto">
                    Unete hoy y comienza tu viaje hacia la fluidez. No necesitas experiencia previa.
                </p>
                <Link to="/signup">
                    <Button size="lg" className="h-14 px-12 text-lg rounded-2xl shadow-xl mt-4"
                            style={{ background: 'var(--accent-primary)', boxShadow: 'var(--shadow-accent)' }}>
                        Empieza Gratis <ArrowRight className="ml-2" />
                    </Button>
                </Link>
            </div>
        </div>
    );
};

export default Landing;
