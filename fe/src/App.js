import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import PhongTro from './pages/PhongTro';
import AboutUs from './pages/AboutUs';
import Callback from './pages/Callback';
import Dashboard from './pages/Dashboard';
import Header from './components/Header';
import { AuthProvider } from './contexts/AuthProvider';
import './styles/global.css';

function App() {
    return (
        <Router>
            <AuthProvider>
                <Header />
                <main>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/phong-tro" element={<PhongTro />} />
                        <Route path="/about-us" element={<AboutUs />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/callback" element={<Callback />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                    </Routes>
                </main>
            </AuthProvider>
        </Router>
    );
}

export default App;
