class DatabaseClosedIncorrectlyError extends Error {
  constructor(message) {
    super(message);


    this.name = "DatabaseClosedIncorrectlyError";
  }
}

export default DatabaseClosedIncorrectlyError;
