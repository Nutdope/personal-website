// api/log-visit.js
export default function handler(req, res) {
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.headers["x-real-ip"] ||
    req.socket.remoteAddress;

  const userAgent = req.headers["user-agent"] || "unknown";

  console.log(`[VISITOR] IP: ${ip} | User-Agent: ${userAgent}`);

  res.status(200).json({ ok: true });
}