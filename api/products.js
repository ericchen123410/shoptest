export default async function handler(req, res) {
  try {
    const { NOTION_TOKEN, DATABASE_ID } = process.env;

    // ⭐ 分頁讀取全部商品（Notion 每次最多 100 筆）
    const headers = {
      Authorization: `Bearer ${NOTION_TOKEN}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    };

    let allResults = [];
    let hasMore    = true;
    let cursor     = undefined;

    while (hasMore) {
      const body = { page_size: 100 };
      if (cursor) body.start_cursor = cursor;

      const response = await fetch(
        `https://api.notion.com/v1/databases/${DATABASE_ID}/query`,
        { method: "POST", headers, body: JSON.stringify(body) }
      );
      const data = await response.json();
      allResults = allResults.concat(data.results || []);
      hasMore    = data.has_more || false;
      cursor     = data.next_cursor || undefined;
    }

    const data = { results: allResults };

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
      return getText(prop); // 回傳原始字串，前端自行 split
    };

    const products = data.results.map((page) => {
      const props = page.properties;

      const isView = getCheckbox(props.isView); // ⭐ 上架控制
      const isHot  = getCheckbox(props.isHot);
      const isSale = getCheckbox(props.isSale);
      const isNew  = getCheckbox(props.isNew);

      const price   = getNumber(props.tprice);  // formula：台幣售價
      const sprice  = getNumber(props.sprice);  // formula：台幣特價
      const jprice  = getNumber(props.jprice);  // 日幣原價
      const jsprice = getNumber(props.jsprice); // 日幣特價

      return {
        id: page.id,
        name:  getText(props.tname),
        jname: getText(props.jname),   // ⭐ 日文名稱
        description: getText(props.description),

        price: isSale ? sprice || price : price,
        originalPrice: price,
        isSale,

        isHot,
        isNew,
        isView,

        weight:    getNumber(props.weight),          // ⭐ 重量
        idnumber:  getText(props.idnumber),            // ⭐ 商品編號（text）
        variants:  (props.variants?.multi_select || []).map(v => v.name),
        sort:    getNumber(props.sort),               // ⭐ 排序
        jprice:  jprice,                                // ⭐ 日幣原價
        jsprice: jsprice,                               // ⭐ 日幣特價
        mainCategory: getSelect(props.mainCategory), // ⭐ 大分類
        category: getSelect(props.category),     // ⭐ 小分類

        image: getImage(props.image),
        images: getImages(props.images),

        createdTime: page.created_time,
        update: getDate(props.update),
      };
    });

    // ⭐ showAll=1 時回傳全部（後台用），否則只回傳上架商品
    const visible = req.query.showAll === "1"
      ? products
      : products.filter(p => p.isView);

    res.setHeader("Cache-Control", "public, max-age=30, stale-while-revalidate=10");
    res.status(200).json(visible);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
