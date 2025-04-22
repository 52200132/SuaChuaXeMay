import BaseModel from './BaseModel';

export default class Invoice extends BaseModel {
  constructor(data = {}) {
    super(data);
  }

  /**
   * Get invoice ID
   */
  get id() {
    return this._data.invoice_id;
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
   * Check if invoice is paid
   */
  get isPaid() {
    return this._data.is_paid;
  }

  /**
   * Set paid status
   */
  set isPaid(value) {
    this._data.is_paid = value;
  }

  /**
   * Create an invoice object from API response
   * @param {Object} data - API data
   */
  static fromApiResponse(data) {
    return new Invoice({
      invoice_id: data.invoice_id,
      create_at: data.create_at,
      total_price: data.total_price,
      payment_method: data.payment_method,
      staff_id: data.staff_id,
      is_paid: data.is_paid
    });
  }
}
