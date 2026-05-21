export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { NOTION_TOKEN, DATABASE_ID } = process.env;
    const {
      tname, jprice, jsprice, idnumber,
      mainCategory, category,
      description,
      image, images,
      weight,
      isView, isHot, isSale, isNew,
    } = req.body;

    if (!tname) {
      return res.status(400).json({ error: "商品名稱為必填" });
    }

    const response = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${NOTION_TOKEN}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        parent: { database_id: DATABASE_ID },
        properties: {
          tname: {
            title: [{ text: { content: tname } }],
          },
          jprice: {
            number: Number(jprice) || 0,
          },
          jsprice: {
            number: Number(jsprice) || 0,
          },
          description: {
            rich_text: [{ text: { content: description || "" } }],
          },
          image: {
            rich_text: [{ text: { content: image || "" } }],
          },
          images: {
            rich_text: [{ text: { content: images || "" } }],
          },
          mainCategory: {
            select: mainCategory ? { name: mainCategory } : null,
          },
          category: {
            select: category ? { name: category } : null,
          },
          weight: {
            number: Number(weight) || 0,
          },
          idnumber: { rich_text: [{ text: { content: idnumber ? String(idnumber) : '' } }] },
          isView:  { checkbox: !!isView },
          isHot:   { checkbox: !!isHot  },
          isSale:  { checkbox: !!isSale },
          isNew:   { checkbox: !!isNew  },
          update: {
            date: { start: new Date().toISOString().split("T")[0] },
          },
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: data.message || "Notion 寫入失敗" });
    }

    res.status(200).json({ success: true, id: data.id });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
