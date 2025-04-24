
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
}
