import React from "react";
import { useHistory } from "react-router-dom";
import Register from "./Register";
import Login from "./Login";


function Auth({ onLoginSuccess, needsRegister }) {
  const history = useHistory();

  const handleSubmit = (user) => {
    onLoginSuccess(user);
    history.replace("/");
  };

  return (
    <div>
      {needsRegister ? <Register handleSubmit={handleSubmit} /> : <Login handleSubmit={handleSubmit} />}
    </div>
  );
}

export default Auth;
