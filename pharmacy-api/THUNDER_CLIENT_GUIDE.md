# 🌩️ Como Usar Thunder Client

## 1️⃣ Instalar Thunder Client

Se ainda não tens instalado:

1. Abrir VS Code
2. Ir para Extensions (⇧⌘X)
3. Procurar "Thunder Client"
4. Clicar em "Install"

## 2️⃣ Importar a Coleção

### Método 1: Importar ficheiro

1. **Abrir Thunder Client**
   - Clicar no ícone ⚡ na barra lateral do VS Code
   - Ou usar `Cmd+Shift+P` → "Thunder Client: New Request"

2. **Importar Collection**
   - Clicar em "Collections" no Thunder Client
   - Clicar nos 3 pontinhos ⋮ → "Import"
   - Selecionar o ficheiro `thunder-collection.json`
   - ✅ Coleção "Pharmacy API" importada!

### Método 2: Abrir no workspace

Se o Thunder Client detetar automaticamente:
- A coleção pode aparecer automaticamente em "Collections"
- Caso contrário, usar Método 1

## 3️⃣ Estrutura da Coleção

A coleção está organizada em 4 pastas:

```
📁 Pharmacy API
├── 📁 Health & Info
│   ├── Health Check
│   └── API Documentation
├── 📁 Orders
│   ├── Create Single Order
│   ├── Create Batch Orders
│   ├── Get Order Status
│   ├── Update Order Status
│   └── Cancel Order
├── 📁 History
│   ├── Patient Order History
│   ├── Nursing Home History
│   └── Medication History
└── 📁 Invoices
    ├── Get Order Invoice
    └── Get Nursing Home Invoices
```

## 4️⃣ Como Testar

### Passo 1: Health Check (sem autenticação)

1. Abrir "Health & Info" → "Health Check"
2. Clicar em **Send**
3. Deverás ver: `"success": true`

### Passo 2: Criar uma Encomenda

1. Abrir "Orders" → "Create Single Order"
2. **Headers já configurados:**
   - `Content-Type: application/json`
   - `x-api-key: NH001-abc123def456ghi789`
3. **Body já preenchido** com exemplo
4. Clicar em **Send**
5. **Resposta esperada:**
   - Status: `201 Created`
   - Encomenda criada com número único
   - Guardar o `id` da encomenda

### Passo 3: Consultar a Encomenda

1. Abrir "Orders" → "Get Order Status"
2. **Ajustar URL:** Trocar `/1` pelo ID da encomenda criada
3. Clicar em **Send**
4. Ver detalhes completos da encomenda

### Passo 4: Outros Endpoints

Todos os endpoints estão prontos para usar! Basta:
- Selecionar o request
- (Opcional) Ajustar IDs no URL
- Clicar em **Send**

## 5️⃣ Funcionalidades Thunder Client

### ✅ Query Parameters

Em requests com parâmetros opcionais (ex: History), podes:
- **Ativar/Desativar** parâmetros clicando na checkbox
- **Editar valores** diretamente na tabela Query Params

Exemplo no "Patient Order History":
```
startDate: 2024-01-01  [✓] (ativo)
endDate: 2026-12-31    [✓] (ativo)
```

### ✅ Editar Headers

Todos os requests têm o header `x-api-key` já configurado.

Para trocar de API key:
1. Abrir o request
2. Separador "Headers"
3. Editar valor de `x-api-key`

**API Keys disponíveis:**
- Unidade Norte: `NH001-abc123def456ghi789`
- Unidade Sul: `NH002-xyz789uvw456rst123`

### ✅ Editar Body (POST/PUT)

Para requests POST/PUT:
1. Separador "Body"
2. Tipo: JSON (já selecionado)
3. Editar o JSON conforme necessário

### ✅ Ver Respostas

Depois de enviar:
- **Status Code** aparece no topo (200, 201, 400, etc.)
- **Response Body** mostra JSON formatado
- **Headers** da resposta disponíveis no separador
- **Time** mostra quanto demorou

### ✅ Histórico

Thunder Client guarda histórico automático:
- Separador "History" mostra todos os requests enviados
- Útil para repetir requests anteriores

## 6️⃣ Fluxo de Teste Recomendado

```
1. Health Check
   ↓
2. API Documentation (ver estrutura)
   ↓
3. Create Single Order
   ↓
4. Get Order Status (usar ID retornado)
   ↓
5. Update Order Status (ex: para PROCESSING)
   ↓
6. Patient Order History
   ↓
7. Get Order Invoice
   ↓
8. Nursing Home History
```

## 7️⃣ Testar Validações (Erros)

### Sem API Key
1. Abrir qualquer request de Orders/History/Invoices
2. **Desativar ou remover** header `x-api-key`
3. Enviar
4. **Esperado:** `401 - API key is required`

### Dados Inválidos
1. Abrir "Create Single Order"
2. Mudar `nursingHomeId` para `"invalid"`
3. Enviar
4. **Esperado:** `400 - Validation failed`

### Cancelar Estado Errado
1. Criar encomenda
2. Atualizar para `PROCESSING`
3. Tentar cancelar
4. **Esperado:** `400 - Can only cancel SENT_TO_PHARMACY`

## 8️⃣ Dicas

### 💡 Duplicar Requests
- Clicar direito num request → "Duplicate"
- Útil para testar com dados diferentes

### 💡 Variáveis de Ambiente
Thunder Client suporta environments:
1. Criar environment (ex: "Development")
2. Adicionar variável: `baseUrl = http://localhost:3000`
3. Usar nos requests: `{{baseUrl}}/api/orders`

### 💡 Alterar IDs facilmente
Quando testares vários registos:
- Patient IDs: 1, 2, 3, 4
- Nursing Home IDs: 1, 2
- Medication IDs: 1-8

### 💡 Testar Datas
Nos filtros de histórico, experimenta:
- `startDate=2026-01-01` (hoje)
- `endDate=2026-12-31` (fim do ano)

## 9️⃣ Resolução de Problemas

**Request fica eternalmente a carregar:**
- ❌ Servidor não está a correr
- ✅ Executar `npm run dev` no terminal

**401 - Invalid API key:**
- ❌ API key errada ou base de dados sem dados
- ✅ Verificar se executaste `seed_data.sql`

**404 - Not found:**
- ❌ Endpoint URL errado ou ID não existe
- ✅ Verificar URL e IDs no phpMyAdmin

**500 - Internal server error:**
- ❌ Erro no servidor
- ✅ Ver logs no terminal onde corre `npm run dev`

## 📊 Ver no phpMyAdmin

Depois de criar encomendas:
1. Abrir phpMyAdmin
2. Base de dados `pharmacy_db`
3. Tabela `orders` → Ver registos criados
4. Tabela `order_items` → Ver itens

---

## ✨ Pronto para Testar!

O servidor está a correr em: http://localhost:3000

Abre o Thunder Client e começa a testar! ⚡
