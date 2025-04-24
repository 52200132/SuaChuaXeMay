
URLS = {
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
        'GET_ALL_PARTS' : '/parts',
        'GET_PART_BY_ID' : '/part/{part_id}',
        'CREATE_PART' : '/part/create',
        'UPDATE_PART' : '/part/update',
        'DELETE_PART' : '/part/delete/{part_id}'
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
        # 'DELETE_INVOICE': '/invoice/{invoice_id}',
    }
}
