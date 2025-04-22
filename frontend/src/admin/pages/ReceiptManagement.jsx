import React, { useState, useEffect, useCallback, use } from 'react';
import { Card, Table, Button, Pagination, Modal, Form, Row, Col, InputGroup, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { debounce } from 'lodash';


import StatusBadge from '../components/StatusBadge';
import { useAppData } from '../contexts/AppDataContext';
import { customerService } from '../../services/api';

const ReceiptManagement = () => {
    // State quản lý danh sách đơn tiếp nhận
    const { getData, fetchAndStoreData, setData } = useAppData();
    const receiptsById = getData('receipts') || {};
    const receiptIds = getData('receiptsIds') || new Set();
    const customersById = getData('customers') || {};
    const motorcyclesById = getData('motorcycles') || {};
    // const [receiptsById, setReceiptsById] = useState({});
    // const [receiptIds, setReceiptIds] = useState([]);
    const [receptionsDisplay, setReceptionsDisplay] = useState({});
    const [filteredReceiptIds, setFilteredReceiptIds] = useState([]);

    //
    const [ currentCustomerWithMotorcycle, setCurrentCustomerWithMotorcycle ] = useState({});
    const [ customerNotFound, setCustomerNotFound ] = useState(false);
    const [ motorcyclesNotFound, setMotorcyclesNotFound ] = useState(false);

    // Loading state
    const [loading, setLoading] = useState(true);

    // State cho filter và phân trang
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        startDate: '',
        endDate: '',
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // State cho modal
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [currentReceipt, setCurrentReceipt] = useState(null);

    // State cho form tạo/chỉnh sửa
    const [formData, setFormData] = useState({
        customerName: '',
        phone: '',
        email: '',
        plateNumber: '',
        brand: '',
        motorcycleModel: '',
        initialCondition: '',
        note: '',
        isReturned: false,
        plateNumber: '',
    });
    const [validated, setValidated] = useState(false);

    
    // Load mock data khi component được mount
    useEffect(() => {
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
                updatedAt: receipt.updated_at
            };

            newReceiptIds.push(receipt.form_id);
        });

        // Cập nhật state
        // setReceiptsById(newReceiptsById);
        // setReceiptIds(newReceiptIds);
        // setData('receipts', newReceiptsById);
        // setReceptionsDisplay(newReceiptsById);

        const fetchData = async () => {

            setLoading(true);

            await fetchAndStoreData('receipts', customerService.reception.getAllReceptionists, 'form_id')
                .then(async response => {
                    const data = response.data;
                    const entries = await Promise.all(
                        Object.values(data).map(async (item) => {
                            const customerId = item.customer_id;
                            const motorcycleId = item.motocycle_id;

                            const [customer, motorcycle] = await Promise.all([
                                customersById[customerId] || (await customerService.customer.getCustomerById(customerId)).data,
                                motorcyclesById[motorcycleId] || (await customerService.motorcycle.getMotorcycleById(motorcycleId)).data
                            ]);
                            return [item.form_id, formatReciptData(item, customer, motorcycle)];
                        })
                    );
                    const newReceiptDisplay = Object.fromEntries(entries);
                    setReceptionsDisplay(newReceiptDisplay);
                    setLoading(false);
                });
            console.log(receptionsDisplay);
        }

        fetchData();


        // setFilteredReceiptIds(newReceiptIds);
        // setTotalPages(Math.ceil(newReceiptIds.length / 10));
    }, []);

    useEffect(() => {
        console.log('Loading state:', loading); // Log loading state để kiểm tra
        if (!loading) {
            console.log(receiptIds);
            setFilteredReceiptIds(Array.from(receiptIds));
            setTotalPages(Math.ceil(filteredReceiptIds / 10));
            console.log('total pages:', totalPages); // Log tổng số trang để kiểm tra
            console.log('Receptions display:', receptionsDisplay); // Log dữ liệu tiếp nhận để kiểm tra
        }
    }, [loading]);

    // Hàm debounce để tìm kiếm khách hàng theo số điện thoại
    const debouncedFindCustomer = useCallback(
        debounce((phone) => {
            customerService.customer.getCustomerWithMotorcyclesByPhone(phone)
            .then(response => {
                const customer = response.data || response; // dữ liệu của khách có chứa danh sách xe
                if (customer && customer.fullname) {
                    setCurrentCustomerWithMotorcycle(customer);
                    setFormData(prev => ({
                        ...prev,
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
                    setCustomerNotFound(phone.length > 0); // chỉ báo khi đã nhập số
                }
            })
            .catch(error => {
                console.error('Lỗi khi tìm khách hàng với xe:', error);
                setFormData(prev => ({
                    ...prev,
                    customerName: '',
                    email: ''
                }));
                setCustomerNotFound(phone.length > 0); // chỉ báo khi đã nhập số
            });
        }, 1000),
        []
    );
    // Cleanup effect để hủy bỏ hàm debounce khi component unmount
    useEffect(() => {
        return () => {
            debouncedFindCustomer.cancel();
        };
    }, [debouncedFindCustomer]);

    const formatReciptData = (receipt, customer, motorcycle) => {
        const model = motorcycle.model;
        const brand = motorcycle.brand;
        return {
            id: receipt.form_id,
            customerName: customer.fullname,
            phone: customer.phone_num,
            plateNumber: motorcycle.license_plate,
            motorcycleModel: `${brand} ${model}`,
            // TODO: lỗi chính tả
            initialCondition: receipt.initial_conditon,
            note: receipt.note,
            isReturned: receipt.is_returned,
            createdAt: receipt.created_at,
            updatedAt: receipt.updated_at || ''
        };
    };


    // Xử lý tìm kiếm và lọc
    const handleApplyFilter = () => {
        let filtered = [...receiptIds];

        // Lọc theo từ khóa tìm kiếm
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            filtered = filtered.filter(id => {
                const receipt = receiptsById[id];
                return receipt.customerName.toLowerCase().includes(searchTerm) ||
                    receipt.phone.includes(searchTerm) ||
                    receipt.plateNumber.toLowerCase().includes(searchTerm) ||
                    receipt.motorcycleModel.toLowerCase().includes(searchTerm);
            });
        }

        // Lọc theo trạng thái
        if (filters.status) {
            filtered = filtered.filter(id => {
                if (filters.status === 'returned') {
                    return receiptsById[id].isReturned;
                } else {
                    return !receiptsById[id].isReturned;
                }
            });
        }

        // Lọc theo ngày
        if (filters.startDate) {
            filtered = filtered.filter(id => receiptsById[id].createdAt >= filters.startDate);
        }
        if (filters.endDate) {
            filtered = filtered.filter(id => receiptsById[id].createdAt <= filters.endDate);
        }

        setFilteredReceiptIds(filtered);
        setTotalPages(Math.ceil(filtered.length / 10));
        setCurrentPage(1);
    };

    // Xử lý thay đổi filter
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Xử lý reset filter
    const handleResetFilter = () => {
        setFilters({
            search: '',
            status: '',
            startDate: '',
            endDate: '',
        });
        setFilteredReceiptIds(Array.from(receiptIds));
        setTotalPages(Math.ceil(receiptIds.length / 10));
        setCurrentPage(1);
    };

    // TODO: Xử lý khi chọn biển số xe
    const handleSelectPlate = (e) => {    
        // const { value, name } = e.target;
        const plateNumber = e.target.value;
        setFormData(prev => ({
            ...prev,
            plateNumber
        }));
        console.log("plateNumber", plateNumber);

        // Tìm xe theo biển số và tự động điền brand/model
        const motorcycle = currentCustomerWithMotorcycle['motocycles'].find(m => m.license_plate === plateNumber);
        if (motorcycle) {
            setFormData(prev => ({
                ...prev,
                brand: motorcycle.brand || '',
                motorcycleModel: motorcycle.model || '',
                motocycleId: motorcycle.motocycle_id || '',
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                brand: '',
                motorcycleModel: '',
                motocycleId: '',
            }));
        }
    }

    // Phân trang
    const getCurrentItems = () => {
        const indexOfLastItem = currentPage * 10;
        const indexOfFirstItem = indexOfLastItem - 10;
        const a = filteredReceiptIds.slice(indexOfFirstItem, indexOfFirstItem + 10).map(id => receptionsDisplay[id]);
        // console.log('getCurrentItems', receptionsDisplay);
        return a;
    };

    // Xử lý modal xem chi tiết
    const handleShowDetailModal = (receipt) => {
        setCurrentReceipt(receipt);
        setShowDetailModal(true);
    };

    // Xử lý modal chỉnh sửa
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

    // Xử lý modal tạo mới
    const handleShowCreateModal = () => {
        setFormData({
            customerName: '',
            phone: '',
            email: '',
            plateNumber: '',
            brand: '',
            motorcycleModel: '',
            initialCondition: '',
            note: '',
            isReturned: false
        });
        setValidated(false);
        setShowCreateModal(true);
    };

    // Hàm lấy thông tin khách hàng theo số điện thoại
    const handlePhoneChange = (e) => {
        const phone = e.target.value;
        setFormData(prev => ({
            ...prev,
            phone
        }));
        debouncedFindCustomer(phone);

        // // Tìm khách hàng theo số điện thoại
        // const customer = Object.values(customersById).find(c => c.phone_num === phone);
        // if (customer) {
        //     setFormData(prev => ({
        //         ...prev,
        //         customerName: customer.fullname || '',
        //         email: customer.email || ''
        //     }));
        //     setCustomerNotFound(false);
        // } else {
        //     setFormData(prev => ({
        //         ...prev,
        //         customerName: '',
        //         email: ''
        //     }));
        //     setCustomerNotFound(phone.length > 0); // chỉ báo khi đã nhập số
        // }
    };

    // Hàm lấy thông tin xe theo biển số
    // const handlePlateChange = (e) => {
    //     const plateNumber = e.target.value;
    //     setFormData(prev => ({
    //         ...prev,
    //         plateNumber
    //     }));
    // };

    // Xử lý thay đổi form
    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name === 'phone') {
            handlePhoneChange(e);
        } else if (name === 'plateNumber') {
            handleSelectPlate(e);
        } else {
            // console.log(name, value);
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };


    // Xử lý submit form chỉnh sửa
    const handleEditSubmit = (e) => {
        e.preventDefault();
        const form = e.currentTarget;

        if (form.checkValidity() === false) {
            e.stopPropagation();
            setValidated(true);
            return;
        }

        // Cập nhật dữ liệu
        const updatedReceipt = {
            ...currentReceipt,
            initialCondition: formData.initialCondition,
            note: formData.note,
            isReturned: formData.isReturned,
            updatedAt: new Date().toISOString().split('T')[0]
        };

        setReceptionsDisplay(prev => ({
            ...prev,
            [currentReceipt.id]: updatedReceipt
        }));


        setShowEditModal(false);
    };

    // Xử lý submit form tạo mới
    const handleCreateSubmit = (e) => {
        e.preventDefault();
        const form = e.currentTarget;

        if (form.checkValidity() === false) {
            e.stopPropagation();
            setValidated(true);
            return;
        }

        // Tạo ID mới
        const newId = `RN-${new Date().getFullYear()}-${String(receiptIds.length + 1).padStart(3, '0')}`;
        const today = new Date().toISOString().split('T')[0];

        // Tạo đơn mới
        const newReceipt = {
            id: newId,
            customerName: formData.customerName,
            phone: formData.phone,
            plateNumber: formData.plateNumber,
            motorcycleModel: formData.motorcycleModel,
            initialCondition: formData.initialCondition,
            note: formData.note,
            isReturned: formData.isReturned,
            createdAt: today,
            updatedAt: today
        };

        // Cập nhật state
        // setReceiptsById(prev => ({
        //     ...prev,
        //     [newId]: newReceipt
        // }));

        // setReceiptIds(prev => [...prev, newId]);
        setFilteredReceiptIds(prev => [...prev, newId]);
        setTotalPages(Math.ceil((filteredReceiptIds.length + 1) / 10));

        setShowCreateModal(false);
    };

    // Xử lý thay đổi trang
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

    return (
        <>
            {/* {loading && (
                <div className="text-center my-5">
                    <i className="bi bi-arrow-clockwise fs-1 text-muted"></i>
                    <p className="text-muted">Đang tải dữ liệu...</p>
                </div>
            )} */}
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
                                    <th>Thông tin khách hàng</th>
                                    <th>Thông tin xe</th>
                                    <th>Ngày tiếp nhận</th>
                                    <th>Trạng thái</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {getCurrentItems().map(receipt => (
                                    <tr key={receipt.id}>
                                        <td>{receipt.id}</td>
                                        <td>
                                            <div className="fw-semibold">{receipt.customerName}</div>
                                            <small className="text-muted">{receipt.phone}</small>
                                        </td>
                                        <td>
                                            <div>{receipt.motorcycleModel}</div>
                                            <small className="text-muted">{receipt.plateNumber}</small>
                                        </td>
                                        <td>{receipt.createdAt}</td>
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
                                                    variant="outline-primary"
                                                    size="sm"
                                                    onClick={() => handleShowEditModal(receipt)}
                                                    style={{ borderColor: '#d30000', color: '#d30000' }}
                                                    title="Chỉnh sửa"
                                                >
                                                    <i className="bi bi-pencil"></i>
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                                {filteredReceiptIds.length === 0 && (
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
                                    <p><strong>Ngày tiếp nhận:</strong> {currentReceipt.createdAt}</p>
                                    <p><strong>Cập nhật lần cuối:</strong> {currentReceipt.updatedAt}</p>
                                    <p>
                                        <strong>Trạng thái:</strong> <Badge bg={currentReceipt.isReturned ? "success" : "warning"}>
                                            {currentReceipt.isReturned ? "Đã trả khách" : "Đang sửa chữa"}
                                        </Badge>
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
                                    <p><strong>Loại xe:</strong> {currentReceipt.motorcycleModel}</p>
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
                                    <p className="mb-1"><strong>Xe:</strong> {currentReceipt.motorcycleModel} - {currentReceipt.plateNumber}</p>
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
            <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg">
                <Form noValidate validated={validated} onSubmit={handleCreateSubmit}>
                    <Modal.Header closeButton>
                        <Modal.Title>Tạo đơn tiếp nhận mới</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Row>
                            <Col md={6}>
                                <h6 className="mb-3">Thông tin khách hàng</h6>
                                <Form.Group className="mb-3">
                                    <Form.Label>Số điện thoại *</Form.Label>
                                    <Form.Control
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        pattern="^0[0-9]{9,10}$" // Số điện thoại Việt Nam bắt đầu bằng 0, 10-11 số
                                        onChange={handleFormChange}
                                        required
                                        maxLength={10}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        Vui lòng nhập số điện thoại hợp lệ
                                    </Form.Control.Feedback>
                                    {customerNotFound && (
                                        <div className="text-warning mt-1" style={{ fontSize: '0.95em' }}>
                                            Khách hàng chưa có tài khoản!
                                        </div>
                                    )}
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Họ và tên khách hàng *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="customerName"
                                        value={formData.customerName}
                                        onChange={handleFormChange}
                                        required
                                        readOnly={!customerNotFound} //{!customerNotFound && !formData.customerName}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        Vui lòng nhập họ tên khách hàng
                                    </Form.Control.Feedback>
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleFormChange}
                                        readOnly={!customerNotFound } // {!customerNotFound && !formData.email}
                                        // disabled={!customerNotFound } // {!customerNotFound && !formData.email}
                                        placeholder="Email khách hàng (nếu có)"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <h6 className="mb-3">Thông tin xe</h6>
                                <Form.Group className="mb-3">
                                    <Form.Label>Biển số xe *</Form.Label>
                                    {/* Nếu currentCustomerWithMotorcycle có motorcycles thì cho chọn, nếu không thì nhập */}
                                    {Array.isArray(currentCustomerWithMotorcycle['motocycles']) && currentCustomerWithMotorcycle['motocycles'].length > 0 ? (
                                        <Form.Select
                                            name="plateNumber"
                                            value={formData.plateNumber}
                                            onChange={handleFormChange}
                                            required
                                        >
                                            <option value="">-- Chọn biển số xe --</option>
                                            {currentCustomerWithMotorcycle['motocycles'].map(m => (
                                                <option key={m.motocycle_id} value={m.license_plate}>
                                                    {m.license_plate} 
                                                </option>
                                            ))} 
                                            <option value="__manual__">Nhập biển số mới...</option>
                                        </Form.Select>
                                    ) : (
                                        <Form.Control
                                            type="text"
                                            name="plateNumber"
                                            value={formData.plateNumber}
                                            onChange={handleFormChange}
                                            required
                                            disabled={!customerNotFound}
                                            placeholder="Ví dụ: 59X1-12345"
                                        />
                                    )}
                                    {/* Nếu chọn nhập biển số mới */}
                                    {Array.isArray(currentCustomerWithMotorcycle['motocycles']) && currentCustomerWithMotorcycle['motocycles'].length > 0 && formData.plateNumber === "__manual__" && (
                                        <Form.Control
                                            className="mt-2"
                                            type="text"
                                            name="plateNumberManual"
                                            value={formData.plateNumberManual || ""}
                                            onChange={handleFormChange}
                                            required
                                            placeholder="Nhập biển số mới"
                                        />
                                    )}
                                    <Form.Control.Feedback type="invalid">
                                        Vui lòng nhập biển số xe
                                    </Form.Control.Feedback>
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Hãng xe</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="brand"
                                        onChange={handleFormChange}
                                        value={formData.brand}
                                        readOnly={formData.plateNumber !== "__manual__"}
                                        required
                                        placeholder="Hãng xe (tự động điền nếu có)"
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Loại xe *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="motorcycleModel"
                                        value={formData.motorcycleModel}
                                        onChange={handleFormChange}
                                        readOnly={formData.plateNumber !== "__manual__"}
                                        required
                                        placeholder="Ví dụ: Honda Wave, Yamaha Exciter..."
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        Vui lòng nhập loại xe
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                        </Row>
                        <h6 className="mt-2 mb-3">Tình trạng & Ghi chú</h6>
                        <Form.Group className="mb-3">
                            <Form.Label>Tình trạng ban đầu *</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                name="initialCondition"
                                value={formData.initialCondition}
                                onChange={handleFormChange}
                                required
                                placeholder="Mô tả tình trạng của xe khi tiếp nhận"
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
                                placeholder="Nhập ghi chú nếu có"
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                            style={{ backgroundColor: '#d30000', borderColor: '#d30000' }}
                        >
                            Tạo đơn tiếp nhận
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </>
    );
};

export default ReceiptManagement;