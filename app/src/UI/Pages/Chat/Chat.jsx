import React, { useEffect, useState } from "react";
import PeerId from "peer-id";
import { t } from "react-i18nify";
import { useSnackbar } from "notistack";
import ContactPage from "../ContactPage";
import AddContactDialog from "./AddContactDialog";
import DatabaseHandler from "../../../Database";
import createNode from "../../../Connection/Bundle";
import Loader from "../../Components/Loader";
import Sidebar from "../Sidebar";
import PROTOCOLS, { Implementations } from "../../../Protocols";
import { ADD_EVENTS, CALL_EVENTS, CHAT_EVENTS, UPDATE_EVENTS } from "../../../Protocols/constants";
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

const ring = new Audio("sounds/ring.mp3");
ring.loop = true;

const notification = new Audio("sounds/notification.wav");

function Chat() {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  // TODO clean this mess
  const [username, setUsername] = useState(localStorage.getItem("username"));
  const [avatar, setAvatar] = useState(localStorage.getItem("avatar"));

  const [isLoading, setIsLoading] = useState(true);
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
  const [hasCamera, setHasCamera] = useState(false);

  /* LOAD DATABASE DATA */
  useEffect(() => {
    async function getDatabaseData() {
      try {
        const database = DatabaseHandler.getDatabase();

        const userId = localStorage.getItem("id");
        /** @type {Array<User>} */
        const users = await database.users.where("id").notEqual(userId).toArray();


        users.forEach(user => {
          user.on(User.EVENTS.DELETE, () => {
            setContacts(prevContacts => prevContacts.filter(contact => contact.id !== user.id));
            enqueueSnackbar(t("Contacts.DeletedSuccess"), { variant: "success" });
          })
            .on(User.EVENTS.BLOCK, () => {
              setContacts(prevState => [
                ...prevState.filter(contact => contact.id !== user.id),
                user,
              ]);
            });
        });

        /** @type {Object[]} */
        const requests = await database.requests.toArray();

        setContacts(users);
        setReceivedRequests(requests.filter(request => !request.sent));
        setSentRequests(requests.filter(request => request.sent));
        setIsLoading(false);

        return () => {
          users.forEach(user => {
            user.removeAllListeners(User.EVENTS.DELETE);
            user.removeAllListeners(User.EVENTS.BLOCK);
          });
        };
      } catch (error) {
        console.log(error);
        console.log(error.message);
        // TODO set error snackbar!, peer not found, node not created...
      }
    }

    if (isLoading) {
      getDatabaseData();
    }
  }, [call, enqueueSnackbar, isLoading, ownNode]);

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

      return updateContact(
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
          // add relay addres for different signaling servers
          node.peerInfo.multiaddrs.add(`/p2p/${peerInfo.id.toB58String()}/p2p-circuit/p2p/${node.peerInfo.id.toB58String()}`);

          const contact = await updateContactConnectionStatus(peerInfo, true);

          if (contact && contact.isNeedingUpdate) {
            await node.getImplementation(PROTOCOLS.UPDATE).update(peerInfo.id, localStorage.getItem("avatar"));

            await database.users.put({ ...contact.export(), isNeedingUpdate: false });

            await updateContact(
              setContacts,
              contact.id,
              { isNeedingUpdate: false },
            );
          }
        });
        node.on("peer:disconnect", (peerInfo) => updateContactConnectionStatus(peerInfo, false));
        node.on("error", (err) => {
          console.log(err);
          console.log(err.message);
        });

        node.handleProtocol(PROTOCOLS.ADD, Implementations[PROTOCOLS.ADD], database);
        node.handleProtocol(PROTOCOLS.CHAT, Implementations[PROTOCOLS.CHAT], database);
        node.handleProtocol(PROTOCOLS.CALL, Implementations[PROTOCOLS.CALL], database);
        node.handleProtocol(PROTOCOLS.UPDATE, Implementations[PROTOCOLS.UPDATE], database);

        node
          .getImplementation(PROTOCOLS.ADD)
          .on(ADD_EVENTS.SENT, (request) => setSentRequests(prevValues => ([...prevValues, request])))
          .on(ADD_EVENTS.RECEIVED, (request) => setReceivedRequests(prevValues => ([...prevValues, request])))
          .on(ADD_EVENTS.ACCEPTED, (request) => {
            const contact = new User({ id: request.id, username: request.username, database });
            contact.isConnected = true;

            contact.on(User.EVENTS.DELETE, () => {
              setContacts(prevContacts => prevContacts.filter(e => e.id !== user.id));
              enqueueSnackbar(t("Contacts.DeletedSuccess"), { variant: "success" });
            })
              .on(User.EVENTS.BLOCK, () => {
                setContacts(prevState => [
                  ...prevState.filter(e => e.id !== contact.id),
                  contact,
                ]);
              });

            setContacts(prevContacts => ([
              ...prevContacts.filter(prevContact => prevContact.id !== contact.id), // in case it's a contact who blocked us
              contact,
            ]));

            if (request.sent) {
              setSentRequests(prevRequests => prevRequests.filter(req => req.id !== request.id));

              enqueueSnackbar(
                t("Requests.Accepted", { username: contact.username }),
                { variant: "info", persist: true }
              );
            } else {
              setReceivedRequests(prevRequests => prevRequests.filter(req => req.id !== request.id));
            }

            if (localStorage.getItem("avatar")) {
              node.getImplementation(PROTOCOLS.UPDATE).update(user.id, localStorage.getItem("avatar"));
            }
          })
          .on(ADD_EVENTS.REJECTED, (request) => {
            if (request.sent) {
              let requestUsername;

              setSentRequests(prevRequests => prevRequests.filter(prev => {
                const isFound = prev.id === request.id;

                if (isFound) {
                  requestUsername = prev.username;
                }

                return !isFound;
              }));

              if (requestUsername) {
                enqueueSnackbar(
                  t("Requests.Rejected", { username: requestUsername }),
                  { variant: "info", persist: true }
                );
              }
            } else {
              setReceivedRequests(prevRequests => prevRequests.filter(prev => prev.id !== request.id));
            }
          })
          .on(ADD_EVENTS.DELETED, (id) => {
            setSentRequests(prevRequests => prevRequests.filter(prev => prev.id !== id));
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

              if (contact.chatItem.unread === 1 || contact.chatItem.unread % 5 === 0) {
                await notification.play();
              }
            }
          })
          .on(CHAT_EVENTS.BLOCKED, async ({ id, username: requestUsername }) => {
            const contact = await updateContact(setContacts, id, { isBlocked: true });

            if (contact) {
              enqueueSnackbar(
                t("Contacts.BlockedEvent", { username: requestUsername }),
                { variant: "info", persist: true }
              );
            }
          });

        node
          .getImplementation(PROTOCOLS.CALL)
          .on(CALL_EVENTS.CALLED, async (caller, peerStream) => {
            if (ring.paused) {
              await ring.play();
            }

            setCall(prevValue => prevValue || {
              contact: caller,
              peerStream,
              isReceivingVideo: peerStream && peerStream.getVideoTracks().length,
            });
            setIsCalled(true);
          })
          .on(CALL_EVENTS.CALL, async (contact, ownStream, peerStream) => {
            if (ring.paused) {
              await ring.play();
            }

            setCall({
              contact,
              ownStream,
              peerStream,
              isReceivingVideo: peerStream && peerStream.getVideoTracks().length,
              isShowingVideo: ownStream && ownStream.getVideoTracks().length,
            });
          })
          .on(CALL_EVENTS.TRACK, (track, peerStream) => {
            setCall(prevValue => prevValue && {
              ...prevValue,
              peerStream,
              isReceivingVideo: peerStream && peerStream.getVideoTracks().length,
            });
          })
          .on(CALL_EVENTS.ACCEPTED, () => {
            ring.pause();
            setIsInCall(true);
          })
          .on(CALL_EVENTS.CLOSE, () => {
            ring.pause();

            setIsInCall(false);
            setIsCalled(false);
            setCall(null);
          })
          .on(CALL_EVENTS.BLOCKED, (blockedUser) => {
            ring.pause();

            enqueueSnackbar(
              t("Contacts.BlockedEvent", { username: blockedUser.username }),
              { variant: "info", persist: true }
            );

            node.getImplementation(PROTOCOLS.CALL).hangUp();
          });

        node
          .getImplementation(PROTOCOLS.UPDATE)
          .on(UPDATE_EVENTS.UPDATED, async (contact, newAvatar) => {
            await updateContact(setContacts, contact.id, { avatar: newAvatar });
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
  }, [ownNode, contacts, selectedContact, call, enqueueSnackbar, closeSnackbar]);

  /* CHECK MEDIA DEVICES */
  useEffect(() => {
    async function checkForCamera() {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameraEnabled = devices.some(device => device.kind === "videoinput");

      setHasCamera(cameraEnabled);
    }

    checkForCamera();
  }, []);

  /**
   *
   * @param {User} newContact
   * @returns {Promise<void>}
   */
  async function handleSelectContact(newContact) {
    const setMessagesStatus = async contact => {
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
    };

    newContact.on(User.EVENTS.MESSAGE, () => setMessagesStatus(newContact));

    newContact.deleteCallback = () => setSelectedContact(null); // TODO
    newContact.on(User.EVENTS.DELETE, newContact.deleteCallback);

    if (newContact.chatItem.unread && (!selectedContact || (newContact.id !== selectedContact.id))) {
      await setMessagesStatus(newContact, "read");
    }

    setSelectedContact(prevContact => {
      if (prevContact) {
        prevContact.removeAllListeners(User.EVENTS.MESSAGE);
        prevContact.removeAllListeners(User.EVENTS.CLEAR);
        prevContact.removeListener(User.EVENTS.DELETE, prevContact.deleteCallback);
      }

      return newContact;
    });
  }

  const handleCallResponse = (willAnswer) => {
    setIsCalled(false);


    if (willAnswer) {
      ring.pause();
      setIsInCall(true);
    } else {
      setCall(null);
    }

    ownNode.getImplementation(PROTOCOLS.CALL).accept(willAnswer);
  };

  const handleCall = (withVideo) => {
    ownNode.getImplementation(PROTOCOLS.CALL).call(selectedContact, withVideo);

    setCall({ contact: selectedContact });
  };

  const handleSetAvatar = async (newAvatar) => {
    setAvatar(newAvatar);

    const updateProtocol = ownNode.getImplementation(PROTOCOLS.UPDATE);

    contacts.forEach(contact => contact.isConnected && updateProtocol.update(contact.peerId, newAvatar));


    try {
      const database = DatabaseHandler.getDatabase();
      const userId = localStorage.getItem("id");

      await database.transaction("rw", database.users, async () => {
        let updatedContacts = await database.users.where("id").notEqual(userId).toArray();
        updatedContacts = updatedContacts.map(contact => {
          contact.isNeedingUpdate = true;

          return contact.export();
        });

        await database.users.bulkPut(updatedContacts);
      });

      setContacts(prevState => prevState.map(contact => {
        contact.isNeedingUpdate = true;

        return contact;
      }));
    } catch (error) {
      // TODO
      console.log(error);
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
            handleDeleteRequest={ownNode.getImplementation(PROTOCOLS.ADD).delete}
            onAddContact={() => setModalOpen(true)}
            selectedContact={selectedContact}
            handleSelectContact={handleSelectContact}
            receivedRequests={receivedRequests}
            sentRequests={sentRequests}
            onCall={handleCall}
            hasCamera={hasCamera}
            avatar={avatar}
            setAvatar={handleSetAvatar}
          >

            {
              call && !isCalled ? (
                <VideoCall
                  bounds="body"
                  loading={!isInCall}
                  stream={call.peerStream}
                  isReceivingVideo={call.isReceivingVideo}
                  isShowingVideo={call.isShowingVideo}
                  contact={call.contact}
                  onEnd={ownNode.getImplementation(PROTOCOLS.CALL).hangUp}
                  onVideoChange={ownNode.getImplementation(PROTOCOLS.CALL).changeVideo}
                  onMicrophoneChange={ownNode.getImplementation(PROTOCOLS.CALL).changeMicrophone}
                  hasCamera={hasCamera}
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
              isCalled
                ? (
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
