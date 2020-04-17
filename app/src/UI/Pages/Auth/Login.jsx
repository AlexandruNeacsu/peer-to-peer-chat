import React from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { t } from "react-i18nify";
import { makeStyles } from "@material-ui/core/styles";
import Avatar from "@material-ui/core/Avatar";
import Button from "@material-ui/core/Button";
import CssBaseline from "@material-ui/core/CssBaseline";
import Box from "@material-ui/core/Box";
import LockOutlinedIcon from "@material-ui/icons/LockOutlined";
import Typography from "@material-ui/core/Typography";
import Container from "@material-ui/core/Container";
import FormikTextField from "../../Components/FormFields/TextField";


const useStyles = makeStyles(theme => ({
  paper: {
    marginTop: theme.spacing(8),
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  avatar: {
    margin: theme.spacing(1),
    backgroundColor: theme.palette.secondary.main,
  },
  form: {
    width: "100%", // Fix IE 11 issue.
    marginTop: theme.spacing(1),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
}));

function Login({ handleSubmit }) {
  // TODO make sure snackbar works !
  const classes = useStyles();

  return (
    <div>
      <Formik
        initialValues={{
          username: "",
          password: "",
        }}
        validationSchema={Yup.object({
          username: Yup.string().required("Required").min(5, t("Auth.Errors.UsernameLength")).max(50, t("Auth.Errors.UsernameLength")),
          password: Yup.string(),
        })}
        onSubmit={handleSubmit}
      >
        <Form>
          <Container component="main" maxWidth="xs">
            <CssBaseline />
            <div className={classes.paper}>
              <Avatar className={classes.avatar}>
                <LockOutlinedIcon />
              </Avatar>
              <Typography component="h1" variant="h5">
                {t("Auth.Login")}
              </Typography>
              <FormikTextField
                margin="normal"
                fullWidth
                label={t("Auth.Username")}
                name="username"
              />
              <FormikTextField
                margin="normal"
                fullWidth
                label={t("Auth.Password")}
                name="password"
                type="password"
                autoComplete="current-password"
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                className={classes.submit}
              >
                {t("Auth.Login")}
              </Button>
            </div>
            <Box mt={8} />
          </Container>
        </Form>
      </Formik>
    </div>
  );
}

export default Login;
