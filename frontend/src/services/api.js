import axios from 'axios';
import { format } from 'date-fns'; // Thư viện date-fns để định dạng ngày giờ

import URLS from './url'; 

// Tạo biến lưu URL cơ sở của API resource_service
const API_BASE_URL = 'http://localhost:8000/api/v1';

// Tạo instance axios với cấu hình mặc định
const apiResourceService = axios.create({
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

// Tạo instance axios với cấu hình mặc định cho repair_service
const apiRepairService = axios.create({
    baseURL: 'http://localhost:8002/api/v1',
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
            const response = await apiResourceService.get(URLS.SERVICE_TYPE.GET_ALL_SERVICE_TYPES);
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
            const response = await apiResourceService.get(URLS.SERVICE.GET_SERVICE_TYPE_BY_ID.replace('{service-type-id}', id));
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
            const response = await apiResourceService.post('/service-types/create', serviceData);
            return response.data;
        } catch (error) {
            console.error('Lỗi khi tạo dịch vụ mới:', error);
            throw error;
        }
    },

    // Lấy service theo srvice_type_id
    getServiceFollowTypeId: async (serviceTypeId) => {
        try {
            const response = await apiResourceService.get(URLS.SERVICE.GET_SERVICES_BY_SERVICE_TYPE_ID.replace('{service_type_id}', serviceTypeId));
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
                const response = await apiResourceService.post(URLS.STAFF.LOGIN, { email, password });
                return response;
            } catch (error) {
                console.error('Lỗi khi đăng nhập nhân viên:', error);
                throw error;
            }
        },

        getStaffById: async (id) => {
            try {
                const response = await apiResourceService.get(URLS.STAFF.GET_STAFF_BY_ID.replace('{staff_id}', id));
                return response;
            } catch (error) {
                console.error(`Lỗi khi lấy thông tin nhân viên ID=${id}:`, error);
                throw error;
            }
        },

        getAllTechnicians: async () => {
            try {
                const response = await apiResourceService.get(URLS.STAFF.FILTER + '?role=technician');
                return response;
            }
            catch (error) {
                console.error('api - Lỗi khi lấy danh sách nhân viên:', error);
                throw error;
            }
        },
    },

    part: {
        getAllParts: async (query) => {
            try {
                const response = await apiResourceService.get(URLS.PART.GET_ALL_PARTS, {
                    params: query
            });
                return response;
            } catch (error) {
                console.error('api - Lỗi khi lấy danh sách phụ tùng:', error);
                throw error;
            }
        },
        
        getPartById: async (id) => {
            try {
                const response = await apiResourceService.get(URLS.PART.GET_PART_BY_ID.replace('{part_id}', id));
                return response;
            } catch (error) {
                console.error(`api - Lỗi khi lấy thông tin phụ tùng ID=${id}:`, error);
                throw error;
            }
        }
    },

    service: {
        getAllServices: async () => {
            try {
                const response = await apiResourceService.get('/services');
                return response;
            } catch (error) {
                console.error('Lỗi khi lấy danh sách dịch vụ:', error);
                throw error;
            }
        },
        
        getServiceById: async (id) => {
            try {
                const response = await apiResourceService.get(`/services/${id}`);
                return response;
            } catch (error) {
                console.error(`Lỗi khi lấy thông tin dịch vụ ID=${id}:`, error);
                throw error;
            }
        }
    },

    partMotoType: {
        getAllPartMotoTypes: async (query) => {
            try {
                const response = await apiResourceService.get(URLS.PART_MOTO_TYPE.GET_ALL_PART_MOTO_TYPES, {
                    params: query
                });
                return response;
            } catch (error) {
                console.error('api - Lỗi khi lấy danh sách phụ tùng:', error);
                throw error;
            }
        },
        getAllPartMotoTypesByMotoTypeId: async (motoTypeId) => {
            try {
                const response = await apiResourceService.get(URLS.PART_MOTO_TYPE.GET_ALL_PART_MOTO_TYPES_BY_MOTOTYPE_ID.replace('{moto_type_id}', motoTypeId));
                return response;
            } catch (error) {
                console.error('api - Lỗi khi lấy danh sách phụ tùng theo loại xe:', error);
                throw error;
            }
        },

        getPartMotoTypeByPartIdAndMototypeId: async (partId, motoTypeId) => {
            try {
                const response = await apiResourceService.get(URLS.PART_MOTO_TYPE.GET_PART_MOTO_TYPE_BY_PART_ID_AND_MOTOTYPE_ID.replace('{part_id}', partId).replace('{moto_type_id}', motoTypeId));
                return response;
            } catch (error) {
                console.error(`api - Lỗi khi lấy thông tin phụ tùng theo ID=${partId} và loại xe=${motoTypeId}:`, error);
                throw error;
            }
        }
    },

    serviceMotoType: {
        getAllServiceMotoTypes: async (query) => {
            try {
                const response = await apiResourceService.get(URLS.SERVICE_MOTO_TYPE.GET_ALL_SERVICE_MOTO_TYPES, {
                    params: query
            });
                return response;
            } catch (error) {
                console.error('api - Lỗi khi lấy danh sách dịch vụ:', error);
                throw error;
            }
        },
        getAllServiceMotoTypesByMotoTypeId: async (motoTypeId) => {
            try {
                const response = await apiResourceService.get(URLS.SERVICE_MOTO_TYPE.GET_ALL_SERVICE_MOTO_TYPES_BY_MOTOTYPE_ID.replace('{moto_type_id}', motoTypeId));
                return response;
            } catch (error) {
                console.error('api - Lỗi khi lấy danh sách dịch vụ theo loại xe:', error);
                throw error;
            }
        },

        getServiceMotoTypeByServiceIdAndMototypeId: async (serviceId, motoTypeId) => {
            try {
                const response = await apiResourceService.get(URLS.SERVICE_MOTO_TYPE.GET_SERVICE_MOTO_TYPE_BY_SERVICE_ID_AND_MOTOTYPE_ID.replace('{service_id}', serviceId).replace('{moto_type_id}', motoTypeId));
                return response;
            } catch (error) {
                console.error(`api - Lỗi khi lấy thông tin dịch vụ theo ID=${serviceId} và loại xe=${motoTypeId}:`, error);
                throw error;
            }
        }
    },

    invoice: {
        createInvoice: async (data) => {
            try {
                const response = await apiResourceService.post(URLS.INVOICE.CREATE, data);
                return response;
            } catch (error) {
                console.error('api - Lỗi khi tạo hóa đơn:', error);
                throw error;
            }
        },

        getAllInvoices: async () => {
            try {
                const response = await apiResourceService.get(URLS.INVOICE.GET_ALL_INVOICES);
                return response;
            } catch (error) {
                console.error('api - Lỗi khi lấy danh sách hóa đơn hôm nay:', error);
                throw error;
            }
        },

        updateInvoice: async (invoiceId, data) => {
            try {
                const response = await apiResourceService.put(URLS.INVOICE.UPDATE_INVOICE.replace('{invoice_id}', invoiceId), data);
                return response;
            } catch (error) {
                console.error(`api - Lỗi khi cập nhật hóa đơn ID=${invoiceId}:`, error);
                throw error;
            }
        },
    }
};

