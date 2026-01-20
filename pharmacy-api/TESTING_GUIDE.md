# 🧪 Guia de Testes da API

## 1️⃣ Iniciar o Servidor

```bash
cd /Users/leandromonteiro/Desktop/GitHub/DSOS/pharmacy-api
npm run dev
```

Deverás ver:
```
✓ Database connection established successfully
✓ Database synchronized
✓ Server running on port 3000
✓ API available at http://localhost:3000/api
```

---

## 2️⃣ API Keys (do seed_data.sql)

- **Unidade Norte:** `NH001-abc123def456ghi789`
- **Unidade Sul:** `NH002-xyz789uvw456rst123`

**IMPORTANTE:** Usar no header `x-api-key` em todas as requisições!

---

## 3️⃣ Testes Básicos

### ✅ Health Check (sem autenticação)

**Request:**
```bash
curl http://localhost:3000/health
```

**Resposta esperada:**
```json
{
  "success": true,
  "message": "Pharmacy API is running",
  "timestamp": "2026-01-20T12:53:00.000Z",
  "environment": "development"
}
```

### ✅ API Info (sem autenticação)

```bash
curl http://localhost:3000/api
```

---

## 4️⃣ Testes de Encomendas

### 📦 Criar Encomenda Individual

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -H "x-api-key: NH001-abc123def456ghi789" \
  -d '{
    "nursingHomeId": 1,
    "patientId": 1,
    "items": [
      {
        "medicationId": 1,
        "quantity": 2
      },
      {
        "medicationId": 3,
        "quantity": 1
      }
    ]
  }'
```

**Resposta esperada:**
- `success: true`
- Encomenda com número único (ex: `ORD-1737375180000-123`)
- Status: `SENT_TO_PHARMACY`
- Total calculado automaticamente

### 📦📦 Criar Encomendas em Lote

```bash
curl -X POST http://localhost:3000/api/orders/batch \
  -H "Content-Type: application/json" \
  -H "x-api-key: NH001-abc123def456ghi789" \
  -d '{
    "orders": [
      {
        "nursingHomeId": 1,
        "patientId": 1,
        "items": [{"medicationId": 1, "quantity": 3}]
      },
      {
        "nursingHomeId": 1,
        "patientId": 2,
        "items": [{"medicationId": 2, "quantity": 1}]
      }
    ]
  }'
```

### 🔍 Consultar Estado da Encomenda

```bash
curl http://localhost:3000/api/orders/1 \
  -H "x-api-key: NH001-abc123def456ghi789"
```

### ⏭️ Atualizar Estado da Encomenda

```bash
curl -X PUT http://localhost:3000/api/orders/1/status \
  -H "Content-Type: application/json" \
  -H "x-api-key: NH001-abc123def456ghi789" \
  -d '{
    "status": "PROCESSING"
  }'
```

**Estados válidos:**
- `SENT_TO_PHARMACY`
- `PROCESSING`
- `SENT_TO_NURSING_HOME`
- `RECEIVED`
- `CANCELLED`

### ❌ Cancelar Encomenda

```bash
curl -X PUT http://localhost:3000/api/orders/1/cancel \
  -H "x-api-key: NH001-abc123def456ghi789"
```

⚠️ **Nota:** Só funciona se status = `SENT_TO_PHARMACY`

---

## 5️⃣ Testes de Histórico

### 👤 Histórico do Utente

```bash
curl "http://localhost:3000/api/history/patient/1" \
  -H "x-api-key: NH001-abc123def456ghi789"
```

**Com intervalo de datas:**
```bash
curl "http://localhost:3000/api/history/patient/1?startDate=2024-01-01&endDate=2026-12-31" \
  -H "x-api-key: NH001-abc123def456ghi789"
```

### 🏥 Histórico do Lar

```bash
curl "http://localhost:3000/api/history/nursing-home/1" \
  -H "x-api-key: NH001-abc123def456ghi789"
```

### 💊 Histórico de Medicamento

```bash
curl "http://localhost:3000/api/history/medication/1" \
  -H "x-api-key: NH001-abc123def456ghi789"
```

---

## 6️⃣ Testes de Faturas

### 📄 Fatura de Encomenda

```bash
curl http://localhost:3000/api/invoices/1 \
  -H "x-api-key: NH001-abc123def456ghi789"
