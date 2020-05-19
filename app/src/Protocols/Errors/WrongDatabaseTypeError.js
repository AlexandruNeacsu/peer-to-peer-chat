class WrongDatabaseTypeError extends Error {
  constructor(message) {
    super(message);


    this.name = "WrongDatabaseTypeError";
  }
}

export default WrongDatabaseTypeError;
