import React, { useState, useEffect, useCallback } from 'react';
import { Alert, Button, Spinner, Table, Modal, Row, Col, Pagination } from 'react-bootstrap';
import { useUserData } from '../contexts/UserDataContext';
import { formatDate, formatTime } from '../utils/formatters';
import StatusBadge from '../admin/components/StatusBadge';

const ReceptionFormList = () => {
    const { dataStore, loading, getIds, getData } = useUserData();
    const [showModal, setShowModal] = useState(false);
    const [currentReception, setCurrentReception] = useState(null);
    const [relatedMotorcycle, setRelatedMotorcycle] = useState(null);
    const [filter, setFilter] = useState('all'); // 'all', 'pending', 'processing', 'completed', 'cancelled'
    
    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const [totalPages, setTotalPages] = useState(1);
    const [filteredReceptionIds, setFilteredReceptionIds] = useState([]);
    
    const motorcycles = dataStore.motorcycles || {};
    const motorcyclesById = getData('motorcycles');
    const staffById = getData('staffs');
    const receptionsById = getData('receptions');

    useEffect(() => {
        if (loading.receptions === true) return;
        const ids = getIds('receptions');
        setFilteredReceptionIds(ids);
        setTotalPages(Math.ceil(ids.length / itemsPerPage));
    }, [loading, itemsPerPage, getIds]);

    
    const formatReceptionData = (reception, motorcycle, staff) => {
        const [createdDate, createdTime] = reception.created_at?.split('T') || [null, null];
        const [returnedDate, returnedTime] = reception.returned_at?.split('T') || [null, null];
        return {
            originalData: reception,
            formId: reception.form_id,
            createdDate,
            createdTime,
            returnedDate,
            returnedTime,
            isReturned: reception.is_returned,
            initialCondition: reception.initial_conditon || 'Không có thông tin',
            note: reception.note || '',

            staffName: staff?.fullname || 'Không có thông tin',

            plateNumber: motorcycle?.license_plate,
            brand: motorcycle?.brand,
            model: motorcycle?.model,
        };
    };


    // Handle page change
    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };
    
    // Create pagination items
    const renderPaginationItems = () => {
        let items = [];

        // Add Previous button
        items.push(
            <Pagination.Prev
                key="prev"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
            />
        );

        // Always show first page
        items.push(
            <Pagination.Item
                key={1}
                active={currentPage === 1}
                onClick={() => handlePageChange(1)}
            >
                1
            </Pagination.Item>
        );

        // Add ellipsis if needed
        if (currentPage > 3) {
            items.push(<Pagination.Ellipsis key="ellipsis-1" disabled />);
        }

        // Add pages around current page
        for (let page = Math.max(2, currentPage - 1); page <= Math.min(totalPages - 1, currentPage + 1); page++) {
            if (page === 1 || page === totalPages) continue; // Skip first and last page (handled separately)
            items.push(
                <Pagination.Item
                    key={page}
                    active={currentPage === page}
                    onClick={() => handlePageChange(page)}
                >
                    {page}
                </Pagination.Item>
            );
        }

        // Add ellipsis if needed
        if (currentPage < totalPages - 2 && totalPages > 3) {
            items.push(<Pagination.Ellipsis key="ellipsis-2" disabled />);
        }

        // Always show last page if there is more than one page
        if (totalPages > 1) {
            items.push(
                <Pagination.Item
                    key={totalPages}
                    active={currentPage === totalPages}
                    onClick={() => handlePageChange(totalPages)}
                >
                    {totalPages}
                </Pagination.Item>
            );
        }

        // Add Next button
        items.push(
            <Pagination.Next
                key="next"
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => handlePageChange(currentPage + 1)}
            />
        );

        return items;
    };

    // Hàm xử lý hiển thị chi tiết phiếu tiếp nhận
    const handleShowDetails = (reception) => {
        setCurrentReception(reception);
        setShowModal(true);
    };

    const getCurrentReceptions = useCallback(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const displayData = filteredReceptionIds.slice(startIndex, endIndex).map(id => {
            const reception = receptionsById[id];
            const motorcycle = motorcyclesById[reception.motocycle_id];
            const staff = staffById[reception.staff_id];
            return formatReceptionData(reception, motorcycle, staff);
        });
        return displayData;
    }, [receptionsById, motorcyclesById, staffById, currentPage, itemsPerPage, filteredReceptionIds]);

    return (
        <>
            {loading.receptions ? (
                <div className="text-center p-4">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-2">Đang tải dữ liệu phiếu tiếp nhận...</p>
                </div>
            ) : filteredReceptionIds.length === 0 ? (
                <Alert variant="info">
                    Bạn chưa có phiếu tiếp nhận nào.
                </Alert>
            ) : (
                <div className="reception-list">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h5 className="mb-0">Danh sách phiếu tiếp nhận của bạn</h5>
                    </div>
                    <Table responsive hover>
                        <thead>
                            <tr>
                                <th>Mã phiếu</th>
                                <th>Ngày tiếp nhận</th>
                                <th>Biển số xe</th>
                                <th>Trạng thái</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {getCurrentReceptions().map((reception) => {
                                // Tìm xe máy liên quan đến phiếu tiếp nhận
                                const motorcycle = Object.values(motorcycles).find(
                                    moto => moto.motocycle_id === reception.motocycle_id
                                );

                                return (
                                    <tr key={reception.formId}>
                                        <td>{reception.formId}</td>
                                        <td>
                                            {formatDate(reception.createdDate)}
                                            <br />
                                            <small className="text-muted">{formatTime(reception.createdTime)}</small>
                                        </td>
                                        <td>
                                            <span>{reception.brand + ' ' + reception.model}</span>
                                            <br />
                                            <small className="text-muted">{reception.plateNumber}</small>
                                        </td>
                                        <td>
                                            <StatusBadge status={reception.isReturned ? "Đã trả xe" : "Đang sửa chữa"} />
                                        </td>
                                        <td>
                                            <Button
                                                variant="outline-primary"
                                                size="sm"
                                                onClick={() => handleShowDetails(reception)}
                                            >
                                                <i className="bi bi-eye"></i>
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </Table>

                    {/* Pagination controls */}
                    <div className="d-flex justify-content-between align-items-center mt-3">
                        <div className="text-muted small">
                            Hiển thị {getCurrentReceptions().length} / {filteredReceptionIds.length} phiếu tiếp nhận
                        </div>
                        <div className="d-flex align-items-center">
                            <span className="me-3">
                                <select
                                    className="form-select form-select-sm"
                                    value={itemsPerPage}
                                    onChange={(e) => {
                                        setItemsPerPage(Number(e.target.value));
                                        setCurrentPage(1); // Reset to first page when changing items per page
                                    }}
                                >
                                    <option value={5}>5 mục</option>
                                    <option value={10}>10 mục</option>
                                    <option value={20}>20 mục</option>
                                </select>
                            </span>
                            <Pagination size="sm" className="mb-0">
                                {renderPaginationItems()}
                            </Pagination>
                        </div>
                    </div>

                </div>
            )}

            {/* Modal hiển thị chi tiết phiếu tiếp nhận */}
            <Modal
                show={showModal}
                onHide={() => setShowModal(false)}
                size="md"
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>Chi tiết phiếu tiếp nhận #{currentReception?.formId}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {currentReception && (
                        <>
                            <div className="reception-detail mb-4">
                                <h5 className="border-bottom pb-2 mb-3">Thông tin phiếu tiếp nhận</h5>
                                <Row>
                                    <Col md={6}>
                                        <p><strong>Mã phiếu:</strong> {currentReception.formId}</p>
                                        <p><strong>Ngày tiếp nhận:</strong> {formatDate(currentReception.createdDate) + ' ' + formatTime(currentReception.createdTime)}</p>
                                        <p><strong>Ngày trả xe:</strong> {currentReception.isReturned ? formatDate(currentReception.returnedDate) + ' ' + formatTime(currentReception.returnedTime) : 'Chưa trả xe'}</p>
                                        <p>
                                            <strong>Trạng thái:</strong>{' '}
                                            <StatusBadge status={currentReception.isReturned ? "Đã trả xe" : "Đang sửa chữa"} />
                                        </p>
                                    </Col>
                                    <Col md={6}>
                                        <p><strong>Nhân viên tiếp nhận:</strong> {currentReception.staffName || 'Không có thông tin'}</p>
                                    </Col>
                                </Row>
                            </div>

                            <div className="motorcycle-detail mb-4">
                                <h5 className="border-bottom pb-2 mb-3">Thông tin xe máy</h5>
                                    <Row>
                                        <Col md={6}>
                                            <p><strong>Loại xe:</strong> {currentReception.brand + ' ' + currentReception.model}</p>
                                            <p><strong>Biển số:</strong> {currentReception.plateNumber}</p>
                                        </Col>
                                    </Row>
                            </div>

                            <div className="problem-detail">
                                <h5 className="border-bottom pb-2 mb-3">Mô tả vấn đề</h5>
                                <div className="bg-light p-3 rounded">
                                    <p className="mb-0">
                                        {currentReception.description || 'Không có mô tả vấn đề'}
                                    </p>
                                </div>
                            </div>

                            {currentReception.note && (
                                <div className="note-detail mt-4">
                                    <h5 className="border-bottom pb-2 mb-3">Ghi chú</h5>
                                    <div className="bg-light p-3 rounded">
                                        <p className="mb-0">
                                            {currentReception.note}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>
                        Đóng
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default ReceptionFormList;
