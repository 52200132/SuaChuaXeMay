import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Pagination, Modal, Form, Row, Col, InputGroup, Badge, Image, Tabs, Tab } from 'react-bootstrap';
import { useAppData } from '../contexts/AppDataContext';
import { repairService } from '../../services/api';
import './WarehouseManagement.css';

const WarehouseManagement = () => {
    const { getData, getIds, setData, loading } = useAppData();
    
    // Get parts data from context
    const partsById = getData('parts') || {};
    const partsIds = getIds('parts') || [];

    // Get partsview data from context
    const partsviewById = getData('partsview') || {};
    const partsviewIds = getIds('partsview') || [];

    const suppliersById = getData('suppliers') || {};
    const suppliersIds = getIds('suppliers') || [];

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
    const [currentBatch, setCurrentBatch] = useState(null);
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

    // State for expanded rows
    const [expandedPartId, setExpandedPartId] = useState(null);
    
    // State for grouped parts
    const [groupedParts, setGroupedParts] = useState({});
    const [groupedPartsIds, setGroupedPartsIds] = useState([]);

    // State for tab management
    const [activeTab, setActiveTab] = useState('inventory');
    
    // State for local loading
    const [localLoading, setLocalLoading] = useState(false);
    const [validated, setValidated] = useState(false);

    // Locations and suppliers lists
    const locations = ['A1-01', 'A1-02', 'A2-01', 'B1-01', 'B2-01', 'C1-01'];
    // const suppliers = ['Nhà cung cấp A', 'Nhà cung cấp B', 'Nhà cung cấp C'];
    const suppliers = suppliersIds.map(id => suppliersById[id]?.name).filter(Boolean);
    const destinations = ['Phục vụ sửa chữa', 'Chuyển kệ khác', 'Xuất bán lẻ'];

    // Initialize data
    useEffect(() => {
        setLocalLoading(true);
        
        // Check if we're loading parts data
        if (loading['parts'] === true) return;
        
        // Check if we have partsview data
        if (Object.keys(partsviewById).length > 0) {
            console.log('Using partsview data from context:', partsviewById);
            
            // Convert partsviewById to array for processing
            const partsViewArray = Object.keys(partsviewById).map(id => partsviewById[id]);
            
            // Group parts by part_id
            const grouped = groupPartsByPartId(partsViewArray);
            setGroupedParts(grouped);
            setGroupedPartsIds(Object.keys(grouped));
            setFilteredPartsIds(Object.keys(grouped));
            setTotalPages(Math.ceil(Object.keys(grouped).length / itemsPerPage));
            setLocalLoading(false);
        } else {
            // If no data in context, fetch mock data
            console.log('No partsview data in context, using mock data');
            fetchParts();
        }
    }, [loading, partsviewById]);

    // Group parts by part_id
    const groupPartsByPartId = (partsArray) => {
        const grouped = {};
        
        partsArray.forEach(part => {
            if (!part || !part.part_id) return; // Skip invalid parts
            
            const partId = part.part_id.toString();
            
            if (!grouped[partId]) {
                grouped[partId] = {
                    part_id: part.part_id,
                    name: part.name,
                    unit: part.unit,
                    URL: part.URL,
                    batches: [],
                    totalStock: 0
                };
            }
            
            grouped[partId].batches.push(part);
            grouped[partId].totalStock += part.stock || 0;
        });
        
        return grouped;
    };

    // Mock function to fetch parts
    const fetchParts = async () => {
        try {
            // Mock data using the correct structure for batch inventory
            const mockParts = [
                {
                    "URL": "http://example.com/updated_part",
                    "import_date": null,
                    "import_price": 40000,
                    "location": "A1",
                    "name": "Bugi NGK CR7HSA",
                    "part_id": 1,
                    "part_warehouse_id": 2,
                    "quantity": 100,
                    "stock": 70,
                    "supplier_name": "NGK",
                    "unit": "cái"
                },
                {
                    "URL": null,
                    "import_date": null,
                    "import_price": 120000,
                    "location": "A3",
                    "name": "Bi nồi 18g Yamaha",
                    "part_id": 11,
                    "part_warehouse_id": 1,
                    "quantity": 50,
                    "stock": 40,
                    "supplier_name": "Yamaha",
                    "unit": "bộ"
                }
            ];
            
            // Store in partsview instead of parts
            mockParts.forEach(part => {
                setData('partsview', part, part.part_warehouse_id);
            });
            
            // Group parts by part_id
            const grouped = groupPartsByPartId(mockParts);
            setGroupedParts(grouped);
            setGroupedPartsIds(Object.keys(grouped));
            setFilteredPartsIds(Object.keys(grouped));
            setTotalPages(Math.ceil(Object.keys(grouped).length / itemsPerPage));
            setLocalLoading(false);
        } catch (error) {
            console.error("Error fetching parts data:", error);
            setLocalLoading(false);
        }
    };

    // Apply filters
    const handleApplyFilter = () => {
        let filtered = [...groupedPartsIds];
        
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            filtered = filtered.filter(id => {
                const part = groupedParts[id];
                return part.name.toLowerCase().includes(searchTerm) ||
                       part.part_id.toString().includes(searchTerm);
            });
        }
        
        // Location filter now checks all batches of a part
        if (filters.location) {
            filtered = filtered.filter(id => {
                const part = groupedParts[id];
                return part.batches.some(batch => batch.location === filters.location);
            });
        }
        
        // Supplier filter now checks all batches of a part
        if (filters.supplier) {
            filtered = filtered.filter(id => {
                const part = groupedParts[id];
                return part.batches.some(batch => batch.supplier_name === filters.supplier);
            });
        }
        
        if (filters.minStock) {
            filtered = filtered.filter(id => groupedParts[id].totalStock >= parseInt(filters.minStock));
        }
        
        if (filters.maxStock) {
            filtered = filtered.filter(id => groupedParts[id].totalStock <= parseInt(filters.maxStock));
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
        setFilteredPartsIds(groupedPartsIds);
        setTotalPages(Math.ceil(groupedPartsIds.length / itemsPerPage));
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
        return filteredPartsIds.slice(indexOfFirstItem, indexOfLastItem)
            .map(id => groupedParts[id])
            .filter(Boolean); // Remove undefined items
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
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('vi-VN');
    };

    // Toggle expanded row
    const toggleExpandedRow = (partId) => {
        setExpandedPartId(expandedPartId === partId ? null : partId);
    };
    
    // Show part detail modal
    const handleShowDetailModal = (part) => {
        setCurrentPart(part);
        setShowDetailModal(true);
    };
    
    // Show receive modal for a specific batch
    const handleShowReceiveModal = (part, batch = null) => {
        setCurrentPart(part);
        setCurrentBatch(batch);
        
        setReceiveForm({
            quantity: 0,
            import_price: batch ? batch.import_price : 0,
            supplier_name: batch ? batch.supplier_name : '',
            notes: '',
            location: batch ? batch.location : ''
        });
        
        setValidated(false);
        setShowReceiveModal(true);
    };
    
    // Show distribute modal for a specific batch
    const handleShowDistributeModal = (part, batch) => {
        if (!batch) return;
        
        setCurrentPart(part);
        setCurrentBatch(batch);
        
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
    
    // Hàm helper để làm mới dữ liệu phụ tùng và cập nhật state
    const refreshPartData = () => {
        // Lấy dữ liệu mới nhất từ context
        const freshPartsviewById = getData('partsview') || {};
        const partsViewArray = Object.keys(freshPartsviewById).map(id => freshPartsviewById[id]);
        
        // Nhóm phụ tùng theo part_id
        const grouped = groupPartsByPartId(partsViewArray);
        
        // Cập nhật state grouped parts
        setGroupedParts(grouped);
        const newGroupedIds = Object.keys(grouped);
        setGroupedPartsIds(newGroupedIds);
        
        // Áp dụng lại bộ lọc hiện tại
        let filtered = [...newGroupedIds];
        
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            filtered = filtered.filter(id => {
                const part = grouped[id];
                return part.name.toLowerCase().includes(searchTerm) ||
                       part.part_id.toString().includes(searchTerm);
            });
        }
        
        if (filters.location) {
            filtered = filtered.filter(id => {
                const part = grouped[id];
                return part.batches.some(batch => batch.location === filters.location);
            });
        }
        
        if (filters.supplier) {
            filtered = filtered.filter(id => {
                const part = grouped[id];
                return part.batches.some(batch => batch.supplier_name === filters.supplier);
            });
        }
        
        if (filters.minStock) {
            filtered = filtered.filter(id => grouped[id].totalStock >= parseInt(filters.minStock));
        }
        
        if (filters.maxStock) {
            filtered = filtered.filter(id => grouped[id].totalStock <= parseInt(filters.maxStock));
        }
        
        // Cập nhật state filtered và pagination
        setFilteredPartsIds(filtered);
        setTotalPages(Math.ceil(filtered.length / itemsPerPage));
    };

    // Handle receive submit
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
            
            // Nếu nhận cho một lô đã tồn tại
            if (currentBatch) {
                // Update batch in local store
                const updatedBatch = {
                    ...currentBatch,
                    stock: currentBatch.stock + receiveForm.quantity,
                    import_price: receiveForm.import_price,
                    import_date: new Date().toISOString(),
                    supplier_name: receiveForm.supplier_name,
                    location: receiveForm.location || currentBatch.location
                };
                
                // Update in partsview instead of parts
                setData('partsview', updatedBatch, currentBatch.part_warehouse_id);
            } else {
                // Create a new batch
                const newBatchId = Date.now(); // Generate a temporary ID
                const newBatch = {
                    URL: currentPart.URL,
                    part_id: currentPart.part_id,
                    part_warehouse_id: newBatchId,
                    name: currentPart.name,
                    unit: currentPart.unit,
                    stock: receiveForm.quantity,
                    quantity: receiveForm.quantity,
                    import_price: receiveForm.import_price,
                    import_date: new Date().toISOString(),
                    supplier_name: receiveForm.supplier_name,
                    location: receiveForm.location || ""
                };
                
                // Store in partsview instead of parts
                setData('partsview', newBatch, newBatchId);
            }
            
            // Làm mới dữ liệu phụ tùng và cập nhật giao diện
            refreshPartData();

            setShowReceiveModal(false);
            alert('Nhập kho thành công!');
        } catch (error) {
            console.error('Lỗi khi nhập kho:', error);
            alert('Có lỗi xảy ra khi nhập kho. Vui lòng thử lại!');
        } finally {
            setLocalLoading(false);
        }
    };
    
    // Handle distribute submit
    const handleDistributeSubmit = async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        
        if (form.checkValidity() === false || distributeForm.quantity > currentBatch.stock) {
            e.stopPropagation();
            setValidated(true);
            return;
        }
        
        try {
            setLocalLoading(true);
            
            // Update batch in local store
            const updatedBatch = {
                ...currentBatch,
                stock: currentBatch.stock - distributeForm.quantity
            };
            
            // Update in partsview instead of parts
            setData('partsview', updatedBatch, currentBatch.part_warehouse_id);
            
            // Làm mới dữ liệu phụ tùng và cập nhật giao diện
            refreshPartData();
            
            setShowDistributeModal(false);
            alert('Xuất kho thành công!');
        } catch (error) {
            console.error('Lỗi khi xuất kho:', error);
            alert('Có lỗi xảy ra khi xuất kho. Vui lòng thử lại!');
        } finally {
            setLocalLoading(false);
        }
    };

    // State for bulk receiving modal
    const [showBulkReceiveModal, setShowBulkReceiveModal] = useState(false);
    const [bulkReceiveForm, setBulkReceiveForm] = useState({
        supplier_name: '',
        notes: '',
        parts: []
    });
    const [availableParts, setAvailableParts] = useState([]);
    const [selectedParts, setSelectedParts] = useState([]);
    const [supplierFilteredParts, setSupplierFilteredParts] = useState([]); // State mới để lưu danh sách phụ tùng theo nhà cung cấp
    const [partSearchTerm, setPartSearchTerm] = useState(''); // State để lưu từ khóa tìm kiếm phụ tùng

    // Initialize available parts for bulk receiving (không thay đổi)
    useEffect(() => {
        if (Object.keys(partsById).length > 0) {
            const uniqueParts = Object.values(partsById).map(part => ({
                part_id: part.part_id,
                name: part.name,
                unit: part.unit,
                URL: part.URL,
                selected: false,
                quantity: 0,
                import_price: 0,
                location: ''
            }));
            setAvailableParts(uniqueParts);
        }
    }, [partsById]);
    
    // Show bulk receive modal
    const handleShowBulkReceiveModal = () => {
        setBulkReceiveForm({
            supplier_name: '',
            notes: '',
            parts: []
        });
        setSelectedParts([]);
        setSupplierFilteredParts([]); // Reset danh sách phụ tùng đã lọc theo nhà cung cấp
        setPartSearchTerm(''); // Reset từ khóa tìm kiếm
        setValidated(false);
        setShowBulkReceiveModal(true);
    };
    
    // Handle bulk supplier change
    const handleBulkSupplierChange = async (supplierName) => {
        setBulkReceiveForm(prev => ({
            ...prev,
            supplier_name: supplierName
        }));
        
        // Reset selected parts khi thay đổi nhà cung cấp
        setSelectedParts([]);
        setPartSearchTerm('');
        
        // Nếu đã chọn nhà cung cấp, lọc phụ tùng theo supplier_id
        if (supplierName) {
            const supplierId = suppliersIds.find(
                id => suppliersById[id]?.name === supplierName
            );
            
            if (supplierId) {
                try {
                    setLocalLoading(true);
                    // Gọi API để lấy phụ tùng theo nhà cung cấp
                    const response = await repairService.part.getPartBySupplierId(supplierId);
                    
                    if (response && response.data) {
                        // Cập nhật state với danh sách phụ tùng đã lọc
                        const formattedParts = response.data.map(part => ({
                            part_id: part.part_id,
                            name: part.name,
                            unit: part.unit,
                            URL: part.URL,
                            supplier_id: part.supplier_id,
                            selected: false,
                            quantity: 1,
                            import_price: part.price || 0,
                            location: ''
                        }));
                        setSupplierFilteredParts(formattedParts);
                    }
                } catch (error) {
                    console.error('Lỗi khi lấy phụ tùng theo nhà cung cấp:', error);
                    setSupplierFilteredParts([]);
                } finally {
                    setLocalLoading(false);
                }
            } else {
                setSupplierFilteredParts([]);
            }
        } else {
            // Nếu không chọn nhà cung cấp, xóa danh sách phụ tùng đã lọc
            setSupplierFilteredParts([]);
        }
    };
    
    // Handle part search
    const handlePartSearch = (e) => {
        setPartSearchTerm(e.target.value);
    };
    
    // Filter parts by search term
    const getFilteredPartsBySearch = () => {
        if (!partSearchTerm.trim()) return supplierFilteredParts;
        
        const searchTerm = partSearchTerm.toLowerCase();
        return supplierFilteredParts.filter(part => 
            part.name.toLowerCase().includes(searchTerm) || 
            part.part_id.toString().includes(searchTerm)
        );
    };
    
    // Handle part selection in bulk form
    const handlePartSelection = (partIndex, checked) => {
        // Sử dụng danh sách đã lọc theo nhà cung cấp thay vì availableParts
        const updatedParts = [...supplierFilteredParts];
        updatedParts[partIndex].selected = checked;
        setSupplierFilteredParts(updatedParts);
        
        // If checked, add to selected parts with default values
        if (checked) {
            const part = updatedParts[partIndex];
            const existingPriceFromBatches = 
                groupedParts[part.part_id]?.batches?.[0]?.import_price || part.import_price || 0;
            
            setSelectedParts(prev => [
                ...prev, 
                {
                    ...part,
                    quantity: 1,
                    import_price: existingPriceFromBatches,
                    location: ''
                }
            ]);
        } else {
            // If unchecked, remove from selected parts
            setSelectedParts(prev => 
                prev.filter(p => p.part_id !== updatedParts[partIndex].part_id)
            );
        }
    };
    
    // Handle changing values for selected parts
    const handleSelectedPartChange = (index, field, value) => {
        const updatedParts = [...selectedParts];
        
        // Handle numeric values
        if (field === 'quantity' || field === 'import_price') {
            updatedParts[index][field] = Number(value);
        } else {
            updatedParts[index][field] = value;
        }
        
        setSelectedParts(updatedParts);
    };
    
    // Handle bulk notes change
    const handleBulkNotesChange = (notes) => {
        setBulkReceiveForm(prev => ({
            ...prev,
            notes: notes
        }));
    };
    
    // Handle bulk receive submit
    const handleBulkReceiveSubmit = async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        
        // Validate all fields
        if (form.checkValidity() === false || 
            !bulkReceiveForm.supplier_name ||
            selectedParts.length === 0 ||
            selectedParts.some(part => !part.location || part.quantity <= 0 || part.import_price <= 0)) {
            e.stopPropagation();
            setValidated(true);
            return;
        }
        
        try {
            setLocalLoading(true);
            
            // Chuẩn bị dữ liệu để gửi lên server
            const supplierId = suppliersIds.find(
                id => suppliersById[id]?.name === bulkReceiveForm.supplier_name
            );

            const bulkReceiveData = {
                note: bulkReceiveForm.notes, // Đúng tên trường là "note"
                supplier_id: supplierId,
                parts: selectedParts.map(part => ({
                    part_id: part.part_id,
                    quantity: part.quantity,
                    price: part.import_price, // Đúng tên trường là "price"
                    location: part.location
                }))
            };
            
            // Gọi API để lưu vào CSDL
            console.log('bulkReceiveData:', bulkReceiveData);
            const result = await repairService.part.bulkReceive(bulkReceiveData);
            // bulkReceiveInventory(bulkReceiveData);
            
            if (result && result.success) {
                // Nếu thành công, cập nhật dữ liệu local từ kết quả trả về
                if (result.data && Array.isArray(result.data)) {
                    result.data.forEach(batch => {
                        // Cập nhật vào context
                        setData('partsview', batch, batch.part_warehouse_id);
                    });
                }
            }
            
            // Làm mới dữ liệu phụ tùng và cập nhật giao diện
            refreshPartData();
            
            setShowBulkReceiveModal(false);
            alert('Nhập kho hàng loạt thành công!');
            
            // Reset selections
            const resetAvailableParts = availableParts.map(part => ({
                ...part,
                selected: false
            }));
            setAvailableParts(resetAvailableParts);
            setSelectedParts([]);
            
        } catch (error) {
            console.error('Lỗi khi nhập kho hàng loạt:', error);
            alert('Có lỗi xảy ra khi nhập kho hàng loạt. Vui lòng thử lại!');
        } finally {
            setLocalLoading(false);
        }
    };
    
    // Remove part from selection
    const handleRemoveSelectedPart = (partId) => {
        // Remove from selected parts
        setSelectedParts(prev => prev.filter(p => p.part_id !== partId));
        
        // Update selection status in filtered parts
        setSupplierFilteredParts(prev => prev.map(p => 
            p.part_id === partId ? { ...p, selected: false } : p
        ));
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
                        className="me-2"
                    >
                        <i className="bi bi-plus-circle me-1"></i>
                        Thêm phụ tùng mới
                    </Button>
                    {/* Nút nhập kho hàng loạt */}
                    <Button
                        variant="success"
                        onClick={handleShowBulkReceiveModal}
                    >
                        <i className="bi bi-arrow-bar-down me-1"></i>
                        Nhập kho hàng loạt
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

                    {/* Table Section - Modified to show parts with expandable batches */}
                    <Card className="shadow-sm mb-4">
                        <Card.Body className="p-0">
                            <div className="table-responsive">
                                <Table hover className="mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th style={{ width: '70px' }}>Hình ảnh</th>
                                            <th>Mã PT</th>
                                            <th>Tên phụ tùng</th>
                                            <th>Tổng tồn kho</th>
                                            <th>Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {localLoading ? (
                                            <tr>
                                                <td colSpan="5" className="text-center py-4">
                                                    <div className="spinner-border text-primary" role="status">
                                                        <span className="visually-hidden">Loading...</span>
                                                    </div>
                                                    <p className="mt-2 text-muted">Đang tải dữ liệu...</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            getCurrentItems().map(part => (
                                                <React.Fragment key={part.part_id}>
                                                    <tr 
                                                        className={expandedPartId === part.part_id ? 'table-active' : ''}
                                                        onClick={() => toggleExpandedRow(part.part_id)}
                                                        style={{ cursor: 'pointer' }}
                                                    >
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
                                                        <td>
                                                            <div className="fw-semibold">{part.name}</div>
                                                            {/* <small className="text-muted">{part.unit}</small> */}
                                                        </td>
                                                        <td>
                                                            <div className="fw-semibold">{part.totalStock} {part.unit}</div>
                                                        </td>
                                                        <td>
                                                            <div className="d-flex gap-2">
                                                                <Button
                                                                    variant="outline-primary"
                                                                    size="sm"
                                                                    className="btn-icon"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleShowDetailModal(part);
                                                                    }}
                                                                    title="Xem chi tiết"
                                                                >
                                                                    <i className="bi bi-eye"></i>
                                                                </Button>
                                                                <Button
                                                                    variant="outline-success"
                                                                    size="sm"
                                                                    className="btn-icon"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleShowReceiveModal(part);
                                                                    }}
                                                                    title="Nhập kho mới"
                                                                >
                                                                    <i className="bi bi-arrow-down-circle"></i>
                                                                </Button>
                                                                <Button
                                                                    variant="outline-secondary"
                                                                    size="sm"
                                                                    className="btn-icon"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        toggleExpandedRow(part.part_id);
                                                                    }}
                                                                    title={expandedPartId === part.part_id ? "Thu gọn" : "Xem chi tiết lô"}
                                                                >
                                                                    <i className={`bi ${expandedPartId === part.part_id ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                    {expandedPartId === part.part_id && (
                                                        <tr className="expanded-lots">
                                                            <td colSpan="5" className="p-0">
                                                                <Table className="lot-table mb-0">
                                                                    <thead className="table-light">
                                                                        <tr>
                                                                            <th>Mã lô</th>
                                                                            <th>Số lượng</th>
                                                                            <th>Vị trí kệ</th>
                                                                            <th>Giá nhập</th>
                                                                            <th>Ngày nhập</th>
                                                                            <th>Nhà cung cấp</th>
                                                                            <th>Thao tác</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {part.batches.map(batch => (
                                                                            <tr key={batch.part_warehouse_id}>
                                                                                <td>{batch.part_warehouse_id}</td>
                                                                                <td>{batch.stock} {batch.unit}</td>
                                                                                <td>{batch.location}</td>
                                                                                <td>{formatCurrency(batch.import_price)}</td>
                                                                                <td>{formatDate(batch.import_date)}</td>
                                                                                <td>{batch.supplier_name}</td>
                                                                                <td>
                                                                                    <div className="d-flex gap-1">
                                                                                        {/* <Button
                                                                                            variant="outline-success"
                                                                                            size="sm"
                                                                                            className="btn-icon"
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                handleShowReceiveModal(part, batch);
                                                                                            }}
                                                                                            title="Nhập thêm vào lô"
                                                                                        >
                                                                                            <i className="bi bi-arrow-down-circle"></i>
                                                                                        </Button> */}
                                                                                        <Button
                                                                                            variant="outline-danger"
                                                                                            size="sm"
                                                                                            className="btn-icon"
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                handleShowDistributeModal(part, batch);
                                                                                            }}
                                                                                            title="Xuất kho lô này"
                                                                                            disabled={batch.stock <= 0}
                                                                                        >
                                                                                            <i className="bi bi-arrow-up-circle"></i>
                                                                                        </Button>
                                                                                    </div>
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </Table>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            ))
                                        )}

                                        {!localLoading && filteredPartsIds.length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="text-center py-4">
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

            {/* Part Detail Modal */}
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
                                        <span className="part-info-label">Đơn vị:</span>
                                        <span className="part-info-value">{currentPart.unit}</span>
                                    </div>
                                    <div className="part-info-row">
                                        <span className="part-info-label">Tổng số lượng tồn:</span>
                                        <span className="part-info-value">{currentPart.totalStock} {currentPart.unit}</span>
                                    </div>
                                    <div className="part-info-row">
                                        <span className="part-info-label">Số lô hàng:</span>
                                        <span className="part-info-value">{currentPart.batches?.length || 0} lô</span>
                                    </div>
                                </div>
                                <div className="stock-status mt-4">
                                    <h6>Chi tiết các lô hàng:</h6>
                                    <div className="table-responsive mt-2">
                                        <Table size="sm" className="lot-table">
                                            <thead>
                                                <tr>
                                                    <th>Mã lô</th>
                                                    <th>Số lượng</th>
                                                    <th>Vị trí</th>
                                                    <th>Giá nhập</th>
                                                    <th>Ngày nhập</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {currentPart.batches?.map(batch => (
                                                    <tr key={batch.part_warehouse_id}>
                                                        <td>{batch.part_warehouse_id}</td>
                                                        <td>{batch.stock} {batch.unit}</td>
                                                        <td>{batch.location}</td>
                                                        <td>{formatCurrency(batch.import_price)}</td>
                                                        <td>{formatDate(batch.import_date)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    </div>
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
                        <i className="bi bi-arrow-down-circle me-1"></i> Nhập kho mới
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Receive Modal */}
            <Modal show={showReceiveModal} onHide={() => setShowReceiveModal(false)}>
                <Form noValidate validated={validated} onSubmit={handleReceiveSubmit}>
                    <Modal.Header closeButton>
                        <Modal.Title>
                            {currentBatch ? 'Nhập thêm vào lô hàng' : 'Nhập kho phụ tùng mới'}
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {currentPart && (
                            <>
                                <div className="part-header mb-3">
                                    <h6>{currentPart.name}</h6>
                                    <p className="text-muted mb-0">Mã phụ tùng: {currentPart.part_id}</p>
                                    {currentBatch && (
                                        <>
                                            <p className="text-muted mb-0">Mã lô: {currentBatch.part_warehouse_id}</p>
                                            <p className="text-muted mb-0">Tồn kho hiện tại: {currentBatch.stock} {currentBatch.unit}</p>
                                        </>
                                    )}
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
                                        value={receiveForm.location || (currentBatch ? currentBatch.location : '')}
                                        onChange={handleReceiveFormChange}
                                        required
                                    >
                                        <option value="">-- Chọn vị trí kệ --</option>
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

            {/* Distribute Modal */}
            <Modal show={showDistributeModal} onHide={() => setShowDistributeModal(false)}>
                <Form noValidate validated={validated} onSubmit={handleDistributeSubmit}>
                    <Modal.Header closeButton>
                        <Modal.Title>Xuất kho phụ tùng</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {currentPart && currentBatch && (
                            <>
                                <div className="part-header mb-3">
                                    <h6>{currentPart.name}</h6>
                                    <p className="text-muted mb-0">Mã phụ tùng: {currentPart.part_id}</p>
                                    <p className="text-muted mb-0">Mã lô: {currentBatch.part_warehouse_id}</p>
                                    <p className="text-muted mb-0">Tồn kho hiện tại: {currentBatch.stock} {currentBatch.unit}</p>
                                    <p className="text-muted mb-0">Vị trí: {currentBatch.location}</p>
                                </div>
                                
                                <Form.Group className="mb-3">
                                    <Form.Label>Số lượng xuất *</Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="quantity"
                                        value={distributeForm.quantity}
                                        onChange={handleDistributeFormChange}
                                        min="1"
                                        max={currentBatch.stock}
                                        required
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {distributeForm.quantity > currentBatch.stock 
                                            ? `Số lượng xuất không được vượt quá ${currentBatch.stock}`
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
                            disabled={localLoading || distributeForm.quantity > (currentBatch?.stock || 0)}
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

            {/* Bulk Receive Modal */}
            <Modal show={showBulkReceiveModal} onHide={() => setShowBulkReceiveModal(false)} size="xl">
                <Form noValidate validated={validated} onSubmit={handleBulkReceiveSubmit}>
                    <Modal.Header closeButton>
                        <Modal.Title>Nhập kho hàng loạt</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Row className="mb-4">
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Nhà cung cấp *</Form.Label>
                                    <Form.Select
                                        name="supplier_name"
                                        value={bulkReceiveForm.supplier_name}
                                        onChange={(e) => handleBulkSupplierChange(e.target.value)}
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
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Ghi chú</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        name="notes"
                                        rows={1}
                                        value={bulkReceiveForm.notes}
                                        onChange={(e) => handleBulkNotesChange(e.target.value)}
                                        placeholder="Nhập ghi chú nếu có..."
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={5}>
                                <Card className="mb-3">
                                    <Card.Header className="bg-light">
                                        <div className="d-flex justify-content-between align-items-center">
                                            <strong>Danh sách phụ tùng</strong>
                                            <Form.Control
                                                type="text"
                                                placeholder="Tìm kiếm phụ tùng..."
                                                className="form-control-sm w-50"
                                                value={partSearchTerm}
                                                onChange={handlePartSearch}
                                                disabled={!bulkReceiveForm.supplier_name}
                                            />
                                        </div>
                                    </Card.Header>
                                    <div className="parts-selection-container">
                                        {!bulkReceiveForm.supplier_name ? (
                                            <div className="text-center p-4 text-muted">
                                                <i className="bi bi-exclamation-circle fs-3 d-block mb-2"></i>
                                                Vui lòng chọn nhà cung cấp trước để xem danh sách phụ tùng
                                            </div>
                                        ) : localLoading ? (
                                            <div className="text-center p-4">
                                                <div className="spinner-border text-primary" role="status">
                                                    <span className="visually-hidden">Đang tải...</span>
                                                </div>
                                                <p className="mt-2 text-muted">Đang tải danh sách phụ tùng...</p>
                                            </div>
                                        ) : getFilteredPartsBySearch().length > 0 ? (
                                            getFilteredPartsBySearch().map((part, index) => (
                                                <div 
                                                    key={part.part_id} 
                                                    className={`part-selection-item ${part.selected ? 'selected' : ''}`}
                                                >
                                                    <Form.Check 
                                                        type="checkbox"
                                                        id={`part-${part.part_id}`}
                                                        checked={part.selected}
                                                        onChange={(e) => handlePartSelection(index, e.target.checked)}
                                                        label={
                                                            <div className="d-flex align-items-center">
                                                                <Image 
                                                                    src={part.URL || "/images/parts/placeholder.jpg"}
                                                                    alt={part.name}
                                                                    width={30}
                                                                    height={30}
                                                                    className="me-2 part-thumbnail"
                                                                />
                                                                <div>
                                                                    <div className="fw-semibold">{part.name}</div>
                                                                    <small className="text-muted">Mã PT: {part.part_id}</small>
                                                                </div>
                                                            </div>
                                                        }
                                                    />
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center p-3 text-muted">
                                                {partSearchTerm ? 
                                                    'Không tìm thấy phụ tùng phù hợp' : 
                                                    'Không có phụ tùng của nhà cung cấp này'
                                                }
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            </Col>
                            <Col md={7}>
                                <Card>
                                    <Card.Header className="bg-light">
                                        <strong>Phụ tùng đã chọn ({selectedParts.length})</strong>
                                    </Card.Header>
                                    <div className="selected-parts-container">
                                        {selectedParts.length === 0 ? (
                                            <div className="text-center p-3 text-muted">
                                                Chưa chọn phụ tùng nào
                                            </div>
                                        ) : (
                                            <Table className="mb-0">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th>Phụ tùng</th>
                                                        <th style={{ width: '100px' }}>Số lượng</th>
                                                        <th style={{ width: '150px' }}>Giá nhập (VNĐ)</th>
                                                        <th style={{ width: '150px' }}>Vị trí kệ</th>
                                                        <th style={{ width: '60px' }}></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {selectedParts.map((part, index) => (
                                                        <tr key={part.part_id}>
                                                            <td>
                                                                <div className="d-flex align-items-center">
                                                                    <Image 
                                                                        src={part.URL || "/images/parts/placeholder.jpg"}
                                                                        alt={part.name}
                                                                        width={30}
                                                                        height={30}
                                                                        className="me-2 part-thumbnail"
                                                                    />
                                                                    <div>
                                                                        <div className="fw-semibold">{part.name}</div>
                                                                        <small className="text-muted">Mã PT: {part.part_id}</small>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <Form.Control
                                                                    type="number"
                                                                    size="sm"
                                                                    min="1"
                                                                    value={part.quantity}
                                                                    onChange={(e) => handleSelectedPartChange(index, 'quantity', e.target.value)}
                                                                    required
                                                                    isInvalid={validated && part.quantity <= 0}
                                                                />
                                                            </td>
                                                            <td>
                                                                <Form.Control
                                                                    type="number"
                                                                    size="sm"
                                                                    min="1000"
                                                                    value={part.import_price}
                                                                    onChange={(e) => handleSelectedPartChange(index, 'import_price', e.target.value)}
                                                                    required
                                                                    isInvalid={validated && part.import_price <= 0}
                                                                />
                                                            </td>
                                                            <td>
                                                                <Form.Select
                                                                    size="sm"
                                                                    value={part.location}
                                                                    onChange={(e) => handleSelectedPartChange(index, 'location', e.target.value)}
                                                                    required
                                                                    isInvalid={validated && !part.location}
                                                                >
                                                                    <option value="">Chọn vị trí</option>
                                                                    {locations.map((location, idx) => (
                                                                        <option key={idx} value={location}>{location}</option>
                                                                    ))}
                                                                </Form.Select>
                                                            </td>
                                                            <td>
                                                                <Button 
                                                                    variant="outline-danger"
                                                                    size="sm"
                                                                    className="btn-icon"
                                                                    onClick={() => handleRemoveSelectedPart(part.part_id)}
                                                                >
                                                                    <i className="bi bi-trash"></i>
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>
                                        )}
                                    </div>
                                </Card>
                                {selectedParts.length > 0 && (
                                    <div className="mt-3 text-end">
                                        <div className="mb-2">
                                            <strong>Tổng số phụ tùng:</strong> {selectedParts.length} loại
                                        </div>
                                        <div className="mb-2">
                                            <strong>Tổng số lượng:</strong> {selectedParts.reduce((sum, part) => sum + part.quantity, 0)} sản phẩm
                                        </div>
                                        <div>
                                            <strong>Tổng giá trị:</strong> {formatCurrency(selectedParts.reduce((sum, part) => sum + (part.quantity * part.import_price), 0))}
                                        </div>
                                    </div>
                                )}
                            </Col>
                        </Row>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowBulkReceiveModal(false)}>
                            Hủy
                        </Button>
                        <Button 
                            variant="success" 
                            type="submit"
                            disabled={localLoading || selectedParts.length === 0 || !bulkReceiveForm.supplier_name}
                        >
                            {localLoading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                    Đang xử lý...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-arrow-down-circle me-1"></i> Xác nhận nhập kho hàng loạt
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
