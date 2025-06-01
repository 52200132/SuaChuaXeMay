-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Máy chủ: 127.0.0.1
-- Thời gian đã tạo: Th5 10, 2025 lúc 05:39 PM
-- Phiên bản máy phục vụ: 10.4.32-MariaDB
-- Phiên bản PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Cơ sở dữ liệu: `databasecuahangsuaxe`
--

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `appointment`
--

CREATE TABLE `appointment` (
  `appointment_id` int(11) NOT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `service_type_id` int(11) DEFAULT NULL,
  `appointment_date` datetime DEFAULT NULL,
  `status` enum('pending','confirmed','cancelled') DEFAULT 'pending',
  `note` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Cấu trúc bảng cho bảng `customer`
--

CREATE TABLE `customer` (
  `customer_id` int(11) NOT NULL,
  `fullname` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `phone_num` varchar(10) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `is_guest` tinyint(1) DEFAULT 1,
  `password` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Cấu trúc bảng cho bảng `diagnosis`
--

CREATE TABLE `diagnosis` (
  `diagnosis_id` int(11) NOT NULL,
  `form_id` int(11) DEFAULT NULL,
  `problem` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `estimated_cost` int(11) DEFAULT NULL,
  `order_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Cấu trúc bảng cho bảng `invoice`
--

CREATE TABLE `invoice` (
  `invoice_id` int(11) NOT NULL,
  `order_id` int(11) DEFAULT NULL,
  `staff_id` int(11) DEFAULT NULL,
  `create_at` datetime DEFAULT NULL,
  `total_price` int(11) DEFAULT 0,
  `payment_method` varchar(50) DEFAULT NULL,
  `is_paid` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Cấu trúc bảng cho bảng `motocycle`
--

CREATE TABLE `motocycle` (
  `motocycle_id` int(11) NOT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `moto_type_id` int(11) DEFAULT NULL,
  `license_plate` varchar(20) NOT NULL,
  `brand` varchar(50) DEFAULT NULL,
  `model` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Cấu trúc bảng cho bảng `motocycletype`
--

CREATE TABLE `motocycletype` (
  `moto_type_id` int(11) NOT NULL,
  `name` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `motocycletype`
--

INSERT INTO `motocycletype` (`moto_type_id`, `name`) VALUES
(1, 'Xe Tay Ga'),
(2, 'Xe Số');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `order`
--

CREATE TABLE `order` (
  `order_id` int(11) NOT NULL,
  `motocycle_id` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `staff_id` int(11) DEFAULT NULL,
  `status` enum('received','checking','wait_confirm','cancelled','repairing','wait_delivery','delivered') DEFAULT 'received',
  `total_price` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Cấu trúc bảng cho bảng `orderstatushistory`
--

CREATE TABLE `orderstatushistory` (
  `history_id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `status` enum('received','checking','wait_confirm','cancelled','repairing','wait_delivery','delivered') NOT NULL,
  `changed_at` datetime DEFAULT current_timestamp(),
  `changed_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `part`
--

CREATE TABLE `part` (
  `part_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `URL` varchar(255) DEFAULT NULL,
  `unit` varchar(20) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `stock` int(11) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Cấu trúc bảng cho bảng `partmototype`
--

CREATE TABLE `partmototype` (
  `part_mototype_id` int(11) NOT NULL,
  `moto_type_id` int(11) DEFAULT NULL,
  `part_id` int(11) DEFAULT NULL,
  `price` int(11) NOT NULL CHECK (`price` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Cấu trúc bảng cho bảng `partorderdetail`
--

CREATE TABLE `partorderdetail` (
  `part_detail_ID` int(11) NOT NULL,
  `order_id` int(11) DEFAULT NULL,
  `part_id` int(11) DEFAULT NULL,
  `is_selected` tinyint(1) DEFAULT 0,
  `quantity` int(11) DEFAULT 1,
  `price` int(11) NOT NULL CHECK (`price` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Cấu trúc bảng cho bảng `receptionform`
--

CREATE TABLE `receptionform` (
  `form_id` int(11) NOT NULL,
  `motocycle_id` int(11) DEFAULT NULL,
  `staff_id` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `initial_conditon` varchar(255) DEFAULT NULL,
  `note` text DEFAULT NULL,
  `is_returned` tinyint(1) DEFAULT NULL,
  `returned_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Cấu trúc bảng cho bảng `receptionimage`
--

CREATE TABLE `receptionimage` (
  `img_id` int(11) NOT NULL,
  `form_id` int(11) DEFAULT NULL,
  `URL` varchar(255) DEFAULT NULL,
  `decription` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Cấu trúc bảng cho bảng `service`
--

CREATE TABLE `service` (
  `service_id` int(11) NOT NULL,
  `service_type_id` int(11) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `is_deleted` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Cấu trúc bảng cho bảng `servicemototype`
--

CREATE TABLE `servicemototype` (
  `service_mototype_id` int(11) NOT NULL,
  `moto_type_id` int(11) DEFAULT NULL,
  `service_id` int(11) DEFAULT NULL,
  `price` int(11) NOT NULL CHECK (`price` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Cấu trúc bảng cho bảng `serviceorderdetail`
--

CREATE TABLE `serviceorderdetail` (
  `service_detail_ID` int(11) NOT NULL,
  `order_id` int(11) DEFAULT NULL,
  `service_id` int(11) DEFAULT NULL,
  `is_selected` tinyint(1) DEFAULT 0,
  `price` int(11) NOT NULL CHECK (`price` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Cấu trúc bảng cho bảng `servicetype`
--

CREATE TABLE `servicetype` (
  `service_type_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `servicetype`
--

INSERT INTO `servicetype` (`service_type_id`, `name`) VALUES
(1, 'Bảo dưỡng'),
(2, 'Thay thế phụ tùng'),
(3, 'Sửa chữa');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `staff`
--

CREATE TABLE `staff` (
  `staff_id` int(11) NOT NULL,
  `fullname` varchar(255) NOT NULL,
  `role` enum('receptionist','technician','cashier','manager') NOT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `email` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `staff`
--

INSERT INTO `staff` (`staff_id`, `fullname`, `role`, `status`, `email`, `password`) VALUES
(1, 'Võ Văn Sáng', 'receptionist', 'active', 'sang.vo@gmail.com', '123'),
(2, 'Nguyen Thi Lan', 'receptionist', 'active', 'lan.nguyen@example.com', '123'),
(3, 'Tran Van Binh', 'receptionist', 'active', 'binh.tran@example.com', '123'),
(4, 'Le Huu Nghia', 'technician', 'active', 'nghia.le@example.com', '123'),
(5, 'Pham Quang Huy', 'technician', 'active', 'huy.pham@example.com', '123'),
(6, 'Doan Thi Thu', 'technician', 'active', 'thu.doan@example.com', '123'),
(7, 'Hoang Minh Tri', 'technician', 'active', 'tri.hoang@example.com', '123'),
(8, 'Nguyen Tien Dat', 'technician', 'active', 'dat.nguyen@example.com', '123'),
(9, 'Vo Thi Kim', 'cashier', 'active', 'kim.vo@example.com', '123'),
(10, 'Dang Van Son', 'manager', 'active', 'son.dang@example.com', '123'),
(11, 'Phùng Tấn Phước', 'manager', 'active', 'phuoc.phung@gmail.com', '123');

--
-- Chỉ mục cho các bảng đã đổ
--

--
-- Chỉ mục cho bảng `appointment`
--
ALTER TABLE `appointment`
  ADD PRIMARY KEY (`appointment_id`),
  ADD KEY `customer_id` (`customer_id`);

--
-- Chỉ mục cho bảng `customer`
--
ALTER TABLE `customer`
  ADD PRIMARY KEY (`customer_id`),
  ADD UNIQUE KEY `phone_num` (`phone_num`);

--
-- Chỉ mục cho bảng `diagnosis`
--
ALTER TABLE `diagnosis`
  ADD PRIMARY KEY (`diagnosis_id`),
  ADD KEY `form_id` (`form_id`),
  ADD KEY `fk_order_id` (`order_id`);

--
-- Chỉ mục cho bảng `invoice`
--
ALTER TABLE `invoice`
  ADD PRIMARY KEY (`invoice_id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `staff_id` (`staff_id`);

--
-- Chỉ mục cho bảng `motocycle`
--
ALTER TABLE `motocycle`
  ADD PRIMARY KEY (`motocycle_id`),
  ADD KEY `customer_id` (`customer_id`),
  ADD KEY `moto_type_id` (`moto_type_id`);

--
-- Chỉ mục cho bảng `motocycletype`
--
ALTER TABLE `motocycletype`
  ADD PRIMARY KEY (`moto_type_id`);

--
-- Chỉ mục cho bảng `order`
--
ALTER TABLE `order`
  ADD PRIMARY KEY (`order_id`),
  ADD KEY `staff_id` (`staff_id`),
  ADD KEY `fk_motocycle_id` (`motocycle_id`);

--
-- Chỉ mục cho bảng `orderstatushistory`
--
ALTER TABLE `orderstatushistory`
  ADD PRIMARY KEY (`history_id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `changed_by` (`changed_by`);

--
-- Chỉ mục cho bảng `part`
--
ALTER TABLE `part`
  ADD PRIMARY KEY (`part_id`);

--
-- Chỉ mục cho bảng `partmototype`
--
ALTER TABLE `partmototype`
  ADD PRIMARY KEY (`part_mototype_id`),
  ADD UNIQUE KEY `part_id` (`part_id`,`moto_type_id`),
  ADD UNIQUE KEY `part_id_2` (`part_id`,`moto_type_id`),
  ADD UNIQUE KEY `part_id_3` (`part_id`,`moto_type_id`),
  ADD UNIQUE KEY `part_id_4` (`part_id`,`moto_type_id`),
  ADD KEY `moto_type_id` (`moto_type_id`);

--
-- Chỉ mục cho bảng `partorderdetail`
--
ALTER TABLE `partorderdetail`
  ADD PRIMARY KEY (`part_detail_ID`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `part_id` (`part_id`);

--
-- Chỉ mục cho bảng `receptionform`
--
ALTER TABLE `receptionform`
  ADD PRIMARY KEY (`form_id`),
  ADD KEY `motocycle_id` (`motocycle_id`),
  ADD KEY `staff_id` (`staff_id`);

--
-- Chỉ mục cho bảng `receptionimage`
--
ALTER TABLE `receptionimage`
  ADD PRIMARY KEY (`img_id`),
  ADD KEY `form_id` (`form_id`);

--
-- Chỉ mục cho bảng `service`
--
ALTER TABLE `service`
  ADD PRIMARY KEY (`service_id`),
  ADD KEY `service_type_id` (`service_type_id`);

--
-- Chỉ mục cho bảng `servicemototype`
--
ALTER TABLE `servicemototype`
  ADD PRIMARY KEY (`service_mototype_id`),
  ADD UNIQUE KEY `service_id` (`service_id`,`moto_type_id`),
  ADD KEY `moto_type_id` (`moto_type_id`);

--
-- Chỉ mục cho bảng `serviceorderdetail`
--
ALTER TABLE `serviceorderdetail`
  ADD PRIMARY KEY (`service_detail_ID`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `service_id` (`service_id`);

--
-- Chỉ mục cho bảng `servicetype`
--
ALTER TABLE `servicetype`
  ADD PRIMARY KEY (`service_type_id`);

--
-- Chỉ mục cho bảng `staff`
--
ALTER TABLE `staff`
  ADD PRIMARY KEY (`staff_id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT cho các bảng đã đổ
--

--
-- AUTO_INCREMENT cho bảng `appointment`
--
ALTER TABLE `appointment`
  MODIFY `appointment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT cho bảng `customer`
--
ALTER TABLE `customer`
  MODIFY `customer_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- AUTO_INCREMENT cho bảng `diagnosis`
--
ALTER TABLE `diagnosis`
  MODIFY `diagnosis_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT cho bảng `invoice`
--
ALTER TABLE `invoice`
  MODIFY `invoice_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT cho bảng `motocycle`
--
ALTER TABLE `motocycle`
  MODIFY `motocycle_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=55;

--
-- AUTO_INCREMENT cho bảng `motocycletype`
--
ALTER TABLE `motocycletype`
  MODIFY `moto_type_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT cho bảng `order`
--
ALTER TABLE `order`
  MODIFY `order_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=58;

--
-- AUTO_INCREMENT cho bảng `orderstatushistory`
--
ALTER TABLE `orderstatushistory`
  MODIFY `history_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `part`
--
ALTER TABLE `part`
  MODIFY `part_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT cho bảng `partmototype`
--
ALTER TABLE `partmototype`
  MODIFY `part_mototype_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT cho bảng `partorderdetail`
--
ALTER TABLE `partorderdetail`
  MODIFY `part_detail_ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT cho bảng `receptionform`
--
ALTER TABLE `receptionform`
  MODIFY `form_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=48;

--
-- AUTO_INCREMENT cho bảng `receptionimage`
--
ALTER TABLE `receptionimage`
  MODIFY `img_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT cho bảng `service`
--
ALTER TABLE `service`
  MODIFY `service_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT cho bảng `servicemototype`
--
ALTER TABLE `servicemototype`
  MODIFY `service_mototype_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=44;

--
-- AUTO_INCREMENT cho bảng `serviceorderdetail`
--
ALTER TABLE `serviceorderdetail`
  MODIFY `service_detail_ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=50;

--
-- AUTO_INCREMENT cho bảng `servicetype`
--
ALTER TABLE `servicetype`
  MODIFY `service_type_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT cho bảng `staff`
--
ALTER TABLE `staff`
  MODIFY `staff_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- Các ràng buộc cho các bảng đã đổ
--

--
-- Các ràng buộc cho bảng `appointment`
--
ALTER TABLE `appointment`
  ADD CONSTRAINT `appointment_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customer` (`customer_id`);

--
-- Các ràng buộc cho bảng `diagnosis`
--
ALTER TABLE `diagnosis`
  ADD CONSTRAINT `diagnosis_ibfk_1` FOREIGN KEY (`form_id`) REFERENCES `receptionform` (`form_id`),
  ADD CONSTRAINT `fk_order_id` FOREIGN KEY (`order_id`) REFERENCES `order` (`order_id`);

--
-- Các ràng buộc cho bảng `invoice`
--
ALTER TABLE `invoice`
  ADD CONSTRAINT `invoice_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `order` (`order_id`),
  ADD CONSTRAINT `invoice_ibfk_2` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`staff_id`);

--
-- Các ràng buộc cho bảng `motocycle`
--
ALTER TABLE `motocycle`
  ADD CONSTRAINT `motocycle_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customer` (`customer_id`),
  ADD CONSTRAINT `motocycle_ibfk_2` FOREIGN KEY (`moto_type_id`) REFERENCES `motocycletype` (`moto_type_id`);

--
-- Các ràng buộc cho bảng `order`
--
ALTER TABLE `order`
  ADD CONSTRAINT `fk_motocycle_id` FOREIGN KEY (`motocycle_id`) REFERENCES `motocycle` (`motocycle_id`),
  ADD CONSTRAINT `order_ibfk_2` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`staff_id`);

--
-- Các ràng buộc cho bảng `orderstatushistory`
--
ALTER TABLE `orderstatushistory`
  ADD CONSTRAINT `orderstatushistory_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `order` (`order_id`),
  ADD CONSTRAINT `orderstatushistory_ibfk_2` FOREIGN KEY (`changed_by`) REFERENCES `staff` (`staff_id`);

--
-- Các ràng buộc cho bảng `partmototype`
--
ALTER TABLE `partmototype`
  ADD CONSTRAINT `partmototype_ibfk_1` FOREIGN KEY (`part_id`) REFERENCES `part` (`part_id`),
  ADD CONSTRAINT `partmototype_ibfk_2` FOREIGN KEY (`moto_type_id`) REFERENCES `motocycletype` (`moto_type_id`);

--
-- Các ràng buộc cho bảng `partorderdetail`
--
ALTER TABLE `partorderdetail`
  ADD CONSTRAINT `partorderdetail_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `order` (`order_id`),
  ADD CONSTRAINT `partorderdetail_ibfk_2` FOREIGN KEY (`part_id`) REFERENCES `part` (`part_id`);

--
-- Các ràng buộc cho bảng `receptionform`
--
ALTER TABLE `receptionform`
  ADD CONSTRAINT `receptionform_ibfk_1` FOREIGN KEY (`motocycle_id`) REFERENCES `motocycle` (`motocycle_id`),
  ADD CONSTRAINT `receptionform_ibfk_3` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`staff_id`);

--
-- Các ràng buộc cho bảng `receptionimage`
--
ALTER TABLE `receptionimage`
  ADD CONSTRAINT `receptionimage_ibfk_1` FOREIGN KEY (`form_id`) REFERENCES `receptionform` (`form_id`);

--
-- Các ràng buộc cho bảng `service`
--
ALTER TABLE `service`
  ADD CONSTRAINT `service_ibfk_1` FOREIGN KEY (`service_type_id`) REFERENCES `servicetype` (`service_type_id`);

--
-- Các ràng buộc cho bảng `servicemototype`
--
ALTER TABLE `servicemototype`
  ADD CONSTRAINT `servicemototype_ibfk_1` FOREIGN KEY (`service_id`) REFERENCES `service` (`service_id`),
  ADD CONSTRAINT `servicemototype_ibfk_2` FOREIGN KEY (`moto_type_id`) REFERENCES `motocycletype` (`moto_type_id`);

--
-- Các ràng buộc cho bảng `serviceorderdetail`
--
ALTER TABLE `serviceorderdetail`
  ADD CONSTRAINT `serviceorderdetail_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `order` (`order_id`),
  ADD CONSTRAINT `serviceorderdetail_ibfk_2` FOREIGN KEY (`service_id`) REFERENCES `service` (`service_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
