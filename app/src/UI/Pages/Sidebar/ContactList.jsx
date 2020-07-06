import React, { useEffect, useState } from "react";
import moment from "moment";
import { t } from "react-i18nify";
import ListItem from "@material-ui/core/ListItem";
import ListItemAvatar from "@material-ui/core/ListItemAvatar";
import Typography from "@material-ui/core/Typography";
import ListItemText from "@material-ui/core/ListItemText";
import { makeStyles } from "@material-ui/core/styles";
import Badge from "@material-ui/core/Badge";
import List from "@material-ui/core/List";
import Tooltip from "@material-ui/core/Tooltip";
import SearchIcon from "@material-ui/icons/Search";
import IconButton from "@material-ui/core/IconButton";
import PersonAddIcon from "@material-ui/icons/PersonAdd";
import GroupIcon from "@material-ui/icons/Group";
import InputBase from "@material-ui/core/InputBase";
import UserAvatar from "../../Components/UserAvatar";

const useStyles = makeStyles(theme => ({
  subheader: {
    height: theme.spacing(8),
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
  },
  subheaderText: {
    flexGrow: 1,
  },
  contact: {
    marginRight: theme.spacing(1),
  },
  searchContainer: {
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
  },
  search: {
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    height: "44px",
    display: "flex",
    alignItems: "center",
    borderRadius: "22px",
    backgroundColor: "#1c2025",
  },
  searchInput: {
    flexGrow: 1,
    marginLeft: theme.spacing(1),
  },
  chatItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    justifyItems: "center",
    paddingRight: theme.spacing(1),
    marginTop: theme.spacing(0.75),
    marginBottom: theme.spacing(0.75),
  },
  chatItemUnread: {
    height: theme.spacing(0.25),
    marginTop: theme.spacing(1),
    marginRight: theme.spacing(1),
    display: "flex",
  },
  chatItemDate: {
    marginTop: theme.spacing(1),
  },
}));

/**
 *
 * @param {User[]} contacts
 * @param {function} setSelectedContact
 * @param {function} handleAdd TODO rename, we are not adding, just opening a modal
 */
export default function ContactList({
  contacts,
  selectedContact,
  setSelectedContact,
  onAdd,
  onPopoverOpen,
  requestsCount,
  isOnline,
}) {
  const classes = useStyles();
  const [sortedContacts, setSortedContacts] = useState(contacts);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const newSortedContacts = contacts.sort((a, b) => {
      // newest message first
      const formatedA = moment(a.chatItem.date);
      const formatedB = moment(b.chatItem.date);

      if (formatedA.isBefore(formatedB)) {
        return 1;
      }
      if (formatedA.isAfter(formatedB)) {
        return -1;
      }
      return 0;
    });

    if (newSortedContacts.length) {
      setSelectedContact(newSortedContacts[0]);
    }

    setSortedContacts(newSortedContacts);
  }, [contacts, setSelectedContact]);

  useEffect(() => {
    if (!filter) {
      setFilteredContacts(sortedContacts);
    }
  }, [sortedContacts, filter]);

  const handleChange = (event) => {
    const { value } = event.target;

    setFilteredContacts(contacts.filter(contact => contact.username.startsWith(value)));
    setFilter(value);
  };

  return (
    <div>

      <div className={classes.subheader}>
        <Typography className={classes.subheaderText} variant="h3" color="textPrimary">
          {t("Contacts.ContactList")}
        </Typography>
        <Tooltip title={t(isOnline ? "Contacts.AddTooltip" : "Contacts.DisabledAddTooltip")}>
          {/* Need a div for the tooltip to show when the button is disabled */}
          <div>
            <IconButton color="primary" onClick={onAdd} disabled={!isOnline}>
              <PersonAddIcon />
            </IconButton>
          </div>
        </Tooltip>
        <IconButton
          aria-label="receivedRequests"
          onClick={onPopoverOpen}
        >
          <Badge badgeContent={requestsCount} color="primary">
            <GroupIcon />
          </Badge>
        </IconButton>
      </div>

      <div className={classes.searchContainer}>
        <div className={classes.search}>
          <SearchIcon />
          <InputBase
            value={filter}
            autoFocus
            placeholder={t("Contacts.Search")}
            className={classes.searchInput}
            onChange={handleChange}
          />
        </div>
      </div>

      <List>
        {filteredContacts.map(contact => (
          <ListItem
            button
            selected={selectedContact === contact}
            className={classes.contact}
            key={contact.username}
            onClick={() => setSelectedContact(contact)}
          >
            <ListItemAvatar>
              <UserAvatar
                username={contact.username.toUpperCase()}
                image={contact.avatar}
                showBadge
                isOnline={contact.isConnected}
                isBlocked={contact.isBlocked}
              />
            </ListItemAvatar>

            <ListItemText
              primary={contact.username}
              primaryTypographyProps={{
                variant: "h6",
                noWrap: true,
              }}
              secondary={contact.chatItem.subtitle}
              secondaryTypographyProps={{
                noWrap: true,
                className: classes.subtitle,
              }}
            />

            <div className={classes.chatItem}>
              <Badge color="secondary" badgeContent={contact.chatItem.unread} className={classes.chatItemUnread} />

              <div className={classes.chatItemDate}>
                {
                  contact.chatItem.date ? (
                    <Typography variant="body2">
                      {moment(contact.chatItem.date).fromNow()}
                    </Typography>
                  ) : null
                }
              </div>
            </div>

          </ListItem>
        ))}
      </List>
    </div>
  );
}
