import React from "react";
import Badge from "@material-ui/core/Badge";
import { makeStyles, withStyles } from "@material-ui/core/styles";
import BlockIcon from "@material-ui/icons/Block";
import red from "@material-ui/core/colors/red";
import green from "@material-ui/core/colors/green";
import Tooltip from "@material-ui/core/Tooltip";
import { t } from "react-i18nify";


const useStyles = makeStyles(theme => ({
  badge: {
    backgroundColor: isOnline => (isOnline ? green[500] : red[500]),
    color: isOnline => (isOnline ? green[500] : red[500]),
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    "&::after": {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      borderRadius: "50%",
      border: "1px solid currentColor",
      content: "\"\"",
    },
  },
  blockIcon: {
    width: theme.spacing(2),
    height: theme.spacing(2),
    color: red[500],
  }
}));


const StatusBadge = ({ isOnline, isBlocked, children, ...rest }) => {
  const classes = useStyles(isOnline);

  return (
    <Badge
      classes={isBlocked ? undefined : { badge: classes.badge }}
      overlap="circle"
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "right",
      }}
      variant={isBlocked ? undefined : "dot"}
      badgeContent={isBlocked ? <SmallBlockIcon /> : undefined}
      {...rest}
    >
      {children}
    </Badge>
  );
};


const SmallBlockIcon = () => {
  const classes = useStyles();

  return (
    <Tooltip title={t("Contacts.Blocked")}>
      <BlockIcon className={classes.blockIcon} />
    </Tooltip>
  );
};

export default StatusBadge;
