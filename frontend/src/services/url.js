const URLS = {
    // resource service
    'SERVICE_TYPE': {
        'GET_ALL_SERVICE_TYPES' : '/service/service-types',
        'GET_SERVICE_TYPE_BY_ID' : '/service/service-type/{service_type_id}'
    },
    
    'SERVICE': {
        'GET_ALL_SERVICES' : '/services',
        'GET_SERVICE_BY_ID' : '/service/{service_id}',
        'GET_SERVICES_BY_SERVICE_TYPE_ID' : '/service/service-type/{service_type_id}/get-services',
        'CREATE_SERVICE' : '/service/create',
        'UPDATE_SERVICE' : '/service/update',
        'DELETE_SERVICE' : '/service/delete/{service_id}'
    },
    
    'SERVICE_V2': {
        'CREATE_SERVICE':'/service/create',
        'GET_ALL_SERVICES':'/services',
        'GET_SERVICE_BY_ID':'/service/{service_id}',
        'GET_SERVICE_VIEWS_BY_PARENT_MOTO_TYPE':'/service-views/motocycle-type/{parent_moto_type}',
        'UPDATE_SERVICE':'/service/update/{service_id}',
        'DELETE_SERVICE':'/service/delete/{service_id}',
    },
        
    'STAFF': {
        'LOGIN' : '/staff/login',
        'GET_ALL_STAFF' : '/staffs',
        'FILTER': '/staffs/filter',
        'GET_STAFF_BY_ID' : '/staff/{staff_id}',
        'CREATE_STAFF' : '/staff/create',
        'UPDATE_STAFF' : '/staff/update',
        'DELETE_STAFF' : '/staff/delete/{staff_id}'
    },
    
    'PART': {
        'CREATE_PART':'/part/create',
        'GET_ALL_PARTS':'/parts',
        'GET_PART_BY_ID':'/part/{part_id}',
        'GET_PARTS_VIEWS_BY_MOTO_TYPE_ID':'/part-views/motocycle-type/{moto_type_id}',
        'GET_PARTS_VIEWS_BY_ORDER_ID':'/part-views/order/{order_id}',
        'GET_PARTS_VIEWS_BY_PART_ID_LIST':'/part-views/part-id-list',
        'UPDATE_PART':'/part/update/{part_id}',
        'DELETE_PART':'/part/delete/{part_id}',
        'BULK_RECEIVE':'/parts/bulk-receive',
        'GET_PARTS_BY_SUPPLIER_ID':'/parts/supplier/{supplier_id}', 
    },
    'SUPPLIER': {
        'CREATE_SUPPLIER': '/supplier/create',
        'GET_ALL_SUPPLIERS': '/suppliers',
        'GET_SUPPLIER_BY_ID': '/supplier/{supplier_id}',
        'UPDATE_SUPPLIER': '/supplier/update/{supplier_id}',
    },

    'PART_V2': {
        'CREATE_PART':'/part/create',
        'GET_ALL_PARTS':'/parts',
        'GET_PART_BY_ID':'/part/{part_id}',
        'GET_PART_VIEWS':'/part-views',
        'GET_PARTS_VIEWS_BY_MOTO_TYPE_ID':'/part-views/motocycle-type/{moto_type_id}',
        'GET_PARTS_VIEWS_BY_ORDER_ID':'/part-views/order/{order_id}',
        'GET_PARTS_VIEWS_BY_ORDER_ID_V2':'/part-views/order/{order_id}/v2',
        'GET_PARTS_VIEWS_BY_PART_ID_LIST':'/part-views/part-id-list',
        'UPDATE_PART':'/part/update/{part_id}',
        'DELETE_PART':'/part/delete/{part_id}',
    },
    
    'PART_MOTO_TYPE': {
        'GET_PART_MOTO_TYPE_BY_ID' : '/part-moto-type/{part_mototype_id}',
        'GET_PART_MOTO_TYPE_BY_PART_ID_AND_MOTOTYPE_ID' : '/part-moto-type/{part_id}/{moto_type_id}',
        'GET_ALL_PART_MOTO_TYPES' : '/part-moto-types',
        'GET_ALL_PART_MOTO_TYPES_BY_MOTOTYPE_ID' : '/part-moto-types/moto-type/{moto_type_id}',
        'CREATE_PART_MOTO_TYPE' : '/part-moto-type/create',
        'UPDATE_PART_MOTO_TYPE' : '/part-moto-type/update',
        'UPDATE_PART_MOTO_TYPE_BY_PART_ID_AND_MOTOTYPE_ID' : '/part-moto-type/update2',
        'DELETE_PART_MOTO_TYPE' : '/part-moto-type/delete/{part_moto_type_id}'
    },
    
    'SERVICE_MOTO_TYPE': {
        'GET_SERVICE_MOTO_TYPE_BY_ID' : '/service-moto-type/{service_mototype_id}',
        'GET_SERVICE_MOTO_TYPE_BY_SERVICE_ID_AND_MOTOTYPE_ID' : '/service-moto-type/{service_id}/{moto_type_id}',
        'GET_ALL_SERVICE_MOTO_TYPES' : '/service-moto-types',
        'GET_ALL_SERVICE_MOTO_TYPES_BY_MOTOTYPE_ID' : '/service-moto-types/moto-type/{moto_type_id}',
        'CREATE_SERVICE_MOTO_TYPE' : '/service-moto-type/create',
        'UPDATE_SERVICE_MOTO_TYPE' : '/service-moto-type/update',
        'UPDATE_SERVICE_MOTO_TYPE_BY_SERVICE_ID_AND_MOTOTYPE_ID' : '/service-moto-type/update2',
        'DELETE_SERVICE_MOTO_TYPE' : '/service-moto-type/delete/{service_moto_type_id}'
    },
    
    'INVOICE': {
        'CREATE': '/invoice/create',
        'GET_ALL_TODAY': '/invoice/today',
        'FILTER': '/invoice/filter',
        'GET_ALL_INVOICES': '/invoices',
        'GET_INVOICE_BY_ID': '/invoice/{invoice_id}',
        'GET_INVOICES_BY_DATE_RANGE': '/invoice/date-range',
        'UPDATE_INVOICE': '/invoice/{invoice_id}',
        'GET_INVOICE_BY_ORDER_ID': '/invoice/order/{invoice_id}',
        // 'DELETE_INVOICE': '/invoice/{invoice_id}',
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
        'GET_ALL_MOTORCYCLE_BY_CUSTOMER_ID': '/motorcycle/customer/{customer_id}', //  completed
        'GET_ALL_MOTORCYCLE_TYPES': '/motorcycle/types', //  completed
        'GET_ALL_MOTORCYCLES': '/motorcycles', //  completed
        'GET_MOTORCYCLE_BY_ID': '/motorcycle/{motorcycle_id}', //  completed
        'CREATE_MOTORCYCLE': '/motorcycle/create', //  completed
        // 'UPDATE_MOTORCYCLE': '/motorcycle/update/{motorcycle_id}', //  completed
        // 'DELETE_MOTORCYCLE': '/motorcycle/delete/{motorcycle_id}', //  completed
        
    },
    'APPOINTMENT': {
        'CREATE': '/appointment/create',
        'GET_ALL': '/appointments',
        'GET_APPOINTMENT_BY_ID': '/appointment/{appointment_id}',
        'UPDATE_APPOINTMENT': '/appointment/update/{appointment_id}',
        // 'GET_ALL_APPOINTMENT_TYPES': '/appointment/types',
        // 'GET_APPOINTMENT_BY_ID': '/appointment/{appointment_id}',
    },
    'RECEPTION': {
        'CREATE': '/reception/create', //  completed
        'CREATE_WITHOUT_MOTORCYCLE_ID': '/reception/create/without-motorcycle-id', //  completed
        'CREATE_WITHOUT_CUSTOMER_ID_AND_WITHOUT_MOTORCYCLE_ID': '/reception/create/without-customer-id-and-without-motorcycle-id', // completed
        'GET_ALL': '/receptions', //  completed
        'GET_ALL_TODAY': '/receptions/today', //  completed
        'GET_RECEPTION_BY_ID': '/reception/{form_id}', //  completed
        'GET_RECEPTION_BY_DATE_RANGE': '/receptions/date-range', //  completed
        'UPDATE': '/reception/update/{form_id}', //  completed
        'UPDATE_RETURN': '/reception/{form_id}/return', //  completed
    },

    // repair service
    'ORDER': {
        'CREATE_ORDER':'/order/create',
        'GET_ALL_ORDERS':'/orders',
        'GET_ORDER_BY_ID':'/order/{order_id}',
        'UPDATE_ORDER':'/order/update/{order_id}',
        'ASSIGN_STAFF':'/order/{order_id}/assign-staff/{staff_id}',
        'GET_ALL_ORDERS_BY_STAFF_ID_TODAY':'/orders/staff/{staff_id}/today',
        'GET_CUSTOMER_ORDERS':'/orders/customer/{customer_id}',
        'GET_ALL_ORDERS_BY_MOTO_ID':'/orders/motorcycle/{motocycle_id}',
    },
    'ORDER_V2':{
        'GET_ORDER_VIEWS_FOR_TABLE':'/order-views/table',
    },
    'WAREHOUSE':{
        'EXPORT_PART_LOTS':'/warehouse/export-part-lots',
        'GET_WAREHOUSE_INFO':'/warehouse/info',
    },

    'DIAGNOSIS':{
        'CREATE_DIAGNOSIS':'/diagnosis/create',
        'GET_ALL_DIAGNOSIS':'/diagnosis',
        'GET_DIAGNOSIS_BY_ID':'/diagnosis/{diagnosis_id}',
        'GET_DIAGNOSIS_BY_ORDER_ID':'/diagnosis/order/{order_id}',
        'UPDATE_DIAGNOSIS':'/diagnosis/update/{diagnosis_id}',
    },
    'ORDER_STATUS_HISTORY':{
        'CREATE_STATUS_HISTORY':'/order/status-history/create',
        'GET_ALL_STATUS_HISTORY_BY_ORDER':'order/status-histories/{order_id}',
        'GET_STATUS_HISTORY_BY_ID':'order/status-history/{history_id}',
    },
    'PART_ORDER_DETAIL':{
        'CREATE_PART_ORDER_DETAILS':'/part-order-detail/create',
        'GET_ALL_PART_ORDER_DETAILS':'/part-order-details',
        'GET_ALL_PART_ORDER_DETAILS_BY_ORDER':'/order/part-order-details/{order_id}',
        'GET_PART_ORDER_DETAIL_BY_ID':'/part-order-detail/{part_detail_ID}',
        'UPDATE_PART_ORDER_DETAIL':'/part-order-detail/update/{part_detail_ID}'
    },
    'SERVICE_ORDER_DETAIL':{
        'CREATE_SERVICE_ORDER_DETAILS':'/service-order-detail/create',
        'GET_ALL_SERVICE_ORDER_DETAILS':'/service-order-details',
        'GET_SERVICE_ORDER_DETAIL_BY_ID':'/service-order-detail/{service_detail_ID}',
        'GET_SERVICE_ORDER_DETAILS_BY_ORDER':'/order/service-order-details/{order_id}',
        'UPDATE_SERVICE_ORDER_DETAIL':'/service-order-detail/update/{service_detail_ID}'
    },
    'MOTOCYCLE_TYPE':{
        'GET_ALL_MOTOCYCLE_TYPES':'/motocycle-types',
        'GET_ALL_BRANDS':'/motocycle-type/brands',
        'GET_MOTOCYCLE_TYPES_BY_BRAND':'/motocycle-types/brand/{brand}',
        'CREATE_MOTOCYCLE_TYPE':'/motocycle-type/create',
        'UPDATE_MOTOCYCLE_TYPE':'/motocycle-type/update/{moto_type_id}',
        'DELETE_MOTOCYCLE_TYPE':'/motocycle-type/delete/{moto_type_id}',
    },
}

export default URLS;