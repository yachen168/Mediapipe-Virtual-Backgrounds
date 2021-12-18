import { SelfieSegmentation } from "../node_modules/@mediapipe/selfie_segmentation";
import "./style.scss";

let globalController = null;
let timestamp = null;
let stream = null;
const canvasElement = new OffscreenCanvas(640, 480);
const canvasCtx = canvasElement.getContext("2d");
const selfieSegmentation = new SelfieSegmentation({
  locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`;
  },
});

function onResults(results) {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(
    results.segmentationMask,
    0,
    0,
    canvasElement.width,
    canvasElement.height
  );

  canvasCtx.globalCompositeOperation = "source-out";
  canvasCtx.fillStyle = "#50B5FF";
  canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);

  // Only overwrite missing pixels.
  canvasCtx.globalCompositeOperation = "destination-atop";
  canvasCtx.drawImage(
    results.image,
    0,
    0,
    canvasElement.width,
    canvasElement.height
  );

  canvasCtx.restore();
  globalController.enqueue(
    new VideoFrame(canvasElement, { timestamp, alpha: "discard" })
  );
}

selfieSegmentation.setOptions({
  modelSelection: 1,
});
selfieSegmentation.onResults(onResults);

const $localVideo = document.querySelector(".localVideo");
const $turnCameraOnButton = document.querySelector(".turnCameraOnButton");
const $turnCameraOffButton = document.querySelector(".turnCameraOffButton");
const $removeBackgroundButton = document.querySelector(
  ".removeBackgroundButton"
);

bindEventListeners();

function bindEventListeners() {
  $turnCameraOnButton.addEventListener("click", turnOnCamera);
  $removeBackgroundButton.addEventListener("click", setVirtualBackground);
}

async function turnOnCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: true,
    });

    $localVideo.srcObject = stream;

    $turnCameraOffButton.addEventListener("click", turnOffCamera(stream));
  } catch (error) {
    if (
      error.name === "NotAllowedError" ||
      error.name === "PermissionDeniedError"
    ) {
      alert("Permission denied error");
    } else {
      alert("error");
    }
  }
}

function turnOffCamera(stream) {
  return () => stream.getVideoTracks().map((track) => track.stop());
}

async function setVirtualBackground() {
  const transformedStream = await transformGetUserMediaStream();
  $localVideo.srcObject = transformedStream;
}

async function transformGetUserMediaStream() {
  const videoTrack = stream.getVideoTracks()[0];
  const trackProcessor = new MediaStreamTrackProcessor({ track: videoTrack });
  const trackGenerator = new MediaStreamTrackGenerator({ kind: "video" });

  const transformer = new TransformStream({
    async transform(videoFrame, controller) {
      globalController = controller;
      timestamp = videoFrame.timestamp;
      videoFrame.width = 640;
      videoFrame.height = 480;
      await selfieSegmentation.send({ image: videoFrame });

      // would be good to have results as a response to async .send, instead a callback
      videoFrame.close();
      console.log("transform");
    },
  });

  trackProcessor.readable
    .pipeThrough(transformer)
    .pipeTo(trackGenerator.writable);

  const transformedStream = new MediaStream([trackGenerator]);
  return transformedStream;
}
