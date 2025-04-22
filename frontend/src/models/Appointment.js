import BaseModel from './BaseModel';

export default class Appointment extends BaseModel {
    constructor(data = {}) {
        super(data);
        this._customer = null;
    }

    /**
     * Get appointment ID
     */
    get id() {
        return this._data.appointment_id;
    }

    /**
     * Get customer ID
     */
    get customerId() {
        return this._data.customer_id;
    }

    /**
     * Get service type ID
     */
    get serviceTypeId() {
        return this._data.service_type_id;
    }

    /**
     * Get appointment date
     */
    get appointmentDate() {
        return this._data.appointment_date;
    }

    /**
     * Set appointment date
     */
    set appointmentDate(value) {
        this._data.appointment_date = value;
    }

    /**
     * Get appointment status
     */
    get status() {
        return this._data.status;
    }

    /**
     * Set appointment status
     */
    set status(value) {
        this._data.status = value;
    }

    /**
     * Get appointment note
     */
    get note() {
        return this._data.note;
    }

    /**
     * Set appointment note
     */
    set note(value) {
        this._data.note = value;
    }

    /**
     * Get customer object
     */
    get customer() {
        return this._customer;
    }

    /**
     * Set customer object
     */
    set customer(value) {
        this._customer = value;
    }

    /**
     * Get formatted date (YYYY-MM-DD)
     */
    getFormattedDate() {
        if (!this._data.appointment_date) return '';
        return this._data.appointment_date.split('T')[0];
    }

    /**
     * Get formatted time (HH:MM)
     */
    getFormattedTime() {
        if (!this._data.appointment_date) return '';
        const timePart = this._data.appointment_date.split('T')[1];
        if (!timePart) return '';
        return timePart.substring(0, 5);
    }

    /**
     * Check if appointment is pending
     */
    isPending() {
        return this._data.status === 'pending';
    }

    /**
     * Check if appointment is confirmed
     */
    isConfirmed() {
        return this._data.status === 'confirmed';
    }

    /**
     * Check if appointment is cancelled
     */
    isCancelled() {
        return this._data.status === 'cancelled';
    }

    /**
     * Create an appointment object from API response
     * @param {Object} data - API data
     * @param {Customer} customer - Optional customer object
     */
    static fromApiResponse(data, customer = null) {
        const appointment = new Appointment({
            appointment_id: data.appointment_id,
            customer_id: data.customer_id,
            service_type_id: data.service_type_id,
            appointment_date: data.appointment_date,
            status: data.status,
            note: data.note,
            create_at: data.create_at
        });
        
        if (customer) {
            appointment.customer = customer;
        }
        
        return appointment;
    }
}
