// POST → 寄送訂單通知信（使用 Gmail SMTP via fetch）
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { orderId, customerId, total, items } = req.body;
    const { GMAIL_USER, GMAIL_PASS } = process.env;

    if (!GMAIL_USER || !GMAIL_PASS) {
      return res.status(500).json({ error: "未設定 Gmail 環境變數" });
    }

    const itemsText = Array.isArray(items)
      ? items.map(i => `${i.name}${i.variant ? `（${i.variant}）` : ""} × ${i.qty}  NT$${Math.floor(i.price * i.qty).toLocaleString()}`).join("\n")
      : (items || "");

    const subject = `新訂單 ${orderId}`;
    const bodyText = [
      "W-82 大阪代購 新訂單",
      "",
      `訂單編號：${orderId}`,
      `客戶編號：${customerId || "—"}`,
      `訂單金額：NT$ ${Math.floor(total || 0).toLocaleString()}`,
      "",
      "商品明細：",
      itemsText,
      "",
      "請至後台查看：https://shoptest-chi.vercel.app/admin.html",
    ].join("\n");

    // Base64 encode credentials
    const credentials = Buffer.from(`${GMAIL_USER}:${GMAIL_PASS}`).toString("base64");

    // 使用 Gmail API 寄信
    const emailContent = [
      `To: ${GMAIL_USER}`,
      `From: W-82訂單系統 <${GMAIL_USER}>`,
      `Subject: ${subject}`,
      "Content-Type: text/plain; charset=UTF-8",
      "",
      bodyText,
    ].join("\r\n");

    const encoded = Buffer.from(emailContent)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    // 用 OAuth2 不方便，改用 nodemailer（Vercel 支援 npm）
    const { createTransport } = await import("nodemailer");
    const transporter = createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"W-82 訂單系統" <${GMAIL_USER}>`,
      to: GMAIL_USER,
      subject,
      text: bodyText,
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("寄信失敗:", err.message);
    res.status(500).json({ error: err.message });
  }
}
