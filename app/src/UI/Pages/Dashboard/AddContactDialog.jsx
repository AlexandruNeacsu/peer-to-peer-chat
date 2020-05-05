import React from "react";
import { t } from "react-i18nify";
import { Form, Formik } from "formik";
import * as Yup from "yup";
import Button from "@material-ui/core/Button";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import Dialog from "@material-ui/core/Dialog";
import Grid from "@material-ui/core/Grid";
import FormikTextField from "../../Components/FormFields/TextField";

const AddContactDialog = ({ open, handleClose, handleSubmit }) => (
  <Dialog open={open} onClose={handleClose} aria-labelledby="form-dialog-title">
    <DialogTitle id="form-dialog-title">{t("Contacts.AddFriend")}</DialogTitle>
    <DialogContent>
      <DialogContentText>
        {t("Contacts.AddFriendMessage")}
      </DialogContentText>

      <Formik
        initialValues={{ username: "" }}
        validationSchema={Yup.object({ username: Yup.string().required(t("Errors.Required")) })}
        onSubmit={({ username }) => {
          handleSubmit(username);
          handleClose();
        }}
      >
        <Form>
          <Grid container>
            <Grid item xs={12}>
              <FormikTextField
                label={t("Contacts.Username")}
                name="username"
                type="text"
              />
            </Grid>
          </Grid>

          <DialogActions>
            <Button onClick={handleClose} color="primary">
              {t("Buttons.Cancel")}
            </Button>
            <Button type="submit" color="primary">
              {t("Buttons.Add")}
            </Button>
          </DialogActions>

        </Form>
      </Formik>

    </DialogContent>

  </Dialog>
);

export default AddContactDialog;
