import BaseModel from './BaseModel';
import URLS from '../services/url';

export default class Customer extends BaseModel {
    constructor(data = {}) {
        super(data);
    }

    /**
     * Get customer ID
     */
    get id() {
        return this._data.customer_id;
    }

    /**
     * Get customer full name
     */
    get fullName() {
        return this._data.fullname;
    }

    /**
     * Set customer full name
     */
    set fullName(value) {
        this._data.fullname = value;
    }

    /**
     * Get customer phone number
     */
    get phone() {
        return this._data.phone_num;
    }

    /**
     * Set customer phone number
     */
    set phone(value) {
        this._data.phone_num = value;
    }

    /**
     * Get customer email
     */
    get email() {
        return this._data.email;
    }

    /**
     * Set customer email
     */
    set email(value) {
        this._data.email = value;
    }

    /**
     * Get is_guest status
     */
    get isGuest() {
        return this._data.is_guest;
    }

    /**
     * Get list of customer's motorcycles
     */
    get motorcycles() {
        return this._data.motorcycles || [];
    }

    /**
     * Create a customer object from API response
     * @param {Object} data - API data
     */
    static fromApiResponse(data) {
        return new Customer({
            customer_id: data.customer_id,
            fullname: data.fullname,
            phone_num: data.phone_num,
            email: data.email,
            is_guest: data.is_guest,
            // Don't include password for security reasons
        });
    }
}
