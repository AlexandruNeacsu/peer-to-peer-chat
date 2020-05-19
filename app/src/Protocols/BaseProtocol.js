import EventEmitter from "events";
import Dexie from "dexie";
import HandlerNotImplementedError from "./Errors/HandlerNotImplementedError";
import WrongDatabaseTypeError from "./Errors/WrongDatabaseTypeError";

export default class BaseProtocol extends EventEmitter {
  constructor(node, database) {
    super();

    if (node.name !== "PeerNode") {
      throw new Error(); // TODO: change to ErrorClass
    }

    this.node = node;

    if (!(database instanceof Dexie)) {
      throw new WrongDatabaseTypeError("Database must be instance of Dexie"); // TODO
    }
    this.database = database;
  }

  // eslint-disable-next-line class-methods-use-this
  handler = () => {
    throw new HandlerNotImplementedError("Handler not implemented");
  }
}
