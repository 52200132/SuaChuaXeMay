import { useState, useEffect } from 'react';
import { Card, Table, Row, Col, Button, Badge, Spinner, Form, InputGroup, Alert } from 'react-bootstrap';
import { repairService2 } from '../../services/api';
import StatusBadge from '../components/StatusBadge';
import './OrderWarehouse.css';
import { useStaffAuth } from '../contexts/StaffAuthContext';
import CustomModal from '../components/CustomModal';

const OrderWarehouse = () => {
    // State for orders
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // State for selected order
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orderParts, setOrderParts] = useState([]);
    const [partsLoading, setPartsLoading] = useState(false);
    
    // State for part lot selection
    const [selectedPartLots, setSelectedPartLots] = useState({});
    const [partLotQuantities, setPartLotQuantities] = useState({});
    const [partSelectionStatus, setPartSelectionStatus] = useState({});
    
    // State for export confirmation
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportLoading, setExportLoading] = useState(false);
    const [exportMessage, setExportMessage] = useState(null);
    
    // Get current staff information
    const { currentStaff } = useStaffAuth();

    const tableOrderStatus = {
        // English to Vietnamese mapping
        'received': 'Đã tiếp nhận',
        'checking': 'Đang kiểm tra',
        'wait_confirm': 'Chờ xác nhận',
        'repairing': 'Đang sửa chữa',
        'wait_delivery': 'Chờ giao xe',
        'delivered': 'Đã giao xe',

        // Vietnamese to English mapping
        'Đã tiếp nhận': 'received',
        'Đang kiểm tra': 'checking',
        'Chờ xác nhận': 'wait_confirm',
        'Đang sửa chữa': 'repairing',
        'Chờ giao xe': 'wait_delivery',
        'Đã giao xe': 'delivered'
    };

    // Fetch all orders on component mount
    useEffect(() => {
        fetchOrderViewForTable();
    }, []);

    // Filter orders when search term changes
    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredOrders(orders);
            return;
        }

        const term = searchTerm.toLowerCase();
        const filtered = orders.filter(order => 
            order.order_id.toString().includes(term) ||
            order.customer.fullname.toLowerCase().includes(term) ||
            order.customer.phone_num.includes(term) ||
            order.motocycle.license_plate.toLowerCase().includes(term) ||
            `${order.motocycle.brand} ${order.motocycle.model}`.toLowerCase().includes(term)
        );
        
        setFilteredOrders(filtered);
    }, [searchTerm, orders]);

    // Reset part selection when order changes
    useEffect(() => {
        if (selectedOrder) {
            setSelectedPartLots({});
            setPartLotQuantities({});
            setPartSelectionStatus({});
        }
    }, [selectedOrder]);

    // Update part selection status when parts or selections change
    useEffect(() => {
        updatePartSelectionStatus();
    }, [orderParts, selectedPartLots, partLotQuantities]);

    // Fetch all orders
    const fetchOrderViewForTable = async () => {
        setLoading(true);
        try {
            const response = await repairService2.order.getOrderViewsForTable();
            if (Array.isArray(response.data)) {
                setOrders(response.data);
                setFilteredOrders(response.data);
            } else {
                console.error('Expected array of orders, received:', response.data);
                setOrders([]);
                setFilteredOrders([]);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
            setOrders([]);
            setFilteredOrders([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch parts for selected order
    const fetchOrderParts = async (orderId) => {
        setPartsLoading(true);
        try {
            const response = await repairService2.part.getPartViewsByOrderIdV2(orderId);
            if (Array.isArray(response.data)) {
                setOrderParts(response.data);
            } else {
                console.error('Expected array of parts, received:', response.data);
                setOrderParts([]);
            }
        } catch (error) {
            console.error(`Error fetching parts for order ${orderId}:`, error);
            setOrderParts([]);
        } finally {
            setPartsLoading(false);
        }
    };

    // Handle order selection
    const handleSelectOrder = (order) => {
        setSelectedOrder(order);
        fetchOrderParts(order.order_id);
        // Reset selection state
        setSelectedPartLots({});
        setPartLotQuantities({});
        setPartSelectionStatus({});
    };

    // Update part selection status
    const updatePartSelectionStatus = () => {
        const newStatus = {};
        
        orderParts.forEach(part => {
            const partId = part.part_id;
            const neededQuantity = part.need_quantity;
            let selectedQuantity = 0;
            
            // Calculate total selected quantity for this part
            part.warehouses.forEach(warehouse => {
                const lotId = warehouse.part_lot_id;
                if (selectedPartLots[lotId]) {
                    selectedQuantity += parseInt(partLotQuantities[lotId] || 0);
                }
            });
            
            newStatus[partId] = {
                needed: neededQuantity,      // Số lượng phụ tùng cần thiết cho đơn hàng
                selected: selectedQuantity,  // Tổng số lượng đã được chọn từ các kho
                fulfilled: selectedQuantity >= neededQuantity,  // Đã chọn đủ số lượng cần thiết chưa?
                partiallyFulfilled: selectedQuantity > 0 && selectedQuantity < neededQuantity, // Đã chọn một phần nhưng chưa đủ
                overSelected: selectedQuantity > neededQuantity  // Đã chọn nhiều hơn số lượng cần thiết
            };
        });
        
        setPartSelectionStatus(newStatus);
    };

    // Toggle part lot selection
    const togglePartLotSelection = (lotId, initialQuantity = 1) => {
        setSelectedPartLots(prev => {
            const newSelection = { ...prev };
            if (newSelection[lotId]) {
                delete newSelection[lotId];
                
                // Also remove from quantities
                setPartLotQuantities(prevQty => {
                    const newQty = { ...prevQty };
                    delete newQty[lotId];
                    return newQty;
                });
            } else {
                newSelection[lotId] = true;
                
                // Set initial quantity
                setPartLotQuantities(prevQty => ({
                    ...prevQty,
                    [lotId]: initialQuantity
                }));
            }
            return newSelection;
        });
    };

    // Handle quantity change
    const handleQuantityChange = (lotId, maxStock, value) => {
        // Ensure quantity is between 1 and available stock
        const quantity = Math.min(Math.max(1, parseInt(value) || 1), maxStock);
        setPartLotQuantities(prev => ({
            ...prev,
            [lotId]: quantity
        }));
    };

    // Auto-select part lots based on oldest import date
    const autoSelectPartLots = () => {
        const newSelectedLots = {};
        const newQuantities = {};
        
        // Process each part
        orderParts.forEach(part => {
            const neededQuantity = part.need_quantity;
            let remainingNeeded = neededQuantity;
            
            if (remainingNeeded <= 0 || !part.warehouses || part.warehouses.length === 0) {
                return;
            }
            
            // Sort warehouses by import date (oldest first)
            const sortedWarehouses = [...part.warehouses].sort(
                (a, b) => new Date(a.import_date) - new Date(b.import_date)
            );
            
            // Select from each warehouse until we fulfill the need
            for (const warehouse of sortedWarehouses) {
                if (remainingNeeded <= 0) break;
                
                const lotId = warehouse.part_lot_id;
                const availableStock = warehouse.stock;
                
                if (availableStock > 0) {
                    // Calculate how many to take from this lot
                    const quantityToTake = Math.min(remainingNeeded, availableStock);
                    
                    newSelectedLots[lotId] = true;
                    newQuantities[lotId] = quantityToTake;
                    
                    remainingNeeded -= quantityToTake;
                }
            }
        });
        
        setSelectedPartLots(newSelectedLots);
        setPartLotQuantities(newQuantities);
    };

    // Get selected part lots in API format
    const getSelectedPartLotsForExport = () => {
        return Object.keys(selectedPartLots).map(lotId => ({
            part_lot_id: parseInt(lotId),
            quantity: parseInt(partLotQuantities[lotId] || 1)
        }));
    };

    // Check if all needed parts have enough quantity selected and not over-selected
    const isExportReady = () => {
        return Object.values(partSelectionStatus).every(status => 
            status.fulfilled && !status.overSelected
        );
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    // Fetch export details from API
    const fetchExportDetails = async (partLots) => {
        try {
            // If partLots is already a string, use it directly, otherwise convert to string
            const partLotsData = typeof partLots === 'string' 
                ? partLots 
                : JSON.stringify(partLots);
                
            const response = await repairService2.warehouse.getWarehouseInfo(partLotsData);
            return response.data;
        } catch (error) {
            console.error('Error fetching export details:', error);
            return null;
        }
    };

    // State for printing
    const [isPrinting, setIsPrinting] = useState(false);
    const [exportFormData, setExportFormData] = useState(null); // New state for API export data

    // Handle export confirmation
    const handleConfirmExport = async () => {
        if (!selectedOrder) return;
        
        const selectedLots = getSelectedPartLotsForExport();
        if (selectedLots.length === 0) {
            setExportMessage({
                type: 'warning',
                text: 'Vui lòng chọn ít nhất một phụ tùng để xuất kho.'
            });
            return;
        }
        
        setExportLoading(true);
        setExportMessage(null);
        
        try {
            // Call API to export parts - passing the selected lots data
            await repairService2.warehouse.exportPartLots(selectedLots, selectedOrder.order_id);
            console.log("Exporting parts:", selectedLots);
            
            // Update order status to exported
            setSelectedOrder(prev => ({
                ...prev,
                is_exported: true
            }));
            
            // Update orders in state
            const updateOrderWithExportStatus = order => 
                order.order_id === selectedOrder.order_id 
                    ? { ...order, is_exported: true } 
                    : order;
                    
            setOrders(prev => prev.map(updateOrderWithExportStatus));
            setFilteredOrders(prev => prev.map(updateOrderWithExportStatus));
            
            // Handle successful export
            setExportMessage({
                type: 'success',
                text: `Đã xuất kho phụ tùng cho đơn hàng #${selectedOrder.order_id} thành công!`
            });
            
            // Reset selections
            setSelectedPartLots({});
            setPartLotQuantities({});
            
            // Refresh parts data to show updated stock
            await fetchOrderParts(selectedOrder.order_id);
            
            // Convert selectedLots to string and fetch export details for printing
            const selectedLotsString = JSON.stringify(selectedLots);
            try {
                // Get export details from API using the exported lots
                const exportData = await fetchExportDetails(selectedLotsString);
                if (exportData) {
                    setExportFormData(exportData);
                    // Automatically print the export form
                    setTimeout(() => {
                        handlePrintExportForm(exportData);
                    }, 500);
                }
            } catch (printError) {
                console.error('Error preparing print form after export:', printError);
                // Still show success message for export, just note that printing failed
                setExportMessage(prev => ({
                    ...prev,
                    text: `${prev.text} Tuy nhiên, không thể in phiếu xuất kho. Bạn có thể thử in lại sau.`
                }));
            }
        } catch (error) {
            console.error('Error confirming export:', error);
            setExportMessage({
                type: 'danger',
                text: `Lỗi khi xuất kho: ${error.message || 'Vui lòng thử lại'}`
            });
        } finally {
            setExportLoading(false);
            setShowExportModal(false);
        }
    };

    useEffect(() => {console.log('Nhân viên hiện tại:', currentStaff)}, [currentStaff]);
    // Handle print export form
    const handlePrintExportForm = async (providedExportData = null) => {
        setIsPrinting(true);
        
        try {
            let exportData = providedExportData;
            
            if (!exportData) {
                // If no data provided, fetch it
                if (selectedOrder.is_exported) {
                    // For already exported orders, fetch from API
                    const response = await repairService2.warehouse.getWarehouseInfo(selectedOrder.order_id);
                    exportData = response.data;
                } else {
                    // For preview before export, use selected parts
                    const selectedLots = getSelectedPartLotsForExport();
                    exportData = await fetchExportDetails(selectedLots);
                }
                
                if (!exportData) {
                    throw new Error('Failed to fetch export details');
                }
            }
            
            setExportFormData(exportData);
            
            // Create print content
            const printContent = document.createElement('div');
            printContent.className = 'export-form-print';
            
            const currentDate = new Date();
            const formattedDate = currentDate.toLocaleDateString('vi-VN');
            const formattedTime = currentDate.toLocaleTimeString('vi-VN');
            
            // Create HTML content for the print window
            printContent.innerHTML = `
                <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="margin: 0;">PHIẾU XUẤT KHO PHỤ TÙNG</h2>
                        <p style="margin: 5px 0;">Mã phiếu: #XK-${selectedOrder?.order_id}-${Date.now().toString().slice(-6)}</p>
                        <p style="margin: 5px 0;">Ngày xuất: ${formattedDate} ${formattedTime}</p>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <div style="display: flex; justify-content: space-between;">
                            <div style="width: 48%;">
                                <h4 style="margin: 0 0 5px 0; font-size: 14px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">THÔNG TIN ĐƠN HÀNG</h4>
                                <p style="margin: 5px 0; font-size: 13px;"><strong>Mã đơn hàng:</strong> #${selectedOrder?.order_id}</p>
                                <p style="margin: 5px 0; font-size: 13px;"><strong>Khách hàng:</strong> ${selectedOrder?.customer?.fullname}</p>
                                <p style="margin: 5px 0; font-size: 13px;"><strong>SĐT:</strong> ${selectedOrder?.customer?.phone_num}</p>
                            </div>
                            <div style="width: 48%;">
                                <h4 style="margin: 0 0 5px 0; font-size: 14px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">THÔNG TIN XE</h4>
                                <p style="margin: 5px 0; font-size: 13px;"><strong>Biển số:</strong> ${selectedOrder?.motocycle?.license_plate}</p>
                                <p style="margin: 5px 0; font-size: 13px;"><strong>Loại xe:</strong> ${selectedOrder?.motocycle?.brand} ${selectedOrder?.motocycle?.model}</p>
                                <p style="margin: 5px 0; font-size: 13px;"><strong>Nhân viên xuất kho:</strong> ${currentStaff?.originData?.fullname || currentStaff?.displayName|| 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                    
                    <h4 style="margin: 0 0 10px 0; font-size: 14px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">CHI TIẾT PHỤ TÙNG XUẤT KHO</h4>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                        <thead>
                            <tr style="background-color: #f5f5f5;">
                                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 13px;">STT</th>
                                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 13px;">Tên phụ tùng</th>
                                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 13px;">Vị trí</th>
                                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 13px;">Nhà cung cấp</th>
                                <th style="border: 1px solid #ddd; padding: 8px; text-align: center; font-size: 13px;">Đơn vị</th>
                                <th style="border: 1px solid #ddd; padding: 8px; text-align: center; font-size: 13px;">Số lượng</th>
                                <th style="border: 1px solid #ddd; padding: 8px; text-align: right; font-size: 13px;">Giá nhập</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${exportData.map((item, index) => `
                                <tr>
                                    <td style="border: 1px solid #ddd; padding: 8px; font-size: 13px;">${index + 1}</td>
                                    <td style="border: 1px solid #ddd; padding: 8px; font-size: 13px;">${item.name}</td>
                                    <td style="border: 1px solid #ddd; padding: 8px; font-size: 13px;">${item.location}</td>
                                    <td style="border: 1px solid #ddd; padding: 8px; font-size: 13px;">${item.supplier_name}</td>
                                    <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-size: 13px;">${item.unit}</td>
                                    <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-size: 13px;">${item.quantity}</td>
                                    <td style="border: 1px solid #ddd; padding: 8px; text-align: right; font-size: 13px;">${formatCurrency(item.import_price)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    
                    <div style="display: flex; justify-content: space-between; margin-top: 30px;">
                        <div style="width: 30%; text-align: center;">
                            <p style="margin-bottom: 60px; font-weight: bold;">Người lập phiếu</p>
                            <p>${currentStaff?.originData?.fullname || currentStaff?.displayName || 'N/A'}</p>
                        </div>
                        <div style="width: 30%; text-align: center;">
                            <p style="margin-bottom: 60px; font-weight: bold;">Người nhận</p>
                            <p>Kỹ thuật viên</p>
                        </div>
                        <div style="width: 30%; text-align: center;">
                            <p style="margin-bottom: 60px; font-weight: bold;">Thủ kho</p>
                            <p>Ký tên</p>
                        </div>
                    </div>
                    
                    <div style="margin-top: 30px; font-size: 12px; font-style: italic; text-align: center;">
                        <p>Phiếu này được in tự động từ hệ thống quản lý Sửa Chữa Xe Máy.</p>
                    </div>
                </div>
            `;
            
            // Open print window
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Phiếu xuất kho #${selectedOrder?.order_id}</title>
                        <style>
                            @media print {
                                @page { margin: 10mm; }
                                body { font-family: Arial, sans-serif; }
                            }
                        </style>
                    </head>
                    <body>
                        ${printContent.outerHTML}
                        <script>
                            // Automatically print when loaded
                            window.onload = function() {
                                setTimeout(function() {
                                    window.print();
                                    window.onfocus = function() {
                                        setTimeout(function() { window.close(); }, 500);
                                    }
                                }, 500);
                            };
                        </script>
                    </body>
                </html>
            `);
        } catch (error) {
            console.error('Lỗi khi in phiếu xuất kho:', error);
            alert('Có lỗi xảy ra khi tạo phiếu xuất kho. Vui lòng thử lại.');
        } finally {
            setIsPrinting(false);
        }
    };

    // Handle print button in export modal
    const handlePrintInModal = async () => {
        setShowExportModal(false);
        // Get selected lots and fetch their details from API before printing
        const selectedLots = getSelectedPartLotsForExport();
        try {
            const exportData = await fetchExportDetails(selectedLots);
            if (exportData) {
                setExportFormData(exportData);
                handlePrintExportForm(exportData);
            } else {
                alert('Không thể lấy thông tin chi tiết xuất kho. Vui lòng thử lại.');
            }
        } catch (error) {
            console.error('Error preparing print form:', error);
            alert('Có lỗi xảy ra khi chuẩn bị in phiếu. Vui lòng thử lại.');
        }
    };

    // Format date string
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            // hour: '2-digit',
            // minute: '2-digit',
        });
    };

    // Get export details formatted for printing
    const getExportDetailsForPrinting = () => {
        const selectedLots = [];
        
        orderParts.forEach(part => {
            part.warehouses.forEach(warehouse => {
                if (selectedPartLots[warehouse.part_lot_id]) {
                    selectedLots.push({
                        partId: part.part_id,
                        partName: part.name,
                        unit: part.unit,
                        location: warehouse.location,
                        supplier: warehouse.supplier_name,
                        quantity: partLotQuantities[warehouse.part_lot_id] || 1,
                        price: warehouse.import_price
                    });
                }
            });
        });
        
        return selectedLots;
    };

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="mb-0">Kho phụ tùng - Xuất kho</h5>
                <Button 
                    variant="outline-primary"
                    onClick={() => fetchOrderViewForTable()}
                    disabled={loading}
                >
                    <i className="bi bi-arrow-clockwise me-1"></i> Làm mới
                </Button>
            </div>

            {exportMessage && (
                <Alert 
                    variant={exportMessage.type} 
                    onClose={() => setExportMessage(null)}
                    dismissible
                    className="mb-4"
                >
                    {exportMessage.text}
                </Alert>
            )}

            {/* Hiển thị cảnh báo nếu có phụ tùng được chọn quá số lượng */}
            {Object.values(partSelectionStatus).some(status => status.overSelected) && (
                <Alert 
                    variant="warning" 
                    className="mb-4"
                >
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    Có phụ tùng được chọn nhiều hơn số lượng cần thiết. Vui lòng điều chỉnh lại số lượng.
                </Alert>
            )}

            <Row>
                {/* Left side - Orders Table */}
                <Col lg={6} className="mb-4">
                    <Card className="shadow-sm h-100">
                        <Card.Header className="bg-white">
                            <div className="d-flex justify-content-between align-items-center">
                                <h6 className="mb-0">Danh sách đơn hàng</h6>
                                <Form.Group className="search-box mb-0">
                                    <InputGroup>
                                        <Form.Control
                                            placeholder="Tìm kiếm đơn hàng..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                        <Button variant="outline-secondary">
                                            <i className="bi bi-search"></i>
                                        </Button>
                                    </InputGroup>
                                </Form.Group>
                            </div>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <div className="table-responsive" style={{ maxHeight: "80vh", overflowY: "auto" }}>
                                <Table hover className="mb-0">
                                    <thead className="sticky-top">
                                        <tr className="table-light">
                                            <th>Mã đơn</th>
                                            <th>Khách hàng</th>
                                            <th>Thông tin xe</th>
                                            <th>Ngày tạo</th>
                                            <th>Trạng thái</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr>
                                                <td colSpan="5" className="text-center py-4">
                                                    <Spinner animation="border" variant="primary" />
                                                    <p className="mt-2 text-muted">Đang tải dữ liệu...</p>
                                                </td>
                                            </tr>
                                        ) : filteredOrders.length > 0 ? (
                                            filteredOrders.map(order => (
                                                <tr 
                                                    key={order.order_id}
                                                    onClick={() => handleSelectOrder(order)}
                                                    className={selectedOrder?.order_id === order.order_id ? 'table-active' : ''}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <td>
                                                        {order.order_id}
                                                        {order.is_exported && (
                                                            <span className="ms-2" title="Đã xuất kho">
                                                                <i className="bi bi-box-seam text-success"></i>
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <div className="fw-semibold">{order.customer.fullname}</div>
                                                        <small className="text-muted">{order.customer.phone_num}</small>
                                                    </td>
                                                    <td>
                                                        <div>{order.motocycle.brand} {order.motocycle.model}</div>
                                                        <small className="text-muted">{order.motocycle.license_plate}</small>
                                                    </td>
                                                    <td>{formatDate(order.created_at)}</td>
                                                    <td>
                                                        <div className="d-flex align-items-center">
                                                            <StatusBadge status={tableOrderStatus[order.status]} />
                                                            {order.is_exported && (
                                                                <span className="ms-2 badge bg-success">
                                                                    <i className="bi bi-box-arrow-right me-1"></i>
                                                                    {/* Đã xuất kho */}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className="text-center py-4">
                                                    <div className="text-muted">
                                                        <i className="bi bi-inbox fs-4 d-block mb-2"></i>
                                                        {searchTerm ? 'Không tìm thấy đơn hàng phù hợp' : 'Không có đơn hàng nào'}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </Table>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Right side - Parts Details */}
                <Col lg={6} className="mb-4">
                    <Card className="shadow-sm h-100">
                        <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                            <h6 className="mb-0">Chi tiết phụ tùng</h6>
                            {selectedOrder && selectedOrder.status === 'repairing' && !selectedOrder.is_exported && orderParts.length > 0 && (
                                <div>
                                    <Button 
                                        variant="outline-primary"
                                        size="sm"
                                        className="me-2"
                                        onClick={autoSelectPartLots}
                                        title="Tự động chọn phụ tùng theo thứ tự cũ nhất"
                                    >
                                        <i className="bi bi-magic me-1"></i>
                                        Tự động chọn
                                    </Button>
                                    <Button 
                                        variant="danger"
                                        size="sm"
                                        onClick={() => setShowExportModal(true)}
                                        disabled={!isExportReady()}
                                        title={!isExportReady() ? 
                                            "Chưa chọn đủ số lượng phụ tùng cần thiết" : 
                                            "Xác nhận xuất kho phụ tùng đã chọn"}
                                    >
                                        <i className="bi bi-box-arrow-right me-1"></i>
                                        Xác nhận xuất kho
                                    </Button>
                                </div>
                            )}
                            {selectedOrder && selectedOrder.is_exported && (
                                <div>
                                    <Badge bg="success" className="me-2 py-2 px-3">
                                        <i className="bi bi-check-circle-fill me-1"></i>
                                        Đã xuất kho
                                    </Badge>
                                    <Button 
                                        variant="outline-secondary"
                                        size="sm"
                                        onClick={handlePrintExportForm}
                                        disabled={isPrinting}
                                    >
                                        <i className="bi bi-printer me-1"></i>
                                        {isPrinting ? 'Đang in...' : 'In phiếu xuất'}
                                    </Button>
                                </div>
                            )}
                        </Card.Header>
                        <Card.Body>
                            {!selectedOrder ? (
                                <div className="text-center py-5">
                                    <i className="bi bi-arrows-angle-contract fs-1 text-muted"></i>
                                    <p className="mt-3 text-muted">Vui lòng chọn một đơn hàng để xem chi tiết phụ tùng</p>
                                </div>
                            ) : partsLoading ? (
                                <div className="text-center py-5">
                                    <Spinner animation="border" variant="primary" />
                                    <p className="mt-2 text-muted">Đang tải dữ liệu phụ tùng...</p>
                                </div>
                            ) : orderParts.length > 0 ? (
                                <>
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h6 className="mb-0">Đơn hàng #{selectedOrder.order_id}</h6>
                                        <div className="d-flex align-items-center">
                                            <StatusBadge status={tableOrderStatus[selectedOrder.status]} />
                                            {selectedOrder.is_exported && (
                                                <Badge bg="success" className="ms-2">
                                                    <i className="bi bi-box-arrow-right me-1"></i>
                                                    Đã xuất kho
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    {selectedOrder.is_exported && (
                                        <Alert variant="info" className="mb-3">
                                            <i className="bi bi-info-circle-fill me-2"></i>
                                            Các phụ tùng cho đơn hàng này đã được xuất kho. Không thể thực hiện xuất kho lại.
                                        </Alert>
                                    )}
                                    
                                    {orderParts.map((part, index) => {
                                        const partStatus = partSelectionStatus[part.part_id] || {
                                            needed: part.need_quantity,
                                            selected: 0,
                                            fulfilled: false,
                                            partiallyFulfilled: false,
                                            overSelected: false
                                        };
                                        let statusBadge = null;
                                        if (selectedOrder.status === 'repairing' && !selectedOrder.is_exported) {
                                            if (partStatus.overSelected) {
                                                statusBadge = <Badge bg="danger">Quá nhiều: {partStatus.selected}/{partStatus.needed}</Badge>;
                                            } else if (partStatus.fulfilled) {
                                                statusBadge = <Badge bg="success">Đã chọn đủ</Badge>;
                                            } else if (partStatus.partiallyFulfilled) {
                                                statusBadge = <Badge bg="warning">Chọn {partStatus.selected}/{partStatus.needed}</Badge>;
                                            } else {
                                                statusBadge = <Badge bg="danger">Chưa chọn</Badge>;
                                            }
                                        }
                                        return (
                                            <div key={part.part_id} className="part-item mb-4">
                                                <div className="part-header d-flex justify-content-between align-items-center bg-light p-2 rounded">
                                                    <h6 className="mb-0">{part.name}</h6>
                                                    <div>
                                                        {statusBadge && (
                                                            <span className="me-2">{statusBadge}</span>
                                                        )}
                                                        <Badge bg="primary" className="me-2">
                                                            Giá bán: {formatCurrency(part.price)}
                                                        </Badge>
                                                        <Badge bg="warning">
                                                            Cần: {part.need_quantity} {part.unit}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                
                                                <div className="warehouse-list mt-2">
                                                    <Table size="sm" bordered hover>
                                                        <thead className="table-light">
                                                            <tr>
                                                                {selectedOrder.status === 'repairing' && !selectedOrder.is_exported && (
                                                                    <th style={{ width: '60px' }}>Chọn</th>
                                                                )}
                                                                <th>Vị trí</th>
                                                                <th>Nhà cung cấp</th>
                                                                <th>Ngày nhập</th>
                                                                <th>Tồn kho</th>
                                                                <th>Giá nhập</th>
                                                                {selectedOrder.status === 'repairing' && !selectedOrder.is_exported && (
                                                                    <th style={{ width: '120px' }}>Số lượng</th>
                                                                )}
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {part.warehouses.map(warehouse => (
                                                                <tr key={warehouse.part_lot_id}>
                                                                    {selectedOrder.status === 'repairing' && !selectedOrder.is_exported && (
                                                                        <td className="text-center">
                                                                            <Form.Check
                                                                                type="checkbox"
                                                                                checked={!!selectedPartLots[warehouse.part_lot_id]}
                                                                                onChange={() => togglePartLotSelection(warehouse.part_lot_id)}
                                                                                disabled={warehouse.stock <= 0}
                                                                            />
                                                                        </td>
                                                                    )}
                                                                    <td>{warehouse.location}</td>
                                                                    <td>{warehouse.supplier_name}</td>
                                                                    <td>{formatDate(warehouse.import_date)}</td>
                                                                    <td>{warehouse.stock} / {warehouse.quantity}</td>
                                                                    <td>{formatCurrency(warehouse.import_price)}</td>
                                                                    {selectedOrder.status === 'repairing' && !selectedOrder.is_exported && (
                                                                        <td>
                                                                            <Form.Control
                                                                                type="number"
                                                                                min="1"
                                                                                max={warehouse.stock}
                                                                                value={selectedPartLots[warehouse.part_lot_id] ? 
                                                                                    (partLotQuantities[warehouse.part_lot_id] || 1) : 
                                                                                    1}
                                                                                onChange={(e) => handleQuantityChange(
                                                                                    warehouse.part_lot_id, 
                                                                                    warehouse.stock, 
                                                                                    e.target.value
                                                                                )}
                                                                                disabled={!selectedPartLots[warehouse.part_lot_id] || warehouse.stock <= 0}
                                                                                size="sm"
                                                                            />
                                                                        </td>
                                                                    )}
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </Table>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </>
                            ) : (
                                <div className="text-center py-5">
                                    <i className="bi bi-box fs-1 text-muted"></i>
                                    <p className="mt-3 text-muted">Không có thông tin phụ tùng cho đơn hàng này</p>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Export Confirmation Modal */}
            <CustomModal 
                show={showExportModal}
                onHide={() => setShowExportModal(false)}
                title="Xác nhận xuất kho"
                message={
                    <>
                        <p>Bạn có chắc chắn muốn xuất kho các phụ tùng sau cho đơn hàng #{selectedOrder?.order_id}?</p>
                        
                        <Table size="sm" bordered className="mt-3">
                            <thead className="table-light">
                                <tr>
                                    <th>Phụ tùng</th>
                                    <th>Vị trí</th>
                                    <th>Nhà cung cấp</th>
                                    <th>Số lượng</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orderParts.map(part => 
                                    part.warehouses
                                        .filter(warehouse => selectedPartLots[warehouse.part_lot_id])
                                        .map(warehouse => (
                                            <tr key={warehouse.part_lot_id}>
                                                <td>{part.name}</td>
                                                <td>{warehouse.location}</td>
                                                <td>{warehouse.supplier_name}</td>
                                                <td>{partLotQuantities[warehouse.part_lot_id] || 1} {part.unit}</td>
                                            </tr>
                                        ))
                                )}
                            </tbody>
                        </Table>
                        <p className="mb-0 text-danger mt-3">Lưu ý: Thao tác này không thể hoàn tác!</p>
                    </>
                }
                confirmButtonText={exportLoading ? "Đang xử lý..." : "Xác nhận xuất kho"}
                confirmButtonVariant="danger"
                onConfirm={handleConfirmExport}
                cancelButtonText="Hủy"
                confirmDisabled={exportLoading}
                footerButtons={
                    <Button 
                        variant="outline-secondary" 
                        onClick={handlePrintInModal}
                        disabled={exportLoading}
                        className="me-2"
                    >
                        <i className="bi bi-printer me-1"></i>
                        In phiếu
                    </Button>
                }
            />
        </>
    );
};

export default OrderWarehouse;
