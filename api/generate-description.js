export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { ANTHROPIC_API_KEY, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
    if (!ANTHROPIC_API_KEY) return res.status(500).json({ error: "API Key 未設定" });

    const { productName, jname, idnumber } = req.body;

    // 組合搜尋關鍵字
    const searchQuery = [jname, idnumber].filter(Boolean).join(" ") || productName;
    if (!searchQuery) return res.status(400).json({ error: "請提供商品資訊" });

    const prompt = `搜尋 costco.co.jp 商品「${searchQuery}」，整理商品詳細資訊。

格式輸出（不加說明和markdown）：

商品名稱：[繁體中文名稱]
日文名稱：[日文名稱]
商品編號：[編號]
商品圖片網址：[主圖URL，找不到留空]

商品內容跟特點
• [特點一]
• [特點二]
• [特點三]
• [特點四]
• [特點五]`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type":      "application/json",
        "x-api-key":         ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model:      "claude-sonnet-4-5",
        max_tokens: 800,
        tools: [{
          type: "web_search_20250305",
          name: "web_search",
        }],
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    if (!response.ok) return res.status(500).json({ error: data.error?.message || "生成失敗" });

    // 組合所有 text 內容
    const text = (data.content || [])
      .filter(b => b.type === "text")
      .map(b => b.text)
      .join("\n")
      .trim();

    // 解析圖片網址
    const imgMatch = text.match(/商品圖片網址：(.+)/);
    let imageUrl   = imgMatch ? imgMatch[1].trim() : "";

    // 如果有圖片網址，透過 Cloudinary 轉存（用 unsigned upload preset）
    let cloudinaryUrl = "";
    if (imageUrl && imageUrl.startsWith("http") && CLOUDINARY_CLOUD_NAME) {
      try {
        const fd = new FormData();
        fd.append("file",          imageUrl);
        fd.append("upload_preset", "shop_upload");

        const upRes  = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
          method: "POST",
          body:   fd,
        });
        const upData = await upRes.json();
        console.log("Cloudinary response:", JSON.stringify(upData));
        if (upData.secure_url) cloudinaryUrl = upData.secure_url;
      } catch (err) {
        console.error("Cloudinary upload error:", err.message);
      }
    }

    // 清理輸出文字（移除圖片網址那行）
    const cleanText = text.replace(/商品圖片網址：.+\n?/, "").trim();

    res.status(200).json({
      text:      cleanText,
      imageUrl:  cloudinaryUrl || imageUrl,
      hasImage:  !!cloudinaryUrl,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
