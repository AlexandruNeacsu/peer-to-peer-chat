import { useState, useEffect } from "react";
import Connection from "../Connection";
import ServerConnectionError from "../Connection/Errors/ServerConnectionError";

/**
 * Detect user logout by checking the server response status and message.
 * @param isAuthenticated
 * @param handleLogout
 * @returns {unknown}
 */
function useSignalSocket(isAuthenticated, handleLogout) {
  const [signalSocket, setSignalSocket] = useState(null);

  useEffect(() => {
    async function getSignalSocket() {
      try {
        const socket = await Connection();

        setSignalSocket(socket);

        // setIsAuthenticated(true);
        //
        // if (localStorage.getItem("username") === "lavi") {
        //   const peer = await a.findPeer("alex");
        //
        //   console.log(peer);
        // }
      } catch (error) {
        if (error instanceof ServerConnectionError && error.closeEvent.code === 1006) {
          // user is not logged in
          handleLogout();
        } else {
          throw error;
        }
      }
    }

    // don't create sockets if we already have one
    if (signalSocket === null) {
      getSignalSocket();
    }
  }, [isAuthenticated, signalSocket, handleLogout]);

  return signalSocket;
}

export default useSignalSocket;
