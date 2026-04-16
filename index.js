import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors({ 
  origin: process.env.FRONTEND_URL 
    ? process.env.FRONTEND_URL.split(',')
    : ["http://localhost:3000", "https://marketing-agent-client-umber.vercel.app"],
  credentials: true
}));
app.use(express.json({ limit: "20mb" }));

const PORT = process.env.PORT || 4000;

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/health", (_, res) => res.json({ ok: true }));

// ─── Claude (text) ────────────────────────────────────────────────────────────
app.post("/api/claude", async (req, res) => {
 try {
 const { messages, system, max_tokens = 1200 } = req.body;
 const response = await fetch("https://api.anthropic.com/v1/messages", {
 method: "POST",
 headers: {
 "Content-Type": "application/json",
 "x-api-key": process.env.ANTHROPIC_API_KEY,
 "anthropic-version": "2023-06-01",
 },
 body: JSON.stringify({
 model: "claude-sonnet-4-20250514",
 max_tokens,
 system,
 messages,
 }),
 });
 const data = await response.json();
 res.json(data);
 } catch (err) {
 console.error("Claude error:", err);
 res.status(500).json({ error: err.message });
 }
});

// ─── Claude Vision ────────────────────────────────────────────────────────────
app.post("/api/claude-vision", async (req, res) => {
 try {
 const { imageBase64, mimeType, prompt, system } = req.body;
 const response = await fetch("https://api.anthropic.com/v1/messages", {
 method: "POST",
 headers: {
 "Content-Type": "application/json",
 "x-api-key": process.env.ANTHROPIC_API_KEY,
 "anthropic-version": "2023-06-01",
 },
 body: JSON.stringify({
 model: "claude-sonnet-4-20250514",
 max_tokens: 1000,
 system,
 messages: [{
 role: "user",
 content: [
 { type: "image", source: { type: "base64", media_type: mimeType, data: imageBase64 } },
 { type: "text", text: prompt },
 ],
 }],
 }),
 });
 const data = await response.json();
 res.json(data);
 } catch (err) {
 console.error("Claude vision error:", err);
 res.status(500).json({ error: err.message });
 }
});

// ─── DALL-E Image Generation ──────────────────────────────────────────────────
app.post("/api/dalle", async (req, res) => {
 try {
 const { prompt, size = "1024x1024" } = req.body;
 const response = await fetch("https://api.openai.com/v1/images/generations", {
 method: "POST",
 headers: {
 "Content-Type": "application/json",
 Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
 },
 body: JSON.stringify({ model: "dall-e-3", prompt, n: 1, size }),
 });
 const data = await response.json();
 res.json(data);
 } catch (err) {
 console.error("DALL-E error:", err);
 res.status(500).json({ error: err.message });
 }
});

// ─── Kling Video Generation (submit) ─────────────────────────────────────────
app.post("/api/kling/generate", async (req, res) => {
 try {
 const { prompt, aspect_ratio = "9:16", duration = "5" } = req.body;
 const response = await fetch("https://api.wavespeed.ai/api/v2/wavespeed-ai/kling-v1-5/txt2video", {
 method: "POST",
 headers: {
 "Content-Type": "application/json",
 Authorization: `Bearer ${process.env.WAVESPEED_API_KEY}`,
 },
 body: JSON.stringify({ prompt, duration, aspect_ratio }),
 });
 const data = await response.json();
 res.json(data);
 } catch (err) {
 console.error("Kling generate error:", err);
 res.status(500).json({ error: err.message });
 }
});

// ─── Kling Video Poll (check status) ─────────────────────────────────────────
app.get("/api/kling/result/:id", async (req, res) => {
 try {
 const response = await fetch(
 `https://api.wavespeed.ai/api/v2/predictions/${req.params.id}/result`,
 { headers: { Authorization: `Bearer ${process.env.WAVESPEED_API_KEY}` } }
 );
 const data = await response.json();
 res.json(data);
 } catch (err) {
 console.error("Kling poll error:", err);
 res.status(500).json({ error: err.message });
 }
});

app.listen(PORT, () => console.log(`✦ MarketingAgent server running on http://localhost:${PORT}`));