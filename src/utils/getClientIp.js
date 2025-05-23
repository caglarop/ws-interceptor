// src/utils/getClientIp.js

/**
 * Attempts to extract the real client IP from a WebSocket request.
 * Considers proxies, Cloudflare, Nginx, etc.
 */
function getClientIp(ws, req) {
  // 1. Check for x-forwarded-for header (may contain multiple IPs)
  let ip =
    req?.headers?.["x-forwarded-for"] ||
    req?.headers?.["cf-connecting-ip"] || // Cloudflare
    req?.headers?.["x-real-ip"] || // Nginx
    null;

  if (ip) {
    // If multiple IPs, take the first one (client IP)
    if (ip.includes(",")) {
      ip = ip.split(",")[0].trim();
    }

    return ip;
  }

  // 2. Fallback: native socket IP
  return (
    ws?._socket?.remoteAddress ||
    req?.socket?.remoteAddress ||
    req?.connection?.remoteAddress ||
    null
  );
}

module.exports = getClientIp;
