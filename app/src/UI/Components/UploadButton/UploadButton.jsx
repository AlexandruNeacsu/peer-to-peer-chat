import React  from "react";
import { makeStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import { t } from "react-i18nify";
import BackupIcon from "@material-ui/icons/Backup";

const useStyles = makeStyles((theme) => ({
  root: {
    "& > *": {
      margin: theme.spacing(1),
    },
  },
  input: {
    display: "none",
  },
}));

export default function UploadButton({ onChange }) {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <input
        onChange={onChange}
        accept="image/*"
        className={classes.input}
        id="contained-button-file"
        multiple
        type="file"
      />
      <label htmlFor="contained-button-file">
        <Button variant="contained" color="primary" component="span" startIcon={<BackupIcon />}>
          {t("Buttons.Browse")}
        </Button>
      </label>
    </div>
  );
}
