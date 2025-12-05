import { Router } from "express";
import { generateRSSFeed } from "./rss";

const router = Router();

/**
 * RSS 피드 엔드포인트
 */
router.get("/rss", async (req, res) => {
  try {
    const rss = await generateRSSFeed();
    res.set("Content-Type", "application/rss+xml; charset=utf-8");
    res.send(rss);
  } catch (error) {
    console.error("RSS feed generation error:", error);
    res.status(500).send("Internal Server Error");
  }
});

export default router;
