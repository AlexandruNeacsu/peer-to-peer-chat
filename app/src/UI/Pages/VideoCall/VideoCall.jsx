import React, { useEffect, useRef, useState } from "react";

const VideoCall = ({ stream }) => {
  const ref = useRef();

  const [isVideo, setIsVideo] = useState(false);


  useEffect(() => {
    const hasVideo = stream.getVideoTracks()[0];

    if (hasVideo) {
      setIsVideo(true);
    }

    ref.current.srcObject = stream;
  }, [stream]);


  return (
    <div className="participant">
      {/*<h3>{participant.identity}</h3>*/}

      {
        isVideo ? (
          <video ref={ref} autoPlay />
        ) : (
          <audio ref={ref} autoPlay />
        )
      }
    </div>
  );
};

export default VideoCall;