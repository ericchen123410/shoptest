```js
import { Client } from "@notionhq/client";

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const DATABASE_ID = process.env.DATABASE_ID;

export default async function handler(req, res) {
  try {
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
    });

    // 只顯示 isView 有勾選的商品
    const visibleResults = response.results.filter((page) => {
      return page.properties?.isView?.checkbox === true;
    });

    const products = visibleResults.map((page) => {
      return {
        id: page.id,

        title:
          page.properties?.Name?.title?.[0]?.plain_text || "無名稱",

        price:
          page.properties?.Price?.number || 0,

        image:
          page.properties?.Image?.files?.[0]?.file?.url ||
          page.properties?.Image?.files?.[0]?.external?.url ||
          "",

        description:
          page.properties?.Description?.rich_text?.[0]?.plain_text || "",

        category:
          page.properties?.Category?.select?.name || "",

        isNew:
          page.properties?.isNew?.checkbox || false,

        isHot:
          page.properties?.isHot?.checkbox || false,

        isSale:
          page.properties?.isSale?.checkbox || false,
      };
    });

    res.status(200).json(products);

  } catch (error) {
    console.error("Notion API Error:", error);

    res.status(500).json({
      error: "Failed to fetch products",
      details: error.message,
    });
  }
}
```
