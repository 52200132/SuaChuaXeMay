
const URLS = {
    // resource service
    'SERVICE': {
        'GET_ALL_SERVICE_TYPE' : '/service/service-type/get-all',
        'GET_SERVICE_TYPE_BY_ID' : '/service/service-type/{service-type-id}',
        'GET_SERVICES_BY_SERVICE_TYPE_ID' : '/service/service-type/{service_type_id}/get-services',
    },
    'STAFF': {
        'LOGIN' : '/staff/login',
        // 'GET_ALL_STAFF_TYPE' : '/staff/staff-type/get-all',
        // 'GET_STAFF_TYPE_BY_ID' : '/staff/staff-type/{staff-type-id}',
        'GET_STAFFS_BY_STAFF_TYPE_ID' : '/staff/staff-type/{staff_type_id}/get-staffs',
    },

    // customer service
    'CUSTOMER': {
        'CREATE_CUSTOMER' : '/customer/create',
        'LOGIN' : '/customer/login',
        'GET_CUSTOMER_BY_ID' : '/customer/{customer_id}',
        // 'GET_ALL_CUSTOMER_TYPE' : '/customer/customer-type/get-all',
        // 'GET_CUSTOMER_TYPE_BY_ID' : '/customer/customer-type/{customer-type-id}',
        // 'GET_CUSTOMERS_BY_CUSTOMER_TYPE_ID' : '/customer/customer-type/{customer_type_id}/get-customers',
    },
    'MOTORCYCLE': {
        'GET_ALL_MOTORCYCLE_TYPES': '/motorcycle/types',
        'GET_MOTORCYCLE_BY_ID': '/motorcycle/{motorcycle_id}',
    },
    'APPOINTMENT': {
        'CREATE': '/appointment/create',
        'GET_ALL_TODAY': '/appointment/today',
        'FILLTER': '/appointment/filter',
        'GET_ALL': '/appointment/all',
        'GET_APPOINTMENT_BY_ID': '/appointment/{appointment_id}',
        'GET_APPOINTMENTS_BY_DATE_RANGE': '/appointment/date-range',
        // 'GET_ALL_APPOINTMENT_TYPES': '/appointment/types',
        // 'GET_APPOINTMENT_BY_ID': '/appointment/{appointment_id}',
    },
    'RECEPTION': {
        'CREATE': '/reception/create',
        'GET_ALL': '/receptions',
        'GET_ALL_TODAY': '/reception/today',
        'GET_RECEPTION_BY_ID': '/reception/{form_id}',
        'GET_RECEPTION_BY_DATE_RANGE': '/reception/date-range',
    },
}

export default URLS;