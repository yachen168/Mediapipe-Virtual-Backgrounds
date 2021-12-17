import "./style.scss";

const $localVideo = document.querySelector(".localVideo");
const $turnCameraOnButton = document.querySelector(".turnCameraOnButton");
const $turnCameraOffButton = document.querySelector(".turnCameraOffButton");

bindEventListeners();

function bindEventListeners() {
  $turnCameraOnButton.addEventListener("click", turnOnCamera);
}

async function turnOnCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    $localVideo.srcObject = stream;
    $localVideo.play();

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
