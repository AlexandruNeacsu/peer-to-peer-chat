class User {
  /**
   * @param {String} id
   * @param {String }username
   */
  constructor(id, username) {
    // TODO add validations
    this.id = id;
    this.username = username;


    this.avatar = null;
  }

  get peerInfo() {
    return this._peerInfo;
  }

  /**
   * @param {PeerNode} node
   */
  set peerInfo(peerInfo) {
    this._peerInfo = peerInfo;
  }
}

export default User;
