Documentação do Projeto: Zacaplace
1. Visão Geral do Projeto
Zacaplace é uma aplicação de marketplace completa, construída com Next.js, que permite a múltiplos vendedores (Sellers) cadastrarem e venderem seus produtos e serviços, e a clientes (Users) os encontrarem e comprarem. A plataforma inclui um painel administrativo robusto para gerenciamento total do site, um painel para vendedores gerenciarem seus produtos e vendas, e uma interface de usuário rica para os compradores.

O fluxo de compra é baseado em reservas: o comprador reserva um produto e é então direcionado para o WhatsApp do vendedor para finalizar o pagamento e a entrega, criando uma ponte direta entre as partes.

2. Requisitos Funcionais
2.1. Funções de Administrador (ADMIN)
O administrador possui controle total sobre a plataforma através de um painel dedicado (/admin-dashboard). Suas capacidades incluem:

Gerenciamento de Usuários: Visualizar todos os usuários, alterar senhas e excluir usuários (exceto a si mesmo)/route.ts].
Gerenciamento de Produtos: Visualizar e excluir qualquer produto da plataforma/route.ts].
Gerenciamento de Categorias: Criar, editar e excluir categorias de produtos, além de poder usar IA (Google Gemini) para gerar sugestões de novas categorias.
Customização da Homepage: Gerenciar banners dinâmicos e seções customizadas de produtos, com a possibilidade de reordená-los.
Marketing & Aparência: Criar e enviar campanhas de e-mail marketing e customizar as cores principais do site.
2.2. Funções de Vendedor (SELLER)
Vendedores têm acesso a um painel (/dashboard) para gerenciar sua loja virtual. Suas funcionalidades são:

Cadastro: Para se tornar um vendedor, é necessário selecionar a opção "Quero Vender" no registro e fornecer um número de WhatsApp.
Gerenciamento de Produtos: Adicionar, editar e remover seus próprios produtos e serviços.
Gerenciamento de Vendas: Visualizar todas as reservas e atualizar o status (ex: "Entregue", "Cancelado").
Configurações do Perfil: Editar informações da loja, como nome, descrição, foto de perfil e banner.
2.3. Funções de Usuário/Comprador (USER)
Autenticação: Criar conta com email/senha ou via Google. O fluxo inclui verificação de e-mail e recuperação de senha.
Reservar Produtos: Reservar um produto para iniciar a negociação com o vendedor.
Gerenciar Reservas: Visualizar e cancelar suas próprias reservas pendentes.
2.4. Funções de Visitante
Navegar pela plataforma, filtrar e ordenar produtos.
Inscrever-se na newsletter e enviar mensagens de contato.
3. Arquitetura de Software
Frontend: Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui.
Backend: Next.js API Routes, TypeScript, Zod para validação.
Banco de Dados: PostgreSQL com Prisma ORM.
Autenticação: NextAuth.js com PrismaAdapter.
Serviços Externos:
Firebase Storage: Armazenamento de imagens.
Resend/Nodemailer: Envio de e-mails transacionais e de marketing.
Google Gemini API: Geração de conteúdo por IA.
Stripe: Processamento de pagamentos para planos e serviços.
4. Variáveis de Ambiente (.env)
Para rodar a aplicação localmente, crie um arquivo .env com as seguintes variáveis:

# URL da base de dados PostgreSQL
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"

# URL pública da aplicação
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Secret para o NextAuth.js
NEXTAUTH_SECRET="SEU_SECRET_AQUI"
NEXTAUTH_URL="http://localhost:3000"

# Credenciais do Google para OAuth
GOOGLE_CLIENT_ID="SEU_GOOGLE_CLIENT_ID"
GOOGLE_CLIENT_SECRET="SEU_GOOGLE_CLIENT_SECRET"

# Email do administrador
EMAIL_ADMIN_USER="seu_email_de_admin@exemplo.com"

# Configurações do Servidor de Email (Nodemailer)
EMAIL_SERVER_HOST="smtp.exemplo.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="seu_usuario_smtp"
EMAIL_SERVER_PASSWORD="sua_senha_smtp"
EMAIL_FROM="nao-responda@seu-dominio.com"

# Credenciais do Firebase
NEXT_PUBLIC_FIREBASE_API_KEY="SUA_FIREBASE_API_KEY"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="seu-projeto.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="seu-projeto-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="seu-projeto.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="SEU_MESSAGING_SENDER_ID"
NEXT_PUBLIC_FIREBASE_APP_ID="SEU_APP_ID"

# Chave da API do Resend
RESEND_API_KEY="sua_chave_resend"

# Chave da API do Google Gemini
GEMINI_API_KEY="sua_chave_gemini"

# Chaves do Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="sua_chave_publica_stripe"
STRIPE_API_KEY="sua_chave_secreta_stripe"
STRIPE_WEBHOOK_SECRET="seu_webhook_secret_stripe"
NEXT_PUBLIC_STRIPE_TURBO_PRICE_ID="id_preco_turbo"
NEXT_PUBLIC_STRIPE_CAROUSEL_PRICE_ID="id_preco_carrossel"
NEXT_PUBLIC_STRIPE_SUBSCRIPTION_PRICE_ID="id_preco_assinatura"
5. Justificativa de Valor
