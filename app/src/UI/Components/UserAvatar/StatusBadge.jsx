import React from "react";
import Badge from "@material-ui/core/Badge";
import { makeStyles } from "@material-ui/core/styles";


const useStyles = makeStyles(theme => ({
  badge: {
    backgroundColor: isOnline => (isOnline ? "#44b700" : "#b70003"),
    color: isOnline => (isOnline ? "#44b700" : "#b70003"),
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
}));


const StatusBadge = ({ isOnline, children, ...rest }) => {
  const classes = useStyles(isOnline);

  return (
    <Badge classes={{ badge: classes.badge }} {...rest}>
      {children}
    </Badge>
  );
};

export default StatusBadge;
