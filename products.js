export default async function handler(req, res) {
  if (req.method !== "PATCH") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { NOTION_TOKEN } = process.env;
    const { pageId, ...fields } = req.body;

    if (!pageId) return res.status(400).json({ error: "缺少 pageId" });

    const properties = {};

    if (fields.tname !== undefined)
      properties.tname = { title: [{ text: { content: fields.tname } }] };
    if (fields.jprice !== undefined)
      properties.jprice = { number: Number(fields.jprice) || 0 };
    if (fields.jsprice !== undefined)
      properties.jsprice = { number: Number(fields.jsprice) || 0 };
    if (fields.weight !== undefined)
      properties.weight = { number: Number(fields.weight) || 0 };
    if (fields.mainCategory !== undefined)
      properties.mainCategory = { select: fields.mainCategory ? { name: fields.mainCategory } : null };
    if (fields.category !== undefined)
      properties.category = { select: fields.category ? { name: fields.category } : null };
    if (fields.description !== undefined)
      properties.description = { rich_text: [{ text: { content: fields.description } }] };
    if (fields.image !== undefined)
      properties.image = { rich_text: fields.image ? [{ text: { content: fields.image } }] : [] };
    if (fields.images !== undefined)
      properties.images = { rich_text: fields.images ? [{ text: { content: fields.images } }] : [] };
    if (fields.sort     !== undefined) properties.sort     = { number: Number(fields.sort) };
    if (fields.idnumber !== undefined) properties.idnumber = { rich_text: [{ text: { content: fields.idnumber ? String(fields.idnumber) : '' } }] };
    if (fields.isView  !== undefined) properties.isView  = { checkbox: !!fields.isView  };
    if (fields.isHot   !== undefined) properties.isHot   = { checkbox: !!fields.isHot   };
    if (fields.isSale  !== undefined) properties.isSale  = { checkbox: !!fields.isSale  };
    if (fields.isNew   !== undefined) properties.isNew   = { checkbox: !!fields.isNew   };
    if (fields.update  !== undefined)
      properties.update = { date: { start: new Date().toISOString().split("T")[0] } };

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

    res.status(200).json({ success: true });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
