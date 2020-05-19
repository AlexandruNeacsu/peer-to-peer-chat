class HandlerNotImplementedError extends Error {
  constructor(message) {
    super(message);


    this.name = "HandlerNotImplementedError";
  }
}

export default HandlerNotImplementedError;
