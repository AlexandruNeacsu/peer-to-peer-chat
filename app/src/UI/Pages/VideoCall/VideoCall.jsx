import React, { useCallback, useEffect, useRef, useState } from "react";
import Draggable from "react-draggable";
import Paper from "@material-ui/core/Paper";
import { makeStyles } from "@material-ui/core/styles";
import CallEndIcon from "@material-ui/icons/CallEnd";
import MicOffIcon from "@material-ui/icons/MicOff";
import MicIcon from '@material-ui/icons/Mic';
import TabUnselectedIcon from "@material-ui/icons/TabUnselected";
import AspectRatioIcon from "@material-ui/icons/AspectRatio";
import VideocamIcon from '@material-ui/icons/Videocam';
import VideocamOffIcon from '@material-ui/icons/VideocamOff';
import Fab from "@material-ui/core/Fab";
import IconButton from "@material-ui/core/IconButton";
import UserAvatar from "../../Components/UserAvatar";

const useStyles = makeStyles(theme => ({
  small: {
    position: "absolute",
    padding: theme.spacing(1),
    width: "300px",
    height: "300px",
    zIndex: theme.zIndex.appBar + 1,
  },
  large: {
    position: "absolute",
    padding: theme.spacing(1),
    width: "100%",
    height: "100%",
    zIndex: theme.zIndex.appBar + 1,
  },
  sizeControl: {
    position: "absolute",
    right: 0,
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
}));


const VideoCall = ({ stream, contact, isReceivingVideo, bounds, onEnd, onVideoChange, onMicrophoneChange }) => {
  const classes = useStyles();

  const [expanded, setExpanded] = useState(false);
  const [hasSound, setHasSound] = useState(true);
  const [showVideo, setShowVideo] = useState(isReceivingVideo);
  const [hasCamera, setHasCamera] = useState(false);

  const ref = useRef();

  useEffect(() => {
    async function checkForCamera() {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasCamera = devices.some(device => 'videoinput' === device.kind);

      setHasCamera(hasCamera);
    }

    checkForCamera();
  }, []);

  useEffect(() => {
    ref.current.srcObject = stream;
    ref.current.play();
  }, [stream]);


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

  console.log(isReceivingVideo)


  return (
    <Draggable bounds={bounds} position={expanded ? { x: 0, y: 0 } : undefined} disabled={expanded}>
      <Paper className={expanded ? classes.large : classes.small} elevation={3} variant="outlined">

        <IconButton className={classes.sizeControl} onClick={() => setExpanded(prevState => !prevState)}>
          {expanded ? <TabUnselectedIcon /> : <AspectRatioIcon />}
        </IconButton>

        <UserAvatar
          className={expanded && !isReceivingVideo ? classes.avatar : undefined}
          username={contact.username}
          image={contact.avatar}
          showUsername
        />

        {
          isReceivingVideo ? (
            <video ref={ref} autoPlay width="128" height="128" />
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
            {hasSound ? <MicIcon /> : <MicOffIcon />}
          </Fab>

          <Fab className={classes.controlLeftMargin} color="secondary" aria-label="add" onClick={onEnd}>
            <CallEndIcon />
          </Fab>

          {
            hasCamera ? (
                <Fab color="secondary" aria-label="add" onClick={handleVideoChange}>
                  {showVideo ? <VideocamOffIcon /> : <VideocamIcon />}
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
