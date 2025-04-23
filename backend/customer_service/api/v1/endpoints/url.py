URLS = {
    'CUSTOMER': {
        'CREATE_CUSTOMER': '/customer/create',
        'LOGIN': '/customer/login',
        'GET_CUSTOMER_BY_ID': '/customer/{customer_id}',
        'GET_CUSTOMER_BY_PHONE': '/customer/phone/{phone_num}',# completed
        'GET_ALL_CUSTOMERS': '/customers', # completed
        # 'UPDATE_CUSTOMER': '/customer/update/{customer_id}', # completed
        # 'DELETE_CUSTOMER': '/customer/delete/{customer_id}', # completed
        'GET_CUSTOMER_WITH_MOTORCYCLES': '/customer/phone/{phone_num}/with-motorcycles', # completed
    },
    'MOTORCYCLE': {
        'GET_ALL_MOTORCYCLE_TYPES': '/motorcycle/types', # completed
        'GET_ALL_MOTORCYCLES': '/motorcycles', # completed
        'GET_MOTORCYCLE_BY_ID': '/motorcycle/{motorcycle_id}', # completed
        'CREATE_MOTORCYCLE': '/motorcycle/create', # completed
        # 'UPDATE_MOTORCYCLE': '/motorcycle/update/{motorcycle_id}', # completed
        # 'DELETE_MOTORCYCLE': '/motorcycle/delete/{motorcycle_id}', # completed
        
    },
    'APPOINTMENT': {
        'CREATE': '/appointment/create',
        'GET_ALL_TODAY': '/appointment/today',
        'FILTER': '/appointment/filter',
        'GET_ALL': '/appointment/all',
        'GET_APPOINTMENT_BY_ID': '/appointment/{appointment_id}',
        'GET_APPOINTMENTS_BY_DATE_RANGE': '/appointment/date-range',
        # 'UPDATE_APPOINTMENT': '/appointment/{appointment_id}',
        # 'DELETE_APPOINTMENT': '/appointment/{appointment_id}',
    },
    'RECEPTION': {
        'CREATE': '/reception/create', # completed
        'CREATE_WITHOUT_MOTORCYCLE_ID': '/reception/create/without-motorcycle-id', # completed
        'CREATE_WITHOUT_CUSTOMER_ID_AND_WITHOUT_MOTORCYCLE_ID': '/reception/create/without-customer-id-and-with-motorcycle-id', # completed
        'GET_ALL': '/receptions', # completed
        'GET_ALL_TODAY': '/receptions/today', # completed
        'GET_RECEPTION_BY_ID': '/reception/{form_id}', # completed
        'GET_RECEPTION_BY_DATE_RANGE': '/receptions/date-range', # completed
    },
}
