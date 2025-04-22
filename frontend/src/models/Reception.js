import BaseModel from './BaseModel';

export default class Reception extends BaseModel {
  constructor(data = {}) {
    super(data);
  }

  /**
   * Get form ID
   */
  get id() {
    return this._data.form_id;
  }

  /**
   * Get creation date
   */
  get createAt() {
    return this._data.create_at;
  }

  /**
   * Get initial condition
   */
  get initialCondition() {
    return this._data.initial_condition;
  }

  /**
   * Set initial condition
   */
  set initialCondition(value) {
    this._data.initial_condition = value;
  }

  /**
   * Get note
   */
  get note() {
    return this._data.note;
  }

  /**
   * Set note
   */
  set note(value) {
    this._data.note = value;
  }

  /**
   * Check if motorcycle is returned
   */
  get isReturned() {
    return this._data.is_returned;
  }

  /**
   * Set returned status
   */
  set isReturned(value) {
    this._data.is_returned = value;
  }

  /**
   * Get staff ID
   */
  get staffId() {
    return this._data.staff_id;
  }

  /**
   * Get motorcycle ID
   */
  get motorcycleId() {
    return this._data.motorcycle_id;
  }

  /**
   * Create a reception object from API response
   * @param {Object} data - API data
   */
  static fromApiResponse(data) {
    return new Reception({
      form_id: data.form_id,
      create_at: data.create_at,
      initial_condition: data.initial_condition,
      note: data.note,
      is_returned: data.is_returned,
      staff_id: data.staff_id,
      motorcycle_id: data.motorcycle_id
    });
  }
}
