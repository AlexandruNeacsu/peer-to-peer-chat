class NoPeerIdError extends Error {
  constructor(message) {
    super(message);


    this.name = "NoPeerIdError";
  }
}

export default NoPeerIdError;
