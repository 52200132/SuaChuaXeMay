import React from 'react';
import { Row, Col, Form, Button, InputGroup } from 'react-bootstrap';

const FilterBar = ({ filters, setFilters, onApplyFilter, filterOptions = [] }) => {
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleReset = () => {
        const resetFilters = Object.keys(filters).reduce((acc, key) => {
            acc[key] = '';
            return acc;
        }, {});
        setFilters(resetFilters);
        onApplyFilter(resetFilters);
    };

    return (
        <div className="filter-bar bg-white p-3 rounded shadow-sm mb-4">
            <Row className="align-items-end g-3">
                {/* Search input */}
                <Col md={3} sm={6}>
                    <Form.Group>
                        <Form.Label>Tìm kiếm</Form.Label>
                        <InputGroup>
                            <Form.Control
                                type="text"
                                placeholder="Tìm kiếm..."
                                name="search"
                                value={filters.search || ''}
                                onChange={handleChange}
                            />
                            <Button variant="outline-secondary">
                                <i className="bi bi-search"></i>
                            </Button>
                        </InputGroup>
                    </Form.Group>
                </Col>

                {/* Status filter */}
                {filterOptions.includes('status') && (
                    <Col md={2} sm={6}>
                        <Form.Group>
                            <Form.Label>Trạng thái</Form.Label>
                            <Form.Select
                                name="status"
                                value={filters.status || ''}
                                onChange={handleChange}
                            >
                                <option value="">Tất cả</option>
                                <option value="Chờ xác nhận">Chờ xác nhận</option>
                                <option value="Đã xác nhận">Đã xác nhận</option>
                                <option value="Đang thực hiện">Đang thực hiện</option>
                                <option value="Hoàn thành">Hoàn thành</option>
                                <option value="Đã hủy">Đã hủy</option>
                            </Form.Select>
                        </Form.Group>
                    </Col>
                )}

                {/* Date range filter */}
                {filterOptions.includes('dateRange') && (
                    <>
                        <Col md={2} sm={6}>
                            <Form.Group>
                                <Form.Label>Từ ngày</Form.Label>
                                <Form.Control
                                    type="date"
                                    name="startDate"
                                    value={filters.startDate || ''}
                                    onChange={handleChange}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={2} sm={6}>
                            <Form.Group>
                                <Form.Label>Đến ngày</Form.Label>
                                <Form.Control
                                    type="date"
                                    name="endDate"
                                    value={filters.endDate || ''}
                                    onChange={handleChange}
                                />
                            </Form.Group>
                        </Col>
                    </>
                )}

                {/* Service type filter */}
                {filterOptions.includes('service') && (
                    <Col md={2} sm={6}>
                        <Form.Group>
                            <Form.Label>Loại dịch vụ</Form.Label>
                            <Form.Select
                                name="service"
                                value={filters.service || ''}
                                onChange={handleChange}
                            >
                                <option value="">Tất cả</option>
                                <option value="Bảo dưỡng định kỳ">Bảo dưỡng định kỳ</option>
                                <option value="Sửa chữa động cơ">Sửa chữa động cơ</option>
                                <option value="Thay thế phụ tùng">Thay thế phụ tùng</option>
                                <option value="Sửa hệ thống điện">Sửa hệ thống điện</option>
                                <option value="Vệ sinh xe">Vệ sinh xe</option>
                                <option value="Sơn và làm đẹp xe">Sơn và làm đẹp xe</option>
                            </Form.Select>
                        </Form.Group>
                    </Col>
                )}

                {/* Filter action buttons */}
                <Col md="auto" className="ms-auto">
                    <div className="d-flex gap-2">
                        <Button 
                            variant="outline-secondary" 
                            onClick={handleReset}
                        >
                            <i className="bi bi-x-circle me-1"></i>
                            Xóa bộ lọc
                        </Button>
                        <Button 
                            variant="primary" 
                            onClick={() => onApplyFilter(filters)}
                            style={{ backgroundColor: '#d30000', borderColor: '#d30000' }}
                        >
                            <i className="bi bi-funnel me-1"></i>
                            Lọc
                        </Button>
                    </div>
                </Col>
            </Row>
        </div>
    );
};

export default FilterBar;
