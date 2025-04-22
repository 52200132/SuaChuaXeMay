import BaseModel from './BaseModel';

export default class Part extends BaseModel {
  constructor(data = {}) {
    super(data);
  }

  /**
   * Get part ID
   */
  get id() {
    return this._data.part_id;
  }

  /**
   * Get part name
   */
  get name() {
    return this._data.name;
  }

  /**
   * Set part name
   */
  set name(value) {
    this._data.name = value;
  }

  /**
   * Get part URL (image or info link)
   */
  get url() {
    return this._data.URL;
  }

  /**
   * Set part URL
   */
  set url(value) {
    this._data.URL = value;
  }

  /**
   * Get stock quantity
   */
  get stock() {
    return this._data.stock;
  }

  /**
   * Set stock quantity
   */
  set stock(value) {
    this._data.stock = value;
  }

  /**
   * Get part price
   */
  get price() {
    return this._data.price;
  }

  /**
   * Set part price
   */
  set price(value) {
    this._data.price = value;
  }

  /**
   * Get part unit
   */
  get unit() {
    return this._data.unit;
  }

  /**
   * Set part unit
   */
  set unit(value) {
    this._data.unit = value;
  }

  /**
   * Check if part is in stock
   */
  isInStock() {
    return this._data.stock > 0;
  }

  /**
   * Create a part object from API response
   * @param {Object} data - API data
   */
  static fromApiResponse(data) {
    return new Part({
      part_id: data.part_id,
      name: data.name,
      URL: data.URL,
      stock: data.stock,
      price: data.price,
      unit: data.unit
    });
  }
}
