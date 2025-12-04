export const healthCheck = async (req, res) => {
  const uptime = process.uptime();
  const now = new Date();
  res.json({
    status: 'ok',
    timestamp: now.toISOString(),
    uptimeSeconds: Math.round(uptime)
  });
};
