URLS = {
    'CUSTOMER': {
        'CREATE_CUSTOMER': '/customer/create',
        'LOGIN': '/customer/login',
        # 'GET_ALL_CUSTOMERS': '/customers',
        # 'GET_CUSTOMER_BY_ID': '/customers/{customer_id}',
        # 'UPDATE_CUSTOMER': '/customers/{customer_id}',
        # 'DELETE_CUSTOMER': '/customers/{customer_id}',
    },
    'MOTORCYCLE': {
        'GET_ALL_MOTORCYCLE_TYPES': '/motorcycle/types',
    },
    'APPOINTMENT': {
        'CREATE': '/appointment/create',
        'GET_ALL_TODAY': '/appointment/today',
        'GET_APPOINTMENT_BY_ID': '/appointment/{appointment_id}',
        'GET_APPOINTMENTS_BY_DATE_RANGE': '/appointment/date-range',
        # 'GET_APPOINTMENT_BY_ID': '/appointment/{appointment_id}',
        # 'UPDATE_APPOINTMENT': '/appointment/{appointment_id}',
        # 'DELETE_APPOINTMENT': '/appointment/{appointment_id}',
    },
    'RECEPTION_FORM': {
        'CREATE': '/reception-form/create',
        'GET_ALL_TODAY': '/reception-form/today',
        'GET_RECEPTION_FORM_BY_ID': '/reception-form/{reception_form_id}',
        'GET_RECEPTION_FORMS_BY_DATE_RANGE': '/reception-form/date-range',
    },
}