const customerService = {
    // Lấy tất cả khách hàng
    // getAllCustomers: async () => {
    //     try {
    //         const response = await apiResourceService.get('customer/get-all-customers');
    //         return response.data;
    //     } catch (error) {
    //         console.error('Lỗi khi lấy danh sách khách hàng:', error);
    //         throw error;
    //     }
    // },

    // Lấy thông tin chi tiết của một khách hàng theo ID
    // getCustomerById: async (id) => {
    //     try {
    //         const response = await apiResourceService.get(`customer/${id}`);
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
            console.error('api - Lỗi khi tạo khách hàng mới:', error);
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
        createCustomer: async (data) => {
            try {
                const response = await apiCustomerService.post(URLS.CUSTOMER.CREATE_CUSTOMER, data);
                return response;
            } catch (error) {
                console.error('api - Lỗi khi tạo khách hàng mới:', error);
                throw error;
            }
        },

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
        },

        getCustomerWithMotorcyclesByPhone: async (phone) => {
            try {
                const response = await apiCustomerService.get(URLS.CUSTOMER.GET_CUSTOMER_WITH_MOTORCYCLES.replace('{phone_num}', phone));
                return response;
            } catch (error) {
                console.error(`Lỗi khi lấy thông tin khách hàng và xe theo số điện thoại ${phone}:`, error);
                throw error;
            }
        }
    },

    motorcycle: {
        createMotorcycle: async (data) => {
            try {
                const response = await apiCustomerService.post(URLS.MOTORCYCLE.CREATE_MOTORCYCLE, data);
                return response;
            }
            catch (error) {
                console.error('api - Lỗi khi tạo xe máy mới:', error);
                throw error;
            }
        },
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

        getAllMotorcycleByCustomerId: async (customerId) => {
            try {
                const response = await apiCustomerService.get(URLS.MOTORCYCLE.GET_ALL_MOTORCYCLE_BY_CUSTOMER_ID.replace('{customer_id}', customerId));
                return response;
            } catch (error) {
                console.error(`Lỗi khi lấy danh sách xe máy của khách hàng ID=${customerId}:`, error);
                throw error;
            }
        }
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

        getAllAppointments: async (query) => {
            try {
                const response = await apiCustomerService.get(URLS.APPOINTMENT.GET_ALL, {
                    params: query
                });
                return response;
            } catch (error) {
                console.error('Lỗi khi lấy danh sách lịch hẹn:', error);
                throw error;
            }
        },
        
        // Lấy lịch hẹn của khách hàng
        getCustomerAppointments: async (customerId) => {
            try {
                const response = await apiCustomerService.get(`/appointment/customer/${customerId}`);
                return response;
            } catch (error) {
                console.error(`Lỗi khi lấy lịch hẹn của khách hàng ID=${customerId}:`, error);
                throw error;
            }
        },
        
        updateAppointment: async (appointmentId, data) => {
            try {
                const response = await apiCustomerService.put(URLS.APPOINTMENT.UPDATE_APPOINTMENT.replace('{appointment_id}', appointmentId), data);
                return response;
            } catch (error) {
                console.error(`Lỗi khi cập nhật lịch hẹn ID=${appointmentId}:`, error);
                throw error;
            }
        }
    },

    reception: {
        createReception: async (formData) => {
            try {
                const receptionData = {
                    customer_id: formData.customerId,
                    note: formData.note,
                    initial_conditon: formData.initialCondition,
                    motocycle_id: formData.motocycleId,
                    staff_id: formData.staffId
                };
                const response = await apiCustomerService.post(URLS.RECEPTION.CREATE, receptionData);
                return response;
            } catch (error) {
                console.error('api - Lỗi khi tạo lễ tân:', error);
                throw error;
            }
        },
        createReceptionWithoutMotorcycleId: async (formData) => {
            try {
                const receptionData = {
                    customer_id: formData.customerId,
                    note: formData.note,
                    initial_conditon: formData.initialCondition,
                    staff_id: formData.staffId,
                    moto_type_id: formData.motoTypeId,
                    model: formData.motorcycleModel,
                    brand: formData.brand,
                    license_plate: formData.plateNumberManual || formData.plateNumber,
                };
                const response = await apiCustomerService.post(URLS.RECEPTION.CREATE_WITHOUT_MOTORCYCLE_ID, receptionData);
                return response;
            } catch (error) {
                console.error('api - Lỗi khi tạo đơn tiếp nhận không ID xe:', error);
                throw error;
            }
        },

        createReceptionWithoutMotorcycleIdAndCustomerId: async (formData) => {
            try {
                const receptionData = {
                    email: formData.email,
                    fullname: formData.customerName,
                    phone_num: formData.phone,

                    note: formData.note,
                    initial_conditon: formData.initialCondition,

                    staff_id: formData.staffId,
                    
                    moto_type_id: formData.motoTypeId,
                    model: formData.motorcycleModel,
                    brand: formData.brand,
                    license_plate: formData.plateNumber,

                    images: []
                };
                const response = await apiCustomerService.post(URLS.RECEPTION.CREATE_WITHOUT_CUSTOMER_ID_AND_WITHOUT_MOTORCYCLE_ID, receptionData);
                return response;
            } catch (error) {
                console.error('api - Lỗi khi tạo đơn tiếp nhận không ID xe và ID khách:', error);
                throw error;
            }
        },

        getAllReceptionists: async () => {
            try {
                const response = await apiCustomerService.get(URLS.RECEPTION.GET_ALL);
                return response;
            } catch (error) {
                console.error('api - Lỗi khi lấy danh sách lễ tân:', error);
                throw error;
            }
        },

        getAllReceptions: async (query) => {
            try {
                const response = await apiCustomerService.get(URLS.RECEPTION.GET_ALL, {
                    params: query
                });
                return response;
            } catch (error) {
                console.error('api - Lỗi khi lấy danh sách đơn tiếp nhận:', error);
                throw error;
            }
        },

        getReceptionById: async (id) => {
            try {
                const response = await apiCustomerService.get(URLS.RECEPTION.GET_RECEPTION_BY_ID.replace('{form_id}', id));
                return response;
            } catch (error) {
                console.error(`api - Lỗi khi lấy thông tin đơn tiếp nhận ID=${id}:`, error);
                throw error;
            }
        }, 

        updateReception: async (receptionId, data) => {
            try {
                const response = await apiCustomerService.put(URLS.RECEPTION.UPDATE.replace('{form_id}', receptionId), data);
                return response;
            } catch (error) {
                console.error(`api - Lỗi khi cập nhật đơn tiếp nhận ID=${receptionId}:`, error);
                throw error;
            }
        },

        updateReceptionReturn: async (receptionId, query) => {
            try {
                const response = await apiCustomerService.put(URLS.RECEPTION.UPDATE_RETURN.replace('{form_id}', receptionId), {}, {
                    params: query
                });
                return response;
            } catch (error) {
                console.error(`api - Lỗi khi cập nhật trạng thái đơn tiếp nhận ID=${receptionId}:`, error);
                throw error;
            }
        },
    }
};

