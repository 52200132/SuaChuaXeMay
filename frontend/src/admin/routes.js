import Dashboard from './pages/Dashboard';
import BookingManagement from './pages/BookingManagement';
import ReceiptManagement from './pages/ReceiptManagement/ReceiptManagement';
import ServiceManagement from './pages/ServiceManagement';
import UserManagement from './pages/UserManagement';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import OrderManagement from './pages/OrderManagement';
import TechnicianDashboard from './pages/TechnicianDashboard';
import InvoiceManagement from './pages/InvoiceManagement';
import OrderAssignment from './pages/OrderAssignment';
import WarehouseManagement from './pages/WarehouseManagement';

// Routes cho vai trò receptionist (tiếp tân)
export const receptionistRoutes = [
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
        path: '/admin/receipts',
        component: ReceiptManagement,
        name: 'Quản lý đơn tiếp nhận',
        icon: 'bi bi-file-earmark-text',
        exact: true,
    },
    {
        path: '/admin/orders',
        component: OrderManagement,
        name: 'Quản lý đơn hàng',
        icon: 'bi bi-cart3',
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

// Routes cho vai trò head technician (kỹ thuật viên trưởng)
export const head_technicianRoutes = [
    {
        path: '/admin/dashboard',
        component: Dashboard,
        name: 'Dashboard',
        icon: 'bi bi-speedometer2',
        exact: true,
    },
    {
        path: '/admin/technician-dashboard',
        component: TechnicianDashboard,
        name: 'Đơn hàng của tôi',
        icon: 'bi bi-wrench',
        exact: true,
    },
    {
        path: '/admin/orders',
        component: OrderAssignment,
        name: 'Phân công đơn hàng',
        icon: 'bi bi-cart3',
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

// Routes cho vai trò technician (kỹ thuật viên)
export const warehouse_workerRoutes = [
    {
        path: '/admin/dashboard',
        component: Dashboard,
        name: 'Dashboard',
        icon: 'bi bi-speedometer2',
        exact: true,
    },
    {
        path: '/admin/warehouse',
        component: WarehouseManagement,
        name: 'Quản lý kho',
        icon: 'bi bi-box',
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

// Routes cho vai trò technician (kỹ thuật viên)
export const technicianRoutes = [
    {
        path: '/admin/dashboard',
        component: Dashboard,
        name: 'Dashboard',
        icon: 'bi bi-speedometer2',
        exact: true,
    },
    {
        path: '/admin/technician-dashboard',
        component: TechnicianDashboard,
        name: 'Đơn hàng của tôi',
        icon: 'bi bi-wrench',
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

// Routes cho vai trò cashier (thu ngân)
export const cashierRoutes = [
    {
        path: '/admin/dashboard',
        component: Dashboard,
        name: 'Dashboard',
        icon: 'bi bi-speedometer2',
        exact: true,
    },
    // {
    //     path: '/admin/orders',
    //     component: OrderManagement,
    //     name: 'Quản lý đơn hàng',
    //     icon: 'bi bi-cart3',
    //     exact: true,
    // },
    {
        path: '/admin/invoices',
        component: InvoiceManagement,
        name: 'Quản lý hóa đơn',
        icon: 'bi bi-receipt',
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

// Routes cho vai trò manager (quản lý)
export const managerRoutes = [
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
        path: '/admin/receipts',
        component: ReceiptManagement,
        name: 'Quản lý đơn tiếp nhận',
        icon: 'bi bi-file-earmark-text',
        exact: true,
    },
    {
        path: '/admin/orders',
        component: OrderManagement,
        name: 'Quản lý đơn hàng',
        icon: 'bi bi-cart3',
        exact: true,
    },
    {
        path: '/admin/invoices',
        component: InvoiceManagement,
        name: 'Quản lý hóa đơn',
        icon: 'bi bi-receipt',
        exact: true,
    },
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
    {
        path: '/admin/profile',
        component: Profile,
        name: 'Thông tin cá nhân',
        icon: 'bi bi-person',
        exact: true,
    },
];

// Giữ lại các routes cũ để khả năng tương thích ngược
export const employeeRoutes = [...receptionistRoutes, ...head_technicianRoutes, ...technicianRoutes, ...warehouse_workerRoutes, ...cashierRoutes];
export const ownerRoutes = managerRoutes;
