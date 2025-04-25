import React from 'react';
import { Modal, Button } from 'react-bootstrap';

/**
 * A reusable modal component that can be customized with different content and actions.
 * 
 * @param {Object} props
 * @param {boolean} props.show - Controls whether the modal is visible
 * @param {function} props.onHide - Function to call when the modal is closed
 * @param {string} props.title - The title of the modal
 * @param {string|React.ReactNode} props.message - The message or content of the modal
 * @param {boolean} props.showConfirmButton - Whether to show the confirm button (default: true)
 * @param {string} props.confirmButtonText - The text for the confirm button (default: "Đồng ý")
 * @param {string} props.confirmButtonVariant - The Bootstrap variant for the confirm button (default: "primary")
 * @param {function} props.onConfirm - Function to call when the confirm button is clicked
 * @param {boolean} props.showCancelButton - Whether to show the cancel button (default: true)
 * @param {string} props.cancelButtonText - The text for the cancel button (default: "Hủy")
 * @param {string} props.cancelButtonVariant - The Bootstrap variant for the cancel button (default: "secondary")
 * @param {function} props.onCancel - Function to call when the cancel button is clicked (defaults to onHide)
 * @param {boolean} props.centered - Whether to center the modal vertically (default: true)
 * @param {string} props.size - The size of the modal (default: undefined, options: 'sm', 'lg', 'xl')
 * @param {boolean} props.backdrop - Whether to show a backdrop (default: true)
 * @param {boolean} props.keyboard - Whether to close the modal when escape key is pressed (default: true)
 */
const CustomModal = ({
    show,
    onHide,
    title,
    message,
    showConfirmButton = true,
    confirmButtonText = "Đồng ý",
    confirmButtonVariant = "primary",
    onConfirm,
    showCancelButton = true,
    cancelButtonText = "Hủy",
    cancelButtonVariant = "secondary",
    onCancel,
    centered = true,
    size,
    backdrop = true,
    keyboard = true,
}) => {
    const handleConfirm = () => {
        if (onConfirm) {
            onConfirm();
        }
        onHide();
    };

    const handleCancel = () => {
        if (onCancel) {
            onCancel();
        } else {
            onHide();
        }
    };

    return (
        <Modal
            show={show}
            onHide={onHide}
            centered={centered}
            size={size}
            backdrop={backdrop}
            keyboard={keyboard}
        >
            {title && (
                <Modal.Header closeButton>
                    <Modal.Title>{title}</Modal.Title>
                </Modal.Header>
            )}
            <Modal.Body>
                {typeof message === 'string' ? <p>{message}</p> : message}
            </Modal.Body>
            <Modal.Footer>
                {showCancelButton && (
                    <Button variant={cancelButtonVariant} onClick={handleCancel}>
                        {cancelButtonText}
                    </Button>
                )}
                {showConfirmButton && (
                    <Button variant={confirmButtonVariant} onClick={handleConfirm}>
                        {confirmButtonText}
                    </Button>
                )}
            </Modal.Footer>
        </Modal>
    );
};

export default CustomModal;
