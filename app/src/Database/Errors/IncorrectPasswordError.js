class IncorrectPasswordError extends Error {
  constructor(message) {
    super(message);


    this.name = "IncorrectPasswordError";
  }
}

export default IncorrectPasswordError;
