import React, { useCallback, useEffect, useRef, useState } from "react";
import Draggable from "react-draggable";
import Paper from "@material-ui/core/Paper";
import { makeStyles } from "@material-ui/core/styles";
import CallEndIcon from "@material-ui/icons/CallEnd";
import MicOffIcon from "@material-ui/icons/MicOff";
import MicIcon from "@material-ui/icons/Mic";
import TabUnselectedIcon from "@material-ui/icons/TabUnselected";
import AspectRatioIcon from "@material-ui/icons/AspectRatio";
import VideocamIcon from "@material-ui/icons/Videocam";
import VideocamOffIcon from "@material-ui/icons/VideocamOff";
import Fab from "@material-ui/core/Fab";
import IconButton from "@material-ui/core/IconButton";
import UserAvatar from "../../Components/UserAvatar";
import red from "@material-ui/core/colors/red";

const useStyles = makeStyles(theme => ({
  small: {
    display: "flex",
    flexDirection: "column",
    position: "absolute",
    padding: theme.spacing(1),
    maxWidth: "300px",
    maxHeight: "300px",
    zIndex: theme.zIndex.appBar + 1,
  },
  large: {
    display: "flex",
    flexDirection: "column",
    position: "absolute",
    padding: theme.spacing(1),
    width: "100vw",
    height: "100vh",
    zIndex: theme.zIndex.appBar + 1,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
  },
  controls: {
    display: "flex",
    position: "absolute",
    left: "50%",
    bottom: "0",
    transform: "translate(-50%, -50%)",
  },
  controlLeftMargin: {
    marginRight: theme.spacing(2),
  },
  avatar: {
    bottom: "50%",
    left: "50%",
    position: "absolute",
    transform: "translate(-50 %, -50 %)",
  },
  video: {
    maxWidth: "100%",
    height: "auto",
    flexGrow: 1,
  },
  red: {
    color: red[500],
  },
}));


const VideoCall = ({ stream, contact, isReceivingVideo, bounds, onEnd, onVideoChange, onMicrophoneChange }) => {
  const classes = useStyles();

  const [expanded, setExpanded] = useState(false);
  const [hasSound, setHasSound] = useState(true);
  const [showVideo, setShowVideo] = useState(false);
  const [hasCamera, setHasCamera] = useState(false);

  const ref = useRef();

  useEffect(() => {
    async function checkForCamera() {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasCamera = devices.some(device => device.kind === "videoinput");

      setHasCamera(hasCamera);
    }

    checkForCamera();
  }, []);

  useEffect(() => {
    ref.current.srcObject = stream;
    ref.current.play();
  }, [isReceivingVideo, stream]);


  const handleMicrophoneChange = useCallback(() => {
    setHasSound(prevState => {
      const newValue = !prevState;

      onMicrophoneChange(newValue);

      return newValue;
    });
  }, [onMicrophoneChange]);

  const handleVideoChange = useCallback(() => {
    setShowVideo(prevState => {
      const newValue = !prevState;

      onVideoChange(newValue);

      return newValue;
    });
  }, [onVideoChange]);

  return (
    <Draggable bounds={bounds} position={expanded ? { x: 0, y: 0 } : undefined} disabled={expanded}>
      <Paper className={expanded ? classes.large : classes.small} elevation={3} variant="outlined">

        <div className={classes.header}>
          <UserAvatar
            className={expanded && !isReceivingVideo ? classes.avatar : undefined}
            username={contact.username}
            image={contact.avatar}
            showUsername
          />

          <IconButton onClick={() => setExpanded(prevState => !prevState)}>
            {expanded ? <TabUnselectedIcon /> : <AspectRatioIcon />}
          </IconButton>
        </div>

        {
          isReceivingVideo ? (
            <video autoPlay className={classes.video} ref={ref} />
          ) : (
            <audio ref={ref} autoPlay />
          )
        }


        <div className={classes.controls}>
          <Fab
            className={classes.controlLeftMargin}
            color="secondary"
            aria-label="add"
            onClick={handleMicrophoneChange}
          >
            {hasSound ? <MicIcon /> : <MicOffIcon className={classes.red} />}
          </Fab>

          <Fab className={classes.controlLeftMargin} color="secondary" aria-label="add" onClick={onEnd}>
            <CallEndIcon className={classes.red} />
          </Fab>

          {
            hasCamera ? (
                <Fab color="secondary" aria-label="add" onClick={handleVideoChange}>
                  {showVideo ? <VideocamOffIcon className={classes.red} /> : <VideocamIcon />}
                </Fab>
              )
              : null
          }
        </div>

      </Paper>
    </Draggable>
  );
};

export default VideoCall;
