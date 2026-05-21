// POST → 建立客製化訂單
// GET ?type=list → 所有客製化訂單（後台用）

export default async function handler(req, res) {
  try {
    const { NOTION_TOKEN } = process.env;
    const CUSTOM_DB = "3655bfd83387804da087fbbfcf6e25e2";

    const headers = {
      Authorization: `Bearer ${NOTION_TOKEN}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    };

    const getText = (prop) => {
      if (!prop) return "";
      if (prop.title)     return prop.title.map(t => t.plain_text).join("");
      if (prop.rich_text) return prop.rich_text.map(t => t.plain_text).join("");
      return "";
    };

    // ── GET list：所有客製化訂單 ──────────────────────
    if (req.method === "GET" && req.query.type === "list") {
      const response = await fetch(
        `https://api.notion.com/v1/databases/${CUSTOM_DB}/query`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            sorts: [{ timestamp: "created_time", direction: "descending" }],
            page_size: 100,
          }),
        }
      );
      const data = await response.json();
      const orders = (data.results || []).map(page => {
        const props = page.properties;
        return {
          pageId:      page.id,
          orderId:     getText(props.orderId),
          customerId:  getText(props.customerId),
          productName: getText(props.productName),
          source:      props.source?.select?.name || "",
          quantity:    props.quantity?.number || 1,
          price:       props.price?.number || 0,
          weight:      props.weight?.number || 0,
          note:        getText(props.note),
          status:      props.status?.status?.name || "待處理",
          createdAt:   page.created_time,
        };
      });
      return res.status(200).json(orders);
    }

    // ── GET sources：取得所有 source 選項 ─────────────
    if (req.method === "GET" && req.query.type === "sources") {
      const response = await fetch(
        `https://api.notion.com/v1/databases/${CUSTOM_DB}`,
        { method: "GET", headers }
      );
      const data = await response.json();
      const options = data.properties?.source?.select?.options || [];
      return res.status(200).json(options.map(o => o.name));
    }

    // ── POST：建立客製化訂單 ──────────────────────────
    if (req.method === "POST") {
      const { orderId, customerId, productName, source, quantity, price, note } = req.body;
      if (!productName) return res.status(400).json({ error: "請填寫商品名稱" });

      const response = await fetch("https://api.notion.com/v1/pages", {
        method: "POST",
        headers,
        body: JSON.stringify({
          parent: { database_id: CUSTOM_DB },
          properties: {
            orderId:     { title:     [{ text: { content: orderId || "" } }] },
            customerId:  { rich_text: [{ text: { content: customerId || "" } }] },
            productName: { rich_text: [{ text: { content: productName } }] },
            source:      { select:    source ? { name: source } : null },
            quantity:    { number:    Number(quantity) || 1 },
            price:       { number:    Number(price) || 0 },
            note:        { rich_text: [{ text: { content: note || "" } }] },
            status:      { status:    { name: "待處理" } },
          },
        }),
      });

      const result = await response.json();
      if (!response.ok) return res.status(500).json({ error: result.message || "建立失敗" });
      return res.status(200).json({ success: true, pageId: result.id, orderId });
    }

    // ── PATCH：更新狀態 / 價格 ───────────────────────
    if (req.method === "PATCH") {
      const { pageId, status, price, weight } = req.body;
      if (!pageId) return res.status(400).json({ error: "缺少 pageId" });

      const properties = {};
      if (status !== undefined) properties.status = { status: { name: status } };
      if (price  !== undefined) properties.price  = { number: Number(price) };
      if (weight !== undefined) properties.weight = { number: Number(weight) };

      const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ properties }),
      });
      if (!response.ok) {
        const err = await response.json();
        return res.status(500).json({ error: err.message || "更新失敗" });
      }
      return res.status(200).json({ success: true });
    }

    // ── DELETE：刪除 ─────────────────────────────────
    if (req.method === "DELETE") {
      const { pageId } = req.body;
      if (!pageId) return res.status(400).json({ error: "缺少 pageId" });

      const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
        method: "PATCH",
        headers,
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
