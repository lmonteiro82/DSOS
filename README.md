# Rodas & Bengalas - Sistema de Gestão de Terapêuticas

Sistema completo para gestão de terapêuticas em lares de 3ª idade, desenvolvido com HTML, CSS, JavaScript vanilla e PHP.

## 🚀 Funcionalidades

### Gestão de Lares
- Criar, editar e eliminar lares
- Visualizar informações detalhadas de cada lar
- Controlo de capacidade

### Gestão de Utentes
- Registar utentes com dados pessoais
- Contactos de emergência
- Associação a lares específicos
- Cálculo automático de idade

### Gestão de Medicamentos
- Cadastro completo de medicamentos
- Importação via CSV
- Informações: dose, princípio ativo, marca, tipo de toma
- Múltiplos tipos de administração (oral, injetável, tópica, etc.)

### Gestão de Terapêuticas
- Terapêuticas contínuas, temporárias ou SOS
- Definição de horários e dias da semana
- Associação utente-medicamento
- Controlo de datas de início e fim

### Gestão de Stocks
- Stock por utente (para imputação de despesas)
- Stock geral do lar (para emergências)
- Alertas de stock baixo
- Controlo de lotes

### Administração de Medicamentos
- Registo de administrações
- Validação por administradores
- Atualização automática de stocks após validação
- Registo de motivos de não administração

### Dashboard e Estatísticas
- Número de utentes por lar
- Medicamentos mais usados
- Utentes com mais medicamentos SOS
- Stocks baixos
- Administrações pendentes de validação

### Controlo de Acessos
- **Administrador Geral**: acesso total, gestão de lares
- **Administrador de Lar**: gestão do seu lar específico
- **Técnico**: gestão de terapêuticas e administrações

## 📋 Requisitos

- PHP 7.4 ou superior
- MySQL 5.7 ou superior
- Servidor web (Apache/Nginx)
- Navegador moderno (Chrome, Firefox, Safari, Edge)

## 🔧 Instalação

### 1. Configurar Base de Dados

```bash
# Criar base de dados MySQL
mysql -u root -p
```

```sql
# Executar o script SQL
source config/database.sql
```

Ou importar manualmente o ficheiro `config/database.sql` através do phpMyAdmin.

### 2. Configurar Conexão à Base de Dados

Editar o ficheiro `config/database.php` com as suas credenciais:

```php
private $host = 'localhost';
private $db_name = 'rodas_bengalas';
private $username = 'root';  // Seu utilizador MySQL
private $password = '';      // Sua password MySQL
```

### 3. Configurar Servidor Web

#### Opção A: PHP Built-in Server (Desenvolvimento)

```bash
cd /caminho/para/DSOS
php -S localhost:8000
```

Aceder em: `http://localhost:8000`

#### Opção B: Apache/Nginx (Produção)

Configurar o DocumentRoot para a pasta do projeto.

**Apache (.htaccess já incluído):**
```apache
<VirtualHost *:80>
    ServerName rodas-bengalas.local
    DocumentRoot /caminho/para/DSOS
    <Directory /caminho/para/DSOS>
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

**Nginx:**
```nginx
server {
    listen 80;
    server_name rodas-bengalas.local;
    root /caminho/para/DSOS;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        try_files $uri $uri/ /api/$uri.php;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php7.4-fpm.sock;
        fastcgi_index index.php;
        include fastcgi_params;
    }
}
```

## 👤 Login Inicial

Após a instalação, use as seguintes credenciais:

- **Email:** admin@rodasbengalas.pt
- **Password:** admin123

⚠️ **IMPORTANTE:** Altere a password após o primeiro login!

## 📁 Estrutura do Projeto

```
DSOS/
├── api/                      # Backend PHP
│   ├── auth.php             # Autenticação
│   ├── lares.php            # Gestão de lares
│   ├── utentes.php          # Gestão de utentes
│   ├── medicamentos.php     # Gestão de medicamentos
│   ├── terapeuticas.php     # Gestão de terapêuticas
│   ├── stocks.php           # Gestão de stocks
│   ├── administracoes.php   # Administrações
│   ├── estatisticas.php     # Estatísticas
│   └── import_csv.php       # Importação CSV
├── config/
│   ├── database.php         # Configuração BD
│   └── database.sql         # Script SQL
├── css/
│   └── style.css            # Estilos CSS
├── js/
│   ├── api.js               # Chamadas API
│   ├── auth.js              # Autenticação
│   ├── app.js               # App principal
│   ├── utils.js             # Utilitários
│   └── pages/               # Páginas
│       ├── dashboard.js
│       ├── lares.js
│       ├── utentes.js
│       ├── medicamentos.js
│       ├── terapeuticas.js
│       ├── stocks.js
│       └── administracoes.js
├── index.html               # Página principal
└── README.md               # Este ficheiro
```

## 📊 Importação de Medicamentos via CSV

### Formato do Ficheiro CSV

O ficheiro CSV deve ter o seguinte formato (sem cabeçalho):

```csv
Nome,Princípio Ativo,Marca,Dose,Toma
Paracetamol,Paracetamol,Ben-u-ron,500mg,oral
Ibuprofeno,Ibuprofeno,Brufen,600mg,oral
Insulina,Insulina Humana,NovoRapid,100UI/ml,injetavel
```

### Tipos de Toma Válidos

- `oral`
- `injetavel`
- `topica`
- `sublingual`
- `inalacao`
- `retal`
- `ocular`
- `auricular`
- `nasal`

### Como Importar

1. Aceder à página "Medicamentos"
2. Clicar em "Importar CSV"
3. Selecionar o lar
4. Escolher o ficheiro CSV
5. Clicar em "Importar"

## 🎨 Interface

A interface foi desenvolvida com design moderno e responsivo:

- **Design System**: Cores consistentes e componentes reutilizáveis
- **Responsivo**: Funciona em desktop, tablet e mobile
- **Acessível**: Seguindo boas práticas de acessibilidade
- **Intuitivo**: Navegação clara e feedback visual

### Cores Principais

- **Primary**: #6366f1 (Índigo)
- **Success**: #10b981 (Verde)
- **Danger**: #ef4444 (Vermelho)
- **Warning**: #f59e0b (Laranja)

## 🔒 Segurança

- Passwords encriptadas com bcrypt
- Sessões PHP para autenticação
- Validação de dados no backend
- Proteção contra SQL Injection (PDO prepared statements)
- Controlo de acessos por roles

## 🐛 Resolução de Problemas

### Erro de Conexão à Base de Dados

Verificar:
- MySQL está a correr
- Credenciais em `config/database.php` estão corretas
- Base de dados `rodas_bengalas` foi criada

### Erro 404 nas APIs

Verificar:
- Servidor web está configurado corretamente
- Ficheiros PHP têm permissões de leitura
- mod_rewrite está ativado (Apache)

### Página em branco

Verificar:
- Console do navegador para erros JavaScript
- Logs de erro do PHP
- Permissões dos ficheiros

## 📝 Notas de Desenvolvimento

- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Backend**: PHP 7.4+
- **Base de Dados**: MySQL 5.7+
- **Arquitetura**: SPA (Single Page Application)
- **API**: RESTful

## 📄 Licença

Este projeto foi desenvolvido para fins académicos.

## 👨‍💻 Suporte

Para questões ou problemas, contactar o administrador do sistema.

---

**Desenvolvido com ❤️ para Rodas & Bengalas, SA**
