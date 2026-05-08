# Guia de Início — FFADV Assessorias Dashboard

## Setup Local

### 1. Instalar dependências
```bash
npm install -g pnpm@9.12.3
pnpm install
```

### 2. Variáveis de ambiente
Crie `.env.local` com:
```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role
DATABASE_URL=postgresql://usuario:senha@host:5432/database
```

### 3. Setup do banco
```bash
pnpm db:push      # Executar migrations
pnpm db:seed      # Carregar dados demo
```

### 4. Rodar localmente
```bash
pnpm dev
```

Acesse: http://localhost:3000

---

## Primeiro Acesso

### Admin
- **Email**: admin@ffadv.com.br
- **Senha**: (gerada no seed)
- **Acesso**: `/internal/admin` → Dashboard, Clientes, Usuários, Atribuições, Processos, Custos, Recebimentos

### Advogado
- **Email**: advogado@ffadv.com.br
- **Acesso**: `/internal/dashboard` (vê clientes atribuídos)

### Cliente (Externo)
- **Email**: cliente@empresa.com.br
- **Acesso**: `/(client)/portal` (vê apenas seus KPIs e processos)

---

## Fluxo Típico de Uso

### 1️⃣ Admin: Criar Cliente
1. Acesse `/internal/admin/clients`
2. Clique "Novo Cliente"
3. Preencha: Razão Social, CNPJ (opcional)
4. Salve

### 2️⃣ Admin: Criar Usuários Internos
1. Acesse `/internal/admin/users`
2. Clique "Novo Usuário"
3. Preencha: Email, Nome, Role (admin/controller/advogado)
4. Salve → Senha temporária gerada
5. Compartilhe senha com usuário via e-mail seguro

### 3️⃣ Admin: Atribuir Advogado a Cliente
1. Acesse `/internal/admin/assignments`
2. Arraste advogado (card esquerda) para cliente (drop zone direita)
3. Confirme atribuição

### 4️⃣ Advogado: Criar Processo
1. Acesse `/internal/admin/cases`
2. Selecione cliente na dropdown
3. Clique "Novo Processo"
4. Preencha: Número, Fase, Status, Valores financeiros
5. Salve

### 5️⃣ Advogado: Lançar Custos
1. Acesse `/internal/admin/case-costs`
2. Selecione cliente
3. Clique "Novo Custo"
4. Preencha: Tipo, Descrição, Valor, Data
5. Salve

### 6️⃣ Advogado: Registrar Recebimentos
1. Acesse `/internal/admin/case-receipts`
2. Selecione cliente
3. Clique "Novo Recebimento"
4. Preencha: Processo, Descrição, Valor, Data
5. Salve

### 7️⃣ Admin/Controller: Visualizar KPIs
1. Acesse `/internal/dashboard`
2. Selecione cliente (todos visíveis)
3. Selecione período (30 dias, 90 dias, 12 meses)
4. Veja 4 KPI cards + 3 gráficos
5. Clique "Baixar PDF" para exportar relatório

### 8️⃣ Cliente: Acessar Portal
1. Faça login com email de cliente
2. Acesse `/(client)/portal`
3. Veja KPIs (respeitando kpi_visibility)
4. Clique "Ver Processos" para listar
5. Clique "Baixar Relatório" para PDF

---

## Configurar KPI Visibility

Admin/Controller podem escolher quais KPIs mostrar para cada cliente:

1. Acesse `/internal/admin/clients`
2. Clique no cliente para editar
3. Na seção "KPI Visibility", marque/desmarque:
   - ☑️ Custos da Assessoria
   - ☑️ Condenações Evitadas
   - ☑️ Valores Recebidos
   - ☑️ ROI

Exemplo: Cliente 1 pode ver todos, Cliente 2 vê apenas "Condenações Evitadas" e "Valores Recebidos"

---

## Gerar Relatório em PDF

### Via Dashboard Interno
1. Acesse `/internal/dashboard`
2. Selecione cliente e período
3. Clique "Baixar PDF" (canto inferior direito)

### Via Portal Cliente
1. Cliente faz login em `/(client)/portal`
2. Seleciona período
3. Clique "Baixar Relatório (PDF)"

**Arquivo baixado**: `relatorio-{empresa}-{data}.pdf`

---

## Navegação por Papel

### 👨‍💼 Admin
```
/internal/admin
  ├── Dashboard (placeholder)
  ├── Clientes (CRUD)
  ├── Usuários (CRUD)
  ├── Atribuições (Drag & Drop)
  └── Processos/Custos/Recebimentos (CRUD)
/internal/dashboard (KPIs de todos os clientes)
```

### 👨‍⚖️ Controller
```
/internal/dashboard (KPIs de todos os clientes)
/internal/admin
  ├── Processos/Custos/Recebimentos (CRUD)
  └── Atribuições (somente leitura)
```

### ⚖️ Advogado
```
/internal/dashboard (KPIs apenas de clientes atribuídos)
/internal/admin
  ├── Processos/Custos/Recebimentos (apenas dos clientes atribuídos)
```

### 🏢 Cliente
```
/(client)/portal
  ├── Dashboard (KPIs respeitando kpi_visibility)
  └── Processos (lista somente-leitura)
```

---

## Troubleshooting

### "Não autenticado"
- Verifique cookies habilitados
- Tente fazer logout e login novamente
- Limpe cache do navegador

### "Sem permissão"
- Você precisa de permissão para esse recurso
- Admin: verifique sua role
- Advogado: peça a um admin para ser atribuído ao cliente
- Cliente: use sua conta de cliente, não admin

### "Cliente não encontrado"
- Criou o cliente antes de tentar acessar?
- Verifique o ID correto na URL

### Gráficos vazios
- Sem dados de custos/recebimentos para o período
- Crie alguns casos, custos e recebimentos primeiro

### PDF não baixa
- Verificar permissões (RBAC)
- Ver console do navegador para erros
- Verifique se @react-pdf/renderer está instalado

---

## Comandos Úteis

```bash
# Desenvolvimento
pnpm dev              # Rodar localmente
pnpm build            # Build para produção
pnpm start            # Rodar build production

# Banco de dados
pnpm db:push          # Executar migrations
pnpm db:seed          # Carregar dados demo
pnpm db:studio        # Abrir Supabase Studio

# Testes
pnpm test             # Rodar testes (quando implementados)
pnpm test:e2e         # E2E tests com Playwright (quando implementados)

# Lint & Format
pnpm lint             # ESLint check
pnpm format           # Prettier format
```

---

## Próximos Passos

1. **Configurar logo**: Coloque `logo.svg` em `public/brand/`
2. **Seed com dados reais**: Edite `supabase/seed.sql` com seus clientes
3. **Testar fluxos**: Use checklist acima
4. **Ajustar cores**: Atualize `app/globals.css` com cores da marca
5. **Deploy**: Vercel + Supabase gerenciado

---

## Suporte

Para dúvidas técnicas, consulte:
- `/specs/project/IMPLEMENTATION_SUMMARY.md` — Detalhes técnicos
- `/specs/project/ROADMAP.md` — Cronograma original
- Código em componentes/pages com comentários

---

**Dashboard FFADV Assessorias | MVP v1.0**
