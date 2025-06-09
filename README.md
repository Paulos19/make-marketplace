Documentação do Projeto: Zacaplace
1. Visão Geral do Projeto
Zacaplace é uma aplicação de marketplace completa, construída com Next.js, que permite a múltiplos vendedores (Sellers) cadastrarem e venderem seus produtos, e a clientes (Users) comprarem esses produtos. A plataforma inclui um painel administrativo robusto para gerenciamento total do site, um painel para vendedores gerenciarem seus produtos e vendas, e uma interface de usuário rica para os compradores.

O fluxo de compra é baseado em reservas: o comprador reserva um produto e é então direcionado para o WhatsApp do vendedor para finalizar o pagamento e a entrega, criando uma ponte direta entre as partes/page.tsx.

2. Requisitos Funcionais
2.1. Funções de Administrador (ADMIN)
O administrador possui controle total sobre a plataforma através de um painel dedicado (/admin-dashboard).

Gerenciamento de Usuários:

Visualizar todos os usuários cadastrados na plataforma (USER, SELLER, ADMIN).
Alterar a senha de qualquer usuário/route.ts, paulos19/make-marketplace/make-marketplace-81e049ce215e42063b2e2910886ec05902c96ae9/app/admin-dashboard/users/components/UserActions.tsx.
Excluir usuários da plataforma (exceto a si mesmo)/route.ts, paulos19/make-marketplace/make-marketplace-81e049ce215e42063b2e2910886ec05902c96ae9/app/admin-dashboard/users/components/UserActions.tsx.
Gerenciamento de Produtos:

Visualizar todos os produtos de todos os vendedores.
Excluir qualquer produto da plataforma/route.ts, paulos19/make-marketplace/make-marketplace-81e049ce215e42063b2e2910886ec05902c96ae9/app/admin-dashboard/products/components/ProductActions.tsx.
Gerenciamento de Categorias:

Criar, editar e excluir categorias de produtos/route.ts, paulos19/make-marketplace/make-marketplace-81e049ce215e42063b2e2910886ec05902c96ae9/app/admin-dashboard/categories/components/CategoryClient.tsx.
Gerar sugestões de novas categorias utilizando IA (Google Gemini) para evitar duplicatas e acelerar o cadastro.
Customização da Homepage:

Gerenciar banners dinâmicos na seção "Hero" da página inicial.
Criar, editar, excluir e reordenar seções customizadas de produtos na página inicial.
Marketing & Aparência:

Criar, salvar e enviar campanhas de e-mail marketing para todos os usuários ou para os inscritos na newsletter.
Customizar as cores principais do site (tema) através de um painel, alterando as variáveis CSS globais.
2.2. Funções de Vendedor (SELLER)
Vendedores têm um painel (/dashboard) para gerenciar sua loja virtual.

Cadastro: Para se tornar vendedor, é necessário selecionar a opção "Quero Vender" no registro e fornecer um número de WhatsApp.
Gerenciamento de Produtos: Adicionar, visualizar, editar e remover seus próprios produtos/page.tsx.
Gerenciamento de Vendas: Visualizar todas as reservas feitas em seus produtos e atualizar o status (ex: marcar como "Entregue" ou "Cancelado")/route.ts.
Configurações do Perfil: Editar informações públicas da loja, como nome, descrição, foto de perfil e banner.
2.3. Funções de Usuário/Comprador (USER)
Usuários cadastrados podem interagir com a plataforma para comprar produtos.

