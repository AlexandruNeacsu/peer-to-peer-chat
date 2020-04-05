import React from "react";
import PropTypes from "prop-types";
import CircularProgress from "@material-ui/core/CircularProgress";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles(() => ({
  loader: {
    position: "absolute",
    top: "50%",
    left: "50%",
    margin: "-5rem 0 0 -5rem",
  },
}));

/* Displays a loader until the props changes */
export default function Loader(props) {
  const { isLoading, children } = props;
  const classes = useStyles();

  return isLoading ? (
    <CircularProgress className={classes.loader} size="10rem" />
  ) : (
    children
  );
}


Loader.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  children: PropTypes.node,
};
