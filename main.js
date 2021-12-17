import "./style.scss";

const $localVideo = document.querySelector(".localVideo");
const $turnCameraOnButton = document.querySelector(".turnCameraOnButton");
const $turnCameraOffButton = document.querySelector(".turnCameraOffButton");

bindEventListeners();

function bindEventListeners() {
  $turnCameraOnButton.addEventListener("click", turnOnCamera);
}

async function turnOnCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  $localVideo.srcObject = stream;
  $localVideo.play();

  $turnCameraOffButton.addEventListener("click", turnOffCamera(stream));
}

function turnOffCamera(stream) {
  return () => stream.getVideoTracks().map((track) => track.stop());
}
