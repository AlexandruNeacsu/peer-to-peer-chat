import React from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { t } from "react-i18nify";
import { makeStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import Container from "@material-ui/core/Container";
import Grid from "@material-ui/core/Grid";
import Box from "@material-ui/core/Box";
import Divider from "@material-ui/core/Divider";
import FormikTextField from "../../Components/FormFields/TextField";


const useStyles = makeStyles(theme => ({
  paper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  title: {
    marginBottom: theme.spacing(1),
  },
  form: {
    width: "100%",
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
    <Formik
      initialValues={{
        password: "",
      }}
      validationSchema={Yup.object({
        password: Yup.string(),
      })}
      onSubmit={(user, { setSubmitting }) => {
        handleSubmit(user);

        setSubmitting(false);
      }}
    >
      <Form>
        <Container component="main" maxWidth="xs">
          <div className={classes.paper}>
            <Grid container>
              <Grid item xs={12}>
                <Typography variant="h2">
                  {t("Auth.Login")}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <FormikTextField
                  margin="normal"
                  fullWidth
                  label={t("Auth.Password")}
                  name="password"
                  type="password"
                  autoComplete="current-password"
                />
              </Grid>

              <Grid item xs={12}>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  color="primary"
                  className={classes.submit}
                >
                  {t("Auth.SignIn")}
                </Button>
              </Grid>

              <Divider />

              <Grid item xs={12}>
                <Typography variant="subtitle2">
                  {t("Auth.NoAccount")}
                </Typography>
              </Grid>

            </Grid>
          </div>

          {/* push up the contents */}
          <Box mt={8} />
        </Container>
      </Form>
    </Formik>
  );
}

export default Login;
