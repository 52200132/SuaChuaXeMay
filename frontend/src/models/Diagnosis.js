import BaseModel from './BaseModel';

export default class Diagnosis extends BaseModel {
  constructor(data = {}) {
    super(data);
  }

  /**
   * Get diagnosis ID
   */
  get id() {
    return this._data.diagnosis_id;
  }

  /**
   * Get problem description
   */
  get problem() {
    return this._data.problem;
  }

  /**
   * Set problem description
   */
  set problem(value) {
    this._data.problem = value;
  }

  /**
   * Get estimated cost
   */
  get estimatedCost() {
    return this._data.estimated_cost;
  }

  /**
   * Set estimated cost
   */
  set estimatedCost(value) {
    this._data.estimated_cost = value;
  }

  /**
   * Get order ID
   */
  get orderId() {
    return this._data.order_id;
  }

  /**
   * Get form ID
   */
  get formId() {
    return this._data.form_id;
  }

  /**
   * Create a diagnosis object from API response
   * @param {Object} data - API data
   */
  static fromApiResponse(data) {
    return new Diagnosis({
      diagnosis_id: data.diagnosis_id,
      problem: data.problem,
      estimated_cost: data.estimated_cost,
      order_id: data.order_id,
      form_id: data.form_id
    });
  }
}
