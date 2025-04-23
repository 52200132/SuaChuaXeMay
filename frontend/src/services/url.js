
const URLS = {
    // resource service
    'SERVICE': {
        'GET_ALL_SERVICE_TYPE' : '/service/service-type/get-all',
        'GET_SERVICE_TYPE_BY_ID' : '/service/service-type/{service-type-id}',
        'GET_SERVICES_BY_SERVICE_TYPE_ID' : '/service/service-type/{service_type_id}/get-services',
    },
    'STAFF': {
        'LOGIN' : '/staff/login',
        'GET_STAFF_BY_ID' : '/staff/{staff_id}',
    },

    // customer service
    'CUSTOMER': {
        'CREATE_CUSTOMER': '/customer/create',
        'LOGIN': '/customer/login',
        'GET_CUSTOMER_BY_ID': '/customer/{customer_id}',
        'GET_CUSTOMER_BY_PHONE': '/customer/phone/{phone_num}',//completed
        'GET_ALL_CUSTOMERS': '/customers', //completed
        'UPDATE_CUSTOMER': '/customer/update/{customer_id}', //completed
        'DELETE_CUSTOMER': '/customer/delete/{customer_id}', //completed
        'GET_CUSTOMER_WITH_MOTORCYCLES': '/customer/phone/{phone_num}/with-motorcycles', //completed,
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
        'CREATE': '/reception/create', // completed
        'CREATE_WITHOUT_MOTORCYCLE_ID': '/reception/create/without-motorcycle-id', // 
        'CREATE_WITHOUT_CUSTOMER_ID_AND_WITHOUT_MOTORCYCLE_ID': '/reception/create/without-customer-id-and-with-motorcycle-id', // completed

        'GET_ALL': '/receptions', // completed
        'GET_ALL_TODAY': '/receptions/today', // completed
        'GET_RECEPTION_BY_ID': '/reception/{form_id}', // completed
        'GET_RECEPTION_BY_DATE_RANGE': '/receptions/date-range', // completed
    },

    // repair service
    'ORDER': {
        'CREATE_ORDER':'/order/create',
        'GET_ALL_ORDERS':'/orders',
        'GET_ORDER_BY_ID':'/order/{order_id}',
        'UPDATE_ORDER':'/order/update/{order_id}',
    },
    'DIAGNOSIS':{
        'CREATE_DIAGNOSIS':'/diagnosis/create',
        'GET_DIAGNOSIS_BY_ID':'/diagnosis/{diagnosis_id}',
        'GET_DIAGNOSIS_BY_ORDER_ID':'/diagnosis/order/{order_id}',
    },
    'ORDER_STATUS_HISTORY':{
        'CREATE_STATUS_HISTORY':'/order/status-history/create',
        'GET_ALL_STATUS_HISTORY_BY_ORDER':'order/status-histories/{order_id}',
        'GET_STATUS_HISTORY_BY_ID':'order/status-history/{history_id}',
    },
    'PART_ORDER_DETAIL':{
        'CREATE_PART_ORDER_DETAIL':'/part-order-detail/create',
        'GET_ALL_PART_ORDER_DETAILS':'/part-order-details',
        'GET_PART_ORDER_DETAIL_BY_ID':'/part-order-detail/{part_order_detail_id}',
        'UPDATE_PART_ORDER_DETAIL':'/part-order-detail/update/{part_order_detail_id}'
    },
    'SERVICE_ORDER_DETAIL':{
        'CREATE_SERVICE_ORDER_DETAIL':'/service-order-detail/create',
        'GET_ALL_SERVICE_ORDER_DETAILS':'/service-order-details',
        'GET_SERVICE_ORDER_DETAIL_BY_ID':'/service-order-detail/{service_order_detail_id}',
        'UPDATE_SERVICE_ORDER_DETAIL':'/service-order-detail/update/{service_order_detail_id}'
    }
}

export default URLS;