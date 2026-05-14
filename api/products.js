export default async function handler(req, res) {
  try {
    const { NOTION_TOKEN, DATABASE_ID } = process.env;

    const response = await fetch(
      `https://api.notion.com/v1/databases/${DATABASE_ID}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${NOTION_TOKEN}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    // ⭐ 文字
    const getText = (prop) => {
      if (!prop) return "";
      if (prop.title) return prop.title.map(t => t.plain_text).join("");
      if (prop.rich_text) return prop.rich_text.map(t => t.plain_text).join("\n");
      return "";
    };

    // ⭐ 數字
    const getNumber = (prop) => {
      if (!prop) return 0;
      if (prop.type === "number") return prop.number || 0;
      if (prop.type === "formula") {
        if (prop.formula.type === "number") return prop.formula.number || 0;
      }
      return 0;
    };

    // ⭐ Checkbox
    const getCheckbox = (prop) => prop?.checkbox || false;

    // ⭐ 日期
    const getDate = (prop) => {
      if (!prop || prop.type !== "date") return null;
      return prop.date?.start || null;
    };

    // ⭐ 單圖
    const getImage = (prop) => {
      if (!prop) return "";
      if (prop.type === "url") return prop.url || "";
      return (
        prop?.title?.map(t => t.plain_text).join("") ||
        prop?.rich_text?.map(t => t.plain_text).join("") ||
        ""
      );
    };

    // ⭐ Select 單選（分類）
    const getSelect = (prop) => prop?.select?.name || "";

    // ⭐ 多圖
    const getImages = (prop) => {
      const text = getText(prop);
      if (!text) return [];
      return text.split(",").map(s => s.trim()).filter(Boolean);
    };

    const products = data.results.map((page) => {
      const props = page.properties;

      const isView = getCheckbox(props.isView); // ⭐ 上架控制
      const isHot  = getCheckbox(props.isHot);
      const isSale = getCheckbox(props.isSale);
      const isNew  = getCheckbox(props.isNew);

      const price  = getNumber(props.tprice);
      const sprice = getNumber(props.sprice);

      return {
        id: page.id,
        name: getText(props.tname),
        description: getText(props.description),

        price: isSale ? sprice || price : price,
        originalPrice: price,
        isSale,

        isHot,
        isNew,
        isView,

        category: getSelect(props.category), // ⭐ 分類

        image: getImage(props.image),
        images: getImages(props.images),

        createdTime: page.created_time,
        update: getDate(props.update),
      };
    });

    // ⭐ 只回傳 isView = true 的商品（下架商品不顯示）
    const visible = products.filter(p => p.isView);

    res.status(200).json(visible);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
