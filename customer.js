export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { NOTION_TOKEN, DATABASE_ID } = process.env;
    const { idnumber } = req.query;

    if (!idnumber) {
      return res.status(400).json({ error: "請提供編號" });
    }

    const response = await fetch(
      `https://api.notion.com/v1/databases/${DATABASE_ID}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${NOTION_TOKEN}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filter: {
            property: "idnumber",
            rich_text: { equals: String(idnumber).trim() },
          },
          page_size: 1,
        }),
      }
    );

    const data = await response.json();
    const exists = data.results && data.results.length > 0;

    res.status(200).json({ exists });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
