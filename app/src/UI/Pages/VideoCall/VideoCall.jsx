import React, { useEffect, useRef, useState } from "react";

const VideoCall = ({ stream, isVideo}) => {
  const ref = useRef();

  useEffect(() => {
    ref.current.srcObject = stream;
    ref.current.play();
  }, [stream]);


  return (
    <div className="participant">
      {/*<h3>{participant.identity}</h3>*/}

      {
        isVideo ? (
          <video ref={ref} autoPlay width="128" height="128" />
        ) : (
          <audio ref={ref} autoPlay />
        )
      }
    </div>
  );
};

export default VideoCall;