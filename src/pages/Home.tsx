import React from 'react';
import { Link } from 'react-router-dom';
import { useUserProfile } from '../hooks/useUserProfile';
import Button from '../components/Button';
import { ArrowRight, BookOpen } from 'lucide-react';

const Home: React.FC = () => {
    const { profile, loading } = useUserProfile();

    return (
        <div className="flex flex-col items-center justify-center py-12 md:py-24 text-center space-y-8">
            <div className="space-y-4 max-w-2xl animate-in slide-in-from-bottom-5 duration-700">
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                    Master English with <span className="text-indigo-500">AI</span>
                </h1>
                <p className="text-xl text-gray-400">
                    {loading ? 'Welcome back!' : `Welcome back, ${profile?.name || 'Student'}!`}
                    <br />
                    Ready to continue your journey to fluency?
                </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center animate-in slide-in-from-bottom-5 delay-200 duration-700">
                <Link to="/practice">
                    <Button size="lg" className="w-full sm:w-auto gap-2 group">
                        Start Practice
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </Link>
                <Link to="/profile">
                    <Button variant="secondary" size="lg" className="w-full sm:w-auto gap-2">
                        <BookOpen className="w-4 h-4" />
                        View Progress
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 text-left w-full">
                {features.map((feature, i) => (
                    <Link
                        key={i}
                        to={feature.route}
                        className="block p-6 rounded-2xl bg-gray-900/50 border border-gray-800 hover:border-indigo-500/50 hover:bg-gray-800/50 transition-all duration-300 group"
                    >
                        <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
                            {feature.icon}
                        </div>
                        <h3 className="text-lg font-semibold mb-2 group-hover:text-indigo-400 transition-colors">{feature.title}</h3>
                        <p className="text-sm text-gray-400 leading-relaxed">{feature.desc}</p>
                        <span className="inline-block mt-3 text-xs text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            Explore →
                        </span>
                    </Link>
                ))}
            </div>
        </div>
    );
};

const features = [
    {
        title: "Real Conversations",
        desc: "Practice speaking with an AI that understands context, nuance, and corrects your pronunciation in real-time.",
        icon: <span className="text-xl">💬</span>,
        route: "/practice"
    },
    {
        title: "Personalized Curriculum",
        desc: "Lessons adapt to your proficiency level and interests, ensuring you learn what matters most to you.",
        icon: <span className="text-xl">📚</span>,
        route: "/academy"
    },
    {
        title: "Instant Feedback",
        desc: "Get immediate corrections on grammar and vocabulary to improve faster than traditional methods.",
        icon: <span className="text-xl">⚡</span>,
        route: "/practice"
    }
];

export default Home;

