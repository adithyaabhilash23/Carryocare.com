// CarryO Care — Customer Reviews API Endpoint
// Handles GET (approved reviews) and POST (new customer submissions with moderation)

try {
  require('dotenv').config();
} catch (e) {
  // dotenv is optional in production environments with native env injection
}

const { neon } = require('@neondatabase/serverless');

/**
 * Helper to safely extract JSON body across Vercel serverless and native Node HTTP
 */
async function parseJsonBody(req) {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch (e) {
      return null;
    }
  }

  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      // Protect against oversized request bodies (> 50KB)
      if (raw.length > 50000) {
        req.destroy();
        resolve(null);
      }
    });
    req.on('end', () => {
      if (!raw || raw.trim().length === 0) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        resolve(null);
      }
    });
    req.on('error', () => resolve(null));
  });
}

module.exports = async function handler(req, res) {
  // Standard CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  const databaseUrl = process.env.DATABASE_URL;

  // ──────────────────────────────────────────────────────────
  // GET: Fetch latest approved reviews
  // ──────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    if (!databaseUrl) {
      console.warn('[api/reviews] DATABASE_URL is not configured.');
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify([]));
    }

    try {
      const sql = neon(databaseUrl);
      let rows;
      try {
        // Query approved reviews with name support
        rows = await sql`
          SELECT id, rating, feedback, name, created_at
          FROM reviews
          WHERE status = 'approved'
          ORDER BY created_at DESC
          LIMIT 20;
        `;
      } catch (colErr) {
        // Safe transition fallback if status column has not yet been migrated
        if (colErr.message && (colErr.message.includes('column "status"') || colErr.message.includes('status'))) {
          rows = await sql`
            SELECT id, rating, feedback, created_at
            FROM reviews
            ORDER BY created_at DESC
            LIMIT 20;
          `;
        } else {
          throw colErr;
        }
      }

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
      return res.end(JSON.stringify(rows));
    } catch (err) {
      console.error('[api/reviews] GET failed:', err.message);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: 'Reviews are temporarily unavailable.' }));
    }
  }

  // ──────────────────────────────────────────────────────────
  // POST: Submit a new customer review (defaults to pending)
  // ──────────────────────────────────────────────────────────
  if (req.method === 'POST') {
    const body = await parseJsonBody(req);

    if (body === null) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ success: false, error: 'Invalid or oversized JSON body.' }));
    }

    // 1. Anti-spam honeypot check
    // If the hidden honeypot field is filled, silently succeed without storing
    if (body.website && typeof body.website === 'string' && body.website.trim().length > 0) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({
        success: true,
        message: 'Thank you for sharing your experience. Your review has been submitted and will appear after a quick review.'
      }));
    }

    // 2. Validate rating (integer 1 to 5)
    const rating = Number(body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ success: false, error: 'Please select a rating between 1 and 5 stars.' }));
    }

    // 3. Validate feedback (string, 10 to 1000 characters)
    if (typeof body.feedback !== 'string') {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ success: false, error: 'Feedback text is required.' }));
    }

    const trimmedFeedback = body.feedback.trim();
    if (trimmedFeedback.length < 10) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ success: false, error: 'Feedback must be at least 10 characters long.' }));
    }

    if (trimmedFeedback.length > 1000) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ success: false, error: 'Feedback cannot exceed 1000 characters.' }));
    }

    // 4. Validate optional customer name (max 100 characters)
    let cleanName = null;
    if (body.name && typeof body.name === 'string') {
      const trimmedName = body.name.trim();
      if (trimmedName.length > 0) {
        cleanName = trimmedName.slice(0, 100);
      }
    }

    // 5. Database connectivity check
    if (!databaseUrl) {
      console.warn('[api/reviews] DATABASE_URL is not configured for POST.');
      res.statusCode = 503;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({
        success: false,
        error: 'Review submission is temporarily unavailable. Please try again shortly.'
      }));
    }

    // 6. Insert review with parameterized query and status = 'pending'
    try {
      const sql = neon(databaseUrl);

      try {
        await sql`
          INSERT INTO reviews (rating, feedback, name, status)
          VALUES (${rating}, ${trimmedFeedback}, ${cleanName}, 'pending');
        `;
      } catch (insertErr) {
        // Auto-heal missing status/name columns if database was created with earlier schema
        if (insertErr.message && (insertErr.message.includes('column "status"') || insertErr.message.includes('column "name"'))) {
          await sql`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS name VARCHAR(100);`;
          await sql`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'pending';`;
          await sql`
            INSERT INTO reviews (rating, feedback, name, status)
            VALUES (${rating}, ${trimmedFeedback}, ${cleanName}, 'pending');
          `;
        } else {
          throw insertErr;
        }
      }

      res.statusCode = 201;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({
        success: true,
        message: 'Thank you for sharing your experience. Your review has been submitted and will appear after a quick review.'
      }));
    } catch (dbErr) {
      console.error('[api/reviews] POST failed:', dbErr.message);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({
        success: false,
        error: 'We could not submit your review at this time. Please try again shortly.'
      }));
    }
  }

  // Reject all other HTTP methods
  res.statusCode = 405;
  res.setHeader('Content-Type', 'application/json');
  return res.end(JSON.stringify({ error: 'Method not allowed' }));
};
