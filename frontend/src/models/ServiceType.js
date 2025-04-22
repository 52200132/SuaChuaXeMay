import BaseModel from './BaseModel';

export default class ServiceType extends BaseModel {
  constructor(data = {}) {
    super(data);
  }

  /**
   * Get service type ID
   */
  get id() {
    return this._data.service_type_id;
  }

  /**
   * Get service type name
   */
  get name() {
    return this._data.name;
  }

  /**
   * Set service type name
   */
  set name(value) {
    this._data.name = value;
  }

  /**
   * Create a service type object from API response
   * @param {Object} data - API data
   */
  static fromApiResponse(data) {
    return new ServiceType({
      service_type_id: data.service_type_id,
      name: data.name
    });
  }
}
