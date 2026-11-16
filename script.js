
const videoURL = document.getElementById("videoURL");
const previewBtn = document.getElementById("previewBtn");
const clearBtn = document.getElementById("clearBtn");
const statusBox = document.getElementById("status");
const previewArea = document.getElementById("previewArea");
const videoPreview = document.getElementById("videoPreview");
const downloadBtn = document.getElementById("downloadBtn");
const videoName = document.getElementById("videoName");

let currentURL = "";

function showStatus(message, type = "error") {
  statusBox.textContent = message;
  statusBox.style.color =
    type === "success" ? "#4ade80" : "#ff858b";
}

function getFileName(url) {
  try {
    const pathname = new URL(url).pathname;
    return decodeURIComponent(pathname.split("/").pop()) || "video";
  } catch {
    return "video";
  }
}

previewBtn.addEventListener("click", () => {
  const url = videoURL.value.trim();

  if (!url) {
    showStatus("Please paste a video URL first.");
    return;
  }

  let parsedURL;

  try {
    parsedURL = new URL(url);
  } catch {
    showStatus("Please enter a valid URL.");
    return;
  }

  if (!["http:", "https:"].includes(parsedURL.protocol)) {
    showStatus("Only HTTP and HTTPS links are supported.");
    return;
  }

  currentURL = parsedURL.href;

  showStatus("Loading video preview...", "success");

  previewArea.classList.remove("hidden");
  videoPreview.pause();
  videoPreview.removeAttribute("src");
  videoPreview.load();

  videoPreview.src = currentURL;
  videoName.textContent = getFileName(currentURL);

  videoPreview.onloadedmetadata = () => {
    showStatus("Video loaded successfully!", "success");
  };

  videoPreview.onerror = () => {
    showStatus(
      "Video could not be played. Use a direct, browser-compatible video file URL."
    );
  };

  previewArea.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
});

clearBtn.addEventListener("click", () => {
  videoURL.value = "";
  currentURL = "";

  videoPreview.pause();
  videoPreview.removeAttribute("src");
  videoPreview.load();

  previewArea.classList.add("hidden");
  showStatus("");
});

downloadBtn.addEventListener("click", async () => {
  if (!currentURL) {
    showStatus("Please preview a video first.");
    return;
  }

  const originalText = downloadBtn.textContent;

  try {
    downloadBtn.disabled = true;
    downloadBtn.textContent = "Preparing download...";

    const response = await fetch(currentURL);

    if (!response.ok) {
      throw new Error("Download request failed.");
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

    showStatus("Download started successfully!", "success");

  } catch (error) {
    showStatus(
      "Download blocked. The video server may not allow cross-origin downloads (CORS). Try a direct downloadable video URL or a backend."
    );
  } finally {
    downloadBtn.disabled = false;
    downloadBtn.textContent = originalText;
  }
});

videoURL.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    previewBtn.click();
  }
});


