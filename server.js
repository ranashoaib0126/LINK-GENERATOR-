
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: [
    "https://ranashoaib0126.github.io",
    "http://localhost:5500",
    "http://127.0.0.1:5500"
  ]
}));

app.use(express.json({ limit: "10kb" }));

// Home route
app.get("/", (req, res) => {
  res.send("VIDORA Backend is Running!");
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "VIDORA Backend is Working!"
  });
});

// Detect video link
app.post("/api/inspect", (req, res) => {
  const { url } = req.body;

  if (!url || typeof url !== "string") {
    return res.status(400).json({
      success: false,
      message: "Please enter a valid video URL."
    });
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(url.trim());

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      throw new Error("Invalid protocol");
    }
  } catch {
    return res.status(400).json({
      success: false,
      message: "Invalid URL. Please check your link."
    });
  }

  const host = parsedUrl.hostname.toLowerCase();

  // Block local/private hostnames
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host === "::1" ||
    host.startsWith("192.168.") ||
    host.startsWith("10.")
  ) {
    return res.status(400).json({
      success: false,
      message: "This URL is not allowed."
    });
  }

  let platform = "Other";

  if (
    host === "youtube.com" ||
    host.endsWith(".youtube.com") ||
    host === "youtu.be"
  ) {
    platform = "YouTube";
  } else if (
    host === "instagram.com" ||
    host.endsWith(".instagram.com")
  ) {
    platform = "Instagram";
  } else if (
    host === "tiktok.com" ||
    host.endsWith(".tiktok.com")
  ) {
    platform = "TikTok";
  } else if (
    host === "facebook.com" ||
    host.endsWith(".facebook.com") ||
    host === "fb.watch"
  ) {
    platform = "Facebook";
  } else if (
    host === "x.com" ||
    host.endsWith(".x.com") ||
    host === "twitter.com" ||
    host.endsWith(".twitter.com")
  ) {
    platform = "X";
  }

  const isDirectVideo =
    /\.(mp4|webm|mov|m4v)$/i.test(parsedUrl.pathname);

  res.json({
    success: true,
    platform,
    isDirectVideo,
    downloadSupported: isDirectVideo,
    message: isDirectVideo
      ? "Direct video link detected. You can try previewing and downloading it."
      : `${platform} link detected. Download availability depends on official platform support and permissions.`
  });
});

// Unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found."
  });
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`VIDORA backend running on port ${PORT}`);
});
