URLS = {
    'CUSTOMER': {
        'CREATE_CUSTOMER': '/customer/create',
        'LOGIN': '/customer/login',
        'GET_CUSTOMER_BY_ID': '/customer/{customer_id}',
        'GET_CUSTOMER_BY_PHONE': '/customer/phone/{phone_num}',# completed
        'GET_ALL_CUSTOMERS': '/customers', # completed
        'UPDATE_CUSTOMER': '/customer/update/{customer_id}', # completed
        'DELETE_CUSTOMER': '/customer/delete/{customer_id}', # completed
        'GET_CUSTOMER_WITH_MOTORCYCLES': '/customer/phone/{phone_num}/with-motorcycles', # completed
    },
    'MOTORCYCLE': {
        'GET_ALL_MOTORCYCLE_TYPES': '/motorcycle/types',
        'GET_MOTORCYCLE_BY_ID': '/motorcycle/{motorcycle_id}',
    },
    'APPOINTMENT': {
        'CREATE': '/appointment/create',
        'GET_ALL_TODAY': '/appointment/today',
        'FILTER': '/appointment/filter',
        'GET_ALL': '/appointment/all',
        'GET_APPOINTMENT_BY_ID': '/appointment/{appointment_id}',
        'GET_APPOINTMENTS_BY_DATE_RANGE': '/appointment/date-range',
        # 'GET_APPOINTMENT_BY_ID': '/appointment/{appointment_id}',
        # 'UPDATE_APPOINTMENT': '/appointment/{appointment_id}',
        # 'DELETE_APPOINTMENT': '/appointment/{appointment_id}',
    },
    'RECEPTION': {
        'CREATE': '/reception/create',
        'GET_ALL': '/receptions',
        'GET_ALL_TODAY': '/reception/today',
        'GET_RECEPTION_BY_ID': '/reception/{form_id}',
        'GET_RECEPTION_BY_DATE_RANGE': '/reception/date-range',
    },
}
