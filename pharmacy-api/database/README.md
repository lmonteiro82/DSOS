# Scripts SQL da Base de Dados

## Ficheiros

### 1. create_database.sql
Cria a base de dados `pharmacy_db` e todas as tabelas necessárias.

### 2. seed_data.sql
Insere dados de exemplo (lares, utentes, medicamentos).

## Como Usar

### Opção 1: phpMyAdmin (Recomendado)

1. **Abrir phpMyAdmin**
   - Aceder a http://localhost/phpmyadmin
   - Login com user: `root`, password: `senha123`

2. **Executar create_database.sql**
   - Clicar no separador "SQL"
   - Copiar todo o conteúdo de `create_database.sql`
   - Colar na caixa de texto
   - Clicar em "Executar" ou "Go"
   - ✅ Base de dados e tabelas criadas!

3. **Executar seed_data.sql**
   - Clicar no separador "SQL" novamente
   - Copiar todo o conteúdo de `seed_data.sql`
   - Colar e executar
   - ✅ Dados de exemplo inseridos!
   - **IMPORTANTE:** Guardar as API keys mostradas!

### Opção 2: Linha de Comando

```bash
# Executar script de criação
mysql -u root -psenha123 < database/create_database.sql

# Executar script de dados
mysql -u root -psenha123 < database/seed_data.sql
```

### Opção 3: Usar o script Node.js

```bash
# Este método usa o init-db.js que já existe
npm run init-db
```

## Verificar se funcionou

**No phpMyAdmin:**
1. Selecionar base de dados `pharmacy_db` no menu lateral
2. Deverá ver 5 tabelas:
   - nursing_homes (2 registos)
   - patients (4 registos)
   - medications (8 registos)
   - orders (vazio inicialmente)
   - order_items (vazio inicialmente)

**Ou na linha de comando:**
```bash
mysql -u root -psenha123 -e "USE pharmacy_db; SHOW TABLES;"
```

## API Keys de Teste

Depois de executar `seed_data.sql`, terá estas API keys:

- **Unidade Norte:** `NH001-abc123def456ghi789`
- **Unidade Sul:** `NH002-xyz789uvw456rst123`

Use estas chaves no header `x-api-key` quando testar a API.

## Estrutura das Tabelas

```
nursing_homes (Lares)
├── id
├── name
├── address
├── phone
├── email
├── api_key (UNIQUE)
└── created_at

patients (Utentes)
├── id
├── nursing_home_id (FK)
├── patient_number
├── name
└── created_at

medications (Medicamentos)
├── id
├── name
├── description
├── active_ingredient
├── price
├── stock
└── created_at

orders (Encomendas)
├── id
├── order_number (UNIQUE)
├── nursing_home_id (FK)
├── patient_id (FK)
├── status
├── total_amount
├── created_at
├── updated_at
├── cancelled_at
└── received_at

order_items (Itens)
├── id
├── order_id (FK)
├── medication_id (FK)
├── quantity
├── unit_price
└── subtotal
```

## Resetar Base de Dados

Se precisar recomeçar do zero:

```sql
DROP DATABASE IF EXISTS pharmacy_db;
```

Depois executar novamente `create_database.sql` e `seed_data.sql`.
