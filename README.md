# Public Examples (Hi-G)

Este directorio contiene un servidor unico de ejemplo con dos endpoints:

- `POST /webhook/catalog-purchase`
- `POST /bot/custom-response`

Archivo principal:

- `public-examples/server.js`
- `public-examples/package.json`

## 1) Webhook de catalogo

Endpoint:

- `POST /webhook/catalog-purchase`

Payload base que envia Hi-G:

```json
{
  "schema_version": 1,
  "event": "catalog_purchase",
  "timestamp_utc": "2026-02-11T12:00:00.000Z",
  "context": {
    "is_group": true,
    "chat_id": "Ai7FfzU2Ljik6yCyUXDH",
    "chat_title": "Mi comunidad"
  },
  "order": {
    "order_id": "abc123",
    "total": 15,
    "currency": "USDC"
  },
  "buyer": { "wallet": "0x..." },
  "seller": { "wallet": "0x..." },
  "item": {
    "item_ref": "catalogId:itemId",
    "catalog_id": "catalogId",
    "item_id": "itemId",
    "name": "rosas",
    "quantity": 1,
    "price": 15
  },
  "items": [],
  "checkout_fields": {}
}
```

Respuesta esperada:

```json
{ "ok": true }
```

## 2) URL personalizada del bot (sin IA, ejemplo numero de la suerte)

Endpoint:

- `POST /bot/custom-response`

Hi-G envia, por ejemplo:

```json
{
  "schema_version": 1,
  "type": "text",
  "input": {
    "chat": { "chat_id": "...", "chat_title": "...", "is_group": true },
    "sender": { "wallet": "0x..." },
    "privacy": { "is_private": true },
    "message": { "text": "@Hi-G AI Hola" }
  }
}
```

Tambien puede enviar `type: "catalog"` cuando la respuesta viene de compra de catalogo.

Respuesta requerida:

```json
{ "text": "Tu numero de la suerte de hoy es 27." }
```

## 3) Consultar compras por wallet (nuevo endpoint Hi-G)

Endpoint del backend Hi-G:

- `POST /catalog-purchases-by-wallet`

Body:

```json
{
  "chatId": "Ai7FfzU2Ljik6yCyUXDH",
  "wallet": "0x9af7023fcdd4de41614c8b14747cb586d2234aa1",
  "apiKey": "hig_cat_..."
}
```

Tambien puedes enviar la API key por header:

- `x-api-key: hig_cat_...`

Respuesta (resumen):

```json
{
  "ok": true,
  "chatId": "Ai7FfzU2Ljik6yCyUXDH",
  "wallet": "0x9af7023fcdd4de41614c8b14747cb586d2234aa1",
  "count": 2,
  "purchases": []
}
```

Caso de uso para tu bot personalizado:

- En `public-examples/server.js`, el endpoint `POST /bot/custom-response` ya incluye ejemplo de esta consulta.
- Si `count > 0`, responde un texto diferente (usuario ya compró).
- Si `count == 0`, responde otro texto (usuario aún no compró).
- Si falla la consulta, usa fallback.

Variables de entorno para ese ejemplo:

- `HIG_API_BASE=https://botv1.api.hi-g.io`
- `HIG_CATALOG_API_KEY=<api_key_generada_en_el_grupo>`

Limite de respuesta (backend Hi-G):

- Variable: `CUSTOM_BOT_MAX_REPLY_CHARS`
- Default: `1200`
- Maximo permitido: `10000` caracteres
- Si el texto supera el limite configurado, Hi-G lo recorta automaticamente.

## Ejecutar

```bash
cd public-examples
npm i
cp .env.example .env
npm start
```

Por defecto corre en `http://localhost:8080`.
