import { getLatestRankings } from "./db";

/**
 * RSS 피드 생성
 */
export async function generateRSSFeed(): Promise<string> {
  const rankings = await getLatestRankings();
  const now = new Date();
  const pubDate = now.toUTCString();

  const items = rankings.map((item) => {
    const title = `#${item.rank} ${item.nameKo || item.name}`;
    const description = `
      <![CDATA[
        <div>
          <img src="${item.thumbnailUrl}" alt="${item.nameKo}" style="max-width: 300px; height: auto;" />
          <p><strong>브랜드:</strong> ${item.brand}</p>
          <p><strong>가격:</strong> ${item.price ? `${item.price.toLocaleString()}원` : "가격 정보 없음"}</p>
          <p><strong>관심수:</strong> ${item.wishCount ? item.wishCount.toLocaleString() : "0"}</p>
          <p><strong>거래량:</strong> ${item.tradeVolume || "정보 없음"}</p>
        </div>
      ]]>
    `;
    const link = item.detailUrl || `https://kream.co.kr/search?keyword=${encodeURIComponent(item.nameKo || item.name || "")}`;

    return `
    <item>
      <title>${escapeXml(title)}</title>
      <link>${escapeXml(link)}</link>
      <description>${description}</description>
      <pubDate>${item.recordedAt.toUTCString()}</pubDate>
      <guid isPermaLink="false">${item.productId}-${item.recordedAt.getTime()}</guid>
    </item>`;
  }).join("\n");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>KREAM 스니커즈 랭킹</title>
    <link>https://kream.co.kr</link>
    <description>KREAM 인기 스니커즈 TOP 30 랭킹</description>
    <language>ko</language>
    <lastBuildDate>${pubDate}</lastBuildDate>
    <atom:link href="/rss" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;

  return rss;
}

/**
 * XML 특수문자 이스케이프
 */
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
