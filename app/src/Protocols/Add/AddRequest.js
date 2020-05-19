export default class AddRequest {
  /**
   *
   * @param id
   * @param username
   * @param sent
   */
  constructor(id, username, sent = false) {
    this.id = id;
    this.username = username;
    this.sent = sent;
  }
}
