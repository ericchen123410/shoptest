export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { ADMIN_PASSWORD } = process.env;
    const { password } = req.body;

    if (!ADMIN_PASSWORD) {
      return res.status(500).json({ error: "後台密碼未設定" });
    }

    if (password === ADMIN_PASSWORD) {
      // 產生一個簡單的 session token（時間戳 + 隨機）
      const token = Buffer.from(
        `admin:${Date.now()}:${Math.random().toString(36).slice(2)}`
      ).toString("base64");

      return res.status(200).json({ success: true, token });
    }

    res.status(401).json({ error: "密碼錯誤" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
