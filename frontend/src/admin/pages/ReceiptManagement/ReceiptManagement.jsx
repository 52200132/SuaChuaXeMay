import { useState, useEffect, useCallback, use } from 'react';
import { Card, Table, Button, Pagination, Modal, Form, Row, Col, InputGroup } from 'react-bootstrap';
import { debounce } from 'lodash';

import StatusBadge from '../../components/StatusBadge';
import { useAppData } from '../../contexts/AppDataContext';
import { useStaffAuth } from '../../contexts/StaffAuthContext';
import { customerService, repairService } from '../../../services/api';
import CreateNewModal from './Modals/CreateNewModals';

const ReceiptManagement = () => {
    // Context and data fetching
    const { getData, setData, setMultipleData, loading, getIds, dataStore } = useAppData();
    const { currentStaff } = useStaffAuth();
    
    // Data from app context
    const receptions = getData('receptions');
    const receptionsIds = getData('receptionsIds');
    const customersById = getData('customers');
    const motorcyclesById = getData('motorcycles');
    
    // Local state
    // const [receptionsDisplay, setReceptionsDisplay] = useState({});
    const [filteredreceptionsIds, setFilteredreceptionsIds] = useState([]);
    const [currentCustomerWithMotorcycle, setCurrentCustomerWithMotorcycle] = useState({});
    const [customerNotFound, setCustomerNotFound] = useState(false);
    const [localLoading, setLocalLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    
    // Modal states
    const [currentReceipt, setCurrentReceipt] = useState(null);
    
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [validated, setValidated] = useState(false);
    
    // Filter state
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        startDate: '',
        endDate: '',
    });
    
    // Form data
    const [formData, setFormData] = useState({
        customerName: '',
        phone: '',
        email: '',
        plateNumber: '',
        model: '',
        brand: '',
        model: '',
        initialCondition: '',
        note: '',
        isReturned: false,
        staffId: currentStaff.staff_id || '',
        customerId: '',
        motocycleId: '',
        motoTypeId: '',
    });

    // Format receipt data for display
    const formatReceiptData = (receipt, customer, motorcycle) => {
        const model = motorcycle?.model;
        const brand = motorcycle?.brand;
        const [createdAtDate, createdAtTime] = receipt.created_at.split('T');
        const [returnedAtDate, returnedAtTime] = receipt.returned_at ? receipt.returned_at.split('T') : [null, null];
        return {
            id: receipt.form_id,
            customerName: customer?.fullname,
            phone: customer?.phone_num,
            plateNumber: motorcycle?.license_plate,
            model: `${brand} ${model}`,
            initialCondition: receipt.initial_conditon, 
            note: receipt.note,
            isReturned: receipt.is_returned,
            createdAtDate: createdAtDate,
            createdAtTime: createdAtTime,
            returnedAt: returnedAtDate ? `${returnedAtDate} ${returnedAtTime}` : "Chưa trả",
        };
    };

    useEffect(() => {
        setLocalLoading(true);
        if (loading['receptions'] === true || loading['motorcycles'] === true || loading['customers'] === true) return;
        setLocalLoading(false);
    }, [loading]);

    useEffect(() => {
        setFilteredreceptionsIds(getIds('receptions'));
        handleApplyFilter();
        setTotalPages(Math.ceil(getIds('receptions').length / 10));
    }, [receptions, getIds]);

    // Find customer by phone (debounced)
    const debouncedFindCustomer = useCallback(
        debounce((phone) => {
            setFormData(prev => ({
                ...prev, brand: '', model: '',
            }));
            customerService.customer.getCustomerWithMotorcyclesByPhone(phone)
                .then(response => {
                    const customer = response.data || response;
                    if (customer && customer.fullname) {
                        setCurrentCustomerWithMotorcycle(customer);
                        setMultipleData('motorcycles', customer.motocycles, 'motocycle_id');
                        // setData('customers', customer, customer.customer_id);
                        setFormData(prev => ({
                            ...prev,
                            customerId: customer.customer_id || '',
                            customerName: customer.fullname || '',
                            email: customer.email || ''
                        }));
                        setCustomerNotFound(false);
                    } else {
                        setFormData(prev => ({
                            ...prev,
                            customerName: '',
                            email: ''
                        }));
                        setCustomerNotFound(phone.length > 0);
                    }
                })
                .catch(error => {
                    console.error('Lỗi khi tìm khách hàng với xe:', error);
                    setFormData(prev => ({
                        ...prev,
                        customerName: '',
                        email: ''
                    }));
                    setCurrentCustomerWithMotorcycle({});
                    setCustomerNotFound(phone.length > 0);
                });
        }, 500),
        []
    , []);

    // Reset customerId when customer not found
    useEffect(() => {
        if (customerNotFound) {
            setFormData(prevForm => ({
                ...prevForm,
                customerId: ''
            }));
        }
    }, [customerNotFound]);

    // Clean up debounce on unmount
    useEffect(() => {
        return () => {
            debouncedFindCustomer.cancel();
        };
    }, [debouncedFindCustomer]);

    // Filter handlers
    const handleApplyFilter = () => {
        console.log("Apply filter:", filters);
        let filtered = [...receptionsIds];

        const receptionsDisplay = filtered.reduce((acc, id) => {
            const receipt = formatReceiptData(
                receptions[id], 
                customersById[motorcyclesById[receptions[id].motocycle_id]?.customer_id], 
                motorcyclesById[receptions[id].motocycle_id]
            );
            acc[id] = receipt;
            return acc;
        }, {});
        // console.log("Filtered receptions:", receptionsDisplay);

        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            filtered = filtered.filter(id => {
                const receipt = receptionsDisplay[id];
                return receipt.customerName?.toLowerCase().includes(searchTerm) ||
                    receipt.phone?.includes(searchTerm) ||
                    receipt.plateNumber?.toLowerCase().includes(searchTerm) ||
                    receipt.model?.toLowerCase().includes(searchTerm);
            });
        }

        if (filters.status) {
            filtered = filtered.filter(id => {
                if (filters.status === 'returned') {
                    return receptionsDisplay[id].isReturned;
                } else {
                    return !receptionsDisplay[id].isReturned;
                }
            });
        }

        if (filters.startDate) {
            filtered = filtered.filter(id => receptionsDisplay[id].createdAtDate >= filters.startDate);
        }
        if (filters.endDate) {
            filtered = filtered.filter(id => receptionsDisplay[id].createdAtDate <= filters.endDate);
        }

        setFilteredreceptionsIds(filtered);
        setTotalPages(Math.ceil(filtered.length / 10));
        setCurrentPage(1);
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleResetFilter = () => {
        setFilters({
            search: '',
            status: '',
            startDate: '',
            endDate: '',
        });
        // setFilteredreceptionsIds(Array.from(receptionsIds));
        // setTotalPages(Math.ceil(receptionsIds.size / 10));
        // setCurrentPage(1);
    };

    // Form handlers
    const handlePhoneChange = (e) => {
        const phone = e.target.value;
        setFormData(prev => ({
            ...prev,
            phone
        }));
        debouncedFindCustomer(phone);
    };

    const handleSelectPlate = (e) => {    
        const plateNumber = e.target.value;
        setFormData(prev => ({
            ...prev, 
            plateNumber
        }));

        // Find motorcycle by plate number
        const motorcycle = currentCustomerWithMotorcycle.motocycles?.find(m => m.license_plate === plateNumber);
        if (motorcycle) {
            setFormData(prev => ({
                ...prev,
                brand: motorcycle.brand || '',
                model: motorcycle.model || '',
                motocycleId: motorcycle.motocycle_id || '',
                motoTypeId: motorcycle.moto_type_id || ''
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                brand: '',
                model: '',
                motocycleId: '',
                motoTypeId: ''
            }));
        }
    };

    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name === 'phone') {
            handlePhoneChange(e);
        } else if (name === 'plateNumber') {
            handleSelectPlate(e);
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };

    // Modal handlers
    const handleShowDetailModal = (receipt) => {
        setCurrentReceipt(receipt);
        setShowDetailModal(true);
    };

    const handleShowEditModal = (receipt) => {
        setCurrentReceipt(receipt);
        setFormData({
            initialCondition: receipt.initialCondition,
            note: receipt.note,
            isReturned: receipt.isReturned
        });
        setValidated(false);
        setShowEditModal(true);
    };

    // useEffect(() => {console.log(dataStore.receptionsIds)}, [dataStore.receptionsIds]);

    const handleShowCreateModal = () => {
        setFormData({
            customerName: '',
            phone: '',
            email: '',
            plateNumber: '',
            brand: '',
            model: '',
            initialCondition: '',
            note: '',
            isReturned: false,
            staffId: currentStaff.staff_id || '',
            customerId: '',
            motocycleId: '',
            motoTypeId: '',
        });
        setValidated(false);
        setShowCreateModal(true);
    };

    // Submit handlers
    const handleEditSubmit = async (e) => {
        e.preventDefault();
        const form = e.currentTarget;

        if (form.checkValidity() === false) {
            e.stopPropagation();
            setValidated(true);
            return;
        }

        setLocalLoading(true);

        try {
            await customerService.reception.updateReception(currentReceipt.id, {
                    note: formData.note,
                    initial_conditon: formData.initialCondition,
                });
            const response = await customerService.reception.updateReceptionReturn(currentReceipt.id, {
                    is_returned: formData.isReturned,
                });
            setData('receptions', response.data, currentReceipt.id);
            alert('Cập nhật đơn tiếp nhận thành công!');
            setShowEditModal(false);
        } catch (error) { 
            const errorMessage = error.response?.data?.detail || 'Cập nhật đơn thất bại. Vui lòng thử lại sau.';
            alert(errorMessage);
            console.error("Lỗi khi cập nhật đơn tiếp nhận:", errorMessage);
        } finally { 
            setLocalLoading(false);
        }
    };

    const createNewReceipt = async (formData) => {
        if (!formData.customerId && !formData.motocycleId) {
            return await customerService.reception.createReceptionWithoutMotorcycleIdAndCustomerId(formData);
        } else if (formData.customerId && !formData.motocycleId) {
            return await customerService.reception.createReceptionWithoutMotorcycleId(formData);
        } else if (formData.customerId && formData.motocycleId) {
            return await customerService.reception.createReception(formData);
        }
    };

    // useEffect(() => {console.log(dataStore.receptionsIds)}, [dataStore.receptionsIds]);

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        const form = e.currentTarget;

        if (form.checkValidity() === false) {
            e.stopPropagation();
            setValidated(true);
            return;
        }

        try {
            setLocalLoading(true);

            const response = await createNewReceipt(formData);
            const reception = response.data;

            // Create order and diagnosis
            repairService.order.createOrder({ motocycleId: reception.motocycle_id })
            .then(response => {
                const order = response.data;
                if (order.order_id) { 
                    return repairService.diagnosis.createDiagnosis(reception.form_id, order.order_id);
                } else { 
                    alert(`Tạo đơn hàng thất bại cho đơn tiếp nhận "${reception.form_id}"`);
                }
            })
            .then(response => {
                const diagnosisData = response.data;
                if (diagnosisData.diagnosis_id) {
                    alert(`Tạo thành công đơn hàng "${diagnosisData.order_id}" cho đơn tiếp nhận "${reception.form_id}"`);
                } else {
                    alert(`Tạo đơn hàng thất bại cho đơn tiếp nhận "${reception.form_id}"`);
                }
            });

            // Add new receipt to store
            dataStore['receptionsIds'] = new Set([reception.form_id.toString(), ...dataStore['receptionsIds']]);
            setData('receptions', reception, reception.form_id);

            // Get motorcycle and customer data if needed
            const moto = await (async () => {
                if (!motorcyclesById[reception.motocycle_id]) { 
                    const response = await customerService.motorcycle.getMotorcycleById(reception.motocycle_id);
                    setData('motorcycles', response.data, reception.motocycle_id);
                    return response.data;
                }
                return motorcyclesById[reception.motocycle_id];
            })();

            await (async () => {
                console.log("Moto:", moto);
                if (!customersById[moto.customer_id]) { 
                    const response = await customerService.customer.getCustomerById(moto.customer_id);
                    setData('customers', response.data, reception.customer_id);
                    return response.data;
                }
                return customersById[reception.customer_id];
            })();
            
            alert('Tạo đơn tiếp nhận thành công!');
        } catch (error) {
            const errorMessage = error.response?.data?.detail || 'Tạo đơn thất bại. Vui lòng thử lại sau.';
            alert(errorMessage);
            console.error("Lỗi khi tạo đơn tiếp nhận:", errorMessage);
        } finally {
            setLocalLoading(false);
            setShowCreateModal(false);
        }
    };

    // Pagination functions
    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const getCurrentItems = useCallback(() => {
        const indexOfLastItem = currentPage * 10;
        const indexOfFirstItem = indexOfLastItem - 10;
        const displayData =  filteredreceptionsIds.slice(indexOfFirstItem, indexOfLastItem).map(id => {
            const receipt = receptions[id];
            // console.log("Receipt:", receipt, motorcyclesById[receipt.motocycle_id]);
            return formatReceiptData(
                receipt, 
                customersById[motorcyclesById[receipt.motocycle_id]?.customer_id], 
                motorcyclesById[receipt.motocycle_id]
            );
        });
        // console.log(displayData);
        return displayData;
    }, [receptions, motorcyclesById, customersById, currentPage, filteredreceptionsIds]);

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

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="mb-0">Quản lý đơn tiếp nhận</h5>
                <Button
                    onClick={handleShowCreateModal}
                    style={{ backgroundColor: '#d30000', borderColor: '#d30000' }}
                >
                    <i className="bi bi-plus-circle me-1"></i>
                    Tạo đơn tiếp nhận mới
                </Button>
            </div>

            {/* Filter Section */}
            <Card className="shadow-sm mb-4">
                <Card.Body>
                    <Row className="g-3">
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Tìm kiếm</Form.Label>
                                <InputGroup>
                                    <Form.Control
                                        placeholder="Tìm kiếm theo tên, SĐT, biển số..."
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
                                <Form.Label>Trạng thái</Form.Label>
                                <Form.Select
                                    name="status"
                                    value={filters.status}
                                    onChange={handleFilterChange}
                                >
                                    <option value="">Tất cả</option>
                                    <option value="in-service">Đang sửa chữa</option>
                                    <option value="returned">Đã trả khách</option>
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

            {/* Table Section */}
            <Card className="shadow-sm mb-4">
                <Card.Body className="p-0">
                    <div className="table-responsive">
                        <Table hover className="mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>Mã đơn</th>
                                    <th>Khách hàng</th>
                                    <th>Thông tin xe</th>
                                    <th>Ngày tiếp nhận</th>
                                    <th>Trạng thái</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {localLoading ? (
                                    <tr>
                                        <td colSpan="6" className="text-center py-4">
                                            <div className="spinner-border text-primary" role="status">
                                                <span className="visually-hidden">Loading...</span>
                                            </div>
                                            <p className="mt-2 text-muted">Đang tải dữ liệu...</p>
                                        </td>
                                    </tr>
                                ) : (
                                    getCurrentItems().map(receipt => (
                                        <tr key={receipt.id}>
                                            <td>{receipt.id}</td>
                                            <td>
                                                <div className="fw-semibold">{receipt.customerName}</div>
                                                <small className="text-muted">{receipt.phone}</small>
                                            </td>
                                            <td>
                                                <div>{receipt.model}</div>
                                                <small className="text-muted">{receipt.plateNumber}</small>
                                            </td>
                                            <td>
                                                <div className="text-muted">{receipt.createdAtDate}</div>
                                                <small className="text-muted">{receipt.createdAtTime}</small>
                                            </td>
                                            <td>
                                                <StatusBadge status={receipt.isReturned ? "Đã trả khách" : "Đang sửa chữa"} />
                                            </td>
                                            <td>
                                                <div className="d-flex gap-2">
                                                    <Button
                                                        variant="outline-primary"
                                                        size="sm"
                                                        className="btn-icon"
                                                        onClick={() => handleShowDetailModal(receipt)}
                                                        title="Xem chi tiết"
                                                    >
                                                        <i className="bi bi-eye"></i>
                                                    </Button>
                                                    <Button
                                                        variant="outline-danger"
                                                        size="sm"
                                                        onClick={() => handleShowEditModal(receipt)}
                                                        title="Chỉnh sửa"
                                                    >
                                                        <i className="bi bi-pencil"></i>
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                                {!localLoading && filteredreceptionsIds.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="text-center py-4">
                                            <div className="text-muted">
                                                <i className="bi bi-inbox fs-4 d-block mb-2"></i>
                                                Không tìm thấy đơn tiếp nhận nào
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

            {/* Modal xem chi tiết */}
            <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Chi tiết đơn tiếp nhận</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {currentReceipt && (
                        <div>
                            <Row className="mb-4">
                                <Col md={6}>
                                    <h6 className="text-muted mb-3">Thông tin chung</h6>
                                    <p><strong>Mã đơn:</strong> {currentReceipt.id}</p>
                                    <p><strong>Ngày tiếp nhận:</strong> {`${currentReceipt.createdAtDate} ${currentReceipt.createdAtTime}`}</p>
                                    <p><strong>Thời gian trả xe:</strong> {currentReceipt.returnedAt}</p>
                                    <p>
                                        <strong>Trạng thái:</strong> <StatusBadge status={currentReceipt.isReturned ? "Đã trả khách" : "Đang sửa chữa"} />
                                    </p>
                                </Col>
                                <Col md={6}>
                                    <h6 className="text-muted mb-3">Thông tin khách hàng</h6>
                                    <p><strong>Họ tên:</strong> {currentReceipt.customerName}</p>
                                    <p><strong>Số điện thoại:</strong> {currentReceipt.phone}</p>
                                </Col>
                            </Row>

                            <Row className="mb-4">
                                <Col md={12}>
                                    <h6 className="text-muted mb-3">Thông tin xe</h6>
                                    <p><strong>Loại xe:</strong> {currentReceipt.model}</p>
                                    <p><strong>Biển số:</strong> {currentReceipt.plateNumber}</p>
                                </Col>
                            </Row>

                            <Row>
                                <Col md={12}>
                                    <h6 className="text-muted mb-3">Tình trạng & Ghi chú</h6>
                                    <div className="p-3 bg-light rounded mb-3">
                                        <h6>Tình trạng ban đầu:</h6>
                                        <p className="mb-0">{currentReceipt.initialCondition || "Không có thông tin"}</p>
                                    </div>
                                    <div className="p-3 bg-light rounded">
                                        <h6>Ghi chú:</h6>
                                        <p className="mb-0">{currentReceipt.note || "Không có ghi chú"}</p>
                                    </div>
                                </Col>
                            </Row>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
                        Đóng
                    </Button>
                    <Button
                        variant="primary"
                        style={{ backgroundColor: '#d30000', borderColor: '#d30000' }}
                        onClick={() => {
                            setShowDetailModal(false);
                            handleShowEditModal(currentReceipt);
                        }}
                    >
                        Chỉnh sửa
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Modal chỉnh sửa */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
                <Form noValidate validated={validated} onSubmit={handleEditSubmit}>
                    <Modal.Header closeButton>
                        <Modal.Title>Chỉnh sửa đơn tiếp nhận</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {currentReceipt && (
                            <>
                                <div className="mb-3">
                                    <p className="mb-1"><strong>Mã đơn:</strong> {currentReceipt.id}</p>
                                    <p className="mb-1"><strong>Khách hàng:</strong> {currentReceipt.customerName}</p>
                                    <p className="mb-1"><strong>Xe:</strong> {currentReceipt.model} - {currentReceipt.plateNumber}</p>
                                </div>

                                <Form.Group className="mb-3">
                                    <Form.Label>Tình trạng ban đầu</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        name="initialCondition"
                                        value={formData.initialCondition}
                                        onChange={handleFormChange}
                                        required
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        Vui lòng nhập tình trạng ban đầu của xe
                                    </Form.Control.Feedback>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Ghi chú</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        name="note"
                                        value={formData.note}
                                        onChange={handleFormChange}
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Check
                                        type="checkbox"
                                        id="isReturned"
                                        label="Đã trả xe cho khách"
                                        name="isReturned"
                                        checked={formData.isReturned}
                                        onChange={handleFormChange}
                                    />
                                </Form.Group>
                            </>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                            style={{ backgroundColor: '#d30000', borderColor: '#d30000' }}
                        >
                            Lưu thay đổi
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Modal tạo mới */}
            <CreateNewModal 
                show={showCreateModal}
                onHide={() => setShowCreateModal(false)}
                validated={validated}

                formData={formData}
                handleFormChange={handleFormChange}
                handleCreateSubmit={handleCreateSubmit}
                customerNotFound={customerNotFound}
                currentCustomerWithMotorcycle={currentCustomerWithMotorcycle}
            />
        </>
    );
};

export default ReceiptManagement;