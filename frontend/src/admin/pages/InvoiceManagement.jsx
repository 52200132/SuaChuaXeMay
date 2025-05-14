import { useEffect, useState } from 'react';
import { Card, Table, Button, Modal, Row, Col, Form, InputGroup, Spinner, Badge } from 'react-bootstrap';

import { useStaffAuth } from '../contexts/StaffAuthContext';
import { useAppData } from '../contexts/AppDataContext';
import { resourceService, repairService2, customerService } from '../../services/api';
import './InvoiceManagement.css';

const InvoiceManagement = () => {
    const { getData, setData, getIds, loading, setLoadingState } = useAppData();
    const { currentStaff } = useStaffAuth();

    const invoiceViews = getData('invoiceViews');
    const invoiceIds = getIds('invoiceViews');

    const [modalLoading, setModalLoading] = useState(false);
    const [filters, setFilters] = useState({
        search: '',
        startDate: '',
        endDate: '',
        isPaid: ''
    });
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [currentInvoice, setCurrentInvoice] = useState(null);
    const [currentOrderDetail, setCurrentOrderDetail] = useState(null);
    
    // State để xử lý in hóa đơn
    const [isPrinting, setIsPrinting] = useState(false);
    
    // State cho modal thanh toán
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cash');
    const [invoiceToPayment, setInvoiceToPayment] = useState(null);

    useEffect(() => {console.log('Dữ liệu hóa đơn', invoiceViews)}, [invoiceViews]);

    // Hàm format tiền
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
    };

    // Hàm format ngày giờ
    const formatDateTime = (dateTimeStr) => {
        console.log('dateTimeStr', dateTimeStr);
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
        console.log("Current invoice:", invoice);
        setModalLoading(true);
        setShowDetailModal(true);

        try {
            // Reset current order detail
            setCurrentOrderDetail(null);

            if (!invoice.order_id) {
                throw new Error("Hóa đơn không có thông tin đơn hàng");
            }

            // Fetch order details directly with the new response structure
            const response = await repairService2.order.getOrderDetailById(invoice.order_id);
            
            if (response.data) {
                setCurrentOrderDetail(response.data);
                console.log("Order detail:", response.data);
            } else {
                throw new Error("Không lấy được thông tin chi tiết đơn hàng");
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
            
            // Filter selected parts and services
            const selectedParts = currentOrderDetail?.part_order_detail?.part_order_details.filter(part => part.is_selected) || [];
            const selectedServices = currentOrderDetail?.service_order_detail?.service_order_details.filter(service => service.is_selected) || [];
            
            // Thêm CSS in ấn và nội dung
            frameDocument.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Hóa đơn #${currentInvoice?.invoice_id}</title>
                    <style>
                        @page {
                            size: A4;
                            margin: 10mm 10mm 10mm 10mm;
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
                                    <p><strong>Ngày tạo:</strong> ${formatDateTime(currentOrderDetail?.created_at)}</p>
                                    <p><strong>Mã đơn hàng:</strong> ${currentInvoice?.order_id}</p>
                                    <p><strong>Trạng thái:</strong> ${currentInvoice?.is_paid ? 'Đã thanh toán' : 'Chờ thanh toán'}</p>
                                    <p><strong>Phương thức:</strong> ${
                                        currentInvoice?.payment_method === 'cash' ? 'Tiền mặt' :
                                        currentInvoice?.payment_method === 'transfer' ? 'Chuyển khoản' :
                                        currentInvoice?.payment_method || 'Không xác định'
                                    }</p>
                                </div>
                                <div class="col">
                                    <p><strong>Khách hàng:</strong> ${currentOrderDetail?.customer?.fullname || 'N/A'}</p>
                                    <p><strong>SĐT:</strong> ${currentOrderDetail?.customer?.phone_num || 'N/A'}</p>
                                    <p><strong>Biển số xe:</strong> ${currentOrderDetail?.motocycle?.license_plate || 'N/A'}</p>
                                    <p><strong>Loại xe:</strong> ${currentOrderDetail?.motocycle?.brand || ''} ${currentOrderDetail?.motocycle?.model || ''}</p>
                                    <p><strong>Nhân viên phụ trách:</strong> ${currentOrderDetail?.staff?.fullname || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

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
                                ${selectedParts.length > 0 ? 
                                    selectedParts.map((part, index) => `
                                        <tr>
                                            <td class="text-center">${index + 1}</td>
                                            <td>${part.name || "Phụ tùng không xác định"}</td>
                                            <td class="text-center">${formatCurrency(part.price)}</td>
                                            <td class="text-center">${part.quantity}</td>
                                            <td class="text-end">${formatCurrency(part.total_price)}</td>
                                        </tr>
                                    `).join('') : 
                                    `<tr><td colspan="5" class="text-center">Không có phụ tùng nào được sử dụng</td></tr>`
                                }
                            </tbody>
                            ${selectedParts.length > 0 ? `
                                <tfoot>
                                    <tr>
                                        <td colspan="4" class="text-end"><strong>Tổng chi phí phụ tùng:</strong></td>
                                        <td class="text-end"><strong>${formatCurrency(
                                            currentOrderDetail?.part_order_detail?.total_amount_for_part || 0
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
                                ${selectedServices.length > 0 ? 
                                    selectedServices.map((service, index) => `
                                        <tr>
                                            <td class="text-center">${index + 1}</td>
                                            <td>${service.name || "Dịch vụ không xác định"}</td>
                                            <td class="text-center">${formatCurrency(service.price)}</td>
                                            <td class="text-end">${formatCurrency(service.price)}</td>
                                        </tr>
                                    `).join('') : 
                                    `<tr><td colspan="4" class="text-center">Không có dịch vụ nào được sử dụng</td></tr>`
                                }
                            </tbody>
                            ${selectedServices.length > 0 ? `
                                <tfoot>
                                    <tr>
                                        <td colspan="3" class="text-end"><strong>Tổng chi phí dịch vụ:</strong></td>
                                        <td class="text-end"><strong>${formatCurrency(
                                            currentOrderDetail?.service_order_detail?.total_amount_for_service || 0
                                        )}</strong></td>
                                    </tr>
                                </tfoot>
                            ` : ''}
                        </table>

                        <div class="footer">
                            <div class="totals">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                    <span>Tổng chi phí phụ tùng:</span>
                                    <span>${formatCurrency(
                                        currentOrderDetail?.part_order_detail?.total_amount_for_part || 0
                                    )}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                    <span>Tổng chi phí dịch vụ:</span>
                                    <span>${formatCurrency(
                                        currentOrderDetail?.service_order_detail?.total_amount_for_service || 0
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
                is_paid: true,
                payment_method: selectedPaymentMethod,
                staff_id: currentStaff.staff_id,
            });
            
            // Cập nhật trong context
            setData('invoiceViews', {
                ...invoiceToPayment,
                is_paid: true, 
                payment_method: selectedPaymentMethod,
                staff_id: currentStaff.staff_id
            }, invoiceToPayment.invoice_id);
            
            setShowPaymentModal(false);
            alert('Thanh toán hóa đơn thành công!');
        } catch (err) {
            console.error("Lỗi khi cập nhật trạng thái thanh toán:", err);
            alert('Có lỗi xảy ra khi thanh toán hóa đơn. Vui lòng thử lại!');
        }
    };

    // Convert invoiceViews object to array and filter
    const getFilteredInvoices = () => {
        if (!invoiceViews) return [];
        
        const invoicesArray = Object.values(invoiceViews);
        
        return invoicesArray.filter(inv => {
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
    };

    const filteredInvoices = getFilteredInvoices();

    return (
        <>
            {/* <div className="d-flex justify-content-between align-items-center mb-4">
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
            </div> */}

            {/* Filter card */}
            <Card className="mb-4 shadow-sm">
                {/* ...existing code... */}
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

            {/* Invoices table */}
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
                                {loading['invoiceViews'] ? (
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
                                            <td>{formatDateTime(inv.pay_at)}</td>
                                            <td>{inv.order_id}</td>
                                            <td className="fw-medium text-primary">
                                                {formatCurrency(inv.total_price)}
                                            </td>
                                            <td>
                                                {inv.payment_method === 'cash' ? 'Tiền mặt' :
                                                    inv.payment_method === 'card' ? 'Thẻ' :
                                                        inv.payment_method === 'transfer' ? 'Chuyển khoản' :
                                                            inv.payment_method || 'Chưa xác định'}
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
                                        <p className="mb-1"><strong>Ngày tạo:</strong> {formatDateTime(currentOrderDetail?.created_at)}</p>
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
                                                currentInvoice?.payment_method === 'transfer' ? 'Chuyển khoản' :
                                                    currentInvoice?.payment_method || 'Chưa xác định'
                                        }</p>
                                        <p className="mb-1"><strong>Tổng tiền:</strong> <span className="text-primary fw-bold">
                                            {formatCurrency(currentInvoice?.total_price)}
                                        </span></p>
                                    </Col>
                                </Row>
                            </div>

                            {currentOrderDetail && (
                                <>
                                    <div className="mb-4">
                                        <h5 className="border-bottom pb-2 mb-3 d-print-none">Thông tin khách hàng và xe</h5>
                                        <Row>
                                            <Col md={6}>
                                                <h6 className="text-muted mb-2 d-print-none">Khách hàng</h6>
                                                <p className="mb-1"><strong>Họ tên:</strong> {currentOrderDetail.customer?.fullname || 'N/A'}</p>
                                                <p className="mb-1"><strong>SĐT:</strong> {currentOrderDetail.customer?.phone_num || 'N/A'}</p>
                                            </Col>
                                            <Col md={6}>
                                                <h6 className="text-muted mb-2 d-print-none">Thông tin xe</h6>
                                                <p className="mb-1"><strong>Biển số:</strong> {currentOrderDetail.motocycle?.license_plate || 'N/A'}</p>
                                                <p className="mb-1"><strong>Loại xe:</strong> {currentOrderDetail.motocycle?.brand || ''} {currentOrderDetail.motocycle?.model || ''}</p>
                                                <p className="mb-0"><strong>Nhân viên phụ trách:</strong> {currentOrderDetail.staff?.fullname || 'N/A'}</p>
                                            </Col>
                                        </Row>
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
                                                    {currentOrderDetail.part_order_detail?.part_order_details
                                                        .filter(part => part.is_selected)
                                                        .map((part, index) => (
                                                            <tr key={part.part_order_detail_id || index}>
                                                                <td className="text-center">{index + 1}</td>
                                                                <td>
                                                                    <span className="fw-medium">{part.name || "Phụ tùng không xác định"}</span>
                                                                </td>
                                                                <td className="text-center">{formatCurrency(part.price)}</td>
                                                                <td className="text-center">{part.quantity}</td>
                                                                <td className="text-end">{formatCurrency(part.total_price)}</td>
                                                            </tr>
                                                        ))
                                                    }
                                                    
                                                    {!currentOrderDetail.part_order_detail?.part_order_details?.some(part => part.is_selected) && (
                                                        <tr>
                                                            <td colSpan={5} className="text-center py-3 text-muted">
                                                                Không có phụ tùng nào được sử dụng
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                                {currentOrderDetail.part_order_detail?.part_order_details?.some(part => part.is_selected) && (
                                                    <tfoot className="table-light">
                                                        <tr>
                                                            <td colSpan={4} className="text-end fw-bold">Tổng chi phí phụ tùng:</td>
                                                            <td className="text-end fw-bold">
                                                                {formatCurrency(currentOrderDetail.part_order_detail?.total_amount_for_part || 0)}
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
                                                    {currentOrderDetail.service_order_detail?.service_order_details
                                                        .filter(service => service.is_selected)
                                                        .map((service, index) => (
                                                            <tr key={service.service_detail_id || index}>
                                                                <td className="text-center">{index + 1}</td>
                                                                <td>
                                                                    <span className="fw-medium">{service.name || "Dịch vụ không xác định"}</span>
                                                                </td>
                                                                <td className="text-center">{formatCurrency(service.price)}</td>
                                                                <td className="text-end">{formatCurrency(service.price)}</td>
                                                            </tr>
                                                        ))
                                                    }
                                                    
                                                    {!currentOrderDetail.service_order_detail?.service_order_details?.some(service => service.is_selected) && (
                                                        <tr>
                                                            <td colSpan={4} className="text-center py-3 text-muted">
                                                                Không có dịch vụ nào được sử dụng
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                                {currentOrderDetail.service_order_detail?.service_order_details?.some(service => service.is_selected) && (
                                                    <tfoot className="table-light">
                                                        <tr>
                                                            <td colSpan={3} className="text-end fw-bold">Tổng chi phí dịch vụ:</td>
                                                            <td className="text-end fw-bold">
                                                                {formatCurrency(currentOrderDetail.service_order_detail?.total_amount_for_service || 0)}
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
                                                {/* Empty column for spacing */}
                                            </Col>
                                            <Col md={5}>
                                                <div className="bg-light p-3 rounded">
                                                    <div className="d-flex justify-content-between mb-2">
                                                        <span>Tổng chi phí phụ tùng:</span>
                                                        <span>
                                                            {formatCurrency(currentOrderDetail.part_order_detail?.total_amount_for_part || 0)}
                                                        </span>
                                                    </div>
                                                    <div className="d-flex justify-content-between mb-2">
                                                        <span>Tổng chi phí dịch vụ:</span>
                                                        <span>
                                                            {formatCurrency(currentOrderDetail.service_order_detail?.total_amount_for_service || 0)}
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
                                </>
                            )}
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
                        disabled={isPrinting || modalLoading || !currentOrderDetail}
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