```

**Resposta inclui:**
- Número da fatura
- Info do lar e utente
- Itens detalhados
- Subtotal, IVA (23%), Total

### 📊 Faturas do Lar

```bash
curl "http://localhost:3000/api/invoices/nursing-home/1" \
  -H "x-api-key: NH001-abc123def456ghi789"
```

**Com filtros:**
```bash
curl "http://localhost:3000/api/invoices/nursing-home/1?status=RECEIVED&startDate=2024-01-01" \
  -H "x-api-key: NH001-abc123def456ghi789"
```

---

## 7️⃣ Testes de Validação (Erros Esperados)

### ❌ Sem API Key
```bash
curl http://localhost:3000/api/orders/1
```
**Esperado:** `401 - API key is required`

### ❌ API Key Inválida
```bash
curl http://localhost:3000/api/orders/1 \
  -H "x-api-key: INVALID_KEY"
```
**Esperado:** `401 - Invalid API key`

### ❌ Dados Inválidos
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -H "x-api-key: NH001-abc123def456ghi789" \
  -d '{
    "nursingHomeId": "invalid",
    "patientId": 1,
    "items": []
  }'
```
**Esperado:** `400 - Validation failed`

### ❌ Cancelar Encomenda em Estado Errado
```bash
# Primeiro criar encomenda e atualizar estado
curl -X PUT http://localhost:3000/api/orders/1/status \
  -H "Content-Type: application/json" \
  -H "x-api-key: NH001-abc123def456ghi789" \
  -d '{"status": "PROCESSING"}'

# Tentar cancelar (deve falhar)
curl -X PUT http://localhost:3000/api/orders/1/cancel \
  -H "x-api-key: NH001-abc123def456ghi789"
```
**Esperado:** `400 - Order can only be cancelled when status is SENT_TO_PHARMACY`

---

## 8️⃣ Testar com Postman

1. **Importar coleção:**
   - Abrir Postman
   - Import → File → Selecionar `postman_collection.json`

2. **Configurar API Key:**
   - Editar coleção
   - Variables → Adicionar `api_key` = `NH001-abc123def456ghi789`
   - Ou editar manualmente em cada pedido

3. **Executar testes:**
   - Todos os endpoints já configurados
   - Basta clicar "Send" em cada um

---

## 9️⃣ Verificar no phpMyAdmin

Depois de criar encomendas, verificar em phpMyAdmin:

1. Selecionar BD `pharmacy_db`
2. Tabela `orders` → Ver encomendas criadas
3. Tabela `order_items` → Ver itens de cada encomenda

---

## 🎯 Fluxo de Teste Completo

```bash
# 1. Health check
curl http://localhost:3000/health

# 2. Criar encomenda
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -H "x-api-key: NH001-abc123def456ghi789" \
  -d '{"nursingHomeId":1,"patientId":1,"items":[{"medicationId":1,"quantity":2}]}'

# 3. Consultar (substituir :id pelo id retornado)
curl http://localhost:3000/api/orders/1 \
  -H "x-api-key: NH001-abc123def456ghi789"

# 4. Atualizar estado
curl -X PUT http://localhost:3000/api/orders/1/status \
  -H "Content-Type: application/json" \
  -H "x-api-key: NH001-abc123def456ghi789" \
  -d '{"status":"PROCESSING"}'

# 5. Ver histórico do utente
curl http://localhost:3000/api/history/patient/1 \
  -H "x-api-key: NH001-abc123def456ghi789"

# 6. Ver fatura
curl http://localhost:3000/api/invoices/1 \
  -H "x-api-key: NH001-abc123def456ghi789"
```

---

## 📝 Notas Importantes

- ✅ MySQL deve estar a correr
- ✅ Base de dados `pharmacy_db` deve existir com dados
- ✅ Servidor deve estar ativo (`npm run dev`)
- ✅ Usar sempre o header `x-api-key`
- ✅ IDs válidos: nursing_home (1,2), patient (1-4), medication (1-8)

## 🐛 Resolução de Problemas

**Erro de conexão:**
```
Error: connect ECONNREFUSED 127.0.0.1:3000
```
→ Servidor não está a correr. Executar `npm run dev`

**Erro 401:**
```
{"success":false,"error":"API key is required"}
```
→ Adicionar header `-H "x-api-key: NH001-abc123def456ghi789"`

**Erro 404:**
```
{"success":false,"error":"Order not found"}
```
→ ID da encomenda não existe. Verificar no phpMyAdmin
