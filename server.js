const express = require('express');

const app = express();
app.use(express.json({ limit: '1mb' }));

function pickLuckyNumber() {
  return Math.floor(Math.random() * 99) + 1; // 1..99
}

app.get('/health', (_, res) => {
  res.status(200).json({ ok: true, service: 'public-examples' });
});

// 1) Catalog purchase webhook endpoint
app.post('/webhook/catalog-purchase', (req, res) => {
  const body = req.body || {};

  console.log('\n--- catalog webhook received ---');
  console.log('event:', body.event);
  console.log('order_id:', body?.order?.order_id);
  console.log('total:', body?.order?.total, body?.order?.currency || 'USDC');
  console.log('buyer:', body?.buyer?.wallet);
  console.log('item:', body?.item?.name, `(x${body?.item?.quantity || 0})`);
  console.log('checkout_fields:', body?.checkout_fields || {});

  return res.status(200).json({ ok: true });
});

// 2) Custom bot URL endpoint (Lucky Number, no AI)
app.post('/bot/custom-response', (req, res) => {
  const body = req.body || {};
  const type = String(body.type || 'text');
  const lucky = pickLuckyNumber();

  console.log('\n--- custom bot url request ---');
  console.log('type:', type);
  console.log('schema_version:', body.schema_version);

  if (type === 'catalog') {
    const productName = body?.input?.payload?.item?.name || 'tu compra';
    return res.status(200).json({
      text: `Gracias por tu compra de ${productName}. Tu numero de la suerte de hoy es ${lucky}.`,
    });
  }

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
