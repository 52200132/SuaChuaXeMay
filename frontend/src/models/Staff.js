import BaseModel from './BaseModel';

export default class Staff extends BaseModel {
  constructor(data = {}) {
    super(data);
  }

  /**
   * Get staff ID
   */
  get id() {
    return this._data.staff_id;
  }

  /**
   * Get staff full name
   */
  get fullName() {
    return this._data.fullname;
  }

  /**
   * Set staff full name
   */
  set fullName(value) {
    this._data.fullname = value;
  }

  /**
   * Get staff role
   */
  get role() {
    return this._data.role;
  }

  /**
   * Set staff role
   */
  set role(value) {
    this._data.role = value;
  }

  /**
   * Get staff email
   */
  get email() {
    return this._data.email;
  }

  /**
   * Set staff email
   */
  set email(value) {
    this._data.email = value;
  }

  /**
   * Get staff status
   */
  get status() {
    return this._data.status;
  }

  /**
   * Set staff status
   */
  set status(value) {
    this._data.status = value;
  }

  /**
   * Check if staff is active
   */
  isActive() {
    return this._data.status === 'active';
  }

  /**
   * Check if staff is an admin or owner
   */
  isAdmin() {
    return ['admin', 'owner'].includes(this._data.role);
  }

  /**
   * Create a staff object from API response
   * @param {Object} data - API data
   */
  static fromApiResponse(data) {
    return new Staff({
      staff_id: data.staff_id,
      fullname: data.fullname,
      role: data.role,
      status: data.status,
      email: data.email,
      // Don't include password for security reasons
    });
  }
}
