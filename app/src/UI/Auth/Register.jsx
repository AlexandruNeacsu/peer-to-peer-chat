import React, { Component } from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { withStyles } from "@material-ui/core";
import Avatar from "@material-ui/core/Avatar";
import Button from "@material-ui/core/Button";
import Link from "@material-ui/core/Link";
import { NavLink } from "react-router-dom";
import Grid from "@material-ui/core/Grid";
import Box from "@material-ui/core/Box";
import LockOutlinedIcon from "@material-ui/icons/LockOutlined";
import Typography from "@material-ui/core/Typography";
import Container from "@material-ui/core/Container";
import { t } from "react-i18nify";
import axios from "axios";
import FormikTextField from "../../Components/FormFields/TextField";
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

class Register extends Component {
  state = {
    variant: "",
    open: false,
    message: "",
  };


  handleSubmit = async (user) => {
    const { username, email, password } = user;

    try {
      const response = await axios.post("/signup", { username, email, password });

      if (response.status === 201) {
        this.setState({
          variant: "success",
          message: `${response.status} ${response.statusText}`,
          open: true,
        });
        const { handleRegisterSubmit } = this.props;
        handleRegisterSubmit();
      } else {
        // FIXME
      }
    } catch (error) {
      this.setState({
        variant: "error",
        message: `${error.response.status} ${error.response.statusText}`,
        open: true,
      });
    }
  };

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
            email: "",
            password: "",
            confirmPassword: "",
          }}
          validationSchema={Yup.object({
            username: Yup.string().required("Required").min(5, t("Auth.UsernameLength")).max(20),
            email: Yup.string().required("Required").email(t("Auth.InvalidEmail")),
            password: Yup.string().required("Required").min(5, t("Auth.PasswordLength")),
            confirmPassword: Yup.string().required("Required").min(5, t("Auth.PasswordLength")).oneOf([Yup.ref("password")], t("Auth.MatchPassword")),
          })}
          onSubmit={async (user, { setSubmitting }) => {
            await this.handleSubmit(user);

            setSubmitting(false);
          }}
        >
          <Form>
            <Container component="main" maxWidth="xs">
              <div className={classes.paper}>
                <Avatar className={classes.avatar}>
                  <LockOutlinedIcon />
                </Avatar>
                <Grid container>
                  <Grid item xs={12} className={classes.item}>
                    <Typography component="h1" variant="h5">
                      {t("Auth.Register")}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} className={classes.item}>
                    <FormikTextField
                      margin="normal"
                      label={t("Auth.Username")}
                      name="username"
                      autoComplete="username"
                    />
                  </Grid>
                  <Grid item xs={12} className={classes.item}>
                    <FormikTextField
                      margin="normal"
                      label="Email"
                      name="email"
                      autoComplete="email"
                    />
                  </Grid>
                  <Grid item xs={12} className={classes.item}>
                    <FormikTextField
                      margin="normal"
                      label={t("Auth.Password")}
                      name="password"
                      type="password"
                      autoComplete="current-password"
                    />
                  </Grid>
                  <Grid item xs={12} className={classes.item}>
                    <FormikTextField
                      margin="normal"
                      label={t("Auth.ConfirmPassword")}
                      name="confirmPassword"
                      type="password"
                      autoComplete="current-password"
                    />
                  </Grid>
                  <Grid item xs={12} className={classes.item}>
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      color="primary"
                      className={classes.submit}
                    >
                      {t("Auth.Register")}
                    </Button>
                  </Grid>
                </Grid>
                <Grid container>
                  <Grid item xs>
                    <Link href="#" variant="body2">
                      {t("Auth.Forgot")}
                    </Link>
                  </Grid>
                  <Grid item>
                    <NavLink href="#" to="/login" variant="body2">
                      {t("Auth.RegisterMessage")}
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

export default withStyles(styles)(Register);
