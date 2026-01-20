# 🔑 Como Adicionar API Key no Thunder Client

## Método 1: Já está configurada (se importaste a coleção)

Se importaste o ficheiro `thunder-collection.json`, **a API key já está configurada** em todos os requests! ✅

Podes verificar:
1. Abrir qualquer request (ex: "Create Single Order")
2. Clicar no separador **"Headers"**
3. Deverás ver:
   - Name: `x-api-key`
   - Value: `NH001-abc123def456ghi789`

## Método 2: Adicionar manualmente

Se criaste um request novo ou não tens a key:

### Passo a Passo:

1. **Abrir o request no Thunder Client**
   - Clicar no request que queres testar

2. **Ir para o separador "Headers"**
   - Logo abaixo do URL, verás separadores: Query, Auth, Headers, Body
   - Clicar em **"Headers"**

3. **Adicionar novo header**
   - Clicar no botão **"Add"** ou na primeira linha vazia
   - **Name (Nome):** `x-api-key`
   - **Value (Valor):** `NH001-abc123def456ghi789`
   - Deixar a checkbox ativa ✓

4. **Pronto!** Agora podes enviar o request

## 📸 Layout Visual

```
┌─────────────────────────────────────────────────────────┐
│ POST  http://localhost:3000/api/orders          [Send] │
├─────────────────────────────────────────────────────────┤
│  Query   Auth   Headers   Body                         │
│                  ^^^^^^^^                               │
│                                                         │
│  ┌──────────────┬────────────────────────────┬───┐    │
│  │ Name         │ Value                      │ ✓ │    │
│  ├──────────────┼────────────────────────────┼───┤    │
│  │ Content-Type │ application/json           │ ✓ │    │
│  ├──────────────┼────────────────────────────┼───┤    │
│  │ x-api-key    │ NH001-abc123def456ghi789   │ ✓ │ ← AQUI!
│  └──────────────┴────────────────────────────┴───┘    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 🔐 API Keys Disponíveis

Podes usar qualquer uma destas:

**Unidade Norte:**
```
NH001-abc123def456ghi789
```

**Unidade Sul:**
```
NH002-xyz789uvw456rst123
```

## ⚠️ IMPORTANTE

- ✅ Nome do header deve ser **exatamente** `x-api-key` (com hífen, minúsculas)
- ✅ Value é a chave completa (sem espaços)
- ✅ Checkbox deve estar **ativa** (✓)
- ✅ Usar este header em **todos os requests** exceto:
  - Health Check
  - API Documentation

## ✅ Como Verificar se está a funcionar

**Teste 1: Com API key (deve funcionar)**
```
Headers:
  x-api-key: NH001-abc123def456ghi789

Resultado esperado:
  Status: 200 ou 201
  Resposta com "success": true
```

**Teste 2: Sem API key (deve dar erro)**
```
Headers:
  (vazio ou x-api-key desativado)

Resultado esperado:
  Status: 401
  {"success": false, "error": "API key is required"}
```

## 💡 Dica: Usar em todos os requests

Se vais fazer vários requests:

1. Adiciona o header num request
2. Thunder Client **guarda automaticamente**
3. Nos próximos requests do mesmo tipo, já aparece preenchido

Ou usa **Environments** (avançado):
- Criar Environment "Development"
- Adicionar variável: `apiKey = NH001-abc123def456ghi789`
- Usar nos headers: `{{apiKey}}`

---

## 🚀 Exemplo Completo no Thunder Client

**1. URL:**
```
POST http://localhost:3000/api/orders
```

**2. Headers (separador Headers):**
```
Content-Type: application/json
x-api-key: NH001-abc123def456ghi789
```

**3. Body (separador Body, tipo JSON):**
```json
{
  "nursingHomeId": 1,
  "patientId": 1,
  "items": [
    {
      "medicationId": 1,
      "quantity": 2
    }
  ]
}
```

**4. Clicar em "Send"** 

**5. Ver resposta com encomenda criada!** ✅
