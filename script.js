
const API_BASE = "https://YOUR-BACKEND.onrender.com";

const videoURL = document.getElementById("videoURL");
const previewBtn = document.getElementById("previewBtn");
const clearBtn = document.getElementById("clearBtn");
const statusBox = document.getElementById("status");
const previewArea = document.getElementById("previewArea");
const videoPreview = document.getElementById("videoPreview");
const videoName = document.getElementById("videoName");
const downloadBtn = document.getElementById("downloadBtn");
const buttonText = document.getElementById("buttonText");

let currentURL = "";
let currentDirectVideo = false;

function showStatus(message, success = false) {
  statusBox.textContent = message;
  statusBox.className = success
    ? "status success"
    : "status";
}

function detectPlatform(url) {
  const host = new URL(url).hostname.toLowerCase();

  if (host === "youtu.be" ||
      host === "youtube.com" ||
      host.endsWith(".youtube.com")) return "YouTube";

  if (host === "instagram.com" ||
      host.endsWith(".instagram.com")) return "Instagram";

  if (host === "tiktok.com" ||
      host.endsWith(".tiktok.com")) return "TikTok";

  if (host === "facebook.com" ||
      host.endsWith(".facebook.com") ||
      host === "fb.watch") return "Facebook";

  if (host === "x.com" ||
      host === "twitter.com" ||
      host.endsWith(".x.com")) return "X";

  return "Other";
}

function isDirectVideo(url) {
  return /\.(mp4|webm|mov|m4v)$/i.test(
    new URL(url).pathname
  );
}

function getFileName(url) {
  try {
    return decodeURIComponent(
      new URL(url).pathname.split("/").pop()
    ) || "video";
  } catch {
    return "video";
  }
}

async function inspectWithBackend(url) {
  if (API_BASE.includes("YOUR-BACKEND")) {
    return null;
  }

  const response = await fetch(`${API_BASE}/api/inspect`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ url })
  });

  if (!response.ok) {
    throw new Error("Backend inspection failed.");
  }

  return response.json();
}

previewBtn.addEventListener("click", async () => {
  const url = videoURL.value.trim();

  if (!url) {
    showStatus("Please paste a video link first.");
    return;
  }

  let parsed;

  try {
    parsed = new URL(url);
  } catch {
    showStatus("Please enter a valid URL.");
    return;
  }

  if (!["https:", "http:"].includes(parsed.protocol) ||
      parsed.username || parsed.password) {
    showStatus("Only valid HTTP/HTTPS links are supported.");
    return;
  }

  currentURL = parsed.href;
  currentDirectVideo = isDirectVideo(currentURL);

  const platform = detectPlatform(currentURL);

  previewBtn.disabled = true;
  buttonText.textContent = "Analyzing...";

  try {
    let backendResult = null;

    try {
      backendResult = await inspectWithBackend(currentURL);
    } catch {
      showStatus("Backend is currently unavailable. Using local link detection.");
    }

    if (backendResult && !backendResult.success) {
      throw new Error(backendResult.message);
    }

    const detected = backendResult?.platform || platform;

    if (!currentDirectVideo) {
      previewArea.classList.add("hidden");

      const messages = {
        YouTube: "YouTube detected. Use the official video player or authorized creator download options.",
        Instagram: "Instagram detected. Authorized media access is required for downloadable files.",
        TikTok: "TikTok detected. Use supported official media integrations.",
        Facebook: "Facebook detected. Authorized media access is required.",
        X: "X detected. Video download depends on creator permissions and supported access.",
        Other: "Source detected. A direct video file URL is required for browser preview."
      };

      showStatus(messages[detected] || messages.Other);
      return;
    }

    videoPreview.pause();
    videoPreview.removeAttribute("src");
    videoPreview.load();

    videoPreview.src = currentURL;
    videoName.textContent = getFileName(currentURL);

    previewArea.classList.remove("hidden");

    videoPreview.onerror = () => {
      showStatus(
        "Video preview failed. The  may block browser playback or require authentication."
      );
      previewArea.classList.add("hidden");
    };

    videoPreview.onloadedmetadata = () => {
      showStatus("Video is ready for preview.", true);
    };

    showStatus("Direct video file detected. Loading preview...", true);

    previewArea.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });

  } catch (error) {
    showStatus(error.message || "Something went wrong.");
  } finally {
    previewBtn.disabled = false;
    buttonText.textContent = "Analyze Link";
  }
});

downloadBtn.addEventListener("click", async () => {
  if (!currentURL || !currentDirectVideo) {
    showStatus("Please select a supported direct video URL.");
    return;
  }

  downloadBtn.disabled = true;
  downloadBtn.textContent = "Preparing...";

  try {
    const response = await fetch(currentURL);

    if (!response.ok) {
      throw new Error("The video  rejected the download.");
    }

    const blob = await response.blob();

    if (!blob.type.startsWith("video/")) {
      throw new Error("The URL did not return a video file.");
    }

    const blobURL = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = blobURL;
    link.download = getFileName(currentURL) || "video.mp4";

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(blobURL), 60000);

    showStatus("Your video download has started.", true);

  } catch (error) {
    showStatus(
      "Download failed. The source may block cross-origin requests (CORS). A compatible authorized download source is required."
    );
  } finally {
    downloadBtn.disabled = false;
    downloadBtn.textContent = "↓ Download Video";
  }
});

clearBtn.addEventListener("click", () => {
  videoURL.value = "";
  currentURL = "";
  currentDirectVideo = false;

  videoPreview.pause();
  videoPreview.removeAttribute("src");
  videoPreview.load();

  previewArea.classList.add("hidden");
  showStatus("");
});

videoURL.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    previewBtn.click();
  }
});
