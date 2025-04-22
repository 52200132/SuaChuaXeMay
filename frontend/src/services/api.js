import axios from 'axios';
import { format } from 'date-fns'; // Thư viện date-fns để định dạng ngày giờ

import URLS from './url'; 

// Tạo biến lưu URL cơ sở của API resource_service
const API_BASE_URL = 'http://localhost:8000/api/v1';

// Tạo instance axios với cấu hình mặc định
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    },
    timeout: 10000 // Timeout 10 giây
});

const apiCustomerService = axios.create({
    baseURL: 'http://localhost:8001/api/v1',
    headers: {
        'Content-Type': 'application/json'
    },
    timeout: 10000 // Timeout 10 giây
});

// Object chứa các hàm gọi API
const resourceService = {
    // Lấy tất cả các loại dịch vụ
    getAllServiceTypes: async () => {
        try {
            const response = await apiClient.get(URLS.SERVICE.GET_ALL_SERVICE_TYPE);
            // console.log('Dữ liệu dịch vụ:', response.data); // Log dữ liệu để kiểm tra
            const serviceTypes = response.data;
            // console.log('serviceTypes:', serviceTypes); // Log dữ liệu để kiểm tra
            return serviceTypes;
        } catch (error) {
            console.error('Lỗi khi lấy danh sách dịch vụ:', error);
            throw error;
        }
    },

    // Lấy thông tin chi tiết của một loại dịch vụ theo ID
    getServiceTypeById: async (id) => {
        try {
            const response = await apiClient.get(URLS.SERVICE.GET_SERVICE_TYPE_BY_ID.replace('{service-type-id}', id));
            // console.log('Dữ liệu dịch vụ theo ID:', response.data); // Log dữ liệu để kiểm tra
            return response.data;
        } catch (error) {
            console.error(`Lỗi khi lấy thông tin dịch vụ ID=${id}:`, error);
            throw error;
        }
    },

    // Tạo một loại dịch vụ mới
    createServiceType: async (serviceData) => {
        try {
            const response = await apiClient.post('/service-types/create', serviceData);
            return response.data;
        } catch (error) {
            console.error('Lỗi khi tạo dịch vụ mới:', error);
            throw error;
        }
    },

    // Lấy service theo srvice_type_id
    getServiceFollowTypeId: async (serviceTypeId) => {
        try {
            const response = await apiClient.get(URLS.SERVICE.GET_SERVICES_BY_SERVICE_TYPE_ID.replace('{service_type_id}', serviceTypeId));
            // console.log('Dữ liệu dịch vụ theo loại:', response.data); // Log dữ liệu để kiểm tra
            return response.data;
        } catch (error) {
            console.error(`Lỗi khi lấy dịch vụ theo ID=${serviceTypeId}:`, error);
            throw error;
        }
    },

    // Có thể thêm các hàm khác như updateServiceType, deleteServiceType nếu cần

    staff: {
        login: async (email, password) => {
            try {
                const response = await apiClient.post(URLS.STAFF.LOGIN, { email, password });
                return response;
            } catch (error) {
                console.error('Lỗi khi đăng nhập nhân viên:', error);
                throw error;
            }
        }
    }
};

