import React from 'react';
import { Routes, Route } from 'react-router-dom';

import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Services from './pages/Services';
import Booking from './pages/Booking';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Profile from './pages/auth/Profile';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import './App.css';

// Admin imports
import AdminLayout from './admin/components/AdminLayout';
import Dashboard from './admin/pages/Dashboard';
import BookingManagement from './admin/pages/BookingManagement';
import ServiceManagement from './admin/pages/ServiceManagement';
import UserManagement from './admin/pages/UserManagement';
import Reports from './admin/pages/Reports';
import Settings from './admin/pages/Settings';
import AdminProfile from './admin/pages/Profile';

function App() {
    return (
        <AuthProvider>
            <div className="App d-flex flex-column min-vh-100">
                <Header />
                <main className="flex-grow-1">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/services" element={<Services />} />
                        <Route path="/about" element={<About />} />
                        <Route path="/contact" element={<Contact />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/booking" element={<Booking />} />
                        <Route
                            path="/profile"
                            element={
                                <PrivateRoute>
                                    <Profile />
                                </PrivateRoute>
                            }
                        />
                        
                        {/* Admin Routes */}
                        <Route 
                            path="/admin"
                            element={
                                <PrivateRoute>
                                    <AdminLayout />
                                </PrivateRoute>
                            }
                        >
                            <Route index element={<Dashboard />} />
                            <Route path="dashboard" element={<Dashboard />} />
                            <Route path="bookings" element={<BookingManagement />} />
                            <Route path="bookings/:id" element={<BookingManagement />} />
                            <Route path="bookings/create" element={<BookingManagement />} />
                            <Route path="services" element={<ServiceManagement />} />
                            <Route path="users" element={<UserManagement />} />
                            <Route path="reports" element={<Reports />} />
                            <Route path="settings" element={<Settings />} />
                            <Route path="profile" element={<AdminProfile />} />
                        </Route>
                    </Routes>
                </main>
                <Footer />
            </div>
        </AuthProvider>
    );
}

export default App;
