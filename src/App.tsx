import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Practice from './pages/Practice';
import Academy from './pages/Academy';
import Lesson from './pages/Lesson';
import Profile from './pages/Profile';
import Layout from './components/Layout';
import './index.css';

const App: React.FC = () => {
    return (
        <Router>
            <Layout>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/practice" element={<Practice />} />
                    <Route path="/academy" element={<Academy />} />
                    <Route path="/academy/lesson/:topic" element={<Lesson />} />
                    <Route path="/profile" element={<Profile />} />
                </Routes>
            </Layout>
        </Router>
    );
};

export default App;