const customerService = {
    // Lấy tất cả khách hàng
    // getAllCustomers: async () => {
    //     try {
    //         const response = await apiClient.get('customer/get-all-customers');
    //         return response.data;
    //     } catch (error) {
    //         console.error('Lỗi khi lấy danh sách khách hàng:', error);
    //         throw error;
    //     }
    // },

    // Lấy thông tin chi tiết của một khách hàng theo ID
    // getCustomerById: async (id) => {
    //     try {
    //         const response = await apiClient.get(`customer/${id}`);
    //         return response.data;
    //     } catch (error) {
    //         console.error(`Lỗi khi lấy thông tin khách hàng ID=${id}:`, error);
    //         throw error;
    //     }
    // },

    // Tạo một khách hàng mới
    createCustomer: async (formCustomerData) => {
        try {
            const customerData = {
                fullname: formCustomerData.displayName,
                email: formCustomerData.email,
                password: formCustomerData.password,
                phone_num: formCustomerData.phone,
                is_guest: true
                // Thêm các trường khác nếu cần
            };
            const response = await apiCustomerService.post(URLS.CUSTOMER.CREATE_CUSTOMER, customerData);
            return response;
        } catch (error) {
            console.error('Lỗi khi tạo khách hàng mới:', error);
            // return false; // Trả về false nếu có lỗi xảy ra
            throw error;
        }
    },

    login: async (email, password) => {
        try {
            const response = await apiCustomerService.post(URLS.CUSTOMER.LOGIN, { email, password });
            return response;
        } catch (error) {
            console.error('Lỗi khi đăng nhập:', error);
            throw error;
        }
    },

    customer: {
        getCustomerById: async (id) => {
            try {
                const response = await apiCustomerService.get(URLS.CUSTOMER.GET_CUSTOMER_BY_ID.replace('{customer_id}', id));
                return response;
            } catch (error) {
                console.error(`Lỗi khi lấy thông tin khách hàng ID=${id}:`, error);
                throw error;
            }
        },

        getCustomerByPhone: async (phone) => {
            try {
                const response = await apiCustomerService.get(URLS.CUSTOMER.GET_CUSTOMER_BY_PHONE.replace('{phone_num}', phone));
                return response;
            } catch (error) {
                console.error(`Lỗi khi lấy thông tin khách hàng theo số điện thoại ${phone}:`, error);
                throw error;
            }
        }
    },

    motorcycle: {
        getAllServiceTypes: async () => {
            try {
                const response = await apiCustomerService.get(URLS.MOTORCYCLE.GET_ALL_MOTORCYCLE_TYPES);
                return response.data;
            } catch (error) {
                console.error('Lỗi khi lấy danh sách loại xe máy:', error);
                throw error;
            }
        },

        getMotorcycleById: async (id) => {
            try {
                const response = await apiCustomerService.get(URLS.MOTORCYCLE.GET_MOTORCYCLE_BY_ID.replace('{motorcycle_id}', id));
                return response;
            } catch (error) {
                console.error(`Lỗi khi lấy thông tin xe máy ID=${id}:`, error);
                throw error;
            }
        },
    },

    appointment: {
        createAppointment: async (formData) => {
            try {
                const appointmentDate = new Date(`${formData.date} ${formData.time}`);
                const formattedDate = format(appointmentDate, 'yyyy-MM-dd HH:mm:ss');
                // console.log('Ngày giờ lịch hẹn:', appointmentDate); // Log ngày giờ để kiểm tra
                const appointmentData = {
                    customer_id: formData.customer_id,
                    service_type_id: formData.service_type_id,
                    appointment_date: formattedDate,
                    note: formData.note
                };
                // console.log('Dữ liệu lịch hẹn:', appointmentData); // Log dữ liệu để kiểm tra
                const response = await apiCustomerService.post(URLS.APPOINTMENT.CREATE, appointmentData);
                return response;
            } catch (error) {
                console.error('api - Lỗi khi tạo lịch hẹn:', error);
                throw error;
            }
        },

        getAllTodayAppointments: async () => {
            try {
                const response = await apiCustomerService.get(URLS.APPOINTMENT.GET_ALL_TODAY);
                return response;
            } catch (error) {
                console.error('Lỗi khi lấy danh sách lịch hẹn hôm nay:', error);
                throw error;
            }
        },

        getAllAppointments: async () => {
            try {
                const response = await apiCustomerService.get(URLS.APPOINTMENT.GET_ALL);
                return response;
            } catch (error) {
                console.error('Lỗi khi lấy danh sách lịch hẹn:', error);
                throw error;
            }
        },
    },

    reception: {
        getAllReceptionists: async () => {
            try {
                const response = await apiCustomerService.get(URLS.RECEPTION.GET_ALL);
                return response;
            } catch (error) {
                console.error('Lỗi khi lấy danh sách lễ tân:', error);
                throw error;
            }
        }
    }
};

export { customerService, resourceService };
