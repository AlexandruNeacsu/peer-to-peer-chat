import React, { useEffect, useState } from "react";
import PeerId from "peer-id";
import ContactPage from "../ContactPage";
import AddContactDialog from "./AddContactDialog";
import DatabaseHandler from "../../../Database";
import createNode from "../../../Connection/Bundle";
import Loader from "../../Components/Loader";
import Sidebar from "../Sidebar";
import PROTOCOLS, { Implementations } from "../../../Protocols";
import { ADD_EVENTS, CALL_EVENTS, CHAT_EVENTS } from "../../../Protocols/constants";
import User from "../../../Database/Schemas/User";
import CallAlert from "./CallAlert";
import VideoCall from "../VideoCall";

/**
 *
 * @param setContacts
 * @param contactId
 * @param fields
 * @return {Promise<User>}
 */
function updateContact(setContacts, contactId, fields) {
  return new Promise(resolve => {
    setContacts(previousContacts => {
      const contactIndex = previousContacts.findIndex(e => e.id === contactId);

      // node is a contact
      if (contactIndex !== -1) {
        const newContacts = [...previousContacts];

        /** @type {User} */
        const connectedContact = newContacts[contactIndex];

        Object.assign(connectedContact, fields);

        resolve(connectedContact);

        // don't use the same reference
        return newContacts;
      }

      resolve(null);

      return previousContacts;
    });
  });
}