Autenticação: Criar conta com nome, email e senha, ou via provedor Google/route.ts. O fluxo inclui verificação de e-mail e recuperação de senha.
Reservar Produtos: Reservar um produto para iniciar a negociação com o vendedor/page.tsx, paulos19/make-marketplace/make-marketplace-81e049ce215e42063b2e2910886ec05902c96ae9/app/api/reservations/route.ts.
Gerenciar Reservas: Visualizar e cancelar suas próprias reservas pendentes.
Configurações da Conta: Editar informações básicas do perfil, como nome e foto.
2.4. Funções de Visitante (Não Autenticado)
Navegar pela página inicial, páginas de produtos e páginas de vendedores.
Filtrar e ordenar produtos.
Inscrever-se na newsletter.
Enviar mensagens através do formulário de contato.
3. Requisitos Não Funcionais
Segurança: Autenticação gerenciada pelo NextAuth.js, com senhas de usuários criptografadas usando bcryptjs/route.ts, paulos1pau/make-marketplace/make-marketplace-81e049ce215e42063b2e2910886ec05902c96ae9/package.json. Rotas de painel são protegidas por middleware que verifica a role do usuário.
Usabilidade e Design: A interface é responsiva e construída com componentes reutilizáveis da biblioteca shadcn/ui. O sistema utiliza a biblioteca sonner para fornecer feedback ao usuário através de notificações (toasts).
Desempenho: Utiliza o componente next/image para otimização de imagens. A estrutura do Next.js App Router com Server Components permite a renderização de páginas estáticas e dinâmicas no servidor, melhorando o tempo de carregamento inicial.
Manutenibilidade: O código é organizado em uma estrutura de projeto Next.js padrão, com separação clara entre API, componentes de UI, lógica de negócio (lib) e páginas. O uso de TypeScript garante a tipagem estática do código, facilitando a manutenção e prevenindo erros.
4. Arquitetura de Software
O projeto segue uma arquitetura monolítica com uma separação clara entre frontend e backend, utilizando a estrutura do Next.js App Router.

Frontend:

Framework: Next.js 15 com React 19.
Linguagem: TypeScript.
Estilização: Tailwind CSS com um sistema de temas dinâmico baseado em variáveis CSS..
Componentes de UI: shadcn/ui, que oferece um conjunto de componentes acessíveis e customizáveis.
Backend (API Routes):

Framework: Next.js API Routes, localizadas em app/api/.
Linguagem: TypeScript.
Validação: Zod é utilizado para validar os dados de entrada nas rotas da API, garantindo a integridade dos dados.
Banco de Dados:

SGBD: PostgreSQL.
ORM: Prisma, que facilita o acesso e a manipulação dos dados do banco. O schema define as tabelas: User, Product, Category, Reservation, ThemeSettings, HomePageBanner, HomepageSection, MarketingCampaign, etc.
Autenticação:

Provedor: NextAuth.js, configurado com um PrismaAdapter para sincronizar os usuários com o banco de dados. Suporta login por credenciais (email/senha) e Google/route.ts.
Serviços Externos:

Armazenamento de Arquivos: Firebase Storage é utilizado para o upload e armazenamento de imagens de produtos e de perfil.
Envio de Emails: Nodemailer para emails transacionais (verificação, recuperação de senha) e Resend para campanhas de marketing.
Inteligência Artificial: Google Gemini API para geração de conteúdo, como nomes de categorias.

5. Variáveis de Ambiente (.env)
Para rodar a aplicação localmente, crie um arquivo .env na raiz do projeto com as seguintes variáveis:

# URL da base de dados PostgreSQL (usada pelo Prisma)
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"

# URL pública da aplicação
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Secret para o NextAuth.js (gere um valor aleatório, ex: `openssl rand -base64 32`)
NEXTAUTH_SECRET="SEU_SECRET_AQUI"
NEXTAUTH_URL="http://localhost:3000"

# Credenciais do Google para OAuth
GOOGLE_CLIENT_ID="SEU_GOOGLE_CLIENT_ID"
GOOGLE_CLIENT_SECRET="SEU_GOOGLE_CLIENT_SECRET"

# Email do administrador para atribuição automática da role ADMIN
EMAIL_ADMIN_USER="seu_email_de_admin@exemplo.com"

# Configurações do Servidor de Email (Nodemailer)
EMAIL_SERVER_HOST="smtp.exemplo.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="seu_usuario_smtp"
EMAIL_SERVER_PASSWORD="sua_senha_smtp"
EMAIL_FROM="nao-responda@seu-dominio.com"

# Credenciais do Firebase para armazenamento de imagens
NEXT_PUBLIC_FIREBASE_API_KEY="SUA_FIREBASE_API_KEY"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="seu-projeto.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="seu-projeto-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="seu-projeto.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="SEU_MESSAGING_SENDER_ID"
NEXT_PUBLIC_FIREBASE_APP_ID="SEU_APP_ID"

# Chave da API do Resend (para envio de emails de marketing)
RESEND_API_KEY="sua_chave_resend"

# Chave da API do Google Gemini (para geração de conteúdo por IA)
GEMINI_API_KEY="sua_chave_gemini"