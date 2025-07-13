// Logging utility
const log = {
  info: (message, data = null) => {
    const timestamp = new Date().toISOString();
    console.log(
      `[${timestamp}] ℹ️  ${message}`,
      data ? JSON.stringify(data, null, 2) : ""
    );
  },
  error: (message, error = null) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ❌ ${message}`, error || "");
    if (error && error.stack) {
      console.error(`[${timestamp}] 📚 Stack trace:`, error.stack);
    }
  },
  success: (message, data = null) => {
    const timestamp = new Date().toISOString();
    console.log(
      `[${timestamp}] ✅ ${message}`,
      data ? JSON.stringify(data, null, 2) : ""
    );
  },
  warning: (message, data = null) => {
    const timestamp = new Date().toISOString();
    console.warn(
      `[${timestamp}] ⚠️  ${message}`,
      data ? JSON.stringify(data, null, 2) : ""
    );
  },
  debug: (message, data = null) => {
    const timestamp = new Date().toISOString();
    console.debug(
      `[${timestamp}] 🔍 ${message}`,
      data ? JSON.stringify(data, null, 2) : ""
    );
  },
  sync: (message, data = null) => {
    const timestamp = new Date().toISOString();
    console.log(
      `[${timestamp}] 🔄 [SYNC] ${message}`,
      data ? JSON.stringify(data, null, 2) : ""
    );
  },
};

// Request logging middleware
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  log.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    query: req.query,
    body: req.method === "POST" || req.method === "PUT" ? req.body : undefined,
  });

  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const logMethod = res.statusCode >= 400 ? "error" : "success";
    log[logMethod](`${req.method} ${req.path} - ${res.statusCode}`, {
      duration: `${duration}ms`,
      status: res.statusCode,
    });
  });

  next();
};

module.exports = { log, requestLogger };
