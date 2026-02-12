import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import LoginPage from './pages/Auth/LoginPage';
import SignupPage from './pages/Auth/SignupPage';
import Home from './pages/Home';
import Practice from './pages/Practice';
import Academy from './pages/Academy';
import Lesson from './pages/Lesson';
import Profile from './pages/Profile';
import Leaderboard from './pages/Leaderboard';
import Layout from './components/Layout';
import './index.css';

const App: React.FC = () => {
    return (
        <AuthProvider>
            <Router>
                <Layout>
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/signup" element={<SignupPage />} />

                        {/* Protected Routes */}
                        <Route path="/practice" element={<ProtectedRoute><Practice /></ProtectedRoute>} />
                        <Route path="/academy" element={<ProtectedRoute><Academy /></ProtectedRoute>} />
                        <Route path="/academy/lesson/:topic" element={<ProtectedRoute><Lesson /></ProtectedRoute>} />
                        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                        <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
                    </Routes>
                </Layout>
            </Router>
        </AuthProvider>
    );
};

export default App;

