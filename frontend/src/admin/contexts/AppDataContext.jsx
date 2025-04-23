import React, { createContext, useState, useContext, useCallback } from 'react';
import * as moldel from '../../models';

// Create context
const AppDataContext = createContext();

// Custom hook to use the app data context
export const useAppData = () => useContext(AppDataContext);

export const AppDataProvider = ({ children }) => {
    const [currentCustomer, setCurrentCustomer] = useState(null); // State for current customer

    // State for different data categories
    const [dataStore, setDataStore] = useState({
        customers: {},    // Customer data by ID
        customersIds: new Set(),  // IDs of customers
        appointments: {}, // Appointment data by ID
        appointmentsIds: new Set(),  // IDs of appointments
        services: {},     // Service data by ID
        servicesIds: new Set(),  // IDs of services
        products: {},     // Product data by ID
        productsIds: new Set(),  // IDs of products
        employees: {},    // Employee data by ID
        employeesIds: new Set(),  // IDs of employees
        settings: {},     // App settings
        settingsIds: new Set(),  // IDs of settings
        stats: {},        // Statistics and analytics data
        statsIds: new Set(),  // IDs of stats
    });

    // State to track loading status for different categories
    const [loading, setLoading] = useState({
        customers: false,
        appointments: false,
        services: false,
        products: false,
        employees: false,
        settings: false,
        stats: false,
    });

    // State to track errors
    const [errors, setErrors] = useState({});

    // Set data for a specific category
    const setData = useCallback((category, data, id = null) => {
        setDataStore(prevStore => {
            // If an ID is provided, set/update that specific item
            if (id) {
                const idsKey = `${category}Ids`;
                const updatedIds = new Set(prevStore[idsKey]);
                updatedIds.add(id.toString());
                
                return {
                    ...prevStore,
                    [category]: {
                        ...prevStore[category],
                        [id]: data
                    },
                    [idsKey]: updatedIds
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
                const updatedIds = new Set(prevStore[idsKey]);
                
                // Add all keys to the IDs set
                Object.keys(dataItems).forEach(id => {
                    updatedIds.add(id.toString());
                });
                
                return {
                    ...prevStore,
                    [category]: {
                        ...prevStore[category],
                        ...dataItems
                    },
                    [idsKey]: updatedIds
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
                const updatedIds = new Set(prevStore[idsKey]);
                
                // Add all IDs to the set
                dataItems.forEach(item => {
                    updatedIds.add(item[idProperty]);
                });
                
                return {
                    ...prevStore,
                    [category]: {
                        ...prevStore[category],
                        ...dataObject
                    },
                    [idsKey]: updatedIds
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
            const newCategoryData = { ...prevStore[category] };
            delete newCategoryData[id];
            
            const idsKey = `${category}Ids`;
            const updatedIds = new Set(prevStore[idsKey]);
            updatedIds.delete(id.toString());
            
            return {
                ...prevStore,
                [category]: newCategoryData,
                [idsKey]: updatedIds
            };
        });
    }, []);

    // Clear all data for a category
    const clearData = useCallback((category) => {
        setDataStore(prevStore => ({
            ...prevStore,
            [category]: {},
            [`${category}Ids`]: new Set()
        }));
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
            const dataIdSet = new Set();

            // Convert to object with ID as key
            const dataObject = Array.isArray(data) 
                ? data.reduce((obj, item) => {
                    const idValue = item[idProperty].toString();
                    dataIdSet.add(idValue);
                    obj[idValue] = item;
                    return obj;
                }, {})
                : data;

            // Lấy ID từ data nếu không có ID nào trong dataIdSet
            if (dataIdSet.size === 0 && typeof data === 'object' && Object.values(data)[0]?.[idProperty]) {
                // If data is an object, use its keys as IDs
                Object.keys(data).forEach(key => {
                    dataIdSet.add(key.toString());
                });
            }
            
            setDataStore(prevStore => ({
                ...prevStore,
                [category]: dataObject,
                [`${category}Ids`]: dataIdSet
            }));
            
            setLoadingState(category, false);
            return { data, dataArray, dataIdSet, dataObject };
        } catch (error) {
            console.error(`Error fetching ${category}:`, error);
            setError(category, error.message || `Failed to fetch ${category}`);
            setLoadingState(category, false);
            return null;
        }
    }, [setLoadingState, setError, clearError]);

    // Context value
    const value = {
        currentCustomer,
        setCurrentCustomer,
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
    };

    return (
        <AppDataContext.Provider value={value}>
            {children}
        </AppDataContext.Provider>
    );
};

export default AppDataProvider;
