export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return res.status(500).json({ error: "Telegram not configured" });
  }

  const body = req.body || {};
  const name = String(body.name || "").trim().slice(0, 80);
  const contact = String(body.contact || "").trim().slice(0, 120);
  const comment = String(body.comment || "").trim().slice(0, 1500);
  const services = Array.isArray(body.services) ? body.services.slice(0, 10) : [];

  if (!name || !contact || !services.length) {
    return res.status(400).json({ error: "Заполни все обязательные поля" });
  }

  const lines = services.map(s =>
    `• ${String(s.name || "Услуга").slice(0,100)} — ${
      Number(s.price) > 0 ? Number(s.price).toLocaleString("ru-RU") + " ₽" : "По запросу"
    }`
  );

  const total = services.reduce((sum, s) =>
    sum + (Number(s.price) > 0 ? Number(s.price) : 0), 0
  );

  const message = [
    "🟣 НОВАЯ ЗАЯВКА — KOZRAGE",
    "",
    "Имя: " + name,
    "Контакт: " + contact,
    "",
    "Услуги:",
    ...lines,
    "",
    "Итого: " + total.toLocaleString("ru-RU") + " ₽",
    "Комментарий: " + (comment || "—")
  ].join("\n");

  const response = await fetch(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: message })
    }
  );

  const result = await response.json();

  if (!response.ok || !result.ok) {
    return res.status(502).json({ error: "Ошибка Telegram" });
  }

  return res.status(200).json({ ok: true });
}
