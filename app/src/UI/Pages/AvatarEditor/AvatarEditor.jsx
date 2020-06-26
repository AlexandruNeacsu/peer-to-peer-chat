import React, { useCallback, useEffect, useState } from "react";
import DialogTitle from "@material-ui/core/DialogTitle";
import { t } from "react-i18nify";
import AvatarEditor from "react-avatar-editor";
import DialogContent from "@material-ui/core/DialogContent";
import Dialog from "@material-ui/core/Dialog";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import useTheme from "@material-ui/core/styles/useTheme";
import Button from "@material-ui/core/Button";
import DialogActions from "@material-ui/core/DialogActions";
import { makeStyles } from "@material-ui/core/styles";
import Dropzone from "react-dropzone";
import UploadButton from "../../Components/UploadButton";

const useStyles = makeStyles(theme => ({
  browseButton: {
    display: "flex",
    justifyContent: "flex-start",
    flexGrow: 1,
  },
  rootDiv: {
    display: "flex"
  },
}));


const Editor = ({ isOpen, onClose }) => {
  const classes = useStyles();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [avatar, setAvatar] = useState(null);
  const [originalAvatar, setOriginalAvatar] = useState(null);

  useEffect(() => {
    const data = localStorage.getItem("avatar");
    if (data) {
      // const uInt8Array = JSON.parse(data);
      // const blob = new Blob(uInt8Array);

      setAvatar(data);
      setOriginalAvatar(data);
    }
  }, []);

  const handleChange = useCallback(file => setAvatar(file), []);

  let editorRef;
  const setEditorRef = (ref) => {
    editorRef = ref;
  };

  const handleSubmit = useCallback(async editedAvatarCanvas => {
    const newAvatar = editedAvatarCanvas.toDataURL();
    localStorage.setItem("avatar", newAvatar);

    await onClose(newAvatar);
  }, [onClose]);

  const handleClose = useCallback(async () => {
    await onClose(null);
    setAvatar(originalAvatar);
  }, [onClose, originalAvatar]);

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      aria-labelledby="form-edit-avatar"
      fullScreen={fullScreen}
    >
      <DialogTitle>{t("User.Avatar")}</DialogTitle>
      <DialogContent>

        <Dropzone
          onDrop={acceptedFiles => handleChange(acceptedFiles[0])}
          noClick
          noKeyboard
        >
          {({ getRootProps, getInputProps }) => (
            <div {...getRootProps()} className={classes.rootDiv}>
              <AvatarEditor
                ref={setEditorRef}
                image={avatar}
                width={250}
                height={250}
                border={50}
                color={[255, 255, 255, 0.6]} // RGBA
                // scale={1.2} TODO
                rotate={0}
                borderRadius={50}
                style={{
                  width: "100%",
                  height: "auto",
                  maxWidth: "100vh",
                  margin: "auto"
                }}
              />
              <input {...getInputProps()} />
            </div>
          )}
        </Dropzone>


      </DialogContent>

      <DialogActions>

        <div className={classes.browseButton}>
          <UploadButton onChange={(e) => handleChange(e.target.files[0])} />
        </div>

        <Button onClick={handleClose} color="primary">
          {t("Buttons.Cancel")}
        </Button>
        <Button type="submit" color="primary" onClick={() => handleSubmit(editorRef.getImageScaledToCanvas())}>
          {t("Buttons.Submit")}
        </Button>
      </DialogActions>

    </Dialog>
  );
};

export default Editor;
