import React, { createContext, useState, useContext, useCallback, useMemo, useEffect, useRef } from 'react';

import { customerService, repairService, resourceService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
// Tạo context
const UserDataContext = createContext();

// Custom hook để sử dụng context
export const useUserData = () => useContext(UserDataContext);

export const UserDataProvider = ({ children }) => {
    const hasDataLoaded = useRef(false);
    const { currentUser } = useAuth();

    // State cho các loại dữ liệu
    const [dataStore, setDataStore] = useState({
        orders: {},
        ordersIds: new Set(),

        receptions: {},
        receptionsIds: new Set(),

        motorcycles: {},
        motorcyclesIds: new Set(),

        appointments: {},
        appointmentsIds: new Set(),

        diagnosis: {}, // lấy order_id làm key
        diagnosisIds: new Set(),

        staffs: {},
        staffsIds: new Set(),

        parts: {},
        partsIds: new Set(),

        services: {},
        servicesIds: new Set(),
    });

    // State theo dõi trạng thái loading
    const [loading, setLoading] = useState({
        orders: false,
        receptions: false,
        motorcycles: false,
        appointments: false,
        diagnosis: false,
        staffs: false,
        parts: false,
        services: false,
    });

    // State lưu trữ lỗi
    const [errors, setErrors] = useState({});

    const fetchParts = async () => {
        setLoadingState('parts', true);
        clearError('parts');
        try {
            const response = await resourceService.part.getAllParts();
            const data = response.data || response || [];
            setMultipleData('parts', data, 'part_id');
        } catch (error) {
            console.error('Lỗi khi lấy danh sách phụ tùng:', error);
            setError('parts', error.message || 'Không thể lấy danh sách phụ tùng');
        } finally {
            setLoadingState('parts', false);
        }
    }

    const fetchServices = async () => {
        setLoadingState('services', true);
        clearError('services');
        try {
            const response = await resourceService.service.getAllServices();
            const data = response.data || response || [];
            setMultipleData('services', data, 'service_id');
        } catch (error) {
            console.error('Lỗi khi lấy danh sách dịch vụ:', error);
            setError('services', error.message || 'Không thể lấy danh sách dịch vụ');
        } finally {
            setLoadingState('services', false);
        }
    }

    const fetchDiagnosis = async (orderId) => {
        if (dataStore.diagnosisIds.has(orderId.toString())) return; // Nếu đã có thông tin diagnosis thì không cần gọi lại API
        setLoadingState('diagnosis', true);
        clearError('diagnosis');
        try {
            const response = await repairService.diagnosis.getDiagnosisByOrderId(orderId);
            const data = response.data || response || [];
            setData('diagnosis', data, 'orderId');
        } catch (error) {
            console.error(`Lỗi khi lấy diagnosis cho đơn hàng ID=${orderId}: `, error);
            setError('diagnosis', error.message || 'Không thể lấy danh sách chẩn đoán');
        } finally {
            setLoadingState('diagnosis', false);
        }
    }

    const fetchOrdersForUser = async (motorcycleId) => {
        setLoadingState('orders', true);
        clearError('orders');
        try {
            const response = await repairService.order.getAllOrdersByMotorcycleId(motorcycleId);
            const data = response.data || response || [];
            setMultipleData('orders', data, 'order_id');
            const staffIds = new Set(); // Tạo một Set để lưu trữ các staff_id duy nhất
            data.forEach(order => {
                const orderId = order.order_id;
                console.log('orderId', order.staff_id);
                if (order.staff_id !== null) { staffIds.add(order.staff_id); }
                fetchDiagnosis(orderId);
            })
            console.log('staffIds', staffIds);  
            staffIds.forEach(staffId => {
                fetchStaff(staffId); // Gọi hàm fetchStaff cho từng staff_id
            }) 
        } catch (error) {
            console.error('Lỗi khi lấy danh sách đơn hàng:', error);
            setError('orders', error.message || 'Không thể lấy danh sách đơn hàng');
        } finally {
            setLoadingState('orders', false);
        }
    }

    const fetchReceptionsForUser = async (motoTypeId) => {
        setLoadingState('receptions', true);
        clearError('receptions');
        try {
            const response = await customerService.reception.getAllReceptions({
                motocycle_id: motoTypeId,
                skip: 0,
                limit: 1000,
            });
            const data = response.data || response || [];
            setMultipleData('receptions', data, 'form_id');
            const staffIds = new Set(); // Tạo một Set để lưu trữ các staff_id duy nhất
            data.forEach(reception => {
                staffIds.add(reception.staff_id); // Thêm staff_id vào Set
            });
            staffIds.forEach(staffId => {
                fetchStaff(staffId); // Gọi hàm fetchStaff cho từng staff_id
            })
        } catch (error) { 
            console.error('Lỗi khi lấy danh sách phiếu tiếp nhận:', error);
            setError('receptions', error.message || 'Không thể lấy danh sách phiếu tiếp nhận');
        } finally { 
            setLoadingState('receptions', false);
        }
    }

    const fetchStaff = async (staffId) => {
        if (dataStore.staffsIds.has(staffId.toString())) return; // Nếu đã có thông tin nhân viên thì không cần gọi lại API
        setLoadingState('staffs', true);
        clearError('staffs');
        try {
            const response = await resourceService.staff.getStaffById(staffId);
            const data = response.data || response || [];
            setData('staffs', data, staffId);
        } catch (error) {
            console.error(`Lỗi khi lấy thông tin nhân viên ID=${staffId}: `, error);
            setError('staffs', error.message || 'Không thể lấy thông tin nhân viên');
        } finally {
            setLoadingState('staffs', false);
        }
    }

    const fetchAppointmentsForUser = async () => {
        setLoadingState('appointments', true);
        clearError('appointments');
        try {
            const response = await customerService.appointment.getAllAppointments({
                customer_id: currentUser.customer_id,
                skip: 0,
                limit: 1000,
            });
            const data = response.data || response || [];
            setMultipleData('appointments', data, 'appointment_id');
        } catch (error) {
            console.error('Lỗi khi lấy danh sách lịch hẹn:', error);
            setError('appointments', error.message || 'Không thể lấy danh sách lịch hẹn');
        } finally {
            setLoadingState('appointments', false);
        }
    }

    const fetchDataForUser = async () => { // Lấy dữ liệu xe của người dùng
        setLoadingState('motorcycles', true);
        clearError('motorcycles');
        
        try {
            const response = await customerService.motorcycle.getAllMotorcycleByCustomerId(currentUser.customer_id);
            const data = response.data || response || [];
            setMultipleData('motorcycles', data, 'motocycle_id');
            data.forEach(motorcycle => {
                const motorcycleId = motorcycle.motocycle_id.toString();
                fetchReceptionsForUser(motorcycleId); // Lấy danh sách phiếu tiếp nhận cho từng xe máy
                fetchOrdersForUser(motorcycleId); // Lấy danh sách đơn hàng cho từng xe máy
            });
        } catch (error) {
            console.error('Lỗi khi lấy danh sách xe máy:', error);
            setError('motorcycles', error.message || 'Không thể lấy danh sách xe máy');
        } finally {
            setLoadingState('motorcycles', false);
        }
    }

    useEffect(() => {
        if (!currentUser) return;
        if (hasDataLoaded.current) return;
        hasDataLoaded.current = true;

        console.log('Đang tải dữ liệu cho người dùng:', currentUser.customer_id);
        fetchDataForUser();
        fetchAppointmentsForUser(); // Lấy danh sách lịch hẹn cho người dùng
        fetchParts(); // Lấy danh sách phụ tùng
        fetchServices(); // Lấy danh sách dịch vụ

    }, [currentUser]);

    useEffect(() => {
        if (loading['orders'] || loading['appointments'] || loading['motorcycles'] || loading['diagnosis'] 
            || loading['receptions']
        ) return;
        console.log(dataStore);
    }, [loading]);

    // Set trạng thái loading cho một loại dữ liệu
    const setLoadingState = useCallback((category, isLoading) => {
        setLoading(prev => ({
            ...prev,
            [category]: isLoading
        }));
    }, []);

    // Xử lý lỗi
    const setError = useCallback((category, error) => {
        setErrors(prev => ({
            ...prev,
            [category]: error
        }));
    }, []);

    const clearError = useCallback((category) => {
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[category];
            return newErrors;
        });
    }, []);

    // Lưu dữ liệu cho một category
    const setData = useCallback((category, data, id = null) => {
        setDataStore(prevStore => {
            if (id) {
                const idsKey = `${category}Ids`;
                const idStr = id.toString();
                
                if (!prevStore[idsKey].has(idStr)) {
                    const updatedIds = prevStore[idsKey];
                    updatedIds.add(idStr);
                    
                    return {
                        ...prevStore,
                        [category]: {
                            ...prevStore[category],
                            [id]: data
                        }
                    };
                }
                
                return {
                    ...prevStore,
                    [category]: {
                        ...prevStore[category],
                        [id]: data
                    }
                };
            }
            
            if (typeof data === 'object' && !Array.isArray(data)) {
                const idsKey = `${category}Ids`;
                const newIds = new Set(Object.keys(data).map(key => key.toString()));
                
                return {
                    ...prevStore,
                    [category]: data,
                    [idsKey]: newIds
                };
            }
            
            return {
                ...prevStore,
                [category]: data
            };
        });
    }, []);

    // Lưu nhiều dữ liệu cùng lúc
    const setMultipleData = useCallback((category, dataItems, idProperty = 'id') => {
        if (!Array.isArray(dataItems) && typeof dataItems === 'object') {
            setDataStore(prevStore => {
                const idsKey = `${category}Ids`;
                const existingIds = prevStore[idsKey];
                
                Object.keys(dataItems).forEach(id => {
                    existingIds.add(id.toString());
                });
                
                return {
                    ...prevStore,
                    [category]: {
                        ...prevStore[category],
                        ...dataItems
                    }
                };
            });
        } else if (Array.isArray(dataItems) && dataItems.length > 0 && dataItems[0][idProperty]) {
            const dataObject = dataItems.reduce((acc, item) => {
                acc[item[idProperty]] = item;
                return acc;
            }, {});
            
            setDataStore(prevStore => {
                const idsKey = `${category}Ids`;
                const existingIds = prevStore[idsKey];
                
                dataItems.forEach(item => {
                    existingIds.add(item[idProperty].toString());
                });
                
                return {
                    ...prevStore,
                    [category]: {
                        ...prevStore[category],
                        ...dataObject
                    }
                };
            });
        }
    }, []);

    // Lấy dữ liệu cho một category
    const getData = useCallback((category, id = null) => {
        if (id) {
            return dataStore[category]?.[id] || null;
        }
        return dataStore[category] || {};
    }, [dataStore]);

    // Lấy tất cả dữ liệu của một category dưới dạng mảng
    const getAllData = useCallback((category) => {
        return Object.values(dataStore[category] || {});
    }, [dataStore]);

    // Lấy tất cả ID của một category
    const getIds = useCallback((category) => {
        const idsKey = `${category}Ids`;
        return dataStore[idsKey] ? Array.from(dataStore[idsKey]) : [];
    }, [dataStore]);

    // Xóa dữ liệu của một mục
    const deleteData = useCallback((category, id) => {
        setDataStore(prevStore => {
            const idsKey = `${category}Ids`;
            const existingIds = prevStore[idsKey];
            const idStr = id.toString();
            
            if (existingIds.has(idStr)) {
                const newCategoryData = { ...prevStore[category] };
                delete newCategoryData[id];
                
                existingIds.delete(idStr);
                
                return {
                    ...prevStore,
                    [category]: newCategoryData
                };
            }
            
            return prevStore;
        });
    }, []);

    // Xóa tất cả dữ liệu của một category
    const clearData = useCallback((category) => {
        setDataStore(prevStore => {
            const idsKey = `${category}Ids`;
            const existingIds = prevStore[idsKey];
            
            existingIds.clear();
            
            return {
                ...prevStore,
                [category]: {}
            };
        });
    }, []);

    // Xóa tất cả dữ liệu
    const clearAllData = useCallback(() => {
        setDataStore({
            orders: {},
            ordersIds: new Set(),
            receptions: {},
            receptionsIds: new Set(),
            motorcycles: {},
            motorcyclesIds: new Set(),
            appointments: {},
            appointmentsIds: new Set(),
        });
    }, []);

    // Hàm tiện ích để fetch dữ liệu từ API và lưu trữ
    const fetchAndStoreData = useCallback(async (category, fetchFunction, idProperty = 'id') => {
        setLoadingState(category, true);
        clearError(category);
        
        try {
            const response = await fetchFunction();
            const data = response.data || response || [];
            const dataArray = Array.isArray(data) ? data : [data];
            
            const dataObject = Array.isArray(data) 
                ? data.reduce((obj, item) => {
                    const idValue = item[idProperty].toString();
                    obj[idValue] = item;
                    return obj;
                }, {})
                : data;

            setDataStore(prevStore => {
                const idsKey = `${category}Ids`;
                const existingIds = prevStore[idsKey] || new Set();
                
                existingIds.clear();
                
                if (Array.isArray(data)) {
                    data.forEach(item => {
                        const idValue = item[idProperty].toString();
                        existingIds.add(idValue);
                    });
                } else if (typeof data === 'object' && Object.values(data)[0]?.[idProperty]) {
                    Object.keys(data).forEach(key => {
                        existingIds.add(key.toString());
                    });
                }
                
                return {
                    ...prevStore,
                    [category]: dataObject
                };
            });
            
            setLoadingState(category, false);
            return { data, dataArray, dataObject };
        } catch (error) {
            console.error(`Lỗi khi lấy ${category}:`, error);
            setError(category, error.message || `Không thể lấy dữ liệu ${category}`);
            setLoadingState(category, false);
            return null;
        }
    }, [setLoadingState, setError, clearError]);

    // Fetch dữ liệu khi component được mount và có currentUser
    useEffect(() => {
        if (!currentUser?.customer_id || hasDataLoaded.current) return;
        hasDataLoaded.current = true;

        const fetchUserOrders = async () => {
            setLoadingState('orders', true);
            try {
                const response = await repairService.order.getOrdersByCustomerId(currentUser.customer_id);
                const data = response?.data || [];
                setMultipleData('orders', data, 'order_id');
            } catch (error) {
                console.error('Lỗi khi lấy đơn hàng:', error);
                setError('orders', error.message || 'Không thể lấy đơn hàng');
            }
            setLoadingState('orders', false);
        };

        const fetchUserReceptions = async () => {
            setLoadingState('receptions', true);
            try {
                const response = await customerService.reception.getReceptionsByCustomerId(currentUser.customer_id);
                const data = response?.data || [];
                setMultipleData('receptions', data, 'form_id');
            } catch (error) {
                console.error('Lỗi khi lấy phiếu tiếp nhận:', error);
                setError('receptions', error.message || 'Không thể lấy phiếu tiếp nhận');
            }
            setLoadingState('receptions', false);
        };

        const fetchUserMotorcycles = async () => {
            setLoadingState('motorcycles', true);
            try {
                const response = await customerService.motorcycle.getMotorcyclesByCustomerId(currentUser.customer_id);
                const data = response?.data || [];
                setMultipleData('motorcycles', data, 'motocycle_id');
            } catch (error) {
                console.error('Lỗi khi lấy thông tin xe máy:', error);
                setError('motorcycles', error.message || 'Không thể lấy thông tin xe máy');
            }
            setLoadingState('motorcycles', false);
        };

        const fetchUserAppointments = async () => {
            setLoadingState('appointments', true);
            try {
                const response = await customerService.appointment.getAppointmentsByCustomerId(currentUser.customer_id);
                const data = response?.data || [];
                setMultipleData('appointments', data, 'appointment_id');
            } catch (error) {
                console.error('Lỗi khi lấy lịch hẹn:', error);
                setError('appointments', error.message || 'Không thể lấy lịch hẹn');
            }
            setLoadingState('appointments', false);
        };

        // Gọi các hàm fetch dữ liệu
        fetchUserOrders();
        fetchUserReceptions();
        fetchUserMotorcycles();
        fetchUserAppointments();
    }, [currentUser, setMultipleData, setLoadingState, setError]);

    // Context value
    const value = useMemo(() => ({
        dataStore,
        loading,
        errors,
        setData,
        setMultipleData,
        getData,
        getAllData,
        getIds,
        deleteData,
        clearData,
        clearAllData,
        setLoadingState,
        setError,
        clearError,
        fetchAndStoreData,
        // Các hàm tiện ích để lấy dữ liệu dễ dàng hơn
        orders: getAllData('orders'),
        receptions: getAllData('receptions'),
        motorcycles: getAllData('motorcycles'),
        appointments: getAllData('appointments'),
    }), [
        dataStore,
        loading,
        errors,
        setData,
        setMultipleData,
        getData,
        getAllData,
        getIds,
        deleteData,
        clearData,
        clearAllData,
        setLoadingState,
        setError,
        clearError,
        fetchAndStoreData
    ]);

    return (
        <UserDataContext.Provider value={value}>
            {children}
        </UserDataContext.Provider>
    );
};

export default UserDataProvider;
