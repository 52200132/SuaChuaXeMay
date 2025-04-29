import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Modal, Row, Col, Form, InputGroup, Spinner, Badge } from 'react-bootstrap';

import { useStaffAuth } from '../contexts/StaffAuthContext';
import { useAppData } from '../contexts/AppDataContext';
import { resourceService, repairService, customerService } from '../../services/api';
import './InvoiceManagement.css';

const InvoiceManagement = () => {
    const { getData, setData, fetchAndStoreData } = useAppData();
    const { currentStaff } = useStaffAuth();

    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalLoading, setModalLoading] = useState(false);
    const [filters, setFilters] = useState({
        search: '',
        startDate: '',
        endDate: '',
        isPaid: ''
    });
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [currentInvoice, setCurrentInvoice] = useState(null);
    const [currentOrder, setCurrentOrder] = useState(null);
    const [customer, setCustomer] = useState(null);
    const [motorcycle, setMotorcycle] = useState(null);
    const [staff, setStaff] = useState(null);
    const [diagnosis, setDiagnosis] = useState(null);

    // State để lưu chi tiết phụ tùng và dịch vụ
    const [partOrderDetails, setPartOrderDetails] = useState([]);
    const [serviceOrderDetails, setServiceOrderDetails] = useState([]);

    // State để xử lý in hóa đơn
    const [isPrinting, setIsPrinting] = useState(false);
    
    // State cho modal thanh toán
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cash');
    const [invoiceToPayment, setInvoiceToPayment] = useState(null);

    // Lấy danh sách hóa đơn khi load trang
    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const res = await resourceService.invoice.getAllInvoices();
            setInvoices(res.data || []);
        } catch (err) {
            console.error("Lỗi khi tải danh sách hóa đơn:", err);
            setInvoices([]);
        } finally {
            setLoading(false);
        }
    };

    // Hàm format tiền
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
    };

    // Hàm format ngày giờ
    const formatDateTime = (dateTimeStr) => {
        if (!dateTimeStr) return '';

        const date = new Date(dateTimeStr);
        return new Intl.DateTimeFormat('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    // Xử lý lọc hóa đơn
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleApplyFilter = () => {
        // Filter sẽ được áp dụng tự động trong phần render
    };

    const handleResetFilter = () => {
        setFilters({
            search: '',
            startDate: '',
            endDate: '',
            isPaid: ''
        });
    };

    // Xem chi tiết hóa đơn
    const handleShowDetail = async (invoice) => {
        setCurrentInvoice(invoice);
        setModalLoading(true);
        setShowDetailModal(true);

        try {
            // Reset state
            setCurrentOrder(null);
            setCustomer(null);
            setMotorcycle(null);
            setStaff(null);
            setDiagnosis(null);
            setPartOrderDetails([]);
            setServiceOrderDetails([]);

            // Lấy thông tin đơn hàng liên quan
            const orderRes = await repairService.order.getAllOrders();
            console.log("Order response:", orderRes);

            // Kiểm tra cấu trúc response và lấy mảng đơn hàng
            const orders = Array.isArray(orderRes.data) ? orderRes.data : (orderRes.data?.data || []);

            // Tìm đơn hàng phù hợp
            const order = orders.find(o => o.order_id === invoice.order_id) || null;

            if (!order) {
                throw new Error("Không tìm thấy thông tin đơn hàng");
            }

            setCurrentOrder(order);

            // Tải song song các dữ liệu liên quan
            const [motorcycleRes, diagnosisRes, partDetailsRes, serviceDetailsRes] = await Promise.all([
                customerService.motorcycle.getMotorcycleById(order.motocycle_id),
                repairService.diagnosis.getDiagnosisByOrderId(order.order_id),
                repairService.partOrderDetail.getAllPartOrderDetailsByOrderId(order.order_id),
                repairService.serviceOrderDetail.getAllServiceOrderDetailsByOrderId(order.order_id)
            ]);

            console.log("Part details response:", partDetailsRes);
            console.log("Service details response:", serviceDetailsRes);

            setMotorcycle(motorcycleRes.data);
            setDiagnosis(diagnosisRes.data);

            // Lọc các mục đã được chọn
            const selectedParts = (partDetailsRes.data || []).filter(part => part.is_selected);
            const selectedServices = (serviceDetailsRes.data || []).filter(service => service.is_selected);

            // Tải thông tin chi tiết của tất cả phụ tùng và dịch vụ
            const [allPartsRes, allServicesRes] = await Promise.all([
                resourceService.part.getAllParts(),
                resourceService.service.getAllServices()
            ]);

            console.log("All parts response:", allPartsRes);
            console.log("All services response:", allServicesRes);

            // Tạo map để lưu trữ thông tin phụ tùng và dịch vụ theo ID
            const partsMap = {};
            const servicesMap = {};

            // Tạo bản đồ phụ tùng theo ID
            (allPartsRes.data || []).forEach(part => {
                partsMap[part.part_id] = part;
            });

            // Tạo bản đồ dịch vụ theo ID
            (allServicesRes.data || []).forEach(service => {
                servicesMap[service.service_id] = service;
            });

            // Gắn thông tin tên và mã cho từng phụ tùng trong đơn hàng
            const enrichedParts = selectedParts.map(part => {
                const partDetail = partsMap[part.part_id];
                return {
                    ...part,
                    partDetail,
                    part_name: partDetail?.name || part.part_name || "Phụ tùng không xác định",
                    part_code: partDetail?.code || part.part_code || "Không có mã"
                };
            });

            // Gắn thông tin tên và mã cho từng dịch vụ trong đơn hàng
            const enrichedServices = selectedServices.map(service => {
                const serviceDetail = servicesMap[service.service_id];
                return {
                    ...service,
                    serviceDetail,
                    service_name: serviceDetail?.name || service.service_name || "Dịch vụ không xác định",
                    service_code: serviceDetail?.code || service.service_code || "Không có mã"
                };
            });

            console.log("Enriched parts:", enrichedParts);
            console.log("Enriched services:", enrichedServices);

            setPartOrderDetails(enrichedParts);
            setServiceOrderDetails(enrichedServices);

            // Tải thông tin khách hàng và nhân viên
            if (motorcycleRes.data?.customer_id && order.staff_id) {
                const [customerRes, staffRes] = await Promise.all([
                    customerService.customer.getCustomerById(motorcycleRes.data.customer_id),
                    resourceService.staff.getStaffById(order.staff_id)
                ]);

                setCustomer(customerRes.data);
                setStaff(staffRes.data);
            }
        } catch (err) {
            console.error("Lỗi khi tải chi tiết hóa đơn:", err);
        } finally {
            setModalLoading(false);
        }
    };

    // Hàm xử lý in hóa đơn
    const handlePrintInvoice = () => {
        setIsPrinting(true);
        
        try {
            // Lấy nội dung cần in
            const printContent = document.getElementById('invoice-print-content');
            
            if (!printContent) {
                console.error('Không tìm thấy nội dung để in');
                setIsPrinting(false);
                return;
            }
            
            // Tạo một iframe ẩn
            const printFrame = document.createElement('iframe');
            printFrame.style.position = 'absolute';
            printFrame.style.width = '0';
            printFrame.style.height = '0';
            printFrame.style.border = '0';
            document.body.appendChild(printFrame);
            
            // Tạo nội dung HTML đầy đủ cho iframe
            const frameDocument = printFrame.contentWindow.document;
            frameDocument.open();
            
            // Thêm CSS in ấn và nội dung
            frameDocument.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Hóa đơn #${currentInvoice?.invoice_id}</title>
                    <style>
                        @page {
                            size: A4;
                            margin: 10mm 10mm 10mm 10mm; /* Giảm lề trang */
                        }
                        body {
                            font-family: Arial, sans-serif;
                            margin: 0;
                            padding: 0;
                            width: 100%;
                            max-width: 100%;
                        }
                        .invoice-container {
                            width: 100%;
                            padding: 10px;
                        }
                        .header {
                            text-align: center;
                            margin-bottom: 20px;
                            border-bottom: 1px solid #ddd;
                            padding-bottom: 10px;
                        }
                        .header h1 {
                            margin: 0;
                            font-size: 24px;
                        }
                        .info-section {
                            margin-bottom: 20px;
                        }
                        table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-bottom: 15px;
                        }
                        table, th, td {
                            border: 1px solid #ddd;
                        }
                        th, td {
                            padding: 8px;
                            text-align: left;
                            font-size: 14px;
                        }
                        th {
                            background-color: #f2f2f2;
                        }
                        .text-end {
                            text-align: right;
                        }
                        .text-center {
                            text-align: center;
                        }
                        .row {
                            display: flex;
                            width: 100%;
                        }
                        .col {
                            flex: 1;
                            padding-right: 15px;
                        }
                        h5 {
                            margin-top: 20px;
                            margin-bottom: 10px;
                            border-bottom: 1px solid #ddd;
                            padding-bottom: 5px;
                        }
                        .footer {
                            margin-top: 30px;
                            border-top: 1px solid #ddd;
                            padding-top: 10px;
                        }
                        .totals {
                            width: 100%;
                            max-width: 350px;
                            margin-left: auto;
                            background-color: #f9f9f9;
                            padding: 10px;
                            border-radius: 4px;
                        }
                    </style>
                </head>
                <body>
                    <div class="invoice-container">
                        <div class="header">
                            <h1>HÓA ĐƠN THANH TOÁN</h1>
                        </div>

                        <div class="info-section">
                            <div class="row">
                                <div class="col">
                                    <p><strong>Mã hóa đơn:</strong> ${currentInvoice?.invoice_id}</p>
                                    <p><strong>Ngày tạo:</strong> ${formatDateTime(currentInvoice?.create_at)}</p>
                                    <p><strong>Mã đơn hàng:</strong> ${currentInvoice?.order_id}</p>
                                    <p><strong>Trạng thái:</strong> ${currentInvoice?.is_paid ? 'Đã thanh toán' : 'Chờ thanh toán'}</p>
                                    <p><strong>Phương thức:</strong> ${
                                        currentInvoice?.payment_method === 'cash' ? 'Tiền mặt' :
                                        currentInvoice?.payment_method === 'transfer' ? 'Chuyển khoản' :
                                        currentInvoice?.payment_method || 'Không xác định'
                                    }</p>
                                </div>
                                <div class="col">
                                    <p><strong>Khách hàng:</strong> ${customer?.fullname || 'N/A'}</p>
                                    <p><strong>SĐT:</strong> ${customer?.phone_num || 'N/A'}</p>
                                    <p><strong>Biển số xe:</strong> ${motorcycle?.license_plate || 'N/A'}</p>
                                    <p><strong>Loại xe:</strong> ${motorcycle?.brand || ''} ${motorcycle?.model || ''}</p>
                                    <p><strong>Nhân viên phụ trách:</strong> ${staff?.fullname || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        ${diagnosis?.problem ? `
                            <div class="info-section">
                                <h5>Chuẩn đoán</h5>
                                <p><strong>Vấn đề:</strong> ${diagnosis.problem}</p>
                            </div>
                        ` : ''}

                        <h5>Phụ tùng và vật tư</h5>
                        <table>
                            <thead>
                                <tr>
                                    <th style="width: 5%">#</th>
                                    <th style="width: 45%">Tên phụ tùng</th>
                                    <th style="width: 20%">Đơn giá</th>
                                    <th style="width: 10%">Số lượng</th>
                                    <th style="width: 20%">Thành tiền</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${partOrderDetails.length > 0 ? 
                                    partOrderDetails.map((item, index) => `
                                        <tr>
                                            <td class="text-center">${index + 1}</td>
                                            <td>${item.part_name || (item.partDetail && item.partDetail.name) || "Phụ tùng không xác định"}</td>
                                            <td class="text-center">${formatCurrency(item.price)}</td>
                                            <td class="text-center">${item.quantity}</td>
                                            <td class="text-end">${formatCurrency(item.price * item.quantity)}</td>
                                        </tr>
                                    `).join('') : 
                                    `<tr><td colspan="5" class="text-center">Không có phụ tùng nào được sử dụng</td></tr>`
                                }
                            </tbody>
                            ${partOrderDetails.length > 0 ? `
                                <tfoot>
                                    <tr>
                                        <td colspan="4" class="text-end"><strong>Tổng chi phí phụ tùng:</strong></td>
                                        <td class="text-end"><strong>${formatCurrency(
                                            partOrderDetails.reduce((sum, part) => sum + (part.price * part.quantity), 0)
                                        )}</strong></td>
                                    </tr>
                                </tfoot>
                            ` : ''}
                        </table>

                        <h5>Dịch vụ</h5>
                        <table>
                            <thead>
                                <tr>
                                    <th style="width: 5%">#</th>
                                    <th style="width: 55%">Tên dịch vụ</th>
                                    <th style="width: 20%">Đơn giá</th>
                                    <th style="width: 20%">Thành tiền</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${serviceOrderDetails.length > 0 ? 
                                    serviceOrderDetails.map((item, index) => `
                                        <tr>
                                            <td class="text-center">${index + 1}</td>
                                            <td>${item.service_name || (item.serviceDetail && item.serviceDetail.name) || "Dịch vụ không xác định"}</td>
                                            <td class="text-center">${formatCurrency(item.price)}</td>
                                            <td class="text-end">${formatCurrency(item.price)}</td>
                                        </tr>
                                    `).join('') : 
                                    `<tr><td colspan="4" class="text-center">Không có dịch vụ nào được sử dụng</td></tr>`
                                }
                            </tbody>
                            ${serviceOrderDetails.length > 0 ? `
                                <tfoot>
                                    <tr>
                                        <td colspan="3" class="text-end"><strong>Tổng chi phí dịch vụ:</strong></td>
                                        <td class="text-end"><strong>${formatCurrency(
                                            serviceOrderDetails.reduce((sum, service) => sum + service.price, 0)
                                        )}</strong></td>
                                    </tr>
                                </tfoot>
                            ` : ''}
                        </table>

                        <div class="footer">
                            ${currentOrder?.note ? `
                                <div style="margin-bottom: 15px;">
                                    <p style="margin-bottom: 5px;"><strong>Ghi chú:</strong></p>
                                    <p style="margin: 0;">${currentOrder.note}</p>
                                </div>
                            ` : ''}
                            
                            <div class="totals">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                    <span>Tổng chi phí phụ tùng:</span>
                                    <span>${formatCurrency(
                                        partOrderDetails.reduce((sum, part) => sum + (part.price * part.quantity), 0)
                                    )}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                    <span>Tổng chi phí dịch vụ:</span>
                                    <span>${formatCurrency(
                                        serviceOrderDetails.reduce((sum, service) => sum + service.price, 0)
                                    )}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; padding-top: 8px; border-top: 1px solid #ddd; font-weight: bold;">
                                    <span>Tổng cộng:</span>
                                    <span>${formatCurrency(currentInvoice?.total_price)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `);
            
            frameDocument.close();
            
            // Đợi iframe tải xong
            printFrame.onload = () => {
                setTimeout(() => {
                    // Kích hoạt in
                    printFrame.contentWindow.focus();
                    printFrame.contentWindow.print();
                    
                    // Xóa iframe sau khi in
                    setTimeout(() => {
                        document.body.removeChild(printFrame);
                        setIsPrinting(false);
                    }, 500);
                }, 500);
            };
        } catch (error) {
            console.error('Lỗi khi in:', error);
            setIsPrinting(false);
        }
    };

    // Xử lý thanh toán hóa đơn
    const handlePayInvoice = (invoice) => {
        setInvoiceToPayment(invoice);
        setShowPaymentModal(true);
    };
    
    // Xử lý xác nhận thanh toán sau khi chọn phương thức
    const handleSubmitPayment = async () => {
        try {
            // Gọi API cập nhật trạng thái thanh toán và phương thức thanh toán
            await resourceService.invoice.updateInvoice(invoiceToPayment.invoice_id, {
                // ...invoiceToPayment,
                is_paid: true,
                payment_method: selectedPaymentMethod,
                staff_id: currentStaff.staff_id,
            });
            
            // Cập nhật danh sách hóa đơn
            setInvoices(prev => 
                prev.map(inv => 
                    inv.invoice_id === invoiceToPayment.invoice_id 
                        ? {...inv, is_paid: true, payment_method: selectedPaymentMethod} 
                        : inv
                )
            );
            
            setShowPaymentModal(false);
            alert('Thanh toán hóa đơn thành công!');
        } catch (err) {
            console.error("Lỗi khi cập nhật trạng thái thanh toán:", err);
            alert('Có lỗi xảy ra khi thanh toán hóa đơn. Vui lòng thử lại!');
        }
    };

    // Danh sách hóa đơn đã lọc
    const filteredInvoices = invoices.filter(inv => {
        let passFilter = true;

        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            passFilter = passFilter && (
                String(inv.invoice_id).toLowerCase().includes(searchTerm) ||
                String(inv.order_id).toLowerCase().includes(searchTerm)
            );
        }

        if (filters.isPaid !== '') {
            const isPaid = filters.isPaid === 'paid';
            passFilter = passFilter && (inv.is_paid === isPaid);
        }

        if (filters.startDate) {
            const invDate = new Date(inv.create_at).setHours(0, 0, 0, 0);
            const startDate = new Date(filters.startDate).setHours(0, 0, 0, 0);
            passFilter = passFilter && (invDate >= startDate);
        }

        if (filters.endDate) {
            const invDate = new Date(inv.create_at).setHours(0, 0, 0, 0);
            const endDate = new Date(filters.endDate).setHours(0, 0, 0, 0);
            passFilter = passFilter && (invDate <= endDate);
        }

        return passFilter;
    });

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="mb-0">Quản lý hóa đơn</h5>
                <div>
                    <Button
                        variant="outline-primary"
                        onClick={() => fetchInvoices()}
                        disabled={loading}
                    >
                        <i className="bi bi-arrow-clockwise me-1"></i> Làm mới
                    </Button>
                </div>
            </div>

            <Card className="mb-4 shadow-sm">
                <Card.Body>
                    <Row className="g-3">
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label>Tìm kiếm</Form.Label>
                                <InputGroup>
                                    <Form.Control
                                        placeholder="Mã hóa đơn, mã đơn hàng..."
                                        name="search"
                                        value={filters.search}
                                        onChange={handleFilterChange}
                                    />
                                    <Button
                                        variant="outline-secondary"
                                        onClick={handleApplyFilter}
                                    >
                                        <i className="bi bi-search"></i>
                                    </Button>
                                </InputGroup>
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label>Trạng thái thanh toán</Form.Label>
                                <Form.Select
                                    name="isPaid"
                                    value={filters.isPaid}
                                    onChange={handleFilterChange}
                                >
                                    <option value="">Tất cả</option>
                                    <option value="paid">Đã thanh toán</option>
                                    <option value="unpaid">Chưa thanh toán</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label>Từ ngày</Form.Label>
                                <Form.Control
                                    type="date"
                                    name="startDate"
                                    value={filters.startDate}
                                    onChange={handleFilterChange}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label>Đến ngày</Form.Label>
                                <Form.Control
                                    type="date"
                                    name="endDate"
                                    value={filters.endDate}
                                    onChange={handleFilterChange}
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                    <div className="d-flex justify-content-end mt-3">
                        <Button
                            variant="outline-secondary"
                            className="me-2"
                            onClick={handleResetFilter}
                        >
                            <i className="bi bi-x-circle me-1"></i> Xóa bộ lọc
                        </Button>
                        <Button
                            variant="primary"
                            style={{ backgroundColor: '#d30000', borderColor: '#d30000' }}
                            onClick={handleApplyFilter}
                        >
                            <i className="bi bi-filter me-1"></i> Lọc
                        </Button>
                    </div>
                </Card.Body>
            </Card>

            <Card className="shadow-sm">
                <Card.Body className="p-0">
                    <div className="table-responsive">
                        <Table hover className="mb-0 align-middle">
                            <thead className="table-light">
                                <tr>
                                    <th>Mã hóa đơn</th>
                                    <th>Ngày thanh toán</th>
                                    <th>Mã đơn hàng</th>
                                    <th>Tổng tiền</th>
                                    <th>Phương thức thanh toán</th>
                                    <th>Trạng thái</th>
                                    <th style={{ width: '120px' }}>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-4">
                                            <Spinner animation="border" variant="primary" />
                                            <p className="mt-2 text-muted">Đang tải dữ liệu...</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredInvoices.map(inv => (
                                        <tr key={inv.invoice_id}>
                                            <td>
                                                <span className="fw-medium">{inv.invoice_id}</span>
                                            </td>
                                            <td>{formatDateTime(inv.create_at)}</td>
                                            <td>{inv.order_id}</td>
                                            <td className="fw-medium text-primary">
                                                {formatCurrency(inv.total_price)}
                                            </td>
                                            <td>
                                                {inv.payment_method === 'cash' ? 'Tiền mặt' :
                                                    inv.payment_method === 'card' ? 'Thẻ' :
                                                        inv.payment_method === 'transfer' ? 'Chuyển khoản' :
                                                            inv.payment_method}
                                            </td>
                                            <td>
                                                {inv.is_paid ? (
                                                    <Badge bg="success" className="px-3 py-2">
                                                        <i className="bi bi-check-circle me-1"></i> Đã thanh toán
                                                    </Badge>
                                                ) : (
                                                    <Badge bg="warning" text="dark" className="px-3 py-2">
                                                        <i className="bi bi-hourglass-split me-1"></i> Chờ thanh toán
                                                    </Badge>
                                                )}
                                            </td>
                                            <td>
                                                <div className="d-flex gap-2">
                                                    <Button
                                                        variant="outline-primary"
                                                        size="sm"
                                                        onClick={() => handleShowDetail(inv)}
                                                        title="Xem chi tiết"
                                                    >
                                                        <i className="bi bi-eye"></i>
                                                    </Button>
                                                    {!inv.is_paid && (
                                                        <Button
                                                            variant="outline-success"
                                                            size="sm"
                                                            onClick={() => handlePayInvoice(inv)}
                                                            title="Thanh toán"
                                                        >
                                                            <i className="bi bi-check-square"></i>
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}

                                {!loading && filteredInvoices.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="text-center py-5">
                                            <div className="text-muted">
                                                <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                                                <p className="mb-0">Không tìm thấy hóa đơn nào</p>
                                                {(filters.search || filters.isPaid || filters.startDate || filters.endDate) && (
                                                    <p className="mt-1">Thử thay đổi bộ lọc để tìm kiếm lại</p>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>

            {/* Modal chi tiết hóa đơn */}
            <Modal
                show={showDetailModal}
                onHide={() => setShowDetailModal(false)}
                size="lg"
                backdrop="static"
            >
                <Modal.Header closeButton>
                    <Modal.Title>Chi tiết hóa đơn #{currentInvoice?.invoice_id}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {modalLoading ? (
                        <div className="text-center py-4">
                            <Spinner animation="border" variant="primary" />
                            <p className="mt-3 text-muted">Đang tải chi tiết hóa đơn...</p>
                        </div>
                    ) : (
                        <div id="invoice-print-content">
                            <div className="mb-4 d-print-none">
                                <h5 className="border-bottom pb-2 mb-3">Thông tin hóa đơn</h5>
                                <Row>
                                    <Col md={6}>
                                        <p className="mb-1"><strong>Mã hóa đơn:</strong> {currentInvoice?.invoice_id}</p>
                                        <p className="mb-1"><strong>Ngày tạo:</strong> {formatDateTime(currentInvoice?.create_at)}</p>
                                        <p className="mb-1"><strong>Mã đơn hàng:</strong> {currentInvoice?.order_id}</p>
                                    </Col>
                                    <Col md={6}>
                                        <p className="mb-1">
                                            <strong>Trạng thái:</strong>{' '}
                                            {currentInvoice?.is_paid ? (
                                                <Badge bg="success" className="px-2 py-1">Đã thanh toán</Badge>
                                            ) : (
                                                <Badge bg="warning" text="dark" className="px-2 py-1">Chờ thanh toán</Badge>
                                            )}
                                        </p>
                                        <p className="mb-1"><strong>Phương thức:</strong> {
                                            currentInvoice?.payment_method === 'cash' ? 'Tiền mặt' :
                                                currentInvoice?.payment_method === 'card' ? 'Thẻ' :
                                                    currentInvoice?.payment_method === 'transfer' ? 'Chuyển khoản' :
                                                        currentInvoice?.payment_method
                                        }</p>
                                        <p className="mb-1"><strong>Tổng tiền:</strong> <span className="text-primary fw-bold">{formatCurrency(currentInvoice?.total_price)}</span></p>
                                    </Col>
                                </Row>
                            </div>

                            <div className="mb-4">
                                <h5 className="border-bottom pb-2 mb-3 d-print-none">Thông tin khách hàng và xe</h5>
                                <Row>
                                    <Col md={6}>
                                        <h6 className="text-muted mb-2 d-print-none">Khách hàng</h6>
                                        <p className="mb-1"><strong>Họ tên:</strong> {customer?.fullname || 'N/A'}</p>
                                        <p className="mb-1"><strong>SĐT:</strong> {customer?.phone_num || 'N/A'}</p>
                                        {/* <p className="mb-0"><strong>Email:</strong> {customer?.email || 'N/A'}</p> */}
                                    </Col>
                                    <Col md={6}>
                                        <h6 className="text-muted mb-2 d-print-none">Thông tin xe</h6>
                                        <p className="mb-1"><strong>Biển số:</strong> {motorcycle?.license_plate || 'N/A'}</p>
                                        <p className="mb-1"><strong>Loại xe:</strong> {motorcycle?.brand} {motorcycle?.model}</p>
                                        <p className="mb-0"><strong>Nhân viên phụ trách:</strong> {staff?.fullname || 'N/A'}</p>
                                    </Col>
                                </Row>
                            </div>

                            <div className="mb-4 diagnosis-section">
                                <h5 className="border-bottom pb-2 mb-3 d-print-none">Chuẩn đoán & chi tiết sửa chữa</h5>
                                <div className="p-3 bg-light rounded mb-3">
                                    <p className="mb-1"><strong>Vấn đề:</strong> {diagnosis?.problem || 'Không có thông tin'}</p>
                                </div>
                            </div>

                            {/* Hiển thị chi tiết phụ tùng */}
                            <div className="mb-4">
                                <h5 className="border-bottom pb-2 mb-3 d-print-none">Phụ tùng và vật tư</h5>
                                <div className="table-responsive">
                                    <Table bordered hover className="mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th width="5%">#</th>
                                                <th width="30%">Tên phụ tùng</th>
                                                <th width="15%" className="text-center">Đơn giá</th>
                                                <th width="10%" className="text-center">Số lượng</th>
                                                <th width="15%" className="text-center">Thành tiền</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {partOrderDetails.length > 0 ? (
                                                partOrderDetails.map((item, index) => (
                                                    <tr key={item.part_order_detail_id || index}>
                                                        <td className="text-center">{index + 1}</td>
                                                        <td>
                                                            <span className="fw-medium">
                                                                {item.part_name ||
                                                                    (item.partDetail && item.partDetail.name) ||
                                                                    (item.part && item.part.name) ||
                                                                    "Phụ tùng không xác định"}
                                                            </span>
                                                            {/* <div className="small text-muted">
                                                                {item.part_code ||
                                                                    (item.partDetail && item.partDetail.code) ||
                                                                    (item.part && item.part.code) ||
                                                                    'Không có mã'}
                                                            </div> */}
                                                        </td>
                                                        <td className="text-center">{formatCurrency(item.price)}</td>
                                                        <td className="text-center">{item.quantity}</td>
                                                        <td className="text-end">{formatCurrency(item.price * item.quantity)}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={5} className="text-center py-3 text-muted">
                                                        Không có phụ tùng nào được sử dụng
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                        {partOrderDetails.length > 0 && (
                                            <tfoot className="table-light">
                                                <tr>
                                                    <td colSpan={4} className="text-end fw-bold">Tổng chi phí phụ tùng:</td>
                                                    <td className="text-end fw-bold">
                                                        {formatCurrency(
                                                            partOrderDetails.reduce((sum, part) => sum + (part.price * part.quantity), 0)
                                                        )}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        )}
                                    </Table>
                                </div>
                            </div>

                            {/* Hiển thị chi tiết dịch vụ */}
                            <div className="mb-4">
                                <h5 className="border-bottom pb-2 mb-3 d-print-none">Dịch vụ</h5>
                                <div className="table-responsive">
                                    <Table bordered hover className="mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th width="5%">#</th>
                                                <th width="50%">Tên dịch vụ</th>
                                                <th width="15%" className="text-center">Đơn giá</th>
                                                <th width="15%" className="text-center">Thành tiền</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {serviceOrderDetails.length > 0 ? (
                                                serviceOrderDetails.map((item, index) => (
                                                    <tr key={item.service_order_detail_id || index}>
                                                        <td className="text-center">{index + 1}</td>
                                                        <td>
                                                            <span className="fw-medium">
                                                                {item.service_name ||
                                                                    (item.serviceDetail && item.serviceDetail.name) ||
                                                                    (item.service && item.service.name) ||
                                                                    "Dịch vụ không xác định"}
                                                            </span>
                                                            {/* <div className="small text-muted">
                                                                {item.service_code ||
                                                                    (item.serviceDetail && item.serviceDetail.code) ||
                                                                    (item.service && item.service.code) ||
                                                                    'Không có mã'}
                                                            </div> */}
                                                        </td>
                                                        <td className="text-center">{formatCurrency(item.price)}</td>
                                                        <td className="text-end">{formatCurrency(item.price)}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={4} className="text-center py-3 text-muted">
                                                        Không có dịch vụ nào được sử dụng
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                        {serviceOrderDetails.length > 0 && (
                                            <tfoot className="table-light">
                                                <tr>
                                                    <td colSpan={3} className="text-end fw-bold">Tổng chi phí dịch vụ:</td>
                                                    <td className="text-end fw-bold">
                                                        {formatCurrency(
                                                            serviceOrderDetails.reduce((sum, service) => sum + service.price, 0)
                                                        )}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        )}
                                    </Table>
                                </div>
                            </div>

                            {/* Hiển thị tổng chi phí */}
                            <div className="mt-4 border-top pt-3">
                                <Row>
                                    <Col md={7}>
                                        <div className="d-print-none">
                                            <p className="mb-1 text-muted">Ghi chú:</p>
                                            <p className="small text-muted mb-0">
                                                {currentOrder?.note || 'Không có ghi chú'}
                                            </p>
                                        </div>
                                    </Col>
                                    <Col md={5}>
                                        <div className="bg-light p-3 rounded">
                                            <div className="d-flex justify-content-between mb-2">
                                                <span>Tổng chi phí phụ tùng:</span>
                                                <span>
                                                    {formatCurrency(
                                                        partOrderDetails.reduce((sum, part) => sum + (part.price * part.quantity), 0)
                                                    )}
                                                </span>
                                            </div>
                                            <div className="d-flex justify-content-between mb-2">
                                                <span>Tổng chi phí dịch vụ:</span>
                                                <span>
                                                    {formatCurrency(
                                                        serviceOrderDetails.reduce((sum, service) => sum + service.price, 0)
                                                    )}
                                                </span>
                                            </div>
                                            <div className="d-flex justify-content-between pt-2 border-top mt-2">
                                                <span className="fw-bold">Tổng cộng:</span>
                                                <span className="fw-bold text-primary fs-5">
                                                    {formatCurrency(currentInvoice?.total_price)}
                                                </span>
                                            </div>
                                        </div>
                                    </Col>
                                </Row>
                            </div>

                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
                        Đóng
                    </Button>

                    <Button
                        variant="primary"
                        onClick={handlePrintInvoice}
                        disabled={isPrinting || modalLoading}
                    >
                        {isPrinting ? (
                            <>
                                <Spinner
                                    as="span"
                                    animation="border"
                                    size="sm"
                                    role="status"
                                    aria-hidden="true"
                                    className="me-2"
                                />
                                Đang in...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-printer me-1"></i> In hóa đơn
                            </>
                        )}
                    </Button>

                    {currentInvoice && !currentInvoice.is_paid && (
                        <Button
                            variant="success"
                            onClick={() => {
                                setShowDetailModal(false);
                                handlePayInvoice(currentInvoice);
                            }}
                        >
                            <i className="bi bi-check-circle me-1"></i> Thanh toán
                        </Button>
                    )}
                </Modal.Footer>
            </Modal>
            
            {/* Modal chọn phương thức thanh toán */}
            <Modal
                show={showPaymentModal}
                onHide={() => setShowPaymentModal(false)}
                backdrop="static"
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>Chọn phương thức thanh toán</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p className="mb-3">Hóa đơn: #{invoiceToPayment?.invoice_id} - {formatCurrency(invoiceToPayment?.total_price)}</p>
                    
                    <Form>
                        <div className="mb-3">
                            <Form.Check
                                type="radio"
                                id="payment-cash"
                                name="payment-method"
                                label="Tiền mặt"
                                checked={selectedPaymentMethod === 'cash'}
                                onChange={() => setSelectedPaymentMethod('cash')}
                                className="mb-2"
                            />
                            
                            <Form.Check
                                type="radio"
                                id="payment-transfer"
                                name="payment-method"
                                label="Chuyển khoản ngân hàng"
                                checked={selectedPaymentMethod === 'transfer'}
                                onChange={() => setSelectedPaymentMethod('transfer')}
                                className="mb-2"
                            />
                            
                            {selectedPaymentMethod === 'transfer' && (
                                <div className="mt-3 p-3 border rounded bg-light">
                                    <p className="mb-1 fw-bold">Thông tin chuyển khoản:</p>
                                    <p className="mb-1">Ngân hàng: Vietcombank</p>
                                    <p className="mb-1">Số tài khoản: 1234567890</p>
                                    <p className="mb-1">Chủ tài khoản: CÔNG TY TNHH SỬA CHỮA XE MÁY</p>
                                    <p className="mb-0">Nội dung: Thanh toán hóa đơn #{invoiceToPayment?.invoice_id}</p>
                                </div>
                            )}
                        </div>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowPaymentModal(false)}>
                        Hủy
                    </Button>
                    <Button variant="success" onClick={handleSubmitPayment}>
                        <i className="bi bi-check-circle me-1"></i> Xác nhận thanh toán
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default InvoiceManagement;
