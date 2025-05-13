import { useState, useEffect, useCallback } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import { repairService } from '../../../../services/api';

const CreateNewModals = ({
    show,
    onHide,
    validated,
    handleCreateSubmit,
    formData,
    handleFormChange,
    customerNotFound,
    currentCustomerWithMotorcycle,
}) => {

    const [motoTypesByBrands, setMotoTypesByBrands] = useState({
        loading: false,
        selectedBrand: '',
    });
    const [motoBrands, setMotoBrands] = useState([]);

    useEffect(() => {
        const fetchMotoBrands = async () => {
            try {
                const response = await repairService.motocycleType.getAllBrands();
                setMotoBrands(response.data);
            } catch (error) {
                console.error("Lỗi khi lấy danh sách các hãng xe:", error);
            }
        };
        fetchMotoBrands();
    }, []);

    // useEffect(() => {
    //     console.log("Danh sách các loại xe theo hãng:", motoTypesByBrands);
    // }, [motoTypesByBrands]);

    const handleBrandChange =  (e) => {
        const selectedBrand = e.target.value;
        
        if (selectedBrand && !motoTypesByBrands[selectedBrand]) {
            setMotoTypesByBrands({ ...motoTypesByBrands, loading: true, selectedBrand: selectedBrand });
            repairService.motocycleType.getMotocycleTypesByBrand(selectedBrand)
                .then(response => {
                    console.log("Danh sách các loại xe theo hãng:", response.data);
                    setMotoTypesByBrands(prevState => ({
                        ...prevState,
                        [selectedBrand]: response.data,
                        loading: false,
                    }));
                })
                .catch(error => {
                    console.error("Lỗi khi lấy danh sách các loại xe theo hãng:", error);
                    setMotoTypesByBrands(prevState => ({ ...prevState, loading: false }));
                });
        } else if (selectedBrand) {
            setMotoTypesByBrands(prevState => ({ ...prevState, selectedBrand: selectedBrand }));
        } else {
            setMotoTypesByBrands(prevState => ({ ...prevState, selectedBrand: '' }));
        }
    }

    const renderBrands = () => {
        if (motoBrands.length === 0) {
            return <option value="">Đang tải...</option>;
        }
        
        return (
            <>
                <option value="">-- Chọn hãng xe --</option>
                {motoBrands.map(brand => (
                    <option key={brand} value={brand}>
                        {brand}
                    </option>
                ))}
            </>
        );
    }

    const renderModels = () => {
        console.log("Danh sách các loại xe theo hãng:", motoTypesByBrands);
        if (motoTypesByBrands.loading) {
            return <option value="">Đang tải...</option>;
        }

        if (motoTypesByBrands.selectedBrand && motoTypesByBrands[motoTypesByBrands.selectedBrand]) {
            return (
                <>
                    <option value="">-- Chọn loại xe --</option>
                    {motoTypesByBrands[motoTypesByBrands.selectedBrand].map(type => (
                        <option key={type.moto_type_id} value={type.moto_type_id}>
                            {type.model}
                        </option>))}
                </>
            );
        }

        return <option value="">Chọn hãng xe trước</option>;
    }

    const renderBrandSelectionAndModelSelection = () => {
        if (formData.plateNumber !== '__manual__') return null;
        return (
            <>
                <Form.Group className="mb-3">
                    <Form.Label>Hãng xe</Form.Label>
                    <Form.Select
                        name="brand"
                        value={formData.brand}
                        onChange={(e) => {
                            handleFormChange(e);
                            handleBrandChange(e);
                        }}
                        // disabled={!formData.phone}
                        required
                    >
                        {renderBrands()}
                    </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label>Loại xe *</Form.Label>
                    <Form.Select
                        name="motoTypeId"
                        value={formData.motoTypeId}
                        onChange={handleFormChange}
                        required
                    >
                        {renderModels()}
                    </Form.Select>
                </Form.Group>
            </>
        );
    }
    
    const renderBrandModelByPlateNumber = () => {
        const selectedMoto = formData.plateNumber !== '__manual__' && formData.plateNumber !== '';
        if (selectedMoto) {
            return (
                <>
                    <Form.Group className="mb-3">
                        <Form.Label>Hãng xe</Form.Label>
                        <Form.Control
                            type="text"
                            name="brand"
                            value={formData.brand}
                            readOnly
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Loại xe</Form.Label>
                        <Form.Control
                            type="text"
                            name="motoTypeId"
                            value={formData.model}
                            readOnly
                        />
                    </Form.Group>
                </>
            );
        }
        return null;
    }


    return (
        <Modal show={show} onHide={onHide} size="lg">
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
                                    pattern="^0[0-9]{9,10}$"
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
                                    readOnly={!customerNotFound}
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
                                    readOnly={!customerNotFound}
                                    placeholder="Email khách hàng (nếu có)"
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <h6 className="mb-3">Thông tin xe</h6>
                            <Form.Group className="mb-3">
                                <Form.Label>Biển số xe *</Form.Label>
                                {Array.isArray(currentCustomerWithMotorcycle.motocycles) && currentCustomerWithMotorcycle.motocycles.length > 0 ? (
                                    <Form.Select
                                        name="plateNumber"
                                        value={formData.plateNumber}
                                        onChange={handleFormChange}
                                        required
                                    >
                                        <option value="">-- Chọn biển số xe --</option>
                                        {currentCustomerWithMotorcycle.motocycles.map(m => (
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
                                        disabled={!formData.phone}
                                        placeholder="Ví dụ: 59X1-12345"
                                    />
                                )}
                                {Array.isArray(currentCustomerWithMotorcycle.motocycles) 
                                && currentCustomerWithMotorcycle.motocycles.length > 0 
                                && formData.plateNumber === "__manual__" && (
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
                            {renderBrandModelByPlateNumber()}
                            {renderBrandSelectionAndModelSelection()}
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
                    <Button variant="secondary" onClick={onHide}>
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
    );
};

export default CreateNewModals;