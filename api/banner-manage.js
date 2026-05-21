// POST   → 新增 banner
// PATCH  → 更新 order / isActive
// DELETE → 刪除（archive）

export default async function handler(req, res) {
  try {
    const { NOTION_TOKEN, BANNER_DATABASE_ID } = process.env;

    // ── GET：取得所有 banner ──────────────────────────
    if (req.method === "GET") {
      const response = await fetch(
        `https://api.notion.com/v1/databases/${BANNER_DATABASE_ID}/query`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${NOTION_TOKEN}`,
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...(req.query.all !== "1" ? {
              filter: { property: "isActive", checkbox: { equals: true } },
            } : {}),
            sorts: [{ property: "order", direction: "ascending" }],
          }),
        }
      );
      const data = await response.json();
      const getText = (prop) => {
        if (!prop) return "";
        if (prop.title)     return prop.title.map(t => t.plain_text).join("");
        if (prop.rich_text) return prop.rich_text.map(t => t.plain_text).join("");
        return "";
      };
      const banners = data.results.map(page => ({
        pageId:   page.id,
        title:    getText(page.properties.title),
        image:    getText(page.properties.image),
        order:    page.properties.order?.number ?? 99,
        isActive: page.properties.isActive?.checkbox ?? false,
      }));
      return res.status(200).json(banners);
    }

    // ── POST：新增 banner ─────────────────────────────
    if (req.method === "POST") {
      const { title, image, order } = req.body;
      if (!image) return res.status(400).json({ error: "圖片網址為必填" });
      const response = await fetch("https://api.notion.com/v1/pages", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${NOTION_TOKEN}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          parent: { database_id: BANNER_DATABASE_ID },
          properties: {
            title:    { title:     [{ text: { content: title || "Banner" } }] },
            image:    { rich_text: [{ text: { content: image } }] },
            order:    { number: Number(order) || 99 },
            isActive: { checkbox: true },
          },
        }),
      });
      const data = await response.json();
      if (!response.ok) return res.status(500).json({ error: data.message || "新增失敗" });
      return res.status(200).json({ success: true, pageId: data.id });
    }

    // ── PATCH：更新 order / isActive ──────────────────
    if (req.method === "PATCH") {
      const { pageId, order, isActive } = req.body;
      if (!pageId) return res.status(400).json({ error: "缺少 pageId" });
      const properties = {};
      if (order    !== undefined) properties.order    = { number: Number(order) };
      if (isActive !== undefined) properties.isActive = { checkbox: !!isActive };
      const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${NOTION_TOKEN}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ properties }),
      });
      if (!response.ok) {
        const err = await response.json();
        return res.status(500).json({ error: err.message || "更新失敗" });
      }
      return res.status(200).json({ success: true });
    }

    // ── DELETE：刪除（archive）────────────────────────
    if (req.method === "DELETE") {
      const { pageId } = req.body;
      if (!pageId) return res.status(400).json({ error: "缺少 pageId" });
      const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${NOTION_TOKEN}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ archived: true }),
      });
      if (!response.ok) {
        const err = await response.json();
        return res.status(500).json({ error: err.message || "刪除失敗" });
      }
      return res.status(200).json({ success: true });
    }

    res.status(405).json({ error: "Method not allowed" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
