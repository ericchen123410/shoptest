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

    const prompt = `請幫我在 https://www.costco.co.jp 搜尋以下商品，找到該商品的詳細頁面，從「商品の詳細」中整理資訊。

商品關鍵字：${searchQuery}

請按照以下格式輸出，不要加其他說明、不要加 markdown 符號：

商品名稱：[繁體中文商品名稱，簡潔清楚]
日文名稱：[日文原始商品名稱，從網頁取得]
商品編號：[商品編號，從網頁取得，如果已知是 ${idnumber || "未提供"}]
商品圖片網址：[商品主圖的完整URL，從網頁取得，如果找不到則留空]

商品內容跟特點
• [特點一]
• [特點二]
• [特點三]
• [特點四]
• [特點五]

產地：[產地]
保存方式：[常溫／冷藏／冷凍]

如果找不到該商品，請根據商品名稱用你的知識盡量填寫，商品圖片網址留空。`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type":      "application/json",
        "x-api-key":         ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model:      "claude-sonnet-4-5",
        max_tokens: 1500,
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

    // 如果有圖片網址，透過 Cloudinary 轉存
    let cloudinaryUrl = "";
    if (imageUrl && imageUrl.startsWith("http") && CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
      try {
        const timestamp  = Math.floor(Date.now() / 1000);
        const str        = `file=${encodeURIComponent(imageUrl)}&timestamp=${timestamp}&upload_preset=shop_upload${CLOUDINARY_API_SECRET}`;
        const crypto     = await import("crypto");
        const signature  = crypto.createHash("sha1").update(str).digest("hex");

        const fd = new URLSearchParams();
        fd.append("file",           imageUrl);
        fd.append("upload_preset",  "shop_upload");
        fd.append("timestamp",      timestamp);
        fd.append("api_key",        CLOUDINARY_API_KEY);
        fd.append("signature",      signature);

        const upRes  = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
          method: "POST",
          body:   fd,
        });
        const upData = await upRes.json();
        if (upData.secure_url) cloudinaryUrl = upData.secure_url;
      } catch {}
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
