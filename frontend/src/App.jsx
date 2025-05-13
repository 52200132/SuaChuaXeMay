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
import UserPrivateRoute from './components/UserPrivateRoute';
import './App.css';

// import contexts
import { DataProvider } from './contexts/DataContext';
import AppDataProvider from './admin/contexts/AppDataContext';
import { StaffAuthProvider } from './admin/contexts/StaffAuthContext';
import { PusherProvider } from './contexts/PusherContext';
import { UserDataProvider } from './contexts/UserDataContext';

// Admin imports
import AdminLayout from './admin/components/AdminLayout';
import Dashboard from './admin/pages/Dashboard';
import BookingManagement from './admin/pages/BookingManagement';
import ServiceManagement from './admin/pages/ServiceManagement';
import UserManagement from './admin/pages/UserManagement';
import Reports from './admin/pages/Reports';
import Settings from './admin/pages/Settings';
import AdminProfile from './admin/pages/Profile';
import StaffLogin from './admin/pages/Login';
import ReceiptManagement from './admin/pages/ReceiptManagement/ReceiptManagement';
import OrderManagement from './admin/pages/OrderManagement';
import WarehouseManagement from './admin/pages/WarehouseManagement';
import TechnicianDashboard from './admin/pages/TechnicianDashboard';
// Thêm import cho trang hóa đơn
import InvoiceManagement from './admin/pages/InvoiceManagement';

// Import the new components
import ServiceDetail from './pages/ServiceDetail';
import NotFound from './pages/NotFound';
import ComingSoon from './components/ComingSoon';

import TestNotificationSender from './components/TestNotificationSender';
import NotificationCenter from './components/NotificationCenter';

function App() {
    return (
        <AuthProvider>
            <DataProvider>

                    <StaffAuthProvider>
                        <PusherProvider>
                            <div className="App d-flex flex-column min-vh-100">

                                <Routes>
                                    {/* Staff Login Route - No Header/Footer */}
                                    <Route path="/admin/login" element={
                                        //<StaffAuthProvider>
                                            <StaffLogin />
                                        // </StaffAuthProvider>
                                    } />

                                    {/* Admin Routes - No Header/Footer */}
                                    <Route
                                        path="/admin"
                                        element={
                                            // <StaffAuthProvider>
                                                <PrivateRoute>
                                                    <AppDataProvider>
                                                        <AdminLayout />
                                                    </AppDataProvider>
                                                </PrivateRoute>
                                            // </StaffAuthProvider>
                                        }
                                    >
                                        <Route index element={<Dashboard />} />
                                        <Route path="notification" element={<NotificationCenter/>} />
                                        <Route path="test-notification" element={<TestNotificationSender/>} />
                                        <Route path="dashboard" element={<Dashboard />} />
                                        <Route path="bookings" element={<BookingManagement />} />
                                        <Route path="bookings/:id" element={<BookingManagement />} />
                                        <Route path="bookings/create" element={<BookingManagement />} />
                                        <Route path="receipts" element={<ReceiptManagement />} />
                                        <Route path="warehouse" element={<WarehouseManagement />} />
                                        <Route path="orders" element={<OrderManagement />} />
                                        <Route path="orders/:id/print" element={<OrderManagement />} />
                                        <Route path="orders/create" element={<OrderManagement />} />
                                        <Route path="technician-dashboard" element={<TechnicianDashboard />} />
                                        <Route path="services" element={<ServiceManagement />} />
                                        <Route path="users" element={<UserManagement />} />
                                        <Route path="reports" element={<Reports />} />
                                        <Route path="settings" element={<Settings />} />
                                        <Route path="profile" element={<AdminProfile />} />
                                        {/* Thêm route hóa đơn */}
                                        <Route path="invoices" element={<InvoiceManagement />} />
                                    </Route>

                                    {/* Client Routes - With Header/Footer */}
                                    <Route path="*" element={
                                        <>
                                            <Header />
                                            <main className="flex-grow-1">
                                                <Routes>
                                                    <Route path="/" element={<Home />} />
                                                    <Route path="/services" element={<Services />} />
                                                    <Route path="/services/:id" element={<ServiceDetail />} />
                                                    <Route path="/about" element={<About />} />
                                                    <Route path="/contact" element={<Contact />} />
                                                    <Route path="/login" element={<Login />} />
                                                    <Route path="/register" element={<Register />} />
                                                    <Route path="/booking" element={<Booking />} />
                                                    <Route
                                                        path="/profile"
                                                        element={
                                                            <UserPrivateRoute>
                                                                <UserDataProvider>
                                                                    <Profile />
                                                                </UserDataProvider>
                                                            </UserPrivateRoute>
                                                        }
                                                    />

                                                    {/* Coming Soon Routes for features that are not yet implemented */}
                                                    <Route path="/shop" element={
                                                        <ComingSoon
                                                            title="Cửa hàng phụ tùng sắp ra mắt"
                                                            description="Chúng tôi đang xây dựng cửa hàng phụ tùng trực tuyến. Bạn sẽ sớm có thể mua phụ tùng và phụ kiện xe máy trực tiếp từ website."
                                                        />
                                                    } />

                                                    <Route path="/blog" element={
                                                        <ComingSoon
                                                            title="Blog sắp ra mắt"
                                                            description="Chúng tôi đang xây dựng mục blog với những bài viết hữu ích về bảo dưỡng và sửa chữa xe máy."
                                                        />
                                                    } />

                                                    <Route path="/membership" element={
                                                        <ComingSoon
                                                            title="Chương trình thành viên sắp ra mắt"
                                                            description="Đăng ký thành viên để nhận nhiều ưu đãi hấp dẫn. Tính năng này sẽ sớm được ra mắt."
                                                        />
                                                    } />

                                                    {/* 404 Route - Must be the last route */}
                                                    <Route path="*" element={<NotFound />} />
                                                </Routes>
                                            </main>
                                            <Footer />
                                        </>
                                    } />
                                </Routes>
                            </div>
                        </PusherProvider>
                    </StaffAuthProvider>
                
            </DataProvider>
        </AuthProvider>
    );
}

export default App;