const repairService = {
    order: {
        createOrder: async (formData) => {
            try {
                const orderData = {
                        motocycle_id: formData.motocycleId,
                    };
                const response = await apiRepairService.post(URLS.ORDER.CREATE_ORDER, orderData);
                return response;
            } catch (error) {
                console.error('api - Lỗi khi tạo đơn hàng:', error);
                throw error;
            }
        },

        createOrder2: async (data) => {
            try {
                const response = await apiRepairService.post(URLS.ORDER.CREATE_ORDER, data);
                return response;
            } catch (error) {
                console.error('api - Lỗi khi tạo đơn hàng:', error);
                throw error;
            }
        },

        getAllOrders: async (query) => {
            try {
                const response = await apiRepairService.get(URLS.ORDER.GET_ALL_ORDERS, {
                    params: query
                });
                return response;
            } catch (error) {
                console.error('api - Lỗi khi lấy danh sách đơn hàng:', error);
                throw error;
            }
        },

        getAllOrdersByStaffIdToday: async (staffId) => {
            try {
                const response = await apiRepairService.get(URLS.ORDER.GET_ALL_ORDERS_BY_STAFF_ID_TODAY.replace('{staff_id}', staffId));
                return response;
            } catch (error) {
                console.error(`api - Lỗi khi lấy danh sách đơn hàng của nhân viên ID=${staffId} hôm nay:`, error);
                throw error;
            }
        },

        asignStaffToOrder: async (orderId, staffId) => {
            try {
                const response = await apiRepairService.put(URLS.ORDER.ASSIGN_STAFF.replace('{order_id}', orderId).replace('{staff_id}', staffId));
                return response;
            } catch (error) {
                console.error(`api - Lỗi khi phân công nhân viên cho đơn hàng ID=${orderId}:`, error);
                throw error;
            }
        },

        getAllOrdersByMotorcycleId: async (motorcycleId) => {
            try {
                const response = await apiRepairService.get(URLS.ORDER.GET_ALL_ORDERS_BY_MOTO_ID.replace('{motocycle_id}', motorcycleId));
                return response;
            } catch (error) {
                console.error(`api - Lỗi khi lấy các đơn hàng bởi motorcycleID=${motorcycleId}`, error);
                throw error;
            }
        },

        getOrderById: async (orderId) => {
            try {
                const response = await apiRepairService.get(URLS.ORDER.GET_ORDER_BY_ID.replace('{order_id}', orderId));
                return response;
            } catch (error) {
                console.error(`api - Lỗi khi lấy thông tin đơn hàng ID=${orderId}:`, error);
                throw error;
            }
        },

        // Lấy đơn hàng của kỹ thuật viên
        getOrdersByStaffId: async (staffId) => {
            try {
                const response = await apiRepairService.get(`/orders/staff/${staffId}`);
                return response;
            } catch (error) {
                console.error(`Lỗi khi lấy đơn hàng của kỹ thuật viên ID=${staffId}:`, error);
                throw error;
            }
        },
        
        // Cập nhật trạng thái đơn hàng
        updateOrderStatus: async (orderId, status) => {
            try {
                const response = await apiRepairService.put(URLS.ORDER.UPDATE_ORDER.replace('{order_id}', orderId), {
                    status: status
                });
                return response;
            } catch (error) {
                console.error(`api - Lỗi khi cập nhật trạng thái đơn hàng ID=${orderId}:`, error);
                throw error;
            }
        },

        updateOrder: async (orderId, data) => {
            try {
                const response = await apiRepairService.put(URLS.ORDER.UPDATE_ORDER.replace('{order_id}', orderId), data);
                return response;
            } catch (error) {
                console.error(`Lỗi khi cập nhật đơn hàng ID=${orderId}:`, error);
                throw error;
            }
        },
    },
    
    diagnosis: { 
        createDiagnosis: async (fromId, orderId) => {
            try {
                const diagnosisData = {
                    order_id: orderId,
                    form_id: fromId,
                };
                const response = await apiRepairService.post(URLS.DIAGNOSIS.CREATE_DIAGNOSIS, diagnosisData);
                return response;
            } catch (error) {
                console.error('api - Lỗi khi tạo chẩn đoán:', error);
                throw error;
            }
        },
        getAllDiagnosis: async (query) => {
            try {
                const response = await apiRepairService.get(URLS.DIAGNOSIS.GET_ALL_DIAGNOSIS, {
                    params: query
                });
                return response;
            } catch (error) {
                console.error('api - Lỗi khi lấy danh sách chẩn đoán:', error);
                throw error;
            }
        },
        getDiagnosisByOrderId: async (orderId) => {
            try {
                const response = await apiRepairService.get(URLS.DIAGNOSIS.GET_DIAGNOSIS_BY_ORDER_ID.replace('{order_id}', orderId));
                return response;
            } catch (error) {
                console.error(`api - Lỗi khi lấy thông tin chẩn đoán cho đơn hàng ID=${orderId}:`, error);
                throw error;
            }
        },
        updateDiagnosis: async (diagnosisId, problem, estimatedCost) => {
            try {
                // console.log('diagnosisId:', problem); // Log để kiểm tra
                const response = await apiRepairService.put(URLS.DIAGNOSIS.UPDATE_DIAGNOSIS.replace('{diagnosis_id}', diagnosisId), {
                    problem: problem,
                    estimated_cost: estimatedCost
                });
                return response;
            } catch (error) {
                console.error(`api - Lỗi khi cập nhật chẩn đoán ID=${diagnosisId}:`, error);
                throw error;
            }
        }
    },

    partOrderDetail: {
        createPartOrderDetail: async (listPartOrderDetail) => {
            try {
                const response = await apiRepairService.post(URLS.PART_ORDER_DETAIL.CREATE_PART_ORDER_DETAILS, listPartOrderDetail);
                return response;
            } catch (error) {
                console.error('api - Lỗi khi tạo chi tiết phụ tùng cho đơn hàng:', error);
                throw error;
            }
        },
        getAllPartOrderDetailsByOrderId: async (orderId) => {
            try {
                const response = await apiRepairService.get(URLS.PART_ORDER_DETAIL.GET_ALL_PART_ORDER_DETAILS_BY_ORDER.replace('{order_id}', orderId));             
                return response;
            } catch (error) {
                console.error('api - Lỗi khi lấy danh sách chi tiết phụ tùng:', error);
                throw error;
            }
        },
        updatePartOrderDetail: async (partOrderDetailId, data) => {
            try {
                const response = await apiRepairService.put(URLS.PART_ORDER_DETAIL.UPDATE_PART_ORDER_DETAIL.replace('{part_detail_ID}', partOrderDetailId), data);
                return response;
            } catch (error) {
                console.error(`api - Lỗi khi cập nhật chi tiết phụ tùng ID=${partOrderDetailId}:`, error);
                throw error;
            }
        }
    },

    serviceOrderDetail: {
        createServiceOrderDetail: async (listServiceOrderDetail) => {
            try {
                const response = await apiRepairService.post(URLS.SERVICE_ORDER_DETAIL.CREATE_SERVICE_ORDER_DETAILS, listServiceOrderDetail);
                return response;
            } catch (error) {
                console.error('api - Lỗi khi tạo chi tiết dịch vụ cho đơn hàng:', error);
                throw error;
            }
        },
        getAllServiceOrderDetailsByOrderId: async (orderId) => {
            try {
                const response = await apiRepairService.get(URLS.SERVICE_ORDER_DETAIL.GET_SERVICE_ORDER_DETAILS_BY_ORDER.replace('{order_id}', orderId));             
                return response;
            } catch (error) {
                console.error('api - Lỗi khi lấy danh sách chi tiết dịch vụ:', error);
                throw error;
            }
        },

        updateServiceOrderDetail: async (serviceOrderDetailId, data) => {
            try {
                console.log(serviceOrderDetailId, URLS.SERVICE_ORDER_DETAIL.UPDATE_SERVICE_ORDER_DETAIL.replace('{service_detail_ID}', serviceOrderDetailId));
                const response = await apiRepairService.put(URLS.SERVICE_ORDER_DETAIL.UPDATE_SERVICE_ORDER_DETAIL.replace('{service_detail_ID}', serviceOrderDetailId), data);
                return response;
            } catch (error) {
                console.error(`api - Lỗi khi cập nhật chi tiết dịch vụ ID=${serviceOrderDetailId}:`, error);
                throw error;
            }
        }
    },
};

export { customerService, resourceService, repairService };
