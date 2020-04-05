class InvalidArgumentError extends Error {
  constructor(message, error) {
    super(message);


    this.name = "InvalidArgumentError";
    this.error = error;
  }
}

export default InvalidArgumentError;
