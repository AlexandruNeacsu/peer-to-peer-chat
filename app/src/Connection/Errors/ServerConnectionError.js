class ServerConnectionError extends Error {
  constructor(message, closeEvent) {
    super(message);


    this.name = "NotAuthenticatedError";
    this.closeEvent = closeEvent;
  }
}

export default ServerConnectionError;
