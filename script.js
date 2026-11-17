
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors({
  origin: [
    "https://ranashoaib0126.github.io",
    "http://localhost:5500"
  ]
}));

app.use(express.json({ limit: "10kb" }));

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    service: "VIDORA API",
    status: "online"
  });
});

function detectPlatform(host) {
  if (host === "youtube.com" || host.endsWith(".youtube.com") ||
      host === "youtu.be") return "YouTube";

  if (host === "instagram.com" ||
      host.endsWith(".instagram.com")) return "Instagram";

  if (host === "tiktok.com" ||
      host.endsWith(".tiktok.com")) return "TikTok";

  if (host === "x.com" || host === "twitter.com" ||
      host.endsWith(".x.com")) return "X";

  if (host === "facebook.com" ||
      host.endsWith(".facebook.com") ||
      host === "fb.watch") return "Facebook";

  return "Other";
}

app.post("/api/inspect", (req, res) => {
  const { url } = req.body || {};

  if (!url || typeof url !== "string" || url.length > 2048) {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid video URL."
    });
  }

  let parsed;

  try {
    parsed = new URL(url);
  } catch {
    return res.status(400).json({
      success: false,
      message: "Invalid URL."
    });
  }

  if (!["https:", "http:"].includes(parsed.protocol) ||
      parsed.username || parsed.password) {
    return res.status(400).json({
      success: false,
      message: "Only public HTTP/HTTPS URLs are accepted."
    });
  }

  const host = parsed.hostname.toLowerCase();
  const platform = detectPlatform(host);

  const isDirectVideo =
    /\.(mp4|webm|mov|m4v)$/i.test(parsed.pathname);

  let message;

  if (isDirectVideo) {
    message = "Direct video URL detected. Preview it in VIDORA.";
  } else if (platform === "YouTube") {
    message = "YouTube link detected. Use the official video player.";
  } else if (platform === "Instagram") {
    message = "Instagram link detected. Authorized media access is required.";
  } else if (platform === "TikTok") {
    message = "TikTok link detected. Use supported official integrations.";
  } else if (platform === "X") {
    message = "X link detected. Downloads depend on creator permissions.";
  } else if (platform === "Facebook") {
    message = "Facebook link detected. Authorized media access is required.";
  } else {
    message = "Other link detected. Direct video URLs are supported.";
  }

  res.json({
    success: true,
    platform,
    isDirectVideo,
    message
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`VIDORA API running on port ${PORT}`);
});
