```js id="s4m7n2"
module.exports = async function(req, res) {

  try {

    const NOTION_TOKEN = process.env.NOTION_TOKEN;
    const DATABASE_ID = process.env.DATABASE_ID;

    const url =
      "https://api.notion.com/v1/databases/" +
      DATABASE_ID +
      "/query";

    const notionRes = await fetch(url, {
      method: "POST",

      headers: {
        Authorization: `Bearer ${NOTION_TOKEN}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json"
      }
    });

    const data = await notionRes.json();

    const getText = (prop) => {

      if (!prop) return "";

      if (prop.title) {
        return prop.title
          .map(t => t.plain_text)
          .join("");
      }

      if (prop.rich_text) {
        return prop.rich_text
          .map(t => t.plain_text)
          .join("\n");
      }

      return "";
    };

    const getNumber = (prop) => {

      if (!prop) return 0;

      if (prop.type === "number") {
        return prop.number || 0;
      }

      return 0;
    };

    const getCheckbox = (prop) => {
      return prop?.checkbox || false;
    };

    const getDate = (prop) => {
      return prop?.date?.start || null;
    };

    const getImage = (prop) => {

      if (!prop) return "";

      if (prop.type === "url") {
        return prop.url || "";
      }

      return getText(prop);
    };

    const getImages = (prop) => {

      const text = getText(prop);

      if (!text) return [];

      return text
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);
    };

    const products = data.results.map((page) => {

      const props = page.properties;

      const isSale = getCheckbox(props.isSale);

      const price = getNumber(props.tprice);

      const sprice = getNumber(props.sprice);

      return {

        id: page.id,

        name: getText(props.tname),

        description: getText(props.description),

        price: isSale
          ? (sprice || price)
          : price,

        originalPrice: price,

        isSale,

        isNew: getCheckbox(props.isNew),

        isHot: getCheckbox(props.isHot),

        image: getImage(props.image),

        images: getImages(props.images),

        createdTime: page.created_time,

        update: getDate(props.update)
      };
    });

    res.status(200).json(products);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: err.message
    });
  }
};
```
