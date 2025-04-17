import Dashboard from './pages/Dashboard';
import BookingManagement from './pages/BookingManagement';
import ServiceManagement from './pages/ServiceManagement';
import UserManagement from './pages/UserManagement';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Profile from './pages/Profile';

// Xác định các route có thể truy cập cho tất cả nhân viên (bao gồm cả nhân viên cơ bản)
export const employeeRoutes = [
    {
        path: '/admin/dashboard',
        component: Dashboard,
        name: 'Dashboard',
        icon: 'bi bi-speedometer2',
        exact: true,
    },
    {
        path: '/admin/bookings',
        component: BookingManagement,
        name: 'Quản lý đặt lịch',
        icon: 'bi bi-calendar-check',
        exact: true,
    },
    {
        path: '/admin/profile',
        component: Profile,
        name: 'Thông tin cá nhân',
        icon: 'bi bi-person',
        exact: true,
    },
];

// Xác định các route chỉ có thể truy cập bởi quản lý hoặc admin
export const ownerRoutes = [
    ...employeeRoutes,
    {
        path: '/admin/services',
        component: ServiceManagement,
        name: 'Quản lý dịch vụ',
        icon: 'bi bi-tools',
        exact: true,
    },
    {
        path: '/admin/users',
        component: UserManagement,
        name: 'Quản lý nhân viên',
        icon: 'bi bi-people',
        exact: true,
    },
    {
        path: '/admin/reports',
        component: Reports,
        name: 'Báo cáo & Thống kê',
        icon: 'bi bi-graph-up',
        exact: true,
    },
    {
        path: '/admin/settings',
        component: Settings,
        name: 'Cài đặt hệ thống',
        icon: 'bi bi-gear',
        exact: true,
    },
];
