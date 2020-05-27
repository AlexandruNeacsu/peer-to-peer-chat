import React from "react";
import { t } from "react-i18nify";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import Grid from "@material-ui/core/Grid";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import Button from "@material-ui/core/Button";
import { makeStyles } from "@material-ui/core/styles";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import useTheme from "@material-ui/core/styles/useTheme";
import { FormikSelect, FormikTextField } from "../../../Components/FormFields";


const useStyles = makeStyles(() => ({
  header: {
    padding: "0.3em",
  },
  item: {
    padding: "0.5em",
  },
  deliverablesRoot: {
    marginTop: "2em",
  },
}));

const types = [
  { label: "dns4", value: "dns4" },
  { label: "dns6", value: "dns6" },
  { label: "ip4", value: "ip4" },
  { label: "ip6", value: "ip6" }
];

const typesValidation = types.map(type => type.value);

function AddSignalServer({ open, onClose }) {
  const classes = useStyles();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Dialog open={open} onClose={() => onClose(null)} aria-labelledby="form-add-signal-server" fullScreen={fullScreen}>
      <DialogTitle>{t("AddSignal.Title")}</DialogTitle>
      <DialogContent>
        <Formik
          initialValues={{
            label: "",
            value: "",
            port: 9090,
            type: types[0],
          }}
          validationSchema={Yup.object({
            label: Yup.string().required(t("Errors.Required")),
            value: Yup.string().required(t("Errors.Required")),
            port: Yup.number(t("Errors.Number"))
              .positive(t("Errors.Pozitive"))
              .min(1, t("Errors.Subunit"))
              .max(65535, t("Errors.Subunit"))
              .required(t("Errors.Required")),
            type: Yup.object({
              label: Yup.string().oneOf(typesValidation).required(t("Errors.Required")),
              value: Yup.string().oneOf(typesValidation).required(t("Errors.Required")),
            }).required(t("Errors.Required")),
          })}
          onSubmit={(server, { setSubmitting }) => {
            setSubmitting(false);

            onClose({
              ...server,
              type: server.type.value,
            });
          }}
        >
          <Form>
            <Grid container>

              <Grid item xs={12} className={classes.item}>
                <FormikTextField
                  label={t("AddSignal.Label")}
                  name="label"
                  type="text"
                />
              </Grid>

              <Grid item xs={12} className={classes.item}>
                <FormikTextField
                  label={t("AddSignal.Value")}
                  name="value"
                  type="text"
                />
              </Grid>

              <Grid item xs={12} className={classes.item}>
                <FormikTextField
                  label={t("AddSignal.Port")}
                  name="port"
                  type="text"
                />
              </Grid>

              <Grid item xs={12} className={classes.item}>
                <FormikSelect
                  label={t("AddSignal.Type")}
                  name="type"
                  options={types}
                />
              </Grid>

            </Grid>


            <DialogActions>
              <Button onClick={() => onClose(null)} color="primary">
                {t("Buttons.Cancel")}
              </Button>
              <Button color="primary" type="submit">
                {t("Buttons.Add")}
              </Button>
            </DialogActions>


          </Form>
        </Formik>

      </DialogContent>
    </Dialog>
  );
}

export default AddSignalServer;
