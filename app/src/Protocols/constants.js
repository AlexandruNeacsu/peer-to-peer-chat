const PROTOCOLS = {
  ADD: "/add/1.0.0",
  CHAT: "/chat/1.0.0",
  CALL: "/call/1.0.0",
  UPDATE: "/update/1.0.0",
};

export default PROTOCOLS;


export const ADD_ENUM = {
  ADD: "ADD",
  ACCEPTED: "ACCEPTED",
  REJECTED: "REJECTED",
  REGISTERED: "REGISTERED",
  RECEIVED: "RECEIVED",
  OK: "OK",
};

export const ADD_EVENTS = {
  SENT: "SENT",
  RECEIVED: "RECEIVED",
  ACCEPTED: "ACCEPTED",
  REJECTED: "REJECTED",
  DELETED: "DELETED"
};

export const CHAT_MESSAGE_TYPE = {
  TEXT: "TEXT",
  FILE: "FILE",
};

export const CHAT_MESSAGE_STATUS = {
  OK: "OK",
  RECEIVED: "received",
  SENT: "sent",
  REFUSED: "REFUSED",
  ACKNOWLEDGED: "ACKNOWLEDGED",

};

export const CHAT_EVENTS = {
  RECEIVED: "received",
  SENT: "sent",
  BLOCKED: "BLOCKED"
};

export const CALL_MESSAGES = {
  ACCEPTED: "ACCEPTED",
  REFUSED: "REFUSED",
  OK: "OK",
  SIGNAL: "SIGNAL",
  ACKNOWLEDGED: "ACKNOWLEDGED",
};

export const CALL_EVENTS = {
  CALL: "CALL",
  CALLED: "CALLED",
  MUTE: "MUTE",
  VIDEO: "VIDEO",
  ACCEPTED: "ACCEPTED",
  REFUSED: "REFUSED",
  CLOSE: "CLOSE",
  TRACK: "TRACK",
  BLOCKED: "BLOCKED",
};

export const UPDATE_EVENTS = {
  UPDATED: "UPDATED",
};
