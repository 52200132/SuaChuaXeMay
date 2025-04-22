/**
 * Base model class that provides common functionality for all models
 */
export default class BaseModel {
    constructor(data = {}) {
        this._data = { ...data };
        this._originalData = { ...data };
        this._errors = {};
    }

    /**
     * Returns a copy of the current data
     */
    get data() {
        return { ...this._data };
    }

    /**
     * Checks if the model has been modified since initialization or last save
     */
    isModified() {
        return JSON.stringify(this._data) !== JSON.stringify(this._originalData);
    }

    /**
     * Resets the model data to its original state
     */
    reset() {
        this._data = { ...this._originalData };
        this._errors = {};
        return this;
    }

    /**
     * Updates the model with new data
     * @param {Object} data - New data to update the model
     */
    update(data) {
        this._data = {
            ...this._data,
            ...data
        };
        return this;
    }

    /**
     * Saves the current state as the original state
     */
    commit() {
        this._originalData = { ...this._data };
        return this;
    }

    /**
     * Set validation errors
     * @param {Object} errors - Validation errors
     */
    setErrors(errors) {
        this._errors = { ...errors };
        return this;
    }

    /**
     * Get validation errors
     */
    getErrors() {
        return { ...this._errors };
    }

    /**
     * Check if model has validation errors
     */
    hasErrors() {
        return Object.keys(this._errors).length > 0;
    }
}
