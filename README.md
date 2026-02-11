# Ejemplo Publico (Hi-G)

Este proyecto contiene un servidor unico de ejemplo con dos endpoints:

- `POST /webhook/catalog-purchase`
- `POST /bot/custom-response`

Archivo principal:

- `server.js`
- `package.json`

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
    "chat_id": "<chat_id>",
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
  "chatId": "<chat_id>",
  "wallet": "<buyer_wallet>",
  "apiKey": "hig_cat_..."
}
```

Tambien puedes enviar la API key por header:

- `x-api-key: hig_cat_...`

Respuesta (resumen):

```json
{
  "ok": true,
  "chatId": "<chat_id>",
  "wallet": "<buyer_wallet>",
  "count": 2,
  "purchases": []
}
```

Formato JSON de `purchases`:

```json
{
  "ok": true,
  "chatId": "<chat_id>",
  "wallet": "<buyer_wallet>",
  "count": 1,
  "purchases": [
    {
      "orderId": "<order_id>",
      "firestoreId": "<firestore_doc_id>",
      "chatId": "<chat_id>",
      "buyerWallet": "<buyer_wallet>",
      "sellerWallet": "<seller_wallet_or_empty>",
      "total": 0,
      "currency": "<currency_or_USDC>",
      "status": "<completed|pending|...>",
      "createdAt": "<ISO_DATETIME>",
      "updatedAt": "<ISO_DATETIME>",
      "items": [
        {
          "catalogId": "<catalog_id>",
          "itemId": "<item_id>",
          "name": "<item_name>",
          "quantity": 0,
          "price": 0
        }
      ],
      "checkoutData": {
        "<catalog_id>:<item_id>": {
          "<field_name>": "<value>"
        }
      }
    }
  ]
}
```

Notas de los campos:

- `count`: total de compras encontradas para ese `chatId + wallet`.
- `purchases`: lista de ordenes con solo compras de catalogo.
- `checkoutData`: datos capturados en checkout por item (si existen).
- `createdAt` / `updatedAt`: normalmente vienen en formato ISO; solo pueden venir `null` si la orden no tiene ningun timestamp guardado.
- `currency`: si la orden no tiene moneda guardada, el backend responde `USDC` por defecto.

Caso de uso para tu bot personalizado:

- En `server.js`, el endpoint `POST /bot/custom-response` ya incluye ejemplo de esta consulta.
- Si `count > 0`, responde un texto diferente (usuario ya compró).
- Si `count == 0`, responde otro texto (usuario aún no compró).
- Si falla la consulta, usa fallback.

Variables de entorno para ese ejemplo:

- `HIG_API_BASE=https://botv1.api.hi-g.io`
- `HIG_CATALOG_API_KEY=<api_key_generada_en_el_grupo>`

## Troubleshooting rapido (si devuelve `count: 0`)

1. Verifica que `chatId` sea el ID exacto de la comunidad/canal donde se compro.
2. Verifica que `wallet` sea la wallet compradora exacta.
3. Verifica que la API key pertenezca a ese mismo `chatId` (si no, devolvera `invalid_api_key` o `0` segun tu flujo).
4. Si agregaste o cambiaste el endpoint recientemente, reinicia el proceso Node/PM2 para cargar cambios.
5. Si antes veias `Cannot POST /catalog-purchases-by-wallet`, revisa que el proxy (Nginx/Hestia) apunte al puerto del backend correcto.

Codigos de error comunes:

- `400 missing_params`: faltan `chatId`, `wallet` o API key.
- `403 api_key_not_configured`: el grupo aun no tiene API key configurada.
- `403 invalid_api_key`: API key incorrecta para ese grupo.
- `404 group_not_found`: `chatId` no existe.

Limite de respuesta (backend Hi-G):

- Variable: `CUSTOM_BOT_MAX_REPLY_CHARS`
- Default: `1200`
- Maximo permitido: `10000` caracteres
- Si el texto supera el limite configurado, Hi-G lo recorta automaticamente.

## Ejecutar

```bash
npm i
cp .env.example .env
npm start
```

Este ejemplo carga variables de entorno desde `.env` usando `dotenv`.

Por defecto corre en `http://localhost:7010`.
