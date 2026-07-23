import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Header from './components/Header';
import { AuthProvider } from './contexts/AuthProvider';
import './styles/global.css';

function App() {
    return (
        <AuthProvider>
            <Router>
                <Header />
                <main>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                    </Routes>
                </main>
            </Router>
        </AuthProvider>
    );
}

export default App;
