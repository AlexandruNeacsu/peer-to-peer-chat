import React, { useCallback, useEffect, useRef, useState } from "react";
import Draggable from "react-draggable";
import clsx from "clsx";
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
import red from "@material-ui/core/colors/red";
import green from "@material-ui/core/colors/green";
import UserAvatar from "../../Components/UserAvatar";
import Loader from "../../Components/Loader";

const useStyles = makeStyles(theme => ({
  small: {
    display: "flex",
    flexDirection: "column",
    position: "fixed",
    padding: theme.spacing(1),
    width: "300px",
    height: "300px",
    zIndex: theme.zIndex.appBar + 1,
  },
  large: {
    display: "flex",
    flexDirection: "column",
    position: "fixed",
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
    transform: "translate(-50%, 50%)",
  },
  video: {
    maxWidth: "100%",
    height: "auto",
    flexGrow: 1,
  },
  red: {
    backgroundColor: red[500],
  },
  green: {
    backgroundColor: green[500],
  },
  box: {
    flexGrow: 1,
  },
}));


const VideoCall = ({ stream, contact, loading: isLoading, isReceivingVideo, isShowingVideo, hasCamera, bounds, onEnd, onVideoChange, onMicrophoneChange }) => {
  const classes = useStyles();

  const [expanded, setExpanded] = useState(false);
  const [hasSound, setHasSound] = useState(true);
  const [showVideo, setShowVideo] = useState(isShowingVideo);

  const ref = useRef();

  useEffect(() => {
    if (!isLoading) {
      ref.current.srcObject = stream;
      ref.current.play();
    }
  }, [isLoading, isReceivingVideo, stream]);


  const handleMicrophoneChange = useCallback(async () => {
    try {
      const newValue = await onMicrophoneChange();

      setHasSound(newValue);
    } catch (error) {
      // TODO
      console.log(error);
      console.log(error.message())
    }
  }, [onMicrophoneChange]);

  const handleVideoChange = useCallback(async () => {
    try {
      const newValue = await onVideoChange();

      setShowVideo(newValue);
    } catch (error) {
      // TODO
      console.log(error);
      console.log(error.message);
    }
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

          <div className={expanded && !isReceivingVideo ? classes.box : undefined} />

          <IconButton onClick={() => setExpanded(prevState => !prevState)}>
            {expanded ? <TabUnselectedIcon /> : <AspectRatioIcon />}
          </IconButton>
        </div>

        <Loader isLoading={isLoading}>
          {
            isReceivingVideo ? (
              <video autoPlay className={classes.video} ref={ref} />
            ) : (
              <audio ref={ref} autoPlay />
            )
          }
        </Loader>


        {/* TODO add aria-label to fabs */}
        <div className={classes.controls}>
          {
            hasCamera
              ? (
                <Fab
                  className={showVideo ? classes.green : classes.red}
                  onClick={handleVideoChange}
                  disabled={isLoading}
                >
                  {showVideo ? <VideocamIcon /> : <VideocamOffIcon />}
                </Fab>
              )
              : null
          }

          <Fab
            className={clsx({ [classes.controlLeftMargin]: true, [classes.red]: !hasSound, [classes.green]: hasSound })}
            color="secondary"
            aria-label="add"
            onClick={handleMicrophoneChange}
            disabled={isLoading}
          >
            {hasSound ? <MicIcon /> : <MicOffIcon />}
          </Fab>

          <Fab className={clsx(classes.controlLeftMargin, classes.red)} onClick={onEnd}>
            <CallEndIcon />
          </Fab>
        </div>

      </Paper>
    </Draggable>
  );
};

export default VideoCall;
