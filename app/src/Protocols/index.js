import AddProtocol from "./Add/AddProtocol";
import ChatProtocol from "./Chat/ChatProtocol";
import CallProtocol from "./Call/CallProtocol";
import UpdateProtocol from "./Update/UpdateProtocol";
import PROTOCOLS from "./constants";

export default PROTOCOLS;

export const Implementations = {
  [PROTOCOLS.ADD]: AddProtocol,
  [PROTOCOLS.CHAT]: ChatProtocol,
  [PROTOCOLS.CALL]: CallProtocol,
  [PROTOCOLS.UPDATE]: UpdateProtocol,
};
