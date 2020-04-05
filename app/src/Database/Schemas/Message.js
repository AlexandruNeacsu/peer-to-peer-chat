class Message {
  // TODO add properties and validations

  /**
   *
   * @param ownerId - User or group id
   */
  constructor(ownerId, text, datetime) {
    this.ownerId = ownerId; // TODO what type?
    this.text = text;
    this.datetime = datetime;
  }
}

export default Message;
