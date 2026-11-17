
/* =========================
   VIDORA FRONTEND
========================= */

// IMPORTANT:
// Local testing: uses localhost automatically.
// Live website: replace the Render URL below with your backend URL.

const API_BASE_URL =
  ["localhost", "127.0.0.1"].includes(window.location.hostname)
    ? "http://localhost:10000"
    : "https://YOUR-RENDER-BACKEND.onrender.com";

// HTML ELEMENTS

const videoForm = document.getElementById("videoForm");
const videoURL = document.getElementById("videoURL");
const previewBtn = document.getElementById("previewBtn");
const buttonText = document.getElementById("buttonText");
const clearBtn = document.getElementById("clearBtn");
const statusBox = document.getElementById("status");
const previewArea = document.getElementById("previewArea");
const videoPreview = document.getElementById("videoPreview");
const videoName = document.getElementById("videoName");
const downloadBtn = document.getElementById("downloadBtn");

let currentVideoURL = "";
let isDirectVideo = false;

// SHOW STATUS

function showStatus(message, type = "") {
  statusBox.textContent = message;
  statusBox.className = "status-message";

  if (type) {
    statusBox.classList.add(type);
  }
}

// GET FILE NAME

function getFileName(url) {
  try {
    const pathname = new URL(url).pathname;
    const name = decodeURIComponent(pathname.split("/").pop());

    return name || "Your Video";
  } catch {
    return "Your Video";
  }
}

// LOADING STATE

function setLoading(loading) {
  previewBtn.disabled = loading;
  buttonText.textContent = loading ? "Analyzing..." : "Analyze Link";
}

// CLEAR PREVIOUS PREVIEW

function resetPreview() {
  videoPreview.pause();
  videoPreview.removeAttribute("src");
  videoPreview.load();

  previewArea.classList.add("hidden");

  currentVideoURL = "";
  isDirectVideo = false;
}

// VALIDATE URL ON FRONTEND

function isValidURL(value) {
  try {
    const url = new URL(value);

    return (
      ["http:", "https:"].includes(url.protocol) &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

// ANALYZE LINK

async function analyzeVideo() {
  const url = videoURL.value.trim();

  resetPreview();

  if (!url) {
    showStatus("Please paste a video link first.", "error");
    videoURL.focus();
    return;
  }

  if (!isValidURL(url)) {
    showStatus("Please enter a valid HTTP or HTTPS URL.", "error");
    return;
  }

  setLoading(true);
  showStatus("Analyzing your video link...");

  try {
    const response = await fetch(`${API_BASE_URL}/api/inspect`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ url })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Unable to analyze this link.");
    }

    showStatus(data.message, "success");

    if (data.isDirectVideo) {
      currentVideoURL = url;
      isDirectVideo = true;

      videoPreview.src = url;
      videoName.textContent = getFileName(url);

      previewArea.classList.remove("hidden");

      videoPreview.onerror = () => {
        resetPreview();
        showStatus(
          "This video cannot be previewed. The source may block browser access or the file may be unavailable.",
          "error"
        );
      };

      previewArea.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });

    } else {
      resetPreview();
    }

  } catch (error) {
    console.error("VIDORA Error:", error);

    showStatus(
      error.message.includes("Failed to fetch")
        ? "Cannot connect to VIDORA server. Check your backend URL and server status."
        : error.message,
      "error"
    );

  } finally {
    setLoading(false);
  }
}

// FORM SUBMISSION

videoForm.addEventListener("submit", (event) => {
  event.preventDefault();
  analyzeVideo();
});

// CLEAR BUTTON

clearBtn.addEventListener("click", () => {
  videoURL.value = "";
  resetPreview();
  showStatus("");
  videoURL.focus();
});

// DOWNLOAD BUTTON

downloadBtn.addEventListener("click", () => {
  if (!currentVideoURL || !isDirectVideo) {
    showStatus("No downloadable direct video is available.", "error");
    return;
  }

  const downloadURL =
    `${API_BASE_URL}/api/download?url=${encodeURIComponent(currentVideoURL)}`;

  showStatus("Preparing your video download...", "success");

  // The backend streams the authorized direct video file.
  window.location.href = downloadURL;
});

// ENTER KEY IS HANDLED BY THE FORM

videoURL.addEventListener("input", () => {
  if (statusBox.textContent) {
    showStatus("");
  }
});

// CHECK BACKEND CONNECTION

async function checkServer() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error("Server unavailable");
    }

    console.log("VIDORA server connected:", data.service);

  } catch (error) {
    console.warn("VIDORA backend is not connected yet:", error.message);
  }
}

checkServer();
