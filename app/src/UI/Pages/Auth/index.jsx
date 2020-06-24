import React from "react";
import { useHistory } from "react-router-dom";
import { makeStyles } from "@material-ui/core/styles";
import Register from "./Register";
import Login from "./Login";

const useStyles = makeStyles(() => ({
  authRoot: {
    position: "relative",
    left: "50%",
    transform: "translateX(-50%)",
    alignSelf: "center",
  },
}));

function Auth({ onLoginSuccess, needsRegister }) {
  const history = useHistory();
  const classes = useStyles();

  const handleSubmit = (user) => {
    onLoginSuccess(user);
    history.replace("/");
  };

  return (
    <div className={classes.authRoot}>
      {needsRegister ? <Register handleSubmit={handleSubmit} /> : <Login handleSubmit={handleSubmit} />}
    </div>
  );
}

export default Auth;
