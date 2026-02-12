import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { saveProfile } from '../../services/repository';
import Button from '../../components/Button';
import { UserPlus, Mail, Lock, User, AlertCircle, Loader2 } from 'lucide-react';

const SignupPage: React.FC = () => {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // 1. Sign up with Supabase Auth
            const { data, error: authError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (authError) throw authError;

            if (data.user) {
                // 2. Create Profile
                // Note: In strict RLS, we might need to rely on a Trigger or ensure the policy allows INSERT
                const newProfile = {
                    username: data.user.id, // Using UID as username key for now to simplify migration
                    name: name,
                    current_level: 'A1',
                    target_level: 'B2',
                    xp_total: 0,
                    streak_count: 0,
                    interests: []
                };

                // We try to save the profile. 
                // If this fails due to RLS policies not yet being perfectly set up for new users,
                // we might need to handle it. Phase 2 plan assumes Migration script 01 handles policies.
                await saveProfile(data.user.id, newProfile);

                navigate('/academy');
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Signup failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-950">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-indigo-600/20 text-indigo-400 mb-4">
                        <UserPlus className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-white">Create Account</h1>
                    <p className="text-gray-400">Join thousands of English learners</p>
                </div>

                <form onSubmit={handleSignup} className="space-y-6">
                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-sm">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-500 uppercase tracking-wider ml-1">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-gray-900 border-2 border-gray-800 rounded-2xl pl-12 pr-4 py-3 text-white placeholder-gray-600 focus:border-indigo-500 focus:outline-none transition-colors"
                                    placeholder="John Doe"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-500 uppercase tracking-wider ml-1">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-gray-900 border-2 border-gray-800 rounded-2xl pl-12 pr-4 py-3 text-white placeholder-gray-600 focus:border-indigo-500 focus:outline-none transition-colors"
                                    placeholder="you@example.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-500 uppercase tracking-wider ml-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-gray-900 border-2 border-gray-800 rounded-2xl pl-12 pr-4 py-3 text-white placeholder-gray-600 focus:border-indigo-500 focus:outline-none transition-colors"
                                    placeholder="••••••••"
                                    minLength={6}
                                />
                            </div>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-14 text-lg font-bold rounded-2xl bg-indigo-600 hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20"
                    >
                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Start Learning'}
                    </Button>
                </form>

                <p className="text-center text-gray-500">
                    Already have an account?{' '}
                    <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-bold hover:underline">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default SignupPage;
