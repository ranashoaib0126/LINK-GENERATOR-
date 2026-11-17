
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: [
    "https://ranashoaib0126.github.io",
    "http://localhost:5500"
  ]
}));

app.use(express.json());

app.get("/", (req, res) => {
  res.send("VIDORA Backend is Running!");
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "VIDORA Backend is Working!"
  });
});

app.post("/api/inspect", (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({
      success: false,
      message: "Please provide a video URL."
    });
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(url);

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      throw new Error("Invalid protocol");
    }
  } catch {
    return res.status(400).json({
      success: false,
      message: "Invalid URL."
    });
  }

  const host = parsedUrl.hostname.toLowerCase();
  let platform = "Other";

  if (host === "youtube.com" || host.endsWith(".youtube.com") || host === "youtu.be") {
    platform = "YouTube";
  } else if (host === "instagram.com" || host.endsWith(".instagram.com")) {
    platform = "Instagram";
  } else if (host === "tiktok.com" || host.endsWith(".tiktok.com")) {
    platform = "TikTok";
  } else if (host === "facebook.com" || host.endsWith(".facebook.com") || host === "fb.watch") {
    platform = "Facebook";
  } else if (host === "x.com" || host.endsWith(".x.com") || host === "twitter.com" || host.endsWith(".twitter.com")) {
    platform = "X";
  }

  const isDirectVideo = /\.(mp4|webm|mov|m4v)$/i.test(parsedUrl.pathname);

  res.json({
    success: true,
    platform,
    isDirectVideo,
    message: isDirectVideo
      ? "Direct video link detected."
      : "Link detected. Download availability depends on the platform and its permissions."
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`VIDORA backend running on port ${PORT}`);
});

