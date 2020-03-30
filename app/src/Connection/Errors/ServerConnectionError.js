class ServerConnectionError extends Error {
  constructor(message, error) {
    super(message);


    this.name = "ServerConnectionError";
    this.error = error;
  }
}

export default ServerConnectionError;
