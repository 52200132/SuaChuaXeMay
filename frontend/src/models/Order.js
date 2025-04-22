import BaseModel from './BaseModel';

export default class Order extends BaseModel {
  constructor(data = {}) {
    super(data);
    // Initialize services and parts arrays if they don't exist
    this._data.services = this._data.services || [];
    this._data.parts = this._data.parts || [];
  }

  /**
   * Get order ID
   */
  get id() {
    return this._data.order_id;
  }

  /**
   * Get creation date
   */
  get createAt() {
    return this._data.create_at;
  }

  /**
   * Get total price
   */
  get totalPrice() {
    return this._data.total_price;
  }

  /**
   * Set total price
   */
  set totalPrice(value) {
    this._data.total_price = value;
  }

  /**
   * Get payment method
   */
  get paymentMethod() {
    return this._data.payment_method;
  }

  /**
   * Set payment method
   */
  set paymentMethod(value) {
    this._data.payment_method = value;
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
   * Get services list
   */
  get services() {
    return this._data.services || [];
  }

  /**
   * Add a service to the order
   * @param {Object} service - Service to add
   */
  addService(service) {
    if (!this._data.services) {
      this._data.services = [];
    }
    this._data.services.push(service);
    return this;
  }

  /**
   * Get parts list
   */
  get parts() {
    return this._data.parts || [];
  }

  /**
   * Add a part to the order
   * @param {Object} part - Part to add
   */
  addPart(part) {
    if (!this._data.parts) {
      this._data.parts = [];
    }
    this._data.parts.push(part);
    return this;
  }

  /**
   * Calculate total price from services and parts
   */
  calculateTotalPrice() {
    let total = 0;
    
    // Add up service prices
    if (this._data.services) {
      total += this._data.services.reduce((sum, service) => 
        sum + (parseFloat(service.price) || 0), 0);
    }
    
    // Add up part prices
    if (this._data.parts) {
      total += this._data.parts.reduce((sum, part) => 
        sum + (parseFloat(part.price) * (part.quantity || 1)), 0);
    }
    
    this._data.total_price = total;
    return total;
  }

  /**
   * Create an order object from API response
   * @param {Object} data - API data
   */
  static fromApiResponse(data) {
    return new Order({
      order_id: data.order_id,
      create_at: data.create_at,
      total_price: data.total_price,
      payment_method: data.payment_method,
      staff_id: data.staff_id,
      motorcycle_id: data.motorcycle_id,
      services: data.services || [],
      parts: data.parts || []
    });
  }
}
