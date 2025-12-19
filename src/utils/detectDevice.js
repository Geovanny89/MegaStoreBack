const detectDevice = (req) => {
  const ua = req.headers["user-agent"] || "";

  return /android|iphone|ipad/i.test(ua)
    ? "mobile"
    : "desktop";
};

module.exports = detectDevice;
