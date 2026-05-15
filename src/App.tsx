import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './hooks/useTheme';
import { AuthGate } from './components/AuthGate';
import { ToastContainer } from './components/Toast';
import LoginPage from './pages/Auth/LoginPage';
import SignupPage from './pages/Auth/SignupPage';
import Home from './pages/Home';
import Layout from './components/Layout';
import './index.css';

const Practice = React.lazy(() => import('./pages/Practice'));
const Academy = React.lazy(() => import('./pages/Academy'));
const Lesson = React.lazy(() => import('./pages/Lesson'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Leaderboard = React.lazy(() => import('./pages/Leaderboard'));
const Onboarding = React.lazy(() => import('./pages/Onboarding'));
const ErrorJournal = React.lazy(() => import('./components/ErrorJournal'));

const PageLoader = () => (
    <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }} />
        <p style={{ color: 'var(--text-muted)' }} className="font-medium animate-pulse">Loading...</p>
    </div>
);

const App: React.FC = () => {
    return (
        <AuthProvider>
            <ThemeProvider>
                <ToastProvider>
                    <Router>
                        <Layout>
                            <Suspense fallback={<PageLoader />}>
                                <Routes>
                                    <Route path="/" element={<Home />} />
                                    <Route path="/login" element={<LoginPage />} />
                                    <Route path="/signup" element={<SignupPage />} />
                                    <Route path="/practice" element={<AuthGate><Practice /></AuthGate>} />
                                    <Route path="/academy" element={<AuthGate><Academy /></AuthGate>} />
                                    <Route path="/academy/lesson/:topic" element={<AuthGate><Lesson /></AuthGate>} />
                                    <Route path="/profile" element={<AuthGate><Profile /></AuthGate>} />
                                    <Route path="/leaderboard" element={<AuthGate><Leaderboard /></AuthGate>} />
                                    <Route path="/onboarding" element={<AuthGate><Onboarding /></AuthGate>} />
                                    <Route path="/errors" element={<AuthGate><ErrorJournal /></AuthGate>} />
                                </Routes>
                            </Suspense>
                        </Layout>
                    </Router>
                    <ToastContainer />
                </ToastProvider>
            </ThemeProvider>
        </AuthProvider>
    );
};

export default App;