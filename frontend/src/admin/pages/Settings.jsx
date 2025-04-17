import React from 'react';

const Settings = () => {
    return (
        <div className="container mt-4">
            <div className="card">
                <div className="card-header bg-primary text-white">
                    <h4>Cài đặt hệ thống</h4>
                </div>
                <div className="card-body">
                    <div className="row">
                        <div className="col-md-6">
                            <h5>Cài đặt chung</h5>
                            <div className="mb-3">
                                <label htmlFor="siteName" className="form-label">Tên cửa hàng</label>
                                <input type="text" className="form-control" id="siteName" placeholder="Cửa hàng sửa chữa xe máy" />
                            </div>
                            <div className="mb-3">
                                <label htmlFor="siteDescription" className="form-label">Mô tả cửa hàng</label>
                                <textarea className="form-control" id="siteDescription" rows="3" placeholder="Mô tả về cửa hàng của bạn"></textarea>
                            </div>
                        </div>

                        <div className="col-md-6">
                            <h5>Thông tin liên hệ</h5>
                            <div className="mb-3">
                                <label htmlFor="phone" className="form-label">Số điện thoại</label>
                                <input type="text" className="form-control" id="phone" placeholder="0123456789" />
                            </div>
                            <div className="mb-3">
                                <label htmlFor="email" className="form-label">Email</label>
                                <input type="email" className="form-control" id="email" placeholder="contact@example.com" />
                            </div>
                            <div className="mb-3">
                                <label htmlFor="address" className="form-label">Địa chỉ</label>
                                <textarea className="form-control" id="address" rows="3" placeholder="Địa chỉ cửa hàng"></textarea>
                            </div>
                        </div>
                    </div>

                    <div className="row mt-3">
                        <div className="col-md-12">
                            <h5>Cài đặt thời gian làm việc</h5>
                            <div className="row">
                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <label htmlFor="openTime" className="form-label">Giờ mở cửa</label>
                                        <input type="time" className="form-control" id="openTime" />
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <label htmlFor="closeTime" className="form-label">Giờ đóng cửa</label>
                                        <input type="time" className="form-control" id="closeTime" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="d-grid gap-2 d-md-flex justify-content-md-end mt-3">
                        <button className="btn btn-primary" type="button">Lưu thay đổi</button>
                        <button className="btn btn-secondary" type="button">Đặt lại</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
