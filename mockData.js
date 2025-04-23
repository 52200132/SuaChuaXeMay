const mockOrders = [
    {
        orderId: 'ORD-2023-001',
        customerName: 'Nguyễn Văn A',
        customerPhone: '0912345678',
        createdDate: '2023-06-15',
        createdTime: '08:30',
        technicianName: 'Kỹ thuật viên 1',
        status: 'Đang xử lý',
        items: [
            { name: 'Thay nhớt', quantity: 1, price: 150000 },
            { name: 'Vệ sinh bugi', quantity: 1, price: 50000 }
        ],
        totalAmount: 200000,
        note: 'Khách hẹn lấy xe vào cuối tuần'
    },
    {
        orderId: 'ORD-2023-002',
        customerName: 'Trần Thị B',
        customerPhone: '0987654321',
        createdDate: '2023-06-16',
        createdTime: '10:15',
        technicianName: 'Kỹ thuật viên 2',
        status: 'Hoàn thành',
        items: [
            { name: 'Thay lốp xe', quantity: 2, price: 400000 },
            { name: 'Thay bugi', quantity: 1, price: 120000 }
        ],
        totalAmount: 520000,
        note: 'Đã thanh toán đầy đủ'
    },
    {
        orderId: 'ORD-2023-003',
        customerName: 'Lê Văn C',
        customerPhone: '0977123456',
        createdDate: '2023-06-17',
        createdTime: '13:45',
        technicianName: 'Kỹ thuật viên 3',
        status: 'Đang xử lý',
        items: [
            { name: 'Sửa chữa động cơ', quantity: 1, price: 750000 }
        ],
        totalAmount: 750000,
        note: 'Cần liên hệ với khách khi phát hiện thêm vấn đề'
    },
    {
        orderId: 'ORD-2023-004',
        customerName: 'Phạm Thị D',
        customerPhone: '0909123456',
        createdDate: '2023-06-18',
        createdTime: '09:30',
        technicianName: 'Kỹ thuật viên 1',
        status: 'Hoàn thành',
        items: [
            { name: 'Bảo dưỡng định kỳ', quantity: 1, price: 350000 },
            { name: 'Thay dầu số', quantity: 1, price: 120000 }
        ],
        totalAmount: 470000,
        note: 'Khách đã thanh toán qua chuyển khoản'
    },
    {
        orderId: 'ORD-2023-005',
        customerName: 'Hoàng Văn E',
        customerPhone: '0918765432',
        createdDate: '2023-06-19',
        createdTime: '15:20',
        technicianName: 'Kỹ thuật viên 4',
        status: 'Chờ thanh toán',
        items: [
            { name: 'Thay nhông sên dĩa', quantity: 1, price: 520000 },
            { name: 'Vệ sinh hệ thống nhiên liệu', quantity: 1, price: 280000 }
        ],
        totalAmount: 800000,
        note: 'Khách hẹn thanh toán khi nhận xe'
    },
    {
        orderId: 'ORD-2023-006',
        customerName: 'Vũ Thị F',
        customerPhone: '0919123456',
        createdDate: '2023-06-20',
        createdTime: '11:00',
        technicianName: 'Kỹ thuật viên 2',
        status: 'Đã hủy',
        items: [
            { name: 'Sửa chữa hệ thống điện', quantity: 1, price: 320000 }
        ],
        totalAmount: 320000,
        note: 'Khách hủy đơn vì có việc gấp'
    },
    {
        orderId: 'ORD-2023-007',
        customerName: 'Đặng Văn G',
        customerPhone: '0909765432',
        createdDate: '2023-06-21',
        createdTime: '14:15',
        technicianName: 'Kỹ thuật viên 3',
        status: 'Đang xử lý',
        items: [
            { name: 'Sửa phanh xe', quantity: 2, price: 260000 },
            { name: 'Thay dây phanh', quantity: 2, price: 180000 }
        ],
        totalAmount: 440000,
        note: 'Cần kiểm tra kỹ hệ thống phanh'
    }
];

setOrders(mockOrders);
setFilteredOrders(mockOrders);
setTotalPages(Math.ceil(mockOrders.length / 10));
setLoading(false);

////////////////////////////
        // Mock data
        const mockReceipts = [
            {
                form_id: 'RN-2023-001',
                customer_name: 'Nguyễn Văn A',
                phone: '0912345678',
                plate_number: '59Y2-12345',
                motorcycle_model: 'Honda Wave',
                initial_condition: 'Xe không nổ máy, tình trạng bình thường',
                note: 'Khách hẹn lấy xe vào cuối tuần',
                is_returned: false,
                created_at: '2023-06-15',
                updated_at: '2023-06-15'
            },
            {
                form_id: 'RN-2023-002',
                customer_name: 'Trần Thị B',
                phone: '0987654321',
                plate_number: '59P9-54321',
                motorcycle_model: 'Yamaha Exciter',
                initial_condition: 'Xe chạy không êm, tiếng máy lớn',
                note: 'Khách yêu cầu kiểm tra kỹ nhông sên dĩa',
                is_returned: true,
                created_at: '2023-06-16',
                updated_at: '2023-06-18'
            },
            {
                form_id: 'RN-2023-003',
                customer_name: 'Lê Văn C',
                phone: '0977123456',
                plate_number: '59X3-67890',
                motorcycle_model: 'Honda Air Blade',
                initial_condition: 'Xe bị rò rỉ dầu, phanh không ăn',
                note: '',
                is_returned: false,
                created_at: '2023-06-17',
                updated_at: '2023-06-17'
            },
            {
                form_id: 'RN-2023-004',
                customer_name: 'Phạm Thị D',
                phone: '0909123456',
                plate_number: '59F5-13579',
                motorcycle_model: 'Honda Vision',
                initial_condition: 'Xe không tăng ga được, đèn xi nhan phải không sáng',
                note: 'Khách cần sửa gấp trong ngày',
                is_returned: true,
                created_at: '2023-06-18',
                updated_at: '2023-06-18'
            },
            {
                form_id: 'RN-2023-005',
                customer_name: 'Hoàng Văn E',
                phone: '0918765432',
                plate_number: '59D7-24680',
                motorcycle_model: 'Yamaha Sirius',
                initial_condition: 'Xe cần bảo dưỡng định kỳ 10.000km',
                note: 'Khách dặn thay nhớt loại tốt',
                is_returned: false,
                created_at: '2023-06-19',
                updated_at: '2023-06-19'
            }
        ];

        // Tạo object và mảng ID từ dữ liệu
        const newReceiptsById = {};
        const newReceiptIds = [];

        mockReceipts.forEach(receipt => {
            newReceiptsById[receipt.form_id] = {
                id: receipt.form_id,
                customerName: receipt.customer_name,
                phone: receipt.phone,
                plateNumber: receipt.plate_number,
                motorcycleModel: receipt.motorcycle_model,
                initialCondition: receipt.initial_condition,
                note: receipt.note,
                isReturned: receipt.is_returned,
                createdAt: receipt.created_at,
                returnedAt: receipt.updated_at
            };

            newReceiptIds.push(receipt.form_id);
        });

        // Cập nhật state
        // setReceiptsById(newReceiptsById);
        // setReceiptIds(newReceiptIds);
        // setData('receipts', newReceiptsById);
        // setReceptionsDisplay(newReceiptsById);