const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const TOKENS_FILE = path.join(__dirname, 'tokens.json');

app.use(cors());
app.use(express.json());

let tokenCount = 0;
let writeQueue = Promise.resolve();

async function initTokenCount() {
  try {
    await fs.access(TOKENS_FILE);
  } catch {
    await fs.writeFile(TOKENS_FILE, JSON.stringify({ count: 0 }, null, 2));
  }

  try {
    const raw = await fs.readFile(TOKENS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    const count = Number(parsed?.count);
    tokenCount = Number.isFinite(count) && count >= 0 ? Math.floor(count) : 0;
  } catch (error) {
    console.error('[TKN8R] Failed to read tokens.json, resetting to 0:', error.message);
    tokenCount = 0;
    await fs.writeFile(TOKENS_FILE, JSON.stringify({ count: 0 }, null, 2));
  }
}

function enqueueWrite(nextCount) {
  writeQueue = writeQueue.then(async () => {
    tokenCount = nextCount;
    await fs.writeFile(TOKENS_FILE, JSON.stringify({ count: tokenCount }, null, 2));
    return tokenCount;
  });
  return writeQueue;
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/tokens/count', (_req, res) => {
  res.json({ count: tokenCount });
});

app.post('/api/tokens/increment', async (_req, res) => {
  try {
    const next = tokenCount + 1;
    const count = await enqueueWrite(next);
    res.json({ count });
  } catch (error) {
    console.error('[TKN8R] Failed to increment token count:', error.message);
    res.status(500).json({ error: 'Failed to increment token count' });
  }
});

initTokenCount().then(() => {
  app.listen(PORT, () => {
    console.log(`[TKN8R] Backend listening on port ${PORT}`);
  });
});