function Chat() {
  // TODO clean this mess
  const [username, setUsername] = useState(localStorage.getItem("username"));
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  // TODO: show a message or something if not connected to a peer
  const [isConnectedToPeers, setIsConnectedToPeer] = useState(false);
  const [ownNode, setOwnNode] = useState(null);

  /* CALL STATE */
  const [call, setCall] = useState(null);
  const [isInCall, setIsInCall] = useState(false);
  const [isCalled, setIsCalled] = useState(false);

  const [isCalling, setIsCalling] = useState(false);
  const [isShowingVideo, setIsShowingVide] = useState(false);


  /* INITIALIZE NODE */
  useEffect(() => {
    /**
     *
     * @param {PeerInfo} contactPeerInfo
     * @param {boolean} newConnectionStatus
     */
    async function updateContactConnectionStatus(contactPeerInfo, newConnectionStatus) {
      if (newConnectionStatus) {
        setIsConnectedToPeer(true);
      }

      await updateContact(
        setContacts,
        contactPeerInfo.id.toB58String(),
        {
          isConnected: newConnectionStatus,
          peerInfo: contactPeerInfo,
        },
      );
    }

    async function getOwnNode() {
      try {
        const database = DatabaseHandler.getDatabase();

        const userId = localStorage.getItem("id");
        const user = await database.users.get({ id: userId });

        const peerId = await PeerId.createFromJSON(user.peerIdJSON);
        const node = await createNode(peerId);

        node.on("peer:connect", async (peerInfo) => {
          // this should be done automatically by libp2p
          // but it's not
          // await node.dial(peerInfo);
          // await node._dht._add(peerInfo);


          await updateContactConnectionStatus(peerInfo, true);
        });
        node.on("peer:disconnect", (peerInfo) => updateContactConnectionStatus(peerInfo, false));
        node.on("error", (err) => {
          console.log(err);
          console.log(err.message);
        });

        node.handleProtocol(PROTOCOLS.ADD, Implementations[PROTOCOLS.ADD], database);
        node.handleProtocol(PROTOCOLS.CHAT, Implementations[PROTOCOLS.CHAT], database);
        node.handleProtocol(PROTOCOLS.CALL, Implementations[PROTOCOLS.CALL], database);

        node
          .getImplementation(PROTOCOLS.ADD)
          .on(ADD_EVENTS.SENT, (request) => setSentRequests(prevValues => ([...prevValues, request])))
          .on(ADD_EVENTS.RECEIVED, (request) => setReceivedRequests(prevValues => ([...prevValues, request])))
          .on(ADD_EVENTS.ACCEPTED, (request) => {
            const contact = new User(request.id, request.username);
            contact.isConnected = true;

            setContacts(prevContacts => ([
              ...prevContacts,
              contact,
            ]));

            if (request.sent) {
              setSentRequests(prevRequests => prevRequests.filter(req => req.id !== request.id));
            } else {
              setReceivedRequests(prevRequests => prevRequests.filter(req => req.id !== request.id));
            }
          })
          .on(ADD_EVENTS.REJECTED, (request) => {
            if (request.sent) {
              setSentRequests(prevRequests => prevRequests.filter(prev => prev.id !== request.id));
            } else {
              setReceivedRequests(prevRequests => prevRequests.filter(prev => prev.id !== request.id));
            }
          });

        node
          .getImplementation(PROTOCOLS.CHAT)
          .on(CHAT_EVENTS.SENT, async ({ id }, chatItem) => {
            await updateContact(setContacts, id, { chatItem });
          })
          .on(CHAT_EVENTS.RECEIVED, async ({ id }, chatItem, structuredMessage) => {
            const contact = await updateContact(setContacts, id, { chatItem });

            if (contact) {
              contact.handleMessage(structuredMessage);
            }
          });


        node
          .getImplementation(PROTOCOLS.CALL)
          .on(CALL_EVENTS.CALLED, (callerId, peerStream) => {
            const contact = contacts.find(c => c.id === callerId);

            if (!contact) {
              // TODO
            } else {
              setCall({
                contact,
                peerStream,
                isReceivingVideo: peerStream.getVideoTracks().length,
              });
              setIsCalled(true);
            }
          })
          .on(CALL_EVENTS.CALL, (contact, ownStream, peerStream) => {
            setCall({
              contact,
              ownStream,
              peerStream,
              isReceivingVideo: peerStream.getVideoTracks().length,
            });
          })
          .on(CALL_EVENTS.TRACK, (track, peerStream) => {
            setCall(prevValue => ({
              ...prevValue,
              peerStream,
              isReceivingVideo: peerStream.getVideoTracks().length,
            }));
          })
          .on(CALL_EVENTS.ACCEPTED, () => console.log("ACC") || setIsInCall(true))
          .on(CALL_EVENTS.CLOSE, () => {
            console.log("CLOSE")

            setIsInCall(false);
            setIsCalled(false);
            setCall(null);
          });

        await node.start();

        setOwnNode(node);
      } catch (error) {
        // todo: catch DatabaseHandler.getDatabase() errors
        console.error(error);
        console.error(error.message);
      }
    }

    if (!ownNode) {
      getOwnNode();
    }
  }, [ownNode, contacts, selectedContact, call]);

  /* LOAD DATABASE DATA */
  useEffect(() => {
    async function getDatabaseData() {
      try {
        const database = DatabaseHandler.getDatabase();

        const userId = localStorage.getItem("id");
        /** @type {Array<User>} */
        const users = await database.users.where("id").notEqual(userId).toArray();

        /** @type {Object[]} */
        const requests = await database.requests.toArray();

        setContacts(users);
        setReceivedRequests(requests.filter(request => !request.sent));
        setSentRequests(requests.filter(request => request.sent));
      } catch (error) {
        console.log(error);
        console.log(error.message);
        // TODO set error snackbar!, peer not found, node not created...
      }
    }

    getDatabaseData();
  }, []);

  /* HANDLE CALLS */

  async function handleSelectContact(newContact) {
    async function setMessagesStatus(contact) {
      try {
        const updatedContact = await updateContact(
          setContacts,
          contact.id,
          {
            chatItem: {
              ...contact.chatItem,
              unread: 0,
            },
          },
        );

        const database = DatabaseHandler.getDatabase();
        await database.transaction("rw", database.users, database.conversations, async () => {
          // can't use modify, will corupt data (BUG)
          const conversations = await database.conversations
            .where({
              status: "received",
              partnerId: contact.id,
            })
            .toArray();

          conversations.forEach(e => {
            e.status = "read";
          });

          await database.conversations.bulkPut(conversations);
          await database.users.put(updatedContact.export());
        });
      } catch (error) {
        // TODO
        console.log(error);
        console.log(error.message);
      }
    }

    newContact.on("messages", () => setMessagesStatus(newContact));

    if (newContact.chatItem.unread && (!selectedContact || (newContact.id !== selectedContact.id))) {
      await setMessagesStatus(newContact, "read");
    }

    setSelectedContact(prevContact => {
      if (prevContact) {
        prevContact.removeAllListeners("messages");
      }

      return newContact;
    });
  }

  const handleCallResponse = (willAnswer) => {
    if (willAnswer) {
      setIsCalled(false);
      setIsInCall(true);

      ownNode.getImplementation(PROTOCOLS.CALL).accept();
    }
  };


  return (
    <Loader isLoading={!ownNode}>
      {
        !!ownNode && (
          <Sidebar
            username={username}
            isOnline={isConnectedToPeers}
            contacts={contacts}
            handleAcceptRequest={ownNode.getImplementation(PROTOCOLS.ADD).accept}
            handleRejectRequest={ownNode.getImplementation(PROTOCOLS.ADD).reject}
            onAddContact={() => setModalOpen(true)}
            selectedContact={selectedContact}
            handleSelectContact={handleSelectContact}
            receivedRequests={receivedRequests}
            sentRequests={sentRequests}
            call={() => ownNode.getImplementation(PROTOCOLS.CALL).call(selectedContact, isShowingVideo)}
          >

            {
              isInCall && call ? (
                <VideoCall
                  bounds="body"
                  stream={call.peerStream}
                  isReceivingVideo={call.isReceivingVideo}
                  contact={call.contact}
                  onEnd={ownNode.getImplementation(PROTOCOLS.CALL).hangUp}
                  onVideoChange={ownNode.getImplementation(PROTOCOLS.CALL).changeVideo}
                  onMicrophoneChange={ownNode.getImplementation(PROTOCOLS.CALL).changeMicrophone}
                />
              ) : null
            }

            {
              selectedContact
                ? (
                  <ContactPage
                    selectedContact={selectedContact}
                    sendText={ownNode.getImplementation(PROTOCOLS.CHAT).sendText}
                    sendFile={ownNode.getImplementation(PROTOCOLS.CHAT).sendFile}
                  />
                )
                : "TODO"
            }

            <AddContactDialog
              open={modalOpen}
              handleClose={() => setModalOpen(false)}
              handleSubmit={(contactUsername) => ownNode.getImplementation(PROTOCOLS.ADD).add(username, contactUsername)}
            />

            {
              isCalled ? (
                  <CallAlert
                    open={isCalled}
                    contact={call.contact}
                    onClose={handleCallResponse}
                  />
                )
                : null
            }

          </Sidebar>
        )
      }
    </Loader>
  );
}

// TODO
// Dashboard.propTypes = {
//   signalSocket: PropTypes.instanceOf()
// };

export default Chat;
