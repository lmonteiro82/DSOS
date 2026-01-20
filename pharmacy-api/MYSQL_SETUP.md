# Guia de Configuração MySQL

## Passos para configurar a base de dados MySQL

### 1. Instalar MySQL/MariaDB e phpMyAdmin

Se ainda não tiver MySQL instalado:

**macOS (usando Homebrew):**
```bash
brew install mysql
brew services start mysql
```

**XAMPP/MAMP:**
- Baixe e instale XAMPP ou MAMP (já incluem MySQL e phpMyAdmin)
- Inicie o servidor MySQL através da interface

### 2. Acessar phpMyAdmin

- URL padrão: http://localhost/phpmyadmin
- XAMPP: http://localhost:8080/phpmyadmin (pode variar)
- MAMP: http://localhost:8888/phpMyAdmin (pode variar)

### 3. Criar a base de dados

**Usando phpMyAdmin:**
1. Acesse phpMyAdmin
2. Clique em "New" ou "Nova" no menu lateral
3. Nome da base de dados: `pharmacy_db`
4. Escolha "Collation": `utf8mb4_unicode_ci`
5. Clique em "Create" ou "Criar"

**Usando linha de comando:**
```bash
# Entrar no MySQL
mysql -u root -p

# Criar base de dados
CREATE DATABASE pharmacy_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Verificar se foi criada
SHOW DATABASES;

# Sair
EXIT;
```

### 4. Configurar credenciais no .env

Edite o ficheiro `.env` com as suas credenciais MySQL:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=pharmacy_db
DB_USER=root
DB_PASSWORD=          # Deixe vazio se não tiver password (comum no XAMPP/MAMP)
```

**Nota:** Se estiver a usar XAMPP/MAMP, normalmente:
- User: `root`
- Password: (vazio) ou `root` dependendo da configuração

### 5. Inicializar as tabelas e dados

```bash
npm run init-db
```

Este comando irá:
- Criar todas as tabelas necessárias
- Inserir dados de exemplo (lares, utentes, medicamentos)
- Gerar API keys para autenticação
- Mostrar as API keys no terminal (guarde-as!)

### 6. Verificar no phpMyAdmin

Depois de executar `npm run init-db`, verifique no phpMyAdmin:
1. Selecione a base de dados `pharmacy_db`
2. Deverá ver as tabelas:
   - `nursing_homes` - Lares
   - `patients` - Utentes
   - `medications` - Medicamentos
   - `orders` - Encomendas
   - `order_items` - Itens de encomenda

### Resolução de problemas

**Erro: ECONNREFUSED**
- Verifique se o MySQL está a correr
- XAMPP/MAMP: Inicie o servidor MySQL através da interface
- Homebrew: `brew services start mysql`

**Erro: Access denied**
- Verifique as credenciais no ficheiro `.env`
- Tente user `root` sem password (comum em desenvolvimento)

**Erro: Database doesn't exist**
- Certifique-se que criou a base de dados `pharmacy_db`
- Verifique o nome no ficheiro `.env`

**Porta diferente**
- Se o MySQL estiver noutra porta, altere `DB_PORT` no `.env`
- XAMPP geralmente usa porta 3306
- Verifique a porta no phpMyAdmin ou na configuração do XAMPP/MAMP
