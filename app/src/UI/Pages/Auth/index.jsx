import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import { t } from "react-i18nify";
import Register from "./Register";
import Login from "./Login";
import Snackbar from "../../Components/Snackbar";


function Auth({ onLoginSuccess, needsRegister }) {
  const [snackBarOptions, setSnackBarOptions] = useState({
    variant: "",
    message: "",
    open: false,
  });
  const history = useHistory();

  const handleSubmit = (user) => {
    setSnackBarOptions({
      variant: "success",
      message: t("Auth.LoginSuccess"),
      open: true,
    });


    onLoginSuccess(user);
    history.replace("/");
  };

  return (
    <div>
      {needsRegister ? <Register handleSubmit={handleSubmit} /> : <Login handleSubmit={handleSubmit} />}
      <Snackbar
        variant={snackBarOptions.variant}
        message={snackBarOptions.message}
        open={snackBarOptions.open}
        handleClose={() => setSnackBarOptions(prevState => ({ ...prevState, open: false }))}
      />
    </div>
  );
}

export default Auth;
