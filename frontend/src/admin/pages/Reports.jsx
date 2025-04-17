import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Form, Button, Table } from 'react-bootstrap';
import StatCard from '../components/StatCard';

const Reports = () => {
    const [reportType, setReportType] = useState('daily');
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });
    
    const [reportData, setReportData] = useState({
        summary: {
            totalBookings: 0,
            completedServices: 0,
            revenue: 0,
            averageRating: 0
        },
        chartData: [],
        detailData: []
    });
    
    // Load report data
    useEffect(() => {
        generateReportData();
    }, [reportType, dateRange]);
    
    const generateReportData = () => {
        // In a real application, this would be an API call with the selected parameters
        
        // Generate mock data based on report type
        let mockChartData = [];
        let mockDetailData = [];
        let totalBookings = 0;
        let completedServices = 0;
        let totalRevenue = 0;
        
        // Generate dates based on report type
        const dates = [];
        const startDate = new Date(dateRange.startDate);
        const endDate = new Date(dateRange.endDate);
        
        if (reportType === 'daily') {
            // Daily report for current month
            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                dates.push(new Date(d));
            }
        } else if (reportType === 'weekly') {
            // Weekly report
            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 7)) {
                dates.push(new Date(d));
            }
        } else if (reportType === 'monthly') {
            // Monthly report
            const monthStart = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
            const monthEnd = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0);
            
            for (let d = new Date(monthStart); d <= monthEnd; d.setMonth(d.getMonth() + 1)) {
                dates.push(new Date(d));
            }
        }
        
        // Generate random data for each date
        dates.forEach((date, index) => {
            const bookings = Math.floor(Math.random() * 10) + 1;
            const completed = Math.floor(Math.random() * bookings);
            const revenue = completed * (Math.floor(Math.random() * 500000) + 100000);
            
            const formattedDate = date.toISOString().split('T')[0];
            const displayDate = reportType === 'monthly' 
                ? `Tháng ${date.getMonth() + 1}/${date.getFullYear()}`
                : reportType === 'weekly'
                ? `Tuần ${Math.ceil(date.getDate() / 7)} - Tháng ${date.getMonth() + 1}`
                : formattedDate;
            
            mockChartData.push({
                date: formattedDate,
                displayDate,
                bookings,
                completed,
                revenue
            });
            
            totalBookings += bookings;
            completedServices += completed;
            totalRevenue += revenue;
            
            // Generate details
            const services = ['Bảo dưỡng định kỳ', 'Sửa chữa động cơ', 'Thay thế phụ tùng', 'Sửa hệ thống điện', 'Vệ sinh xe'];
            
            services.forEach(service => {
                const serviceBookings = Math.floor(Math.random() * 3);
                if (serviceBookings > 0) {
                    const serviceRevenue = serviceBookings * (Math.floor(Math.random() * 300000) + 50000);
                    
                    mockDetailData.push({
                        date: formattedDate,
                        displayDate,
                        service,
                        bookings: serviceBookings,
                        revenue: serviceRevenue
                    });
                }
            });
        });
        
        // Sort detail data by date and then by service
        mockDetailData.sort((a, b) => {
            if (a.date === b.date) {
                return a.service.localeCompare(b.service);
            }
            return a.date.localeCompare(b.date);
        });
        
        // Update report data
        setReportData({
            summary: {
                totalBookings,
                completedServices,
                revenue: totalRevenue,
                averageRating: (Math.random() * 1) + 4 // Random rating between 4 and 5
            },
            chartData: mockChartData,
            detailData: mockDetailData
        });
    };
    
    const handleDateRangeChange = (e) => {
        const { name, value } = e.target;
        setDateRange(prev => ({
            ...prev,
            [name]: value
        }));
    };
    
    const handleReportTypeChange = (e) => {
        setReportType(e.target.value);
    };
    
    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };
    
    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="mb-0">Báo cáo & Thống kê</h5>
                <Button 
                    variant="outline-primary"
                    style={{ borderColor: '#d30000', color: '#d30000' }}
                    onClick={() => window.print()}
                >
                    <i className="bi bi-printer me-1"></i>
                    In báo cáo
                </Button>
            </div>
            
            <Card className="shadow-sm mb-4">
                <Card.Body>
                    <Row className="align-items-end g-3">
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label>Loại báo cáo</Form.Label>
                                <Form.Select
                                    value={reportType}
                                    onChange={handleReportTypeChange}
                                >
                                    <option value="daily">Theo ngày</option>
                                    <option value="weekly">Theo tuần</option>
                                    <option value="monthly">Theo tháng</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label>Từ ngày</Form.Label>
                                <Form.Control
                                    type="date"
                                    name="startDate"
                                    value={dateRange.startDate}
                                    onChange={handleDateRangeChange}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label>Đến ngày</Form.Label>
                                <Form.Control
                                    type="date"
                                    name="endDate"
                                    value={dateRange.endDate}
                                    onChange={handleDateRangeChange}
                                />
                            </Form.Group>
                        </Col>
                        <Col md="auto">
                            <Button 
                                variant="primary" 
                                onClick={generateReportData}
                                style={{ backgroundColor: '#d30000', borderColor: '#d30000' }}
                            >
                                <i className="bi bi-bar-chart-fill me-1"></i>
                                Tạo báo cáo
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
            
            <Row className="g-4 mb-4">
                <Col xl={3} md={6}>
                    <StatCard
                        title="Tổng đơn đặt lịch"
                        value={reportData.summary.totalBookings}
                        icon="bi-calendar-check"
                    />
                </Col>
                <Col xl={3} md={6}>
                    <StatCard
                        title="Dịch vụ đã hoàn thành"
                        value={reportData.summary.completedServices}
                        icon="bi-tools"
                        color="#198754"  // success green
                    />
                </Col>
                <Col xl={3} md={6}>
                    <StatCard
                        title="Tổng doanh thu"
                        value={formatCurrency(reportData.summary.revenue)}
                        icon="bi-currency-exchange"
                        color="#0d6efd"  // primary blue
                    />
                </Col>
                <Col xl={3} md={6}>
                    <StatCard
                        title="Đánh giá trung bình"
                        value={reportData.summary.averageRating.toFixed(1)}
                        icon="bi-star-fill"
                        color="#ffc107"  // warning yellow
                    />
                </Col>
            </Row>
            
            <Row className="mb-4">
                <Col>
                    <Card className="shadow-sm">
                        <Card.Header className="bg-white">
                            <h5 className="mb-0">
                                Biểu đồ doanh thu {reportType === 'daily' 
                                    ? 'theo ngày' 
                                    : reportType === 'weekly' 
                                        ? 'theo tuần' 
                                        : 'theo tháng'}
                            </h5>
                        </Card.Header>
                        <Card.Body>
                            <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <p className="text-muted mb-0">Biểu đồ doanh thu sẽ được hiển thị ở đây</p>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
            
            <Row className="mb-4">
                <Col lg={6}>
                    <Card className="shadow-sm h-100">
                        <Card.Header className="bg-white">
                            <h5 className="mb-0">Thống kê doanh thu theo thời gian</h5>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <div className="table-responsive">
                                <Table striped hover className="mb-0">
                                    <thead>
                                        <tr>
                                            <th>Thời gian</th>
                                            <th className="text-center">Số đơn</th>
                                            <th className="text-center">Đã hoàn thành</th>
                                            <th className="text-end">Doanh thu</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.chartData.map((item, index) => (
                                            <tr key={index}>
                                                <td>{item.displayDate}</td>
                                                <td className="text-center">{item.bookings}</td>
                                                <td className="text-center">{item.completed}</td>
                                                <td className="text-end">{formatCurrency(item.revenue)}</td>
                                            </tr>
                                        ))}
                                        
                                        {reportData.chartData.length === 0 && (
                                            <tr>
                                                <td colSpan="4" className="text-center py-4">
                                                    <div className="text-muted">Không có dữ liệu</div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                    <tfoot className="table-light">
                                        <tr>
                                            <th>Tổng cộng</th>
                                            <th className="text-center">{reportData.summary.totalBookings}</th>
                                            <th className="text-center">{reportData.summary.completedServices}</th>
                                            <th className="text-end">{formatCurrency(reportData.summary.revenue)}</th>
                                        </tr>
                                    </tfoot>
                                </Table>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                
                <Col lg={6}>
                    <Card className="shadow-sm h-100">
                        <Card.Header className="bg-white">
                            <h5 className="mb-0">Thống kê doanh thu theo dịch vụ</h5>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <div className="table-responsive">
                                <Table striped hover className="mb-0">
                                    <thead>
                                        <tr>
                                            <th>Dịch vụ</th>
                                            <th>Thời gian</th>
                                            <th className="text-center">Số đơn</th>
                                            <th className="text-end">Doanh thu</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.detailData.map((item, index) => (
                                            <tr key={index}>
                                                <td>{item.service}</td>
                                                <td>{item.displayDate}</td>
                                                <td className="text-center">{item.bookings}</td>
                                                <td className="text-end">{formatCurrency(item.revenue)}</td>
                                            </tr>
                                        ))}
                                        
                                        {reportData.detailData.length === 0 && (
                                            <tr>
                                                <td colSpan="4" className="text-center py-4">
                                                    <div className="text-muted">Không có dữ liệu</div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </Table>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
            
            <Card className="shadow-sm mb-4">
                <Card.Header className="bg-white">
                    <h5 className="mb-0">Dịch vụ phổ biến</h5>
                </Card.Header>
                <Card.Body>
                    <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <p className="text-muted mb-0">Biểu đồ thống kê dịch vụ phổ biến sẽ được hiển thị ở đây</p>
                    </div>
                </Card.Body>
            </Card>
        </>
    );
};

export default Reports;
