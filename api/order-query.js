export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { NOTION_TOKEN, ORDERS_DATABASE_ID } = process.env;
    const { orderId } = req.query;

    if (!orderId) {
      return res.status(400).json({ error: "請提供訂單編號" });
    }

    // 用 orderId 搜尋 Notion 訂單資料庫
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
          filter: {
            property: "orderId",
            title: {
              equals: orderId.trim().toUpperCase(),
            },
          },
        }),
      }
    );

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      return res.status(404).json({ error: "找不到此訂單編號" });
    }

    const page = data.results[0];
    const props = page.properties;

    const getText = (prop) => {
      if (!prop) return "";
      if (prop.title)     return prop.title.map(t => t.plain_text).join("");
      if (prop.rich_text) return prop.rich_text.map(t => t.plain_text).join("\n");
      return "";
    };

    const order = {
      orderId:   getText(props.orderId),
      name:      getText(props.name),
      address:   getText(props.address),
      items:     getText(props.items),
      total:     props.total?.number || 0,
      status:    props.status?.select?.name || "待處理",
      createdAt: page.created_time,
    };

    res.status(200).json(order);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
