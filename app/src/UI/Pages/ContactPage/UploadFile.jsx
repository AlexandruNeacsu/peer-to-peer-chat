import React from "react";
import { IconButton } from "@material-ui/core";
import CloseIcon from "@material-ui/icons/Close";
import { DropzoneArea } from "material-ui-dropzone";
import { t } from "react-i18nify";
import useTheme from "@material-ui/core/styles/useTheme";
import { makeStyles } from "@material-ui/core/styles";


const useStyles = makeStyles(theme => ({
  container: {
    flexGrow: 1,
    display: "flex",
    flexDirection: "column",
  },
  button: {
    alignSelf: "flex-end",
  },
  dropzone: {
    flexGrow: 1,
  }
}));

export default function UploadFile({ handleClose, handleChange }) {
  const classes = useStyles();
  const theme = useTheme();

  return (
    <div className={classes.container}>

      <div className={classes.button}>
        <IconButton onClick={handleClose} color="primary">
          <CloseIcon />
        </IconButton>
      </div>

      <DropzoneArea
        theme={theme}
        dropzoneClass={classes.dropzone}
        dropzoneText={t("Chat.Upload")}
        maxFileSize={10 * 2 ** 20} // 10 MB
        filesLimit={10}
        acceptedFiles={[""]} // accept all files
        showFileNames
        onChange={handleChange}
        alertSnackbarProps={{
          anchorOrigin: { vertical: "top", horizontal: "right" },
        }}
      />

    </div>
  );
}
