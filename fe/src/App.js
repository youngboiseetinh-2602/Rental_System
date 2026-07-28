import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import PhongTro from './pages/PhongTro';
import AboutUs from './pages/AboutUs';
import Callback from './pages/Callback';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Header from './components/Header';
import CustomerRoute from './components/CustomerRoute';
import AuthenticatedRoute from './components/AuthenticatedRoute';
import OwnerRoute from './components/OwnerRoute';
import OwnerDashboard from './pages/OwnerDashboard';
import OwnerProperties from './pages/OwnerProperties';
import OwnerPropertyCreate from './pages/OwnerPropertyCreate';
import OwnerPropertyDetail from './pages/OwnerPropertyDetail';
import RentalDetail from './pages/RentalDetail';
import CustomerRentalRequests from './pages/CustomerRentalRequests';
import OwnerRentalRequests from './pages/OwnerRentalRequests';
import Notifications from './pages/Notifications';
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
                        <Route path="/phong-tro/:rentalPropertyId" element={<RentalDetail />} />
                        <Route path="/about-us" element={<AboutUs />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/callback" element={<Callback />} />
                        <Route
                            path="/dashboard"
                            element={(
                                <CustomerRoute>
                                    <Dashboard />
                                </CustomerRoute>
                            )}
                        />
                        <Route
                            path="/yeu-cau-thue-tro"
                            element={(
                                <CustomerRoute>
                                    <CustomerRentalRequests />
                                </CustomerRoute>
                            )}
                        />
                        <Route
                            path="/thong-tin-ca-nhan"
                            element={(
                                <AuthenticatedRoute>
                                    <Profile />
                                </AuthenticatedRoute>
                            )}
                        />
                        <Route
                            path="/profile"
                            element={(
                                <AuthenticatedRoute>
                                    <Profile />
                                </AuthenticatedRoute>
                            )}
                        />
                        <Route
                            path="/notifications"
                            element={(
                                <AuthenticatedRoute>
                                    <Notifications />
                                </AuthenticatedRoute>
                            )}
                        />
                        <Route
                            path="/owner/dashboard"
                            element={(
                                <OwnerRoute>
                                    <OwnerDashboard />
                                </OwnerRoute>
                            )}
                        />
                        <Route
                            path="/owner/rental-requests"
                            element={(
                                <OwnerRoute>
                                    <OwnerRentalRequests />
                                </OwnerRoute>
                            )}
                        />
                        <Route
                            path="/owner/properties"
                            element={(
                                <OwnerRoute>
                                    <OwnerProperties />
                                </OwnerRoute>
                            )}
                        />
                        <Route
                            path="/owner/properties/new"
                            element={(
                                <OwnerRoute>
                                    <OwnerPropertyCreate />
                                </OwnerRoute>
                            )}
                        />
                        <Route
                            path="/owner/properties/:propertyId"
                            element={(
                                <OwnerRoute>
                                    <OwnerPropertyDetail />
                                </OwnerRoute>
                            )}
                        />
                    </Routes>
                </main>
            </AuthProvider>
        </Router>
    );
}

export default App;
