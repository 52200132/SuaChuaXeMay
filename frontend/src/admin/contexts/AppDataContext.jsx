import React, { createContext, useState, useContext, useCallback, useMemo, useEffect, useRef, use } from 'react';
import { useStaffAuth } from './StaffAuthContext';
import { customerService, repairService, resourceService } from '../../services/api';

// Create context
const AppDataContext = createContext();

// Custom hook to use the app data context
export const useAppData = () => useContext(AppDataContext);

export const AppDataProvider = ({ children }) => {
    const { currentStaff } = useStaffAuth(); 
    const hasDataLoaded = useRef(false); // Flag to check if data has been loaded
    const idsNeeded = useRef({
        customersIds: new Set(), 
        motorcyclesIds: new Set(), 
    });

    // State for different data categories
    const [dataStore, setDataStore] = useState({
        customers: {},    // Customer data by ID
        customersIds: new Set(),  // IDs of customers

        appointments: {}, // Appointment data by ID
        appointmentsIds: new Set(),  // IDs of appointments

        receptions: {}, // Reception data by ID
        receptionsIds: new Set(),  // IDs of receptions

        services: {},     // Service data by ID
        servicesIds: new Set(),  // IDs of services

        staffs: {},     // Staff data by ID
        staffsIds: new Set(),  // IDs of staffs

        orders: {},     // Order data by ID
        ordersIds: new Set(),  // IDs of orders

        diagnosis: {},     // Diagnosis data by ID
        diagnosisIds: new Set(),  // IDs of diagnosis

        motorcycles: {},     // Motorcycle data by ID
        motorcyclesIds: new Set(),  // IDs of motorcycles
    });

    // State to track loading status for different categories
    const [loading, setLoading] = useState({
        customers: false,
        appointments: false,
        receptions: false,
        services: false,
        products: false,
        employees: false,
        settings: false,
        stats: false,
    });

    // State to track errors
    const [errors, setErrors] = useState({});

    // Tải các dữ liệu cần thiết theo role
    const fetchCustomers = async (customerIds) => { 
        setLoadingState('customers', true);
        await Promise.allSettled(
            (Array.isArray(customerIds) ? customerIds : Array.from(customerIds)).map(async (id) => {
                try {
                    if (getData('customers', id)) { return; } // Có rồi không lấy nữa
                    console.log(`Lấy dữ liệu customer ${id}`);
                    const response = await customerService.customer.getCustomerById(id);
                    const customer = response?.data;
                    setData('customers', customer, id);
                } catch (error) {
                    console.error(`Error fetching customer ${id}:`, error);
                }
            })
        );
        setLoadingState('customers', false);
    }

    const fetchMotorcycles = async (motorcycleIds) => { 
        setLoadingState('motorcycles', true);
        const customersIds = idsNeeded.current['customersIds'];
        await Promise.allSettled(
            (Array.isArray(motorcycleIds) ? motorcycleIds : Array.from(motorcycleIds)).map(async (id) => {
                try {
                    if (getData('motorcycles', id)) { return; }
                    const response = await customerService.motorcycle.getMotorcycleById(id);
                    const motorcycle = response?.data;
                    if (motorcycle?.customer_id) {
                        customersIds.add(motorcycle.customer_id.toString()); // Thêm customer_id vào danh sách
                    }
                    setData('motorcycles', motorcycle, id);
                } catch (error) {
                    console.error(`Error fetching motorcycle ${id}:`, error);
                }
            })
        );
        console.log('Danh sang customerID trong moto', customersIds);
        // fetchCustomers(customersIds);
        setLoadingState('motorcycles', false);
    }

    useEffect(() => {        
        if (!currentStaff || hasDataLoaded.current) return;
        hasDataLoaded.current = true; // Set the flag to true after loading data
        
        // Các hàm fetch dữ liệu từ api
        const fetchAppointments = async () => {
            try {
                setLoadingState('appointments', true);
                const startDate = new Date().toISOString().split('T')[0];
                const endDate = new Date().toISOString().split('T')[0];
                // TODO: Đặt kiều kiện
                const response = await customerService.appointment.getAllAppointments({
                    // start_date: startDate,
                    // end_date: endDate,
                    skip: 0,
                    limit: 1000,
                });
                const appointmentsData = response?.data || response || [];
                const appointmentsArray = Array.isArray(appointmentsData) ? appointmentsData : [appointmentsData]; // Ensure data is an array
                setMultipleData('appointments', appointmentsArray, 'appointment_id');
                const customersIds = idsNeeded.current['customersIds']; // Tạo một Set để lưu trữ customer_id
                appointmentsArray.forEach((appointment) => {  
                    if (appointment.customer_id) {
                        customersIds.add(appointment.customer_id.toString());
                    }
                });
                // console.log('Danh sách customersIds', customersIds);
                // fetchCustomers(customersIds);
            } catch (error) {
                console.error('Error fetching appointments:', error);
                setError('appointments', error.message || 'Failed to fetch appointments');
            }
            setLoadingState('appointments', false);
        }

        const fetchReceptions = async () => {
            setLoadingState('receptions', true);
            try {
                const receptionsDataToday = async () => {
                    const startDate = new Date().toISOString().split('T')[0];
                    const endDate = new Date().toISOString().split('T')[0];
                    // TODO: Đặt kiều kiện
                    const response = await customerService.reception.getAllReceptions({
                        // start_date: startDate,
                        // end_date: endDate,
                        skip: 0,
                        limit: 1000,
                    });
                    return response;
                }
                await fetchAndStoreData('receptions', receptionsDataToday, 'form_id')
                .then((response) => {
                    const dataArray = response.dataArray;
                    const motorcyclesIds = idsNeeded.current['motorcyclesIds']; // Tạo một Set để lưu trữ motorcycle_id
                    dataArray.forEach((reception) => {
                        motorcyclesIds.add(reception?.motocycle_id?.toString())
                    });
                    // console.log(motorcyclesIds);
                    // fetchMotorcycles(motorcyclesIds);
                });
            } catch (error) {
                console.error('Error fetching receptions:', error);
                setError('receptions', error.message || 'Failed to fetch receptions');
            }
            setLoadingState('receptions', false);
        }

        const fetchOrders = async () => {
            setLoadingState('orders', true);
            try {
                const ordersData = async () => {
                    const response = await repairService.order.getAllOrders({
                        skip: 0,
                        limit: 1000,
                    });
                    return response;
                }
                await fetchAndStoreData('orders', ordersData, 'order_id')
                .then((response) => {
                    const dataArray = response.dataArray;
                    const motorcyclesIds = idsNeeded.current['motorcyclesIds']; // Tạo một Set để lưu trữ motorcycle_id
                    dataArray.forEach((order) => {
                        motorcyclesIds.add(order?.motocycle_id?.toString())
                    });
                });
            } catch (error) {
                console.error('Error fetching orders:', error);
            }
            setLoadingState('orders', false);
        }

        const fetchDiagnosis = async () => {
            setLoadingState('diagnosis', true);
            try {
                const diagnosisData = async () => {
                    const response = await repairService.diagnosis.getAllDiagnosis({
                        skip: 0,
                        limit: 1000,
                    });
                    return response;
                }
                await fetchAndStoreData('diagnosis', diagnosisData, 'order_id')
            } catch (error) {
                console.error('Error fetching diagnosis:', error);
            }
            setLoadingState('diagnosis', false);
        }

        const fetchStaffs = async () => {
            setLoadingState('staffs', true);
            try {
                const staffsData = async () => {
                    const response = await resourceService.staff.getAllTechnicians();
                    return response;
                }
                await fetchAndStoreData('staffs', staffsData, 'staff_id')
            } catch (error) {
                console.error('Error fetching staffs:', error);
            }
            setLoadingState('staffs', false);
        }


        if (currentStaff.role === 'receptionist') {
            console.log('Đang là nhân viên lễ tân');
            fetchAppointments();
            fetchReceptions();
            fetchOrders();
            fetchDiagnosis();
            fetchStaffs();
            // fetchAndStoreData('customers', fetchCustomers);
            // fetchAndStoreData('appointments', () => fetchAppointments(), 'appointment_id');
            // fetchAndStoreData('services', fetchServices);
            // fetchAndStoreData('products', fetchProducts);
        }
    }, [currentStaff]);

    // Fetch các dữ liệu liên quan
    useEffect(() => {
        console.log(loading['appointments'], loading['receptions']);
        if (loading['appointments'] === true || loading['receptions'] === true || loading['orders'] === true) return; // Chỉ gọi khi loading appointments là false
        // console.log(getData('appointments'), getData('receptions'));
        console.log(dataStore['orders'], dataStore['diagnosis']);
        const fetchData = async () => {
            try {
                const motorcyclesIds = idsNeeded.current['motorcyclesIds'];
                await fetchMotorcycles(motorcyclesIds); // Lấy danh sách xe máy
                const customersIds = idsNeeded.current['customersIds'];
                await fetchCustomers(customersIds); // Lấy danh sách khách hàng
            } catch (error) { 
                console.error('Lỗi khi fetch dữ liệu liên quan', error);
            }
        }
        fetchData();
        
    }, [loading['appointments'], loading['receptions'], loading['orders']]);

    

    // Set data for a specific category
    const setData = useCallback((category, data, id = null) => {
        setDataStore(prevStore => {
            // If an ID is provided, set/update that specific item
            if (id) {
                const idsKey = `${category}Ids`;
                const idStr = id.toString();
                
                // Kiểm tra xem ID đã tồn tại chưa
                if (!prevStore[idsKey].has(idStr)) {
                    // Clone Set và thêm ID mới
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
                
                // Nếu ID đã tồn tại, chỉ cập nhật dữ liệu, không cần cập nhật Set
                return {
                    ...prevStore,
                    [category]: {
                        ...prevStore[category],
                        [id]: data
                    }
                };
            }
            
            // For complete data replacement, extract IDs from the new data
            if (typeof data === 'object' && !Array.isArray(data)) {
                const idsKey = `${category}Ids`;
                const newIds = new Set(Object.keys(data).map(key => key.toString()));
                
                return {
                    ...prevStore,
                    [category]: data,
                    [idsKey]: newIds
                };
            }
            
            // Otherwise, just replace the data without updating IDs
            return {
                ...prevStore,
                [category]: data
            };
        });
    }, []);

    // Set data for multiple items in a category
    const setMultipleData = useCallback((category, dataItems, idProperty = 'id') => {
        if (!Array.isArray(dataItems) && typeof dataItems === 'object') {
            // If dataItems is an object (id -> data mapping)
            setDataStore(prevStore => {
                const idsKey = `${category}Ids`;
                const existingIds = prevStore[idsKey];
                
                // Thêm ID mới trực tiếp vào Set hiện có
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
            // If dataItems is an array of objects with id property
            const dataObject = dataItems.reduce((acc, item) => {
                acc[item[idProperty]] = item;
                return acc;
            }, {});
            
            setDataStore(prevStore => {
                const idsKey = `${category}Ids`;
                const existingIds = prevStore[idsKey];
                
                // Thêm ID mới trực tiếp vào Set hiện có
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

    // Get data for a specific category
    const getData = useCallback((category, id = null) => {
        if (id) {
            return dataStore[category]?.[id] || null;
        }
        return dataStore[category] || {};
    }, [dataStore]);

    // Get all items from a category as an array
    const getAllData = useCallback((category) => {
        return Object.values(dataStore[category] || {});
    }, [dataStore]);

    // Get all IDs for a category
    const getIds = useCallback((category) => {
        const idsKey = `${category}Ids`;
        return dataStore[idsKey] ? Array.from(dataStore[idsKey]) : [];
    }, [dataStore]);

    // Delete an item from a category
    const deleteData = useCallback((category, id) => {
        setDataStore(prevStore => {
            const idsKey = `${category}Ids`;
            const existingIds = prevStore[idsKey];
            const idStr = id.toString();
            
            // Chỉ xóa nếu ID tồn tại
            if (existingIds.has(idStr)) {
                const newCategoryData = { ...prevStore[category] };
                delete newCategoryData[id];
                
                // Xóa trực tiếp từ Set hiện có
                existingIds.delete(idStr);
                
                return {
                    ...prevStore,
                    [category]: newCategoryData
                };
            }
            
            // Không làm gì nếu ID không tồn tại
            return prevStore;
        });
    }, []);

    // Clear all data for a category
    const clearData = useCallback((category) => {
        setDataStore(prevStore => {
            const idsKey = `${category}Ids`;
            const existingIds = prevStore[idsKey];
            
            // Xóa tất cả phần tử khỏi Set hiện có
            existingIds.clear();
            
            return {
                ...prevStore,
                [category]: {}
            };
        });
    }, []);

    // Clear all data in the store
    const clearAllData = useCallback(() => {
        setDataStore({
            customers: {},
            customersIds: new Set(),
            appointments: {},
            appointmentsIds: new Set(),
            services: {},
            servicesIds: new Set(),
            products: {},
            productsIds: new Set(),
            employees: {},
            employeesIds: new Set(),
            settings: {},
            settingsIds: new Set(),
            stats: {},
            statsIds: new Set(),
        });
    }, []);

    // Set loading state for a category
    const setLoadingState = useCallback((category, isLoading) => {
        setLoading(prev => ({
            ...prev,
            [category]: isLoading
        }));
    }, []);

    // Set error for a category
    const setError = useCallback((category, error) => {
        setErrors(prev => ({
            ...prev,
            [category]: error
        }));
    }, []);

    // Clear error for a category
    const clearError = useCallback((category) => {
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[category];
            return newErrors;
        });
    }, []);

    // Utility function to fetch data from API and store it
    const fetchAndStoreData = useCallback(async (category, fetchFunction, idProperty = 'id') => {
        setLoadingState(category, true);
        clearError(category);
        
        try {
            const response = await fetchFunction();
            const data = response.data || response || [];
            const dataArray = Array.isArray(data) ? data : [data]; // Ensure data is an array
            
            // Convert to object with ID as key
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
                
                // Xóa tất cả các ID cũ và thêm ID mới
                existingIds.clear();
                
                if (Array.isArray(data)) {
                    // Thêm các ID mới từ mảng data
                    data.forEach(item => {
                        const idValue = item[idProperty].toString();
                        existingIds.add(idValue);
                    });
                } else if (typeof data === 'object' && Object.values(data)[0]?.[idProperty]) {
                    // Thêm các ID từ object data nếu có idProperty
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
            console.error(`Error fetching ${category}:`, error);
            setError(category, error.message || `Failed to fetch ${category}`);
            setLoadingState(category, false);
            return null;
        }
    }, [setLoadingState, setError, clearError]);

    // Context value - sử dụng useMemo để tránh tạo object mới mỗi lần render
    const value = useMemo(() => ({
        dataStore,
        loading,
        errors,
        idsNeeded,
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
    }), [
        dataStore, 
        loading, 
        errors, 
        idsNeeded,
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
        <AppDataContext.Provider value={value}>
            {children}
        </AppDataContext.Provider>
    );
};

export default AppDataProvider;
