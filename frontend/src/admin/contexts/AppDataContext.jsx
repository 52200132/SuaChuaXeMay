import { createContext, useState, useContext, useCallback, useMemo, useEffect, useRef, use } from 'react';
import { useStaffAuth } from './StaffAuthContext';
import { customerService, repairService, repairService2, resourceService } from '../../services/api';
import pusher, { subscribeToChannel, unsubscribeFromChannel } from '../../services/pusher';
import { data } from 'react-router-dom';
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

    const [channel, setChannel] = useState({
        order: null,
    });

    // State for different data categories
    const [dataStore, setDataStore] = useState({
        customers: {},
        customersIds: new Set(),

        appointments: {},
        appointmentsIds: new Set(),

        receptions: {},
        receptionsIds: new Set(),

        services: {},
        servicesIds: new Set(),
        servicesMotoType: {},

        staffs: {},
        staffsIds: new Set(),

        orders: {},
        ordersIds: new Set(),

        diagnosis: {},
        diagnosisIds: new Set(),

        motorcycles: {},
        motorcyclesIds: new Set(),

        parts: {},
        partsIds: new Set(),
        
        partsMotoType: {},
        partsMotoTypeIds: new Set(), // { part_id: {} }

        partsview: {}, // { part_id: {} }
        partsviewIds: new Set(),

        servicesParentMotoType: {}, // { service_id: {} }
        servicesParentMotoTypeIds: new Set(), // { service_id: {} }

        suppliers: {},
        suppliersIds: new Set(),
    });

    // State to track loading status for different categories
    const [loading, setLoading] = useState({
        customers: false,
        appointments: false,
        receptions: false,
        staffs: false,
        orders: false,
        diagnosis: false,
        motorcycles: false,
        parts: false,
        partsview: false,
        partsMotoType: false, // { "moto_type_id": { part_id: {} } }
        services: false,
        servicesParentMotoType: false,
        suppliers: false,
    });

    // State to track errors
    const [errors, setErrors] = useState({});

    // Đăng ký kênh Pusher 
    useEffect(() => {
        const orderChannel = pusher.subscribe('order-channel');
        setChannel(prev => ({
            ...prev,
            order: orderChannel
        }));

        return () => {
            if (orderChannel) {
                orderChannel.unbind_all(); // Hủy tất cả các sự kiện đã đăng ký
                pusher.unsubscribe('order-channel'); // Hủy đăng ký kênh
            }
        }
    }, []);

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

    // const fetchPartsMotoType = async () => {
    //     setLoadingState('partsMotoType', true);
    //     try {
    //         const response = await resourceService.partMotoType.getAllPartMotoTypes({
    //             skip: 0,
    //             limit: 1000,
    //         });
    //         const data = response?.data;
    //         const dataObject = Array.isArray(data) 
    //             ? data.reduce((obj, item) => {
    //                 const motoTypeId = item.moto_type_id.toString();
    //                 const partId = item.part_id.toString();
    //                 obj[motoTypeId] = obj[motoTypeId] || {}; // Tạo một object con nếu chưa có
    //                 obj[motoTypeId][partId] = item; // Lưu item vào object với moto_type_id là key
    //                 return obj;
    //             }, {})
    //             : data;
    //         console.log('Dữ liệu partMotoType pass', dataObject);
    //         setDataStore(prevStore => ({
    //             ...prevStore,
    //             partsMotoType: dataObject
    //         }));
    //     } catch (error) {
    //         console.error('Lỗi khi lấy partMotoTypes:', error);
    //     }
    //     setLoadingState('partsMotoType', false);
    // }

    const fetchServicesParentMotoType = async () => {
        setLoadingState('servicesParentMotoType', true);
        try {
            const response1 = await repairService2.service.getServiceViewsByParentMotoType('Xe số');
            const response2 = await repairService2.service.getServiceViewsByParentMotoType('Xe tay ga');
            const data1 = response1?.data;
            const data2 = response2?.data;
            const dataObject1 = Array.isArray(data1) 
                ? data1.reduce((obj, item) => {
                    obj[item.service_id] = item; // Lưu item vào object với service_id là key
                    return obj;
                }, {})
                : data1;
            const dataObject2 = Array.isArray(data2)
                ? data2.reduce((obj, item) => {
                    obj[item.service_id] = item; // Lưu item vào object với service_id là key
                    return obj;
                }
                , {})
                : data2;
            setData('servicesParentMotoType', dataObject1, 'Xe số');
            setData('servicesParentMotoType', dataObject2, 'Xe tay ga');
        } catch (error) {
            console.error('Lỗi khi lấy danh sách service:', error);
        }
        setLoadingState('servicesParentMotoType', false);
    }

    const fetchParts = async () => {
        setLoadingState('parts', true);
        try {
            const response = await repairService2.part.getPartViews();
            const data = response?.data;
            const dataObject = Array.isArray(data) 
                ? data.reduce((obj, item) => {
                    obj[item.part_id] = item;
                    return obj;
                }, {})
                : data;
            setDataStore(prevStore => ({
                ...prevStore,
                parts: dataObject
            }));
            setLoadingState('parts', false);
            return Object.keys(dataObject); // Trả về danh sách ID
        } catch (error) {
            console.error('Lỗi khi lấy danh sách part:', error);
            setLoadingState('parts', false);
            return [];
        }
    };

    const fetchPartsView = async (partIdList = []) => {
        setLoadingState('partsview', true);
        try {
            const response = await repairService.part.getPartViewsByPartIdList(partIdList);
            const data = response?.data;
            const dataArray = Array.isArray(data) ? data : (data ? [data] : []);
            console.log('Dữ liệu partview', dataArray);
            setDataStore(prevStore => ({
                ...prevStore,
                partsview: dataArray // Lưu vào partsview dưới dạng array
            }));
        } catch (error) {
            console.error('Lỗi khi lấy danh sách partview:', error);
        }
        setLoadingState('partsview', false);
    }

    const fetchServices = async () => {
        setLoadingState('services', true);
        try {
            const response = await resourceService.service.getAllServices({
                skip: 0,
                limit: 1000,
            });
            const data = response?.data;
            const dataObject = Array.isArray(data) 
                ? data.reduce((obj, item) => {
                    obj[item.service_id] = item; // Lưu item vào object với service_id là key
                    return obj;
                }, {})
                : data;
            setDataStore(prevStore => ({
                ...prevStore,
                services: dataObject
            }));
            console.log('Dữ liệu service', dataObject);
        } catch (error) {
            console.error('Lỗi khi lấy danh sách service:', error);
        }
        setLoadingState('services', false);
    }

    const fetchOrderForTechnician = async () => {
        setLoadingState('orders', true);
        try {
            const response = await repairService.order.getAllOrdersByStaffIdToday(currentStaff.staff_id);
            const data = response?.data || [];
            
            const motorcyclesIds = idsNeeded.current['motorcyclesIds'];
            
            setMultipleData('orders', data, 'order_id'); // Lưu tất cả orders vào dataStore
            // Sử dụng Promise.allSettled để xử lý tất cả các request song song
            await Promise.allSettled(
                data.map(async (order) => {
                    try {
                        // Thêm motorcycle_id vào danh sách cần fetch
                        if (order?.motocycle_id) {
                            motorcyclesIds.add(order.motocycle_id.toString());
                        }
                        
                        // Lấy thông tin diagnosis
                        try {
                            const diagnosisResponse = await repairService.diagnosis.getDiagnosisByOrderId(order.order_id);
                            const diagnosisData = diagnosisResponse?.data;
                            if (diagnosisData) {
                                setData('diagnosis', diagnosisData, order.order_id);
                                
                                // Lấy thông tin reception nếu có form_id
                                if (diagnosisData?.form_id) {
                                    try {
                                        const receptionResponse = await customerService.reception.getReceptionById(diagnosisData.form_id);
                                        const receptionData = receptionResponse?.data;
                                        if (receptionData) {
                                            setData('receptions', receptionData, diagnosisData.form_id);
                                        }
                                    } catch (receptionError) {
                                        console.error(`Lỗi khi lấy reception cho form_id ${diagnosisData.form_id}:`, receptionError);
                                    }
                                }
                            }
                        } catch (diagnosisError) {
                            console.error(`Lỗi khi lấy diagnosis cho order_id ${order.order_id}:`, diagnosisError);
                        }
                    } catch (orderError) {
                        console.error(`Lỗi xử lý cho order ${order.order_id}:`, orderError);
                    }
                })
            );
        } catch (error) {
            console.error('Lỗi khi lấy danh sách order:', error);
        } finally {
            setLoadingState('orders', false);
        }
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
        
        const fetchSuppliers = async () => {
            setLoadingState('suppliers', true);
            try {
                await fetchAndStoreData(
                    'suppliers',
                    async () => {
                        const response = await repairService2.supplier.getAllSuppliers();
                        console.log('Suppliers API response:', response.data);
                        // Đảm bảo trả về mảng
                        return response?.data || [];
                    },
                    'supplier_id'
                );
            } catch (error) {
                console.error('Error fetching suppliers:', error);
            }
            setLoadingState('suppliers', false);
        };

        console.log('Đang là nhân viên', currentStaff.role);

        if (currentStaff.role === 'receptionist') {
            console.log('Đang là nhân viên lễ tân');
            fetchAppointments();
            fetchReceptions();
            fetchOrders();
            fetchDiagnosis();
            fetchStaffs();
        } else if (currentStaff.role === 'technician') {
            console.log('Đang là nhân viên kỹ thuật');
            // fetchPartsMotoType();
            fetchServicesParentMotoType();
            fetchParts();
            fetchServices();
            fetchOrderForTechnician();
        }
        else if (currentStaff.role === 'head technician') {
            console.log('Đang là trưởng kỹ thuật viên');
            fetchServicesParentMotoType();
            fetchParts();
            fetchOrderForTechnician();
            fetchOrders();
            fetchDiagnosis();
            fetchStaffs();
        }
        else if (currentStaff.role === 'warehouse worker') {
            console.log('Đang là nhân viên kho');
            (async () => {
                const allPartIds = await fetchParts();
                fetchPartsView(allPartIds);
            })();
            fetchSuppliers();
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

    // useEffect(() => {
    //     console.log(dataStore['customers'], dataStore['motorcycles'], dataStore['orders'], dataStore['diagnosis'], dataStore['receptions']);
    // }, [dataStore['customers'], dataStore['motorcycles'], dataStore['orders'], dataStore['diagnosis'], dataStore['receptions']]);

    // Set data for a specific category
    const setData = useCallback((category, data, id = null) => {
        setDataStore(prevStore => {
            // If an ID is provided, set/update that specific item
            if (id) {
                const idsKey = `${category}Ids`;
                const idStr = id.toString();
                console.log('category:', category, 'ID:', idStr, 'data:', data);
                console.log('Id set:', prevStore[idsKey]);
                
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
        channel,
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
        fetchPartsView
    }), [
        dataStore, 
        loading, 
        errors, 
        idsNeeded,
        channel,
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
        fetchPartsView
    ]);

    return (
        <AppDataContext.Provider value={value}>
            {children}
        </AppDataContext.Provider>
    );
};

export default AppDataProvider;
