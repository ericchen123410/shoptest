export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { NOTION_TOKEN, ORDERS_DATABASE_ID } = process.env;
    const body = req.body;

    const { name, phone, email, address, note, items, total, orderId } = body;

    // ⭐ 將商品清單整理成文字
    const itemsText = items.map(i =>
      `${i.name} × ${i.qty}（${i.price}）`
    ).join("\n");

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
          // 訂單編號（標題欄）
          orderId: {
            title: [{ text: { content: orderId } }],
          },
          // 客戶資料
          name: {
            rich_text: [{ text: { content: name } }],
          },
          phone: {
            phone_number: phone,
          },
          email: {
            email: email,
          },
          address: {
            rich_text: [{ text: { content: address } }],
          },
          note: {
            rich_text: [{ text: { content: note || "" } }],
          },
          // 訂單內容
          items: {
            rich_text: [{ text: { content: itemsText } }],
          },
          total: {
            number: total,
          },
          // 訂單狀態（預設：待處理）
          status: {
            select: { name: "待處理" },
          },
        },
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(500).json({ error: err.message || "Notion 寫入失敗" });
    }

    res.status(200).json({ success: true, orderId });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
