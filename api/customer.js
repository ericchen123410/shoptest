// GET  ?email=xxx     → 查詢是否已有此 email 的客戶
// POST               → 新增客戶，自動產生客戶編號

export default async function handler(req, res) {
  try {
    const { NOTION_TOKEN, CUSTOMER_DATABASE_ID } = process.env;

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

    // ── GET：用 email 或 customerId 查詢客戶 ───────────
    if (req.method === "GET" && (req.query.email || req.query.customerId)) {
      const { email, customerId } = req.query;

      let filter;
      if (email) {
        filter = { property: "email", email: { equals: email.toLowerCase().trim() } };
      } else if (customerId) {
        filter = { property: "customerId", title: { equals: customerId.trim() } };
      } else {
        return res.status(400).json({ error: "請提供 email 或 customerId" });
      }

      const response = await fetch(
        `https://api.notion.com/v1/databases/${CUSTOMER_DATABASE_ID}/query`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ filter, page_size: 1 }),
        }
      );
      const data = await response.json();

      if (data.results?.length) {
        const page  = data.results[0];
        const props = page.properties;
        return res.status(200).json({
          found:      true,
          pageId:     page.id,
          customerId: getText(props.customerId),
          email:      props.email?.email || "",
          name:       getText(props.name),
          phone:      props.phone?.phone_number || "",
          address:    getText(props.address),
        });
      }

      return res.status(200).json({ found: false });
    }

    // ── GET list：所有客戶 ──────────────────────────────
    if (req.method === "GET") {
      const response = await fetch(
        `https://api.notion.com/v1/databases/${CUSTOMER_DATABASE_ID}/query`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            sorts: [{ property: "customerId", direction: "ascending" }],
            page_size: 100,
          }),
        }
      );
      const data = await response.json();
      const customers = data.results.map(page => {
        const props = page.properties;
        return {
          pageId:     page.id,
          customerId: getText(props.customerId),
          email:      props.email?.email || "",
          name:       getText(props.name),
          phone:      props.phone?.phone_number || "",
          address:    getText(props.address),
          createdAt:  page.created_time,
        };
      });
      return res.status(200).json(customers);
    }

    // ── PATCH：更新客戶資料 ──────────────────────────────
    if (req.method === "PATCH") {
      const { pageId, name, phone, address } = req.body;
      if (!pageId) return res.status(400).json({ error: "缺少 pageId" });

      const properties = {};
      if (name    !== undefined) properties.name    = { rich_text:    [{ text: { content: name || "" } }] };
      if (phone   !== undefined) properties.phone   = { phone_number: phone || null };
      if (address !== undefined) properties.address = { rich_text:    [{ text: { content: address || "" } }] };

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

    // ── POST：新增客戶 + 自動產生編號 ────────────────
    if (req.method === "POST") {
      const { email, name, phone, address } = req.body;
      if (!email) return res.status(400).json({ error: "email 為必填" });

      // 先查一次確保不重複
      const checkRes = await fetch(
        `https://api.notion.com/v1/databases/${CUSTOMER_DATABASE_ID}/query`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            filter: { property: "email", email: { equals: email.toLowerCase().trim() } },
            page_size: 1,
          }),
        }
      );
      const checkData = await checkRes.json();
      if (checkData.results?.length) {
        const page  = checkData.results[0];
        const props = page.properties;
        return res.status(200).json({
          customerId: getText(props.customerId),
          isNew: false,
        });
      }

      // 查目前最大編號，自動產生下一個
      const allRes = await fetch(
        `https://api.notion.com/v1/databases/${CUSTOMER_DATABASE_ID}/query`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            sorts: [{ timestamp: "created_time", direction: "descending" }],
            page_size: 100,
          }),
        }
      );
      const allData = await allRes.json();

      // 產生下一個客戶編號（從 W-82I 開始）
      const PREFIX  = "W-82";
      const KNOWN_START = "I"; // 已知到 W-82H，下一個從 I 開始

      // 取出所有現有編號的後綴
      const suffixes = (allData.results || [])
        .map(p => getText(p.properties.customerId))
        .filter(id => id.startsWith(PREFIX))
        .map(id => id.slice(PREFIX.length))
        .filter(Boolean);

      // 產生下一個後綴
      function nextSuffix(existing) {
        // 把所有後綴轉成數字索引（A=0, B=1...Z=25, AA=26, AB=27...）
        function toIndex(s) {
          let n = 0;
          for (let i = 0; i < s.length; i++) {
            n = n * 26 + (s.charCodeAt(i) - 64);
          }
          return n - 1;
        }
        function fromIndex(n) {
          let s = "";
          n++;
          while (n > 0) {
            n--;
            s = String.fromCharCode(65 + (n % 26)) + s;
            n = Math.floor(n / 26);
          }
          return s;
        }

        // 已知最小起點是 I（第8個，index=8）
        const START_INDEX = toIndex(KNOWN_START);
        const indices = existing.map(toIndex);
        const maxIdx  = indices.length ? Math.max(...indices) : START_INDEX - 1;
        return fromIndex(Math.max(maxIdx + 1, START_INDEX));
      }

      const suffix     = nextSuffix(suffixes);
      const customerId = `${PREFIX}${suffix}`;

      // 寫入 Notion
      const createRes = await fetch("https://api.notion.com/v1/pages", {
        method: "POST",
        headers,
        body: JSON.stringify({
          parent: { database_id: CUSTOMER_DATABASE_ID },
          properties: {
            customerId: { title:        [{ text: { content: customerId } }] },
            email:      { email:        email.toLowerCase().trim() },
            name:       { rich_text:    [{ text: { content: name || "" } }] },
            phone:      { phone_number: phone || null },
            address:    { rich_text:    [{ text: { content: address || "" } }] },
            createdAt:  { date:         { start: new Date().toISOString() } },
          },
        }),
      });

      if (!createRes.ok) {
        const err = await createRes.json();
        console.error("Notion create error:", JSON.stringify(err));
        return res.status(500).json({ error: err.message || "建立失敗", detail: err });
      }

      return res.status(200).json({ customerId, isNew: true });
    }

    res.status(405).json({ error: "Method not allowed" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
