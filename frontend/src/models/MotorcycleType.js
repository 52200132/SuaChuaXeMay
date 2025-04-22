import BaseModel from './BaseModel';

export default class MotorcycleType extends BaseModel {
  constructor(data = {}) {
    super(data);
  }

  /**
   * Get motorcycle type ID
   */
  get id() {
    return this._data.moto_type_id;
  }

  /**
   * Get motorcycle type name
   */
  get name() {
    return this._data.name;
  }

  /**
   * Set motorcycle type name
   */
  set name(value) {
    this._data.name = value;
  }

  /**
   * Create a motorcycle type object from API response
   * @param {Object} data - API data
   */
  static fromApiResponse(data) {
    return new MotorcycleType({
      moto_type_id: data.moto_type_id,
      name: data.name
    });
  }
}
