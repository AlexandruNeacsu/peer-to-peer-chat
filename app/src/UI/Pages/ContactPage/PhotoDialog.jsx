import React from "react";
import DialogContent from "@material-ui/core/DialogContent";
import Dialog from "@material-ui/core/Dialog";
import { makeStyles } from "@material-ui/core/styles";
import IconButton from "@material-ui/core/IconButton";
import GetAppIcon from "@material-ui/icons/GetApp";


const useStyles = makeStyles(() => ({
  wrapper: {
    display: "flex",
  },
  button: {
    position: "absolute",
    right: 0,
    transform: "translate(-50%)",
  },
}));

const PhotoDialog = ({ open, image, onClose, onDownload }) => {
  const classes = useStyles();

  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="form-dialog-title" maxWidth="lg">
      <DialogContent className={classes.content}>
        <IconButton onClick={onDownload} onTouchStart={onDownload} color="primary" className={classes.button}>
          <GetAppIcon />
        </IconButton>
        <div className={classes.wrapper}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <img src={image} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PhotoDialog;
