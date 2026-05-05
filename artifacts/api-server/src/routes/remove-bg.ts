import { Router } from "express";
import multer from "multer";
import { removeBackground } from "@imgly/background-removal-node";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

const SUPPORTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

router.post("/admin/remove-background", upload.single("image"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No image provided" });
    return;
  }
  if (!SUPPORTED_TYPES.includes(req.file.mimetype)) {
    res.status(400).json({ error: `Unsupported format: ${req.file.mimetype}. Use JPG, PNG, or WebP.` });
    return;
  }
  try {
    const ab = req.file.buffer.buffer.slice(req.file.buffer.byteOffset, req.file.buffer.byteOffset + req.file.buffer.byteLength) as ArrayBuffer;
    const blob = new Blob([new Uint8Array(ab)], { type: req.file.mimetype });
    const resultBlob = await removeBackground(blob, {
      output: { format: "image/png", quality: 1 },
    });
    const arrayBuffer = await resultBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    res.set({
      "Content-Type": "image/png",
      "Content-Length": String(buffer.length),
      "Cache-Control": "no-store",
    });
    res.send(buffer);
  } catch (err) {
    req.log.error({ err }, "remove-bg: processing failed");
    res.status(500).json({ error: "Background removal failed" });
  }
});

export default router;
