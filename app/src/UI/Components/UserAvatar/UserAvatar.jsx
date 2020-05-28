import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import Avatar from "@material-ui/core/Avatar";
import AccountCircleIcon from "@material-ui/icons/AccountCircle";
import Typography from "@material-ui/core/Typography";
import clsx from "clsx";
import StatusBadge from "./StatusBadge";


const useStyles = makeStyles(theme => ({
  container: {
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "center",
    padding: theme.spacing(1),
  },
  text: {
    marginLeft: theme.spacing(2),
  },
}));


function UserAvatar({
                      username,
                      image,
                      isOnline = false,
                      isBlocked = false,
                      showBadge = false,
                      showUsername = false,
                      className,
                    }) {
  const classes = useStyles();

  const formatedUsername = username && username.toUpperCase();

  return (
    <div className={clsx(classes.container, className)}>
      {
        showBadge
          ? (
            <StatusBadge
              isOnline={isOnline}
              isBlocked={isBlocked}
            >
              <Avatar alt={formatedUsername} src={image || AccountCircleIcon} />
            </StatusBadge>
          )
          : <Avatar alt={formatedUsername} src={image || AccountCircleIcon} />
      }

      {
        showUsername ? <Typography variant="subtitle1" className={classes.text}>{username}</Typography> : null
      }

    </div>
  );
}

export default UserAvatar;
