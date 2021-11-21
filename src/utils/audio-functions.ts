/**
 *
 * @param analyser web audio analyser node
 * @param audioData Uint8Array containing analyser.frequencyBinCount
 * @returns number (on error, returns -1)
 *
 * @description Calls getByteFrequencyData on audioData and reduces the array by the following calculation; sum += item * item. The sum is then divided by the length of the array to give the mean square. The square root of the mean square is then taken to determine the root mean square, which is then returned. It is intended that this function be called repeatedly to determine if a user is speaking.
 */
export const getOutgoingAudioLevel = (
  analyser: AnalyserNode,
  audioData: Uint8Array
): number => {
  try {
    analyser.getByteFrequencyData(audioData);
    let sum = 0.0;
    for (let i = 0, j = audioData.length; i < j; i++) {
      sum += audioData[i] * audioData[i];
    }
    const audioLevel = Math.sqrt(sum / audioData.length);

    return audioLevel;
  } catch (err) {
    console.error(
      `failed to get outgoing audio level (getOutgoingAudioLevel): ${err}`
    );
    return -1;
  }
};

/**
 *
 * @param connection RTC peer connection to get audio level from
 * @returns number | undefined
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
      return undefined;
    }
  } catch (err) {
    console.error(
      `failed to get incoming audio level (getIncomingAudioLevel): ${err}`
    );
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
