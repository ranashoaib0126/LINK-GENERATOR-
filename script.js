
// =====================================
// VIDORA - FRONTEND JAVASCRIPT
// =====================================

// IMPORTANT: Replace this with your actual Railway URL.
const API_BASE = "https://YOUR-RAILWAY-DOMAIN.up.railway.app";

// Find website elements
const urlInput =
  document.querySelector("#videoUrl") ||
  document.querySelector("#urlInput") ||
  document.querySelector("#videoLink") ||
  document.querySelector('input[type="url"]') ||
  document.querySelector("input");

const analyzeButton =
  document.querySelector("#analyzeBtn") ||
  document.querySelector("#analyze") ||
  document.querySelector("#generateBtn");

const downloadButton =
  document.querySelector("#downloadBtn") ||
  document.querySelector("#download");

const videoPlayer =
  document.querySelector("#videoPlayer") ||
  document.querySelector("#videoPreview video") ||
  document.querySelector("video");

const statusElement =
  document.querySelector("#statusMessage") ||
  document.querySelector("#status") ||
  document.querySelector("#result");

// Create a status message if HTML doesn't already have one
function showStatus(message, type = "info") {
  let element = statusElement;

  if (!element) {
    element = document.createElement("p");
    element.id = "vidoraStatus";
    element.style.marginTop = "15px";
    element.style.fontSize = "14px";

    const parent = urlInput?.parentElement || document.body;
    parent.appendChild(element);
  }

  element.textContent = message;
  element.style.color =
    type === "error" ? "#ff5252" :
    type === "success" ? "#22c55e" : "#ffffff";
}

// Check URL
function getVideoUrl() {
  const value = urlInput?.value?.trim();

  if (!value) {
    showStatus("Please paste a video link first.", "error");
    return null;
  }

  try {
    const parsed = new URL(value);

    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("Invalid protocol");
    }

    return parsed.href;
  } catch {
    showStatus("Please enter a valid URL.", "error");
    return null;
  }
}

// Ask backend to inspect the URL
async function inspectVideo() {
  const url = getVideoUrl();
  if (!url) return;

  showStatus("Checking your video link...");

  try {
    const response = await fetch(`${API_BASE}/api/inspect`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ url })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Could not inspect this link.");
    }

    showStatus(
      `${data.platform}: ${data.message}`,
      data.isDirectVideo ? "success" : "info"
    );

    if (data.isDirectVideo) {
      previewVideo(url);
    } else {
      showStatus(
        `${data.platform} link detected. This link needs an authorized platform integration; it cannot be downloaded by this basic version.`
      );
    }
  } catch (error) {
    console.error("VIDORA error:", error);
    showStatus(
      "Could not connect to the backend. Check your Railway URL and deployment.",
      "error"
    );
  }
}

// Preview direct video
function previewVideo(url) {
  if (!videoPlayer) {
    showStatus(
      "Direct video detected. Your HTML needs a video element for preview.",
      "success"
    );
    return;
  }

  videoPlayer.src = url;
  videoPlayer.load();

  videoPlayer.style.display = "block";
  showStatus("Video detected. Loading preview...", "success");
}

// Download direct video
async function downloadVideo() {
  const url = getVideoUrl();
  if (!url) return;

  showStatus("Checking video download...");

  try {
    const parsed = new URL(url);
    const isVideoFile = /\.(mp4|webm|mov|m4v)$/i.test(parsed.pathname);

    if (!isVideoFile) {
      showStatus(
        "This is not a direct video file link. Use a source that provides an authorized download.",
        "error"
      );
      return;
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Video could not be downloaded.");
    }

    const blob = await response.blob();

    if (!blob.type.startsWith("video/")) {
      throw new Error("The link did not return a video file.");
    }

    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = blobUrl;
    link.download = "VIDORA-video.mp4";

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);

    showStatus("Your video download has started!", "success");
  } catch (error) {
    console.error("Download error:", error);

    showStatus(
      "Download blocked. The video host may not allow browser downloads (CORS). Try an authorized download link.",
      "error"
    );
  }
}

// Connect buttons
if (analyzeButton) {
  analyzeButton.addEventListener("click", inspectVideo);
}

if (downloadButton) {
  downloadButton.addEventListener("click", downloadVideo);
}

// Also support pressing Enter in the input
if (urlInput) {
  urlInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      inspectVideo();
    }
  });
}

// Support forms
const videoForm = document.querySelector("#videoForm");

if (videoForm) {
  videoForm.addEventListener("submit", (event) => {
    event.preventDefault();
    inspectVideo();
  });
}

console.log("VIDORA frontend JavaScript loaded.");
