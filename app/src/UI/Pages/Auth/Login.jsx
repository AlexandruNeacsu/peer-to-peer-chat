import React, { Component } from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { t } from "react-i18nify";
import axios from "axios";
import Avatar from "@material-ui/core/Avatar";
import Button from "@material-ui/core/Button";
import CssBaseline from "@material-ui/core/CssBaseline";
import { NavLink } from "react-router-dom";
import Grid from "@material-ui/core/Grid";
import Box from "@material-ui/core/Box";
import LockOutlinedIcon from "@material-ui/icons/LockOutlined";
import Typography from "@material-ui/core/Typography";
import { withStyles } from "@material-ui/core";
import Container from "@material-ui/core/Container";
import FormikTextField from "../../Components/FormFields/TextField";
import FormControlLabel from "../../Components/FormFields/FormControlLabel";
import Snackbar from "../../Components/Snackbar";

const styles = theme => ({
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
});

class Login extends Component {
  state = {
    variant: "",
    open: false,
    message: "",
  };


  handleSubmit = async (user) => {
    const { username, password, remember } = user;

    try {
      const response = await axios.post("/login", { username, password, remember });

      if (response.status === 202) {
        this.setState({
          variant: "success",
          message: `${response.status} ${response.statusText}`,
          open: true,
        });

        const { handleLoginSubmit } = this.props;

        handleLoginSubmit(username);
      }
    } catch (error) {
      this.setState({
        variant: "error",
        message: `${error.response.status} ${error.response.statusText}`,
        open: true,
      });
    }
  };

  // TODO make sure snackbar works !

  render() {
    const { classes } = this.props;
    const { variant, message, open } = this.state;

    return (
      <div>
        <Snackbar
          variant={variant}
          message={message}
          open={open}
          handleClose={() => this.setState({ open: false })}
        />
        <Formik
          initialValues={{
            username: "",
            password: "",
            remember: false,
          }}
          validationSchema={Yup.object({
            username: Yup.string().required("Required").min(5, t("Auth.Errors.UsernameLength")).max(50, t("Auth.Errors.UsernameLength")),
            password: Yup.string(),
            remember: Yup.bool(),
          })}
          onSubmit={async (user, { setSubmitting }) => {
            await this.handleSubmit(user);
            setSubmitting(false);
          }}
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

                <FormControlLabel
                  color="primary"
                  label={t("Auth.Remember")}
                  name="remember"
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
                <Grid container>
                  <Grid item>
                    <NavLink href="#" to="/register" variant="body2">
                      {t("Auth.LoginMessage")}
                    </NavLink>
                  </Grid>
                </Grid>
              </div>
              <Box mt={8} />
            </Container>
          </Form>
        </Formik>
      </div>
    );
  }
}

export default withStyles(styles)(Login);
