import React, { createContext, useState, useContext, useEffect } from 'react';
import { resourceService, customerService } from '../services/api';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
    const [serviceTypes, setServiceTypes] = useState([]);
    const [timeSlots, setTimeSlots] = useState([]);
    const [motorcycleTypes, setMotorcycleTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                
                // Fetch dữ liệu dịch vụ từ API
                const servicesData = await resourceService.getAllServiceTypes();
                setServiceTypes(servicesData);

                const motorcycleTypesData = await customerService.motorcycle.getAllServiceTypes();
                setMotorcycleTypes(motorcycleTypesData);
                
                // Fetch dữ liệu khung giờ từ API (hoặc sử dụng dữ liệu cứng nếu chưa có API)
                // const timeSlotsData = await resourceService.getTimeSlots();
                // setTimeSlots(timeSlotsData);
                
                // Nếu chưa có API cho timeSlots, có thể sử dụng dữ liệu cứng:
                setTimeSlots([
                    { value: "08:00" },
                    { value: "09:00" },
                    { value: "10:00" },
                    { value: "11:00" },
                    { value: "13:30" },
                    { value: "14:30" },
                    { value: "15:30" },
                    { value: "16:30" },
                    { value: "17:30" },
                    { value: "18:30" },
                    { value: "19:30" },
                    { value: "20:30" },
                ]);
                setLoading(false);
            } catch (err) {
                console.error('DataProvide - Lỗi khi tải dữ liệu:', err);
                setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
                setLoading(false);
            }
        };

        fetchData();
        // console.log('timeSlots:', timeSlots); // Log timeSlots để kiểm tra          

    }, []);

    const refreshData = async () => {
        try {
            setLoading(true);
            const servicesData = await resourceService.getAllServiceTypes();
            setServiceTypes(servicesData);
            
            // Cập nhật timeSlots nếu có API
            // const timeSlotsData = await resourceService.getTimeSlots();
            // setTimeSlots(timeSlotsData);
            
            setLoading(false);
        } catch (err) {
            setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
            setLoading(false);
        }
    };

    const value = {
        serviceTypes,
        timeSlots,
        motorcycleTypes,
        loading,
        error,
        refreshData
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};