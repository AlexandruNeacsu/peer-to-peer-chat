class DatabaseNotInitializedError extends Error {
  constructor(message) {
    super(message);


    this.name = "DatabaseNotInitializedError";
  }
}

export default DatabaseNotInitializedError;
