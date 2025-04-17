import React, { useState } from 'react';

const Profile = () => {
    const [user, setUser] = useState({
        fullName: 'Nguyễn Văn A',
        email: 'admin@example.com',
        phone: '0123456789',
        role: 'Admin',
        joinDate: '01/01/2023',
    });

    const [isEditing, setIsEditing] = useState(false);

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
    };

    const handleSave = () => {
        // Here you would typically save the user data to your backend
        setIsEditing(false);
        // Display success message
        alert('Thông tin đã được cập nhật');
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setUser({
            ...user,
            [name]: value
        });
    };

    return (
        <div className="container mt-4">
            <div className="card">
                <div className="card-header bg-primary text-white">
                    <h4>Thông tin cá nhân</h4>
                </div>
                <div className="card-body">
                    <div className="row">
                        <div className="col-md-4 text-center mb-4">
                            <img
                                src="https://via.placeholder.com/200"
                                alt="Profile"
                                className="img-fluid rounded-circle mb-3"
                                style={{ maxWidth: '200px' }}
                            />
                            {!isEditing ? (
                                <button className="btn btn-outline-primary btn-sm">Thay đổi ảnh</button>
                            ) : null}
                        </div>

                        <div className="col-md-8">
                            <form>
                                <div className="mb-3">
                                    <label htmlFor="fullName" className="form-label">Họ và tên</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="fullName"
                                        name="fullName"
                                        value={user.fullName}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                    />
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="email" className="form-label">Email</label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        id="email"
                                        name="email"
                                        value={user.email}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                    />
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="phone" className="form-label">Số điện thoại</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="phone"
                                        name="phone"
                                        value={user.phone}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                    />
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="role" className="form-label">Vai trò</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="role"
                                        value={user.role}
                                        disabled
                                    />
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="joinDate" className="form-label">Ngày tham gia</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="joinDate"
                                        value={user.joinDate}
                                        disabled
                                    />
                                </div>

                                <div className="d-flex gap-2 justify-content-end mt-3">
                                    {!isEditing ? (
                                        <button
                                            type="button"
                                            className="btn btn-primary"
                                            onClick={handleEdit}
                                        >
                                            Chỉnh sửa
                                        </button>
                                    ) : (
                                        <>
                                            <button
                                                type="button"
                                                className="btn btn-success"
                                                onClick={handleSave}
                                            >
                                                Lưu thay đổi
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-secondary"
                                                onClick={handleCancel}
                                            >
                                                Hủy
                                            </button>
                                        </>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card mt-4">
                <div className="card-header bg-primary text-white">
                    <h4>Thay đổi mật khẩu</h4>
                </div>
                <div className="card-body">
                    <form>
                        <div className="mb-3">
                            <label htmlFor="currentPassword" className="form-label">Mật khẩu hiện tại</label>
                            <input type="password" className="form-control" id="currentPassword" />
                        </div>

                        <div className="mb-3">
                            <label htmlFor="newPassword" className="form-label">Mật khẩu mới</label>
                            <input type="password" className="form-control" id="newPassword" />
                        </div>

                        <div className="mb-3">
                            <label htmlFor="confirmPassword" className="form-label">Xác nhận mật khẩu mới</label>
                            <input type="password" className="form-control" id="confirmPassword" />
                        </div>

                        <div className="d-flex justify-content-end">
                            <button type="button" className="btn btn-primary">Cập nhật mật khẩu</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Profile;
