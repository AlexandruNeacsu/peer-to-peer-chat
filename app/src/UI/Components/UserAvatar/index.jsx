import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import Avatar from "@material-ui/core/Avatar";
import AccountCircleIcon from "@material-ui/icons/AccountCircle";
import Typography from "@material-ui/core/Typography";
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


function UserAvatar({ username, image, isOnline = false, showBadge = false, showUsername = false }) {
  const classes = useStyles();

  const formatedUsername = username && username.toUpperCase();

  return (
    <div className={classes.container}>
      {
        showBadge
          ? (
            <StatusBadge
              isOnline={isOnline}
              overlap="circle"
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "right",
              }}
              variant="dot"
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
