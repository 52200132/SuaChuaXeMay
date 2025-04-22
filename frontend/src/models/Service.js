import BaseModel from './BaseModel';

export default class Service extends BaseModel {
  constructor(data = {}) {
    super(data);
  }

  /**
   * Get service ID
   */
  get id() {
    return this._data.service_id;
  }

  /**
   * Get service name
   */
  get name() {
    return this._data.name;
  }

  /**
   * Set service name
   */
  set name(value) {
    this._data.name = value;
  }

  /**
   * Get service type ID
   */
  get serviceTypeId() {
    return this._data.service_type_id;
  }

  /**
   * Get service price
   */
  get price() {
    return this._data.price;
  }

  /**
   * Set service price
   */
  set price(value) {
    this._data.price = value;
  }

  /**
   * Create a service object from API response
   * @param {Object} data - API data
   */
  static fromApiResponse(data) {
    return new Service({
      service_id: data.service_id,
      name: data.name,
      service_type_id: data.service_type_id,
      price: data.price
    });
  }
}
