import { useState, useEffect } from "react";
import Connection from "../Connection";
import ServerConnectionError from "../Connection/Errors/ServerConnectionError";


/**
 * Detect user logout by checking the server response status and message.
 * @param isAuthenticated {boolean} - User auth status
 * @param handleLogout - Function to call if user is not logged in
 * @returns {Array.<{signalError: Error,  signalSocket: WebSocket}>}
 */
function useSignalSocket(isAuthenticated, handleLogout) {
  const [signalSocket, setSignalSocket] = useState(null);

  useEffect(() => {
    async function getSignalSocket() {
      try {
        const socket = await Connection();

        setSignalSocket(socket);


        // if (localStorage.getItem("username") === "lavii") {
        //   const peer = await socket.findPeer("alexx");
        //
        //   console.log(peer);
        // }
      } catch (error) {
        if (error instanceof ServerConnectionError) {
          // user is not logged in
          handleLogout();
        } else {
          handleLogout();
          console.error("Unknown error connecting to signal server!");
        }
      }
    }

    getSignalSocket();
  }, [isAuthenticated, handleLogout]);

  return signalSocket;
}

export default useSignalSocket;
