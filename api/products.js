export default async function handler(req, res) {
  try {
    const { NOTION_TOKEN, DATABASE_ID } = process.env;
console.log("TOKEN =", process.env.NOTION_TOKEN);
console.log("DB =", process.env.DATABASE_ID);
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

    // ⭐ 文字（完整 rich_text）
    const getText = (prop) => {
      if (!prop) return "";

      if (prop.title) {
        return prop.title.map(t => t.plain_text).join("");
      }

      if (prop.rich_text) {
        return prop.rich_text.map(t => t.plain_text).join("\n");
      }

      return "";
    };

    // ⭐ 數字
    const getNumber = (prop) => {
      if (!prop) return 0;

      if (prop.type === "number") return prop.number || 0;

      if (prop.type === "formula") {
        if (prop.formula.type === "number") {
          return prop.formula.number || 0;
        }
      }

      return 0;
    };

    // ⭐ checkbox
    const getCheckbox = (prop) => prop?.checkbox || false;

    // ⭐ 日期（update）
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

    // ⭐ 多圖
    const getImages = (prop) => {
      const text = getText(prop);
      if (!text) return [];
      return text.split(",").map(s => s.trim()).filter(Boolean);
    };

    const products = data.results.map((page) => {
      const props = page.properties;

      const isSale = getCheckbox(props.Sale);
      const price = getNumber(props.tpric);
      const sprice = getNumber(props.sprice);

      return {
        id: page.id,
        name: getText(props.tname),
        description: getText(props.description),

        price: isSale ? sprice || price : price,
        originalPrice: price,
        isSale,

        isNew: getCheckbox(props.isNew),

        image: getImage(props.image),
        images: getImages(props.images),

        createdTime: page.created_time,

        // ⭐ 用來排序
        update: getDate(props.update)
      };
    });

    res.status(200).json(products);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
