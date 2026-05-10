```js id="ymu1hn"
module.exports = async function (req, res) {

  try {

    const NOTION_TOKEN = process.env.NOTION_TOKEN;
    const DATABASE_ID = process.env.DATABASE_ID;

    // 打 Notion API
    const notionRes = await fetch(
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

    // 轉 JSON
    const data = await notionRes.json();

    // rich text
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

    // number
    const getNumber = (prop) => {

      if (!prop) return 0;

      if (prop.type === "number") {
        return prop.number || 0;
      }

      return 0;
    };

    // checkbox
    const getCheckbox = (prop) => {
      return prop?.checkbox || false;
    };

    // date
    const getDate = (prop) => {
      return prop?.date?.start || null;
    };

    // image
    const getImage = (prop) => {

      if (!prop) return "";

      if (prop.type === "url") {
        return prop.url || "";
      }

      return getText(prop);
    };

    // images
    const getImages = (prop) => {

      const text = getText(prop);

      if (!text) return [];

      return text
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);
    };

    // products
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

        update: getDate(props.update),
      };
    });

    // 回傳
    res.status(200).json(products);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: err.message
    });
  }
};
```
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

        price: isSale ? sprice || price : price,

        originalPrice: price,

        isSale,

        isNew: getCheckbox(props.isNew),

        isHot: getCheckbox(props.isHot),

        image: getImage(props.image),

        images: getImages(props.images),

        createdTime: page.created_time,

        update: getDate(props.update),
      };
    });

    res.status(200).json(products);

  } catch (err) {

    res.status(500).json({
      error: err.message
    });
  }
};
```

      data = JSON.parse(raw);

    } catch (e) {

      return res.status(500).json({
        error: "Notion JSON parse failed",
        raw
      });
    }

    // notion error
    if (!notionRes.ok) {

      return res.status(500).json({
        error: "Notion API Error",
        detail: data
      });
    }

    // results 保護
    if (!Array.isArray(data.results)) {

      return res.status(500).json({
        error: "results 不是 array",
        data
      });
    }

    // rich text
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

    // number
    const getNumber = (prop) => {

      if (!prop) return 0;

      if (prop.type === "number") {
        return prop.number || 0;
      }

      if (
        prop.type === "formula" &&
        prop.formula?.type === "number"
      ) {

        return prop.formula.number || 0;
      }

      return 0;
    };

    // checkbox
    const getCheckbox = (prop) => {
      return prop?.checkbox || false;
    };

    // date
    const getDate = (prop) => {

      if (!prop) return null;

      return prop?.date?.start || null;
    };

    // 單圖
    const getImage = (prop) => {

      if (!prop) return "";

      if (prop.type === "url") {
        return prop.url || "";
      }

      return getText(prop);
    };

    // 多圖
    const getImages = (prop) => {

      const text = getText(prop);

      if (!text) return [];

      return text
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);
    };

    // products
    const products = data.results.map((page) => {

      const props = page.properties || {};

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

        update: getDate(props.update),
      };
    });

    // cors
    res.setHeader(
      "Access-Control-Allow-Origin",
      "*"
    );

    return res.status(200).json(products);

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      error: err.message,
      stack: err.stack
    });
  }
}
```

      return res.status(response.status).json({
        error: "Notion API 錯誤",
        detail: data
      });
    }

    // ⭐ 保護
    if (!data.results || !Array.isArray(data.results)) {

      return res.status(500).json({
        error: "Notion 回傳格式錯誤",
        data
      });
    }

    // ⭐ rich text
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

    // ⭐ number
    const getNumber = (prop) => {

      if (!prop) return 0;

      if (prop.type === "number") {
        return prop.number || 0;
      }

      if (prop.type === "formula") {

        if (prop.formula.type === "number") {
          return prop.formula.number || 0;
        }
      }

      return 0;
    };

    // ⭐ checkbox
    const getCheckbox = (prop) => {
      return prop?.checkbox || false;
    };

    // ⭐ date
    const getDate = (prop) => {

      if (!prop) return null;

      if (prop.type !== "date") return null;

      return prop.date?.start || null;
    };

    // ⭐ 單圖
    const getImage = (prop) => {

      if (!prop) return "";

      // url
      if (prop.type === "url") {
        return prop.url || "";
      }

      // rich text
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

      return text
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);
    };

    // ⭐ products
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

        update: getDate(props.update),
      };
    });

    // ⭐ debug
    console.log("products =", products);

    // ⭐ cors
    res.setHeader(
      "Access-Control-Allow-Origin",
      "*"
    );

    res.status(200).json(products);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: err.message
    });
  }
}
```
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
      const isSale = getCheckbox(props.isSale);
      const isNew = getCheckbox(props.isNew);
      const isHot = getCheckbox(props.isHot);
      const price = getNumber(props.tprice);
      const sprice = getNumber(props.sprice);

      return {
        id: page.id,
        name: getText(props.tname),
        description: getText(props.description),

        price: isSale ? sprice || price : price,
        originalPrice: price,
        isSale,

        isNew: getCheckbox(props.isNew),
        isHot: getCheckbox(props.isHot),
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
