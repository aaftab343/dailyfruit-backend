const buckets = new Map();

/**
 * Very simple in-memory IP-based rate limiter.
 * Not for huge scale, but good baseline protection.
 */
export const rateLimiter = (opts = {}) => {
  const windowMs = opts.windowMs || 60 * 1000; // default 1 min
  const max = opts.max || 100; // default 100 reqs per window

  return (req, res, next) => {
    const key = req.ip || 'global';
    const now = Date.now();
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { count: 1, start: now };
      buckets.set(key, bucket);
      return next();
    }

    if (now - bucket.start > windowMs) {
      bucket.count = 1;
      bucket.start = now;
      return next();
    }

    bucket.count += 1;
    if (bucket.count > max) {
      return res.status(429).json({ message: 'Too many requests, please try again later.' });
    }
    next();
  };
};
