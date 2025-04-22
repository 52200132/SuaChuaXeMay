import BaseModel from './BaseModel';

export default class Motorcycle extends BaseModel {
    constructor(data = {}) {
        super(data);
    }

    /**
     * Get motorcycle ID
     */
    get id() {
        return this._data.motorcycle_id;
    }

    /**
     * Get motorcycle license plate
     */
    get licensePlate() {
        return this._data.license_plate;
    }

    /**
     * Set motorcycle license plate
     */
    set licensePlate(value) {
        this._data.license_plate = value;
    }

    /**
     * Get motorcycle model
     */
    get model() {
        return this._data.model;
    }

    /**
     * Set motorcycle model
     */
    set model(value) {
        this._data.model = value;
    }

    /**
     * Get motorcycle brand
     */
    get brand() {
        return this._data.brand;
    }

    /**
     * Set motorcycle brand
     */
    set brand(value) {
        this._data.brand = value;
    }

    /**
     * Get motorcycle type ID
     */
    get motorcycleTypeId() {
        return this._data.moto_type_id;
    }

    /**
     * Get customer ID
     */
    get customerId() {
        return this._data.customer_id;
    }

    /**
     * Create a motorcycle object from API response
     * @param {Object} data - API data
     */
    static fromApiResponse(data) {
        return new Motorcycle({
            motorcycle_id: data.motorcycle_id,
            license_plate: data.license_plate,
            model: data.model,
            brand: data.brand,
            moto_type_id: data.moto_type_id,
            customer_id: data.customer_id
        });
    }
}
