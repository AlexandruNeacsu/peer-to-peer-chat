class User {
  /**
   * @param {String }username
   * @param {Blob} avatar
   */
  constructor(id, username, avatar) {
    // TODO add validations
    this.id = id;
    this.username = username;
    this.avatar = avatar;
  }
}

export default User;
