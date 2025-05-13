import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Pagination, Modal, Form, Row, Col, InputGroup, Badge, Image, Tabs, Tab } from 'react-bootstrap';
import { useAppData } from '../contexts/AppDataContext';
import { inventoryService } from '../../services/api';
import './WarehouseManagement.css';

const WarehouseManagement = () => {
    const { getData, getIds, setData, loading } = useAppData();
    const partsById = getData('parts') || {};
    const partsIds = getIds('parts') || [];

    // State for parts inventory
    const [filteredPartsIds, setFilteredPartsIds] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [itemsPerPage] = useState(10);

    // State for filters
    const [filters, setFilters] = useState({
        search: '',
        location: '',
        supplier: '',
        minStock: '',
        maxStock: ''
    });

    // State for modal
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showReceiveModal, setShowReceiveModal] = useState(false);
    const [showDistributeModal, setShowDistributeModal] = useState(false);
    const [currentPart, setCurrentPart] = useState(null);
    const [receiveForm, setReceiveForm] = useState({
        quantity: 0,
        import_price: 0,
        supplier_name: '',
        notes: ''
    });
    const [distributeForm, setDistributeForm] = useState({
        quantity: 0,
        destination: '',
        notes: ''
    });

    // State for tab management
    const [activeTab, setActiveTab] = useState('inventory');
    
    // State for local loading
    const [localLoading, setLocalLoading] = useState(false);
    const [validated, setValidated] = useState(false);

    // Locations and suppliers lists - update locations to be shelf positions
    const locations = ['A1-01', 'A1-02', 'A2-01', 'B1-01', 'B2-01', 'C1-01'];
    const suppliers = ['Nhà cung cấp A', 'Nhà cung cấp B', 'Nhà cung cấp C'];
    const destinations = ['Phục vụ sửa chữa', 'Chuyển kệ khác', 'Xuất bán lẻ'];

    // Initialize data
    useEffect(() => {
        setLocalLoading(true);
        if (loading['parts'] === true) return;
        
        // Mock data for development - would be replaced by actual API calls
        if (Object.keys(partsById).length === 0) {
            // Simulate fetching parts data
            fetchParts();
        } else {
            setFilteredPartsIds(partsIds);
            setTotalPages(Math.ceil(partsIds.length / itemsPerPage));
            setLocalLoading(false);
        }
    }, [loading, partsById, partsIds]);

    // Mock function to fetch parts - update to reflect correct meaning of fields
    const fetchParts = async () => {
        try {
            // In a real application, this would be an API call
            // const response = await inventoryService.getParts();
            // setData('parts', response.data);
            
            // Mock data using the correct structure for batch inventory
            const mockParts = [
                {
                    "URL": "/images/parts/loc-gio-wave-alpha.jpg",
                    "import_date": "2023-10-01T12:00:00",
                    "import_price": 65000,
                    "location": "A1-01", // Shelf location
                    "name": "Lọc gió Wave Alpha",
                    "part_id": 1, // Part ID
                    "part_warehouse_id": 1, // Batch/lot ID
                    "stock": 50, // Current quantity of this batch
                    "supplier_name": "Nhà cung cấp A",
                    "unit": "cái"
                },
                {
                    "URL": "/images/parts/loc-gio-wave-alpha.jpg",
                    "import_date": "2023-11-15T14:30:00",
                    "import_price": 68000,
                    "location": "A1-02", // Different shelf location
                    "name": "Lọc gió Wave Alpha",
                    "part_id": 1, // Same part ID
                    "part_warehouse_id": 6, // Different batch/lot ID
                    "stock": 35, // Current quantity of this batch
                    "supplier_name": "Nhà cung cấp A",
                    "unit": "cái"
                },
                {
                    "URL": "/images/parts/day-curoa-vision.jpg",
                    "import_date": "2023-09-15T10:30:00",
                    "import_price": 120000,
                    "location": "A2-01",
                    "name": "Dây curoa Vision",
                    "part_id": 2,
                    "part_warehouse_id": 2,
                    "stock": 30,
                    "supplier_name": "Nhà cung cấp B",
                    "unit": "cái"
                },
                {
                    "URL": "/images/parts/bugi-denso-iridium.jpg",
                    "import_date": "2023-10-05T14:20:00",
                    "import_price": 95000,
                    "location": "B1-01",
                    "name": "Bugi Denso Iridium",
                    "part_id": 3,
                    "part_warehouse_id": 3,
                    "stock": 80,
                    "supplier_name": "Nhà cung cấp A",
                    "unit": "cái"
                },
                {
                    "URL": "/images/parts/nhot-motul-3000.jpg",
                    "import_date": "2023-09-20T09:15:00",
                    "import_price": 85000,
                    "location": "B2-01",
                    "name": "Nhớt Motul 3000",
                    "part_id": 4,
                    "part_warehouse_id": 4,
                    "stock": 25,
                    "supplier_name": "Nhà cung cấp C",
                    "unit": "chai"
                },
                {
                    "URL": "/images/parts/lop-michelin.jpg",
                    "import_date": "2023-10-10T11:45:00",
                    "import_price": 450000,
                    "location": "C1-01",
                    "name": "Lốp Michelin 70/90-17",
                    "part_id": 5,
                    "part_warehouse_id": 5,
                    "stock": 15,
                    "supplier_name": "Nhà cung cấp B",
                    "unit": "cái"
                }
            ];
            
            // Add parts to data store
            mockParts.forEach(part => {
                setData('parts', part, part.part_warehouse_id); // Index by batch ID, not part ID
            });
            
            setFilteredPartsIds(mockParts.map(part => part.part_warehouse_id)); // Track batch IDs
            setTotalPages(Math.ceil(mockParts.length / itemsPerPage));
            setLocalLoading(false);
        } catch (error) {
            console.error("Error fetching parts data:", error);
            setLocalLoading(false);
        }
    };

    // Apply filters - update to filter by part ID and batch criteria
    const handleApplyFilter = () => {
        let filtered = [...partsIds];
        
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            filtered = filtered.filter(id => {
                const part = partsById[id];
                return part.name.toLowerCase().includes(searchTerm) ||
                       part.part_id.toString().includes(searchTerm) ||
                       part.part_warehouse_id.toString().includes(searchTerm);
            });
        }
        
        if (filters.location) {
            filtered = filtered.filter(id => partsById[id].location === filters.location);
        }
        
        if (filters.supplier) {
            filtered = filtered.filter(id => partsById[id].supplier_name === filters.supplier);
        }
        
        if (filters.minStock) {
            filtered = filtered.filter(id => partsById[id].stock >= parseInt(filters.minStock));
        }
        
        if (filters.maxStock) {
            filtered = filtered.filter(id => partsById[id].stock <= parseInt(filters.maxStock));
        }
        
        setFilteredPartsIds(filtered);
        setTotalPages(Math.ceil(filtered.length / itemsPerPage));
        setCurrentPage(1);
    };
    
    // Reset filters
    const handleResetFilter = () => {
        setFilters({
            search: '',
            location: '',
            supplier: '',
            minStock: '',
            maxStock: ''
        });
        setFilteredPartsIds(partsIds);
        setTotalPages(Math.ceil(partsIds.length / itemsPerPage));
        setCurrentPage(1);
    };
    
    // Handle filter change
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Get current items for pagination
    const getCurrentItems = () => {
        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        return filteredPartsIds.slice(indexOfFirstItem, indexOfLastItem).map(id => partsById[id]);
    };
    
    // Handle page change
    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };
    
    // Pagination component
    const renderPagination = () => {
        if (totalPages <= 1) return null;
        
        let items = [];
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, startPage + 4);
        
        if (startPage > 1) {
            items.push(
                <Pagination.First key="first" onClick={() => handlePageChange(1)} />,
                <Pagination.Prev key="prev" onClick={() => handlePageChange(currentPage - 1)} />
            );
        }
        
        for (let page = startPage; page <= endPage; page++) {
            items.push(
                <Pagination.Item
                    key={page}
                    active={page === currentPage}
                    onClick={() => handlePageChange(page)}
                >
                    {page}
                </Pagination.Item>
            );
        }
        
        if (endPage < totalPages) {
            items.push(
                <Pagination.Next key="next" onClick={() => handlePageChange(currentPage + 1)} />,
                <Pagination.Last key="last" onClick={() => handlePageChange(totalPages)} />
            );
        }
        
        return (
            <Pagination className="justify-content-center mt-4">
                {items}
            </Pagination>
        );
    };
    
    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };
    
    // Format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN');
    };
    
    // Show part detail modal
    const handleShowDetailModal = (part) => {
        setCurrentPart(part);
        setShowDetailModal(true);
    };
    
    // Show receive modal
    const handleShowReceiveModal = (part) => {
        setCurrentPart(part);
        setReceiveForm({
            quantity: 0,
            import_price: part.import_price,
            supplier_name: part.supplier_name,
            notes: ''
        });
        setValidated(false);
        setShowReceiveModal(true);
    };
    
    // Show distribute modal
    const handleShowDistributeModal = (part) => {
        setCurrentPart(part);
        setDistributeForm({
            quantity: 0,
            destination: '',
            notes: ''
        });
        setValidated(false);
        setShowDistributeModal(true);
    };
    
    // Handle receive form change
    const handleReceiveFormChange = (e) => {
        const { name, value } = e.target;
        setReceiveForm(prev => ({
            ...prev,
            [name]: name === 'quantity' || name === 'import_price' ? Number(value) : value
        }));
    };
    
    // Handle distribute form change
    const handleDistributeFormChange = (e) => {
        const { name, value } = e.target;
        setDistributeForm(prev => ({
            ...prev,
            [name]: name === 'quantity' ? Number(value) : value
        }));
    };
    
    // Handle receive submit - update to match correct field usage
    const handleReceiveSubmit = async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        
        if (form.checkValidity() === false) {
            e.stopPropagation();
            setValidated(true);
            return;
        }
        
        try {
            setLocalLoading(true);
            
            // In a real application, this would be an API call to receive inventory
            // await inventoryService.receiveParts(currentPart.part_id, receiveForm);
            
            // Update part in local store - maintaining exact field names/structure
            const updatedPart = {
                ...currentPart,
                stock: currentPart.stock + receiveForm.quantity, // Update stock (actual inventory)
                import_price: receiveForm.import_price,
                import_date: new Date().toISOString(),
                supplier_name: receiveForm.supplier_name,
                // Ensure we maintain the same structure
                URL: currentPart.URL,
                part_id: currentPart.part_id,
                part_warehouse_id: currentPart.part_warehouse_id,
                name: currentPart.name,
                unit: currentPart.unit,
                location: receiveForm.location || currentPart.location
            };
            
            setData('parts', updatedPart, currentPart.part_warehouse_id);
            
            setShowReceiveModal(false);
            alert('Nhập kho thành công!');
        } catch (error) {
            console.error('Lỗi khi nhập kho:', error);
            alert('Có lỗi xảy ra khi nhập kho. Vui lòng thử lại!');
        } finally {
            setLocalLoading(false);
        }
    };
    
    // Handle distribute submit - update to match correct field usage
    const handleDistributeSubmit = async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        
        if (form.checkValidity() === false || distributeForm.quantity > currentPart.stock) {
            e.stopPropagation();
            setValidated(true);
            return;
        }
        
        try {
            setLocalLoading(true);
            
            // In a real application, this would be an API call to distribute inventory
            // await inventoryService.distributeParts(currentPart.part_warehouse_id, distributeForm);
            
            // Update part in local store - maintaining exact field structure
            const updatedPart = {
                ...currentPart,
                stock: currentPart.stock - distributeForm.quantity // Update stock (actual inventory)
                // All other fields remain unchanged
            };
            
            setData('parts', updatedPart, currentPart.part_warehouse_id);
            
            setShowDistributeModal(false);
            alert('Xuất kho thành công!');
        } catch (error) {
            console.error('Lỗi khi xuất kho:', error);
            alert('Có lỗi xảy ra khi xuất kho. Vui lòng thử lại!');
        } finally {
            setLocalLoading(false);
        }
    };

    // Render stock status badge - based on stock threshold, not comparing to total
    const renderStockStatusBadge = (stock) => {
        // Set thresholds based on absolute values, not percentages
        if (stock > 30) {
            return <Badge bg="success">Đủ hàng</Badge>;
        } else if (stock > 10) {
            return <Badge bg="warning">Cần nhập thêm</Badge>;
        } else {
            return <Badge bg="danger">Sắp hết</Badge>;
        }
    };

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="mb-0">Quản lý kho phụ tùng</h5>
                <div>
                    <Button
                        variant="outline-primary"
                        className={`me-2 ${activeTab === 'inventory' ? 'active' : ''}`}
                        onClick={() => setActiveTab('inventory')}
                    >
                        <i className="bi bi-box me-1"></i>
                        Tồn kho
                    </Button>
                    <Button
                        variant="outline-primary"
                        className={`me-2 ${activeTab === 'receiving' ? 'active' : ''}`}
                        onClick={() => setActiveTab('receiving')}
                    >
                        <i className="bi bi-arrow-down-circle me-1"></i>
                        Nhập kho
                    </Button>
                    <Button
                        variant="outline-primary"
                        className={`me-2 ${activeTab === 'distribution' ? 'active' : ''}`}
                        onClick={() => setActiveTab('distribution')}
                    >
                        <i className="bi bi-arrow-up-circle me-1"></i>
                        Xuất kho
                    </Button>
                    <Button 
                        style={{ backgroundColor: '#d30000', borderColor: '#d30000' }}
                        onClick={() => setActiveTab('inventory')}
                    >
                        <i className="bi bi-plus-circle me-1"></i>
                        Thêm phụ tùng mới
                    </Button>
                </div>
            </div>

            {/* Main Content based on active tab */}
            {activeTab === 'inventory' && (
                <>
                    {/* Filter Section */}
                    <Card className="shadow-sm mb-4">
                        <Card.Body>
                            <Row className="g-3">
                                <Col md={4}>
                                    <Form.Group>
                                        <Form.Label>Tìm kiếm</Form.Label>
                                        <InputGroup>
                                            <Form.Control
                                                placeholder="Tìm kiếm theo tên hoặc mã phụ tùng..."
                                                name="search"
                                                value={filters.search}
                                                onChange={handleFilterChange}
                                            />
                                            <Button variant="outline-secondary">
                                                <i className="bi bi-search"></i>
                                            </Button>
                                        </InputGroup>
                                    </Form.Group>
                                </Col>
                                <Col md={2}>
                                    <Form.Group>
                                        <Form.Label>Vị trí kệ</Form.Label>
                                        <Form.Select
                                            name="location"
                                            value={filters.location}
                                            onChange={handleFilterChange}
                                        >
                                            <option value="">Tất cả</option>
                                            {locations.map((location, idx) => (
                                                <option key={idx} value={location}>{location}</option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={2}>
                                    <Form.Group>
                                        <Form.Label>Nhà cung cấp</Form.Label>
                                        <Form.Select
                                            name="supplier"
                                            value={filters.supplier}
                                            onChange={handleFilterChange}
                                        >
                                            <option value="">Tất cả</option>
                                            {suppliers.map((supplier, idx) => (
                                                <option key={idx} value={supplier}>{supplier}</option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={2}>
                                    <Form.Group>
                                        <Form.Label>Tồn kho tối thiểu</Form.Label>
                                        <Form.Control
                                            type="number"
                                            name="minStock"
                                            value={filters.minStock}
                                            onChange={handleFilterChange}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={2}>
                                    <Form.Group>
                                        <Form.Label>Tồn kho tối đa</Form.Label>
                                        <Form.Control
                                            type="number"
                                            name="maxStock"
                                            value={filters.maxStock}
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

                    {/* Table Section - Updated to show batch/lot information */}
                    <Card className="shadow-sm mb-4">
                        <Card.Body className="p-0">
                            <div className="table-responsive">
                                <Table hover className="mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th style={{ width: '70px' }}>Hình ảnh</th>
                                            <th>Mã PT</th>
                                            <th>Mã lô</th>
                                            <th>Tên phụ tùng</th>
                                            <th>Tồn kho</th>
                                            <th>Vị trí kệ</th>
                                            <th>Giá nhập</th>
                                            <th>Ngày nhập</th>
                                            <th>Tình trạng</th>
                                            <th>Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {localLoading ? (
                                            <tr>
                                                <td colSpan="10" className="text-center py-4">
                                                    <div className="spinner-border text-primary" role="status">
                                                        <span className="visually-hidden">Loading...</span>
                                                    </div>
                                                    <p className="mt-2 text-muted">Đang tải dữ liệu...</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            getCurrentItems().map(part => (
                                                <tr key={part.part_warehouse_id}>
                                                    <td>
                                                        <Image 
                                                            src={part.URL || "/images/parts/placeholder.jpg"} 
                                                            alt={part.name}
                                                            width={50}
                                                            height={50}
                                                            className="part-thumbnail"
                                                        />
                                                    </td>
                                                    <td>{part.part_id}</td>
                                                    <td>{part.part_warehouse_id}</td>
                                                    <td>
                                                        <div className="fw-semibold">{part.name}</div>
                                                        <small className="text-muted">{part.unit}</small>
                                                    </td>
                                                    <td>
                                                        <div className="fw-semibold">{part.stock} {part.unit}</div>
                                                    </td>
                                                    <td>{part.location}</td>
                                                    <td>{formatCurrency(part.import_price)}</td>
                                                    <td>{formatDate(part.import_date)}</td>
                                                    <td>
                                                        {renderStockStatusBadge(part.stock)}
                                                    </td>
                                                    <td>
                                                        <div className="d-flex gap-2">
                                                            <Button
                                                                variant="outline-primary"
                                                                size="sm"
                                                                className="btn-icon"
                                                                onClick={() => handleShowDetailModal(part)}
                                                                title="Xem chi tiết"
                                                            >
                                                                <i className="bi bi-eye"></i>
                                                            </Button>
                                                            <Button
                                                                variant="outline-success"
                                                                size="sm"
                                                                className="btn-icon"
                                                                onClick={() => handleShowReceiveModal(part)}
                                                                title="Nhập kho"
                                                            >
                                                                <i className="bi bi-arrow-down-circle"></i>
                                                            </Button>
                                                            <Button
                                                                variant="outline-danger"
                                                                size="sm"
                                                                className="btn-icon"
                                                                onClick={() => handleShowDistributeModal(part)}
                                                                title="Xuất kho"
                                                                disabled={part.stock <= 0}
                                                            >
                                                                <i className="bi bi-arrow-up-circle"></i>
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}

                                        {!localLoading && filteredPartsIds.length === 0 && (
                                            <tr>
                                                <td colSpan="10" className="text-center py-4">
                                                    <div className="text-muted">
                                                        <i className="bi bi-inbox fs-4 d-block mb-2"></i>
                                                        Không tìm thấy phụ tùng nào
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </Table>
                            </div>
                        </Card.Body>
                    </Card>

                    {renderPagination()}
                </>
            )}

            {/* Part Detail Modal - Updated to show correct batch information */}
            <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Chi tiết phụ tùng</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {currentPart && (
                        <Row>
                            <Col md={4}>
                                <div className="part-image-container mb-3">
                                    <Image 
                                        src={currentPart.URL || "/images/parts/placeholder.jpg"} 
                                        alt={currentPart.name}
                                        className="part-detail-image"
                                        fluid
                                    />
                                </div>
                            </Col>
                            <Col md={8}>
                                <h5 className="mb-3">{currentPart.name}</h5>
                                <div className="mb-3">
                                    <div className="part-info-row">
                                        <span className="part-info-label">Mã phụ tùng:</span>
                                        <span className="part-info-value">{currentPart.part_id}</span>
                                    </div>
                                    <div className="part-info-row">
                                        <span className="part-info-label">Mã lô:</span>
                                        <span className="part-info-value">{currentPart.part_warehouse_id}</span>
                                    </div>
                                    <div className="part-info-row">
                                        <span className="part-info-label">Số lượng tồn:</span>
                                        <span className="part-info-value">{currentPart.stock} {currentPart.unit}</span>
                                    </div>
                                    <div className="part-info-row">
                                        <span className="part-info-label">Giá nhập:</span>
                                        <span className="part-info-value">{formatCurrency(currentPart.import_price)}</span>
                                    </div>
                                    <div className="part-info-row">
                                        <span className="part-info-label">Nhà cung cấp:</span>
                                        <span className="part-info-value">{currentPart.supplier_name}</span>
                                    </div>
                                    <div className="part-info-row">
                                        <span className="part-info-label">Vị trí kệ:</span>
                                        <span className="part-info-value">{currentPart.location}</span>
                                    </div>
                                    <div className="part-info-row">
                                        <span className="part-info-label">Ngày nhập:</span>
                                        <span className="part-info-value">{formatDate(currentPart.import_date)}</span>
                                    </div>
                                </div>
                                <div className="stock-status mt-4">
                                    <h6>Tình trạng tồn kho:</h6>
                                    <div className="progress">
                                        <div 
                                            className={`progress-bar ${
                                                currentPart.stock > 30 ? 'bg-success' : 
                                                currentPart.stock > 10 ? 'bg-warning' : 'bg-danger'
                                            }`}
                                            role="progressbar" 
                                            style={{ width: `${Math.min((currentPart.stock / 50) * 100, 100)}%` }}
                                            aria-valuenow={currentPart.stock} 
                                            aria-valuemin="0" 
                                            aria-valuemax="50"
                                        ></div>
                                    </div>
                                    <small className="text-muted">
                                        {currentPart.stock} {currentPart.unit} (Mức đủ hàng: 50 {currentPart.unit})
                                    </small>
                                </div>
                            </Col>
                        </Row>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
                        Đóng
                    </Button>
                    <Button 
                        variant="success" 
                        onClick={() => {
                            setShowDetailModal(false);
                            handleShowReceiveModal(currentPart);
                        }}
                    >
                        <i className="bi bi-arrow-down-circle me-1"></i> Nhập kho
                    </Button>
                    <Button 
                        variant="danger" 
                        onClick={() => {
                            setShowDetailModal(false);
                            handleShowDistributeModal(currentPart);
                        }}
                        disabled={currentPart?.stock <= 0}
                    >
                        <i className="bi bi-arrow-up-circle me-1"></i> Xuất kho
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Receive Modal - Updated for correct batch terminology */}
            <Modal show={showReceiveModal} onHide={() => setShowReceiveModal(false)}>
                <Form noValidate validated={validated} onSubmit={handleReceiveSubmit}>
                    <Modal.Header closeButton>
                        <Modal.Title>Nhập kho phụ tùng</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {currentPart && (
                            <>
                                <div className="part-header mb-3">
                                    <h6>{currentPart.name}</h6>
                                    <p className="text-muted mb-0">Mã phụ tùng: {currentPart.part_id}</p>
                                    <p className="text-muted mb-0">Mã lô: {currentPart.part_warehouse_id}</p>
                                    <p className="text-muted mb-0">Tồn kho hiện tại: {currentPart.stock} {currentPart.unit}</p>
                                </div>
                                
                                <Form.Group className="mb-3">
                                    <Form.Label>Số lượng nhập *</Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="quantity"
                                        value={receiveForm.quantity}
                                        onChange={handleReceiveFormChange}
                                        min="1"
                                        required
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        Vui lòng nhập số lượng lớn hơn 0
                                    </Form.Control.Feedback>
                                </Form.Group>
                                
                                <Form.Group className="mb-3">
                                    <Form.Label>Giá nhập (VNĐ) *</Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="import_price"
                                        value={receiveForm.import_price}
                                        onChange={handleReceiveFormChange}
                                        min="1000"
                                        required
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        Vui lòng nhập giá hợp lệ
                                    </Form.Control.Feedback>
                                </Form.Group>
                                
                                <Form.Group className="mb-3">
                                    <Form.Label>Nhà cung cấp *</Form.Label>
                                    <Form.Select
                                        name="supplier_name"
                                        value={receiveForm.supplier_name}
                                        onChange={handleReceiveFormChange}
                                        required
                                    >
                                        <option value="">-- Chọn nhà cung cấp --</option>
                                        {suppliers.map((supplier, idx) => (
                                            <option key={idx} value={supplier}>{supplier}</option>
                                        ))}
                                    </Form.Select>
                                    <Form.Control.Feedback type="invalid">
                                        Vui lòng chọn nhà cung cấp
                                    </Form.Control.Feedback>
                                </Form.Group>
                                
                                <Form.Group className="mb-3">
                                    <Form.Label>Vị trí kệ</Form.Label>
                                    <Form.Select
                                        name="location"
                                        value={receiveForm.location || currentPart.location}
                                        onChange={handleReceiveFormChange}
                                        required
                                    >
                                        {locations.map((location, idx) => (
                                            <option key={idx} value={location}>{location}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                                
                                <Form.Group className="mb-3">
                                    <Form.Label>Ghi chú</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        name="notes"
                                        rows={3}
                                        value={receiveForm.notes}
                                        onChange={handleReceiveFormChange}
                                        placeholder="Nhập ghi chú nếu có..."
                                    />
                                </Form.Group>
                            </>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowReceiveModal(false)}>
                            Hủy
                        </Button>
                        <Button 
                            variant="success" 
                            type="submit"
                            disabled={localLoading}
                        >
                            {localLoading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                    Đang xử lý...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-arrow-down-circle me-1"></i> Xác nhận nhập kho
                                </>
                            )}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Distribute Modal - Updated for correct batch terminology */}
            <Modal show={showDistributeModal} onHide={() => setShowDistributeModal(false)}>
                <Form noValidate validated={validated} onSubmit={handleDistributeSubmit}>
                    <Modal.Header closeButton>
                        <Modal.Title>Xuất kho phụ tùng</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {currentPart && (
                            <>
                                <div className="part-header mb-3">
                                    <h6>{currentPart.name}</h6>
                                    <p className="text-muted mb-0">Mã phụ tùng: {currentPart.part_id}</p>
                                    <p className="text-muted mb-0">Mã lô: {currentPart.part_warehouse_id}</p>
                                    <p className="text-muted mb-0">Tồn kho hiện tại: {currentPart.stock} {currentPart.unit}</p>
                                </div>
                                
                                <Form.Group className="mb-3">
                                    <Form.Label>Số lượng xuất *</Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="quantity"
                                        value={distributeForm.quantity}
                                        onChange={handleDistributeFormChange}
                                        min="1"
                                        max={currentPart.stock}
                                        required
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {distributeForm.quantity > currentPart.stock 
                                            ? `Số lượng xuất không được vượt quá ${currentPart.stock}`
                                            : 'Vui lòng nhập số lượng lớn hơn 0'}
                                    </Form.Control.Feedback>
                                </Form.Group>
                                
                                <Form.Group className="mb-3">
                                    <Form.Label>Nơi xuất đến *</Form.Label>
                                    <Form.Select
                                        name="destination"
                                        value={distributeForm.destination}
                                        onChange={handleDistributeFormChange}
                                        required
                                    >
                                        <option value="">-- Chọn nơi xuất đến --</option>
                                        {destinations.map((dest, idx) => (
                                            <option key={idx} value={dest}>{dest}</option>
                                        ))}
                                    </Form.Select>
                                    <Form.Control.Feedback type="invalid">
                                        Vui lòng chọn nơi xuất đến
                                    </Form.Control.Feedback>
                                </Form.Group>
                                
                                <Form.Group className="mb-3">
                                    <Form.Label>Ghi chú</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        name="notes"
                                        rows={3}
                                        value={distributeForm.notes}
                                        onChange={handleDistributeFormChange}
                                        placeholder="Nhập ghi chú nếu có..."
                                    />
                                </Form.Group>
                            </>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowDistributeModal(false)}>
                            Hủy
                        </Button>
                        <Button 
                            variant="danger" 
                            type="submit"
                            disabled={localLoading || distributeForm.quantity > (currentPart?.stock || 0)}
                        >
                            {localLoading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                    Đang xử lý...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-arrow-up-circle me-1"></i> Xác nhận xuất kho
                                </>
                            )}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </>
    );
};

export default WarehouseManagement;
