const express = require('express');

const app = express();
app.use(express.json({ limit: '1mb' }));

const HIG_API_BASE = String(
  process.env.HIG_API_BASE || 'https://botv1.api.hi-g.io',
).trim();
const HIG_CATALOG_API_KEY = String(
  process.env.HIG_CATALOG_API_KEY || '',
).trim();

function pickLuckyNumber() {
  return Math.floor(Math.random() * 99) + 1; // 1..99
}

async function getCatalogPurchasesByWallet({ chatId, wallet }) {
  if (!HIG_CATALOG_API_KEY || !chatId || !wallet) {
    return null;
  }

  const url = `${HIG_API_BASE}/catalog-purchases-by-wallet`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': HIG_CATALOG_API_KEY,
      },
      body: JSON.stringify({
        chatId,
        wallet,
        limit: 50,
      }),
    });

    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.ok) return null;
    return json;
  } catch (_) {
    return null;
  }
}

app.get('/health', (_, res) => {
  res.status(200).json({ ok: true, service: 'public-examples' });
});

// 1) Catalog purchase webhook endpoint
app.post('/webhook/catalog-purchase', (req, res) => {
  const body = req.body || {};
  const ts = new Date().toISOString();

  console.log(`\n[${ts}] --- catalog webhook received ---`);
  console.log('event:', body.event);
  console.log('order_id:', body?.order?.order_id);
  console.log('total:', body?.order?.total, body?.order?.currency || 'USDC');
  console.log('buyer:', body?.buyer?.wallet);
  console.log('item:', body?.item?.name, `(x${body?.item?.quantity || 0})`);
  console.log('checkout_fields:', body?.checkout_fields || {});

  return res.status(200).json({ ok: true });
});

// 2) Custom bot URL endpoint (Lucky Number, no AI)
// Also includes an example that checks if user already bought in this chat.
app.post('/bot/custom-response', async (req, res) => {
  const body = req.body || {};
  console.dir(body, { depth: null });
  const type = String(body.type || 'text');
  const lucky = pickLuckyNumber();
  const ts = new Date().toISOString();
  const orderId =
    body?.input?.order?.order_id ||
    body?.input?.payload?.order?.order_id ||
    null;

  console.log(`\n[${ts}] --- custom bot url request ---`);
  console.log('type:', type);
  console.log('schema_version:', body.schema_version);
  console.log('order_id:', orderId);

  if (type === 'catalog') {
    const productName = body?.input?.payload?.item?.name || 'tu compra';
    return res.status(200).json({
      text: `Gracias por tu compra de ${productName}. Tu numero de la suerte de hoy es ${lucky}.`,
    });
  }

  // Optional: use Hi-G endpoint to check catalog purchases by wallet.
  // Requires:
  // - HIG_API_BASE
  // - HIG_CATALOG_API_KEY
  const chatId = String(body?.input?.chat?.chat_id || '').trim();
  const wallet = String(body?.input?.sender?.wallet || '').trim();
  const purchasesResult = await getCatalogPurchasesByWallet({ chatId, wallet });

  if (purchasesResult && Number(purchasesResult.count || 0) > 0) {
    return res.status(200).json({
      text: `Ya veo ${purchasesResult.count} compra(s) previas en este chat. Te doy soporte avanzado. Numero de la suerte: ${lucky}.`,
    });
  }

  if (purchasesResult && Number(purchasesResult.count || 0) === 0) {
    return res.status(200).json({
      text: `Aun no veo compras de catalogo en este chat para tu wallet. Si compras uno, te habilito el flujo premium. Numero de la suerte: ${lucky}.`,
    });
  }

  // Fallback when HIG_API_BASE/HIG_CATALOG_API_KEY are not configured
  // or the endpoint is not reachable.
  return res.status(200).json({
    text: `Tu numero de la suerte de hoy es ${lucky}.`,
  });
});

const port = Number(process.env.PORT || 7010);
app.listen(port, () => {
  console.log(`Public examples server listening on http://localhost:${port}`);
  console.log('Endpoints:');
  console.log('- POST /webhook/catalog-purchase');
  console.log('- POST /bot/custom-response');
});
