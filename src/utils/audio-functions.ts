/**
 *
 * @param connection RTC peer connection to get audio level from
 * @returns Number | 'no audio' string | undefined
 *
 * @description Uses getSynchronizationSources on the provided peer connection to determine the current incoming audio level. It is intended that this function be called repeatedly to determine if a user is speaking.
 */
export const getIncomingAudioLevel = (connection: RTCPeerConnection) => {
  try {
    const receiver = connection
      .getReceivers()
      .find((e) => e.track.kind === "audio");
    if (receiver && receiver.getSynchronizationSources) {
      const source = receiver.getSynchronizationSources()[0];
      if (source) return source.audioLevel;
      return "no audio level received";
    }
  } catch (err) {
    console.error(
      `failed to get incoming audio level (getIncomingAudioLevel): ${err}`
    );
  }
};

/**
 *
 * @param connection RTC peer connection to get audio level from <somewhere>
 * @returns Number | 'no audio' string | undefined
 *
 * @description AWAITING IMPLEMENTATION
 */
export const getOutgoingAudioLevel = (connection: RTCPeerConnection) => {
  try {
  } catch (err) {
    console.error(`failed to get audio level (getAudioLevel): ${err}`);
  }
};

/**
 *
 * @param stream MediaStream
 *
 * @description Sets the 'enabled' property on the MediaStream object to false.
 */
export const muteMediaStream = (stream: MediaStream) => {
  stream.getAudioTracks()[0].enabled = false;
};

/**
 *
 * @param stream MediaStream
 *
 * @description Sets the 'enabled' property on the MediaStream object to true.
 */
export const unmuteMediaStream = (stream: MediaStream) => {
  stream.getAudioTracks()[0].enabled = true;
};
