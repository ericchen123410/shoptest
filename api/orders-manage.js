// GET  ?type=list               → 所有訂單列表
// GET  ?type=query&orderId=xxx  → 查詢單筆訂單
// POST                          → 建立新訂單
// PATCH                         → 更新訂單狀態

export default async function handler(req, res) {
  try {
    const { NOTION_TOKEN, ORDERS_DATABASE_ID } = process.env;

    const parseItems = (prop) => {
      const text = getText(prop);
      if (!text) return [];
      try { return JSON.parse(text); } catch { return text; }
    };

    const getText = (prop) => {
      if (!prop) return "";
      if (prop.title)     return prop.title.map(t => t.plain_text).join("");
      if (prop.rich_text) return prop.rich_text.map(t => t.plain_text).join("\n");
      return "";
    };

    // ── GET list：所有訂單 ────────────────────────────
    if (req.method === "GET" && req.query.type === "list") {
      const response = await fetch(
        `https://api.notion.com/v1/databases/${ORDERS_DATABASE_ID}/query`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${NOTION_TOKEN}`,
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sorts: [{ timestamp: "created_time", direction: "descending" }],
            page_size: 100,
          }),
        }
      );
      const data = await response.json();
      const orders = data.results.map(page => {
        const props = page.properties;
        return {
          pageId:    page.id,
          orderId:    getText(props.orderId),
          customerId: getText(props.customerId),
          items:      parseItems(props.items),
          total:      props.total?.number || 0,
          status:     props.status?.select?.name || "待處理",
          createdAt:  page.created_time,
        };
      });
      return res.status(200).json(orders);
    }

    // ── GET query：訂單編號查詢 ───────────────────────
    if (req.method === "GET" && req.query.type === "query") {
      const { orderId } = req.query;
      if (!orderId) return res.status(400).json({ error: "請提供訂單編號" });

      const response = await fetch(
        `https://api.notion.com/v1/databases/${ORDERS_DATABASE_ID}/query`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${NOTION_TOKEN}`,
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            filter: { property: "orderId", title: { equals: orderId.trim().toUpperCase() } },
          }),
        }
      );
      const data = await response.json();
      if (!data.results?.length)
        return res.status(404).json({ error: "找不到此訂單編號" });

      const page  = data.results[0];
      const props = page.properties;
      return res.status(200).json({
        orderId:    getText(props.orderId),
        customerId: getText(props.customerId),
        items:      parseItems(props.items),
        total:      props.total?.number || 0,
        status:     props.status?.select?.name || "待處理",
        createdAt:  page.created_time,
      });
    }

    // ── GET customer-orders：客戶編號 + email 驗證後查訂單 ──
    if (req.method === "GET" && req.query.type === "customer") {
      const { customerId, email } = req.query;
      if (!customerId || !email)
        return res.status(400).json({ error: "請提供客戶編號和 Email" });

      // 先驗證 email 是否符合此客戶編號
      const { CUSTOMER_DATABASE_ID } = process.env;
      const verifyRes = await fetch(
        `https://api.notion.com/v1/databases/${CUSTOMER_DATABASE_ID}/query`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${NOTION_TOKEN}`,
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            filter: {
              and: [
                { property: "customerId", title: { equals: customerId.trim() } },
                { property: "email", email: { equals: email.toLowerCase().trim() } },
              ],
            },
            page_size: 1,
          }),
        }
      );
      const verifyData = await verifyRes.json();
      if (!verifyData.results?.length)
        return res.status(401).json({ error: "客戶編號或 Email 不正確" });

      const customer = verifyData.results[0].properties;
      const customerInfo = {
        name:    customer.name?.rich_text?.map(t => t.plain_text).join("") || "",
        phone:   customer.phone?.phone_number || "",
        address: customer.address?.rich_text?.map(t => t.plain_text).join("") || "",
        email:   customer.email?.email || "",
      };

      // 查詢該客戶所有訂單
      const ordersRes = await fetch(
        `https://api.notion.com/v1/databases/${ORDERS_DATABASE_ID}/query`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${NOTION_TOKEN}`,
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            filter: { property: "customerId", rich_text: { equals: customerId.trim() } },
            sorts:  [{ timestamp: "created_time", direction: "descending" }],
          }),
        }
      );
      const ordersData = await ordersRes.json();

      const orders = (ordersData.results || []).map(page => {
        const props = page.properties;
        return {
          orderId:    getText(props.orderId),
          customerId: getText(props.customerId),
          items:      parseItems(props.items),
          total:      props.total?.number || 0,
          status:     props.status?.select?.name || "待處理",
          createdAt:  page.created_time,
        };
      });

      return res.status(200).json({ customer: customerInfo, orders });
    }

    // ── POST：建立訂單 ────────────────────────────────
    if (req.method === "POST") {
      const { orderId, customerId, items, total } = req.body;
      const itemsText = JSON.stringify(items);
      const response = await fetch("https://api.notion.com/v1/pages", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${NOTION_TOKEN}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          parent: { database_id: ORDERS_DATABASE_ID },
          properties: {
            orderId:    { title:     [{ text: { content: orderId } }] },
            customerId: { rich_text: [{ text: { content: customerId || "" } }] },
            items:      { rich_text: [{ text: { content: itemsText } }] },
            total:      { number: total },
            status:     { select: { name: "待處理" } },
          },
        }),
      });
      if (!response.ok) {
        const err = await response.json();
        return res.status(500).json({ error: err.message || "Notion 寫入失敗" });
      }
      return res.status(200).json({ success: true, orderId });
    }

    // ── PATCH：更新訂單狀態 ───────────────────────────
    if (req.method === "PATCH") {
      const { pageId, status, items, total } = req.body;
      if (!pageId) return res.status(400).json({ error: "缺少 pageId" });
      const properties = {};
      if (status) {
        const VALID = ["待處理","處理中","已出貨","已完成","已取消","申請取消中"];
        if (!VALID.includes(status)) return res.status(400).json({ error: "無效狀態值" });
        properties.status = { select: { name: status } };
      }
      if (items !== undefined) properties.items = { rich_text: [{ text: { content: JSON.stringify(items) } }] };
      if (total !== undefined) properties.total = { number: total };
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

    // ── DELETE：刪除訂單（archive）────────────────────
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
