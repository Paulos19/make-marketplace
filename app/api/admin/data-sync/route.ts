import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '../../auth/[...nextauth]/route'

// Lista de modelos alinhada com o seu schema.
// Nomes em camelCase, como o Prisma Client espera.
const modelNames = [
  'user',
  'account',
  'session',
  'verificationToken',
  'product',
  'category',
  'reservation',
  'themeSettings',
  'newsletterSubscription',
  'homePageBanner',
  'homepageSection',
  'marketingCampaign',
  'shortLink',
  'adminNotification',
]

// GET para exportar dados (sem alterações necessárias, mas incluso para completude)
export async function GET() {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  try {
    const data: { [key: string]: any[] } = {}
    for (const modelName of modelNames) {
      // @ts-ignore
      if (prisma[modelName]) {
        // @ts-ignore
        const records = await prisma[modelName].findMany()
        data[modelName] = records
      }
    }
    return NextResponse.json(data)
  } catch (error) {
    console.error('Erro na exportação do DB:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor ao exportar dados.' },
      { status: 500 },
    )
  }
}

// POST para importar dados (versão corrigida e robusta)
export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  try {
    const data = await request.json()

    // ORDEM DE DELEÇÃO CORRIGIDA: Do mais dependente para o menos dependente.
    // Isso evita erros de violação de chave estrangeira.
    const deletionOrder = [
      'adminNotification',
      'reservation',
      'shortLink',
      'product',
      'account',
      'session',
      'category',
      'user',
      'verificationToken',
      'homePageBanner',
      'homepageSection',
      'marketingCampaign',
      'newsletterSubscription',
      'themeSettings',
    ]

    // ORDEM DE CRIAÇÃO CORRIGIDA: Do menos dependente para o mais dependente.
    const creationOrder = [
      'user',
      'category',
      'verificationToken',
      'themeSettings',
      'newsletterSubscription',
      'marketingCampaign',
      'homepageSection',
      'homePageBanner',
      'account',
      'session',
      'product',
      'shortLink',
      'reservation',
      'adminNotification',
    ]

    // Usando uma transação para garantir que tudo ocorra com sucesso, ou nada.
    await prisma.$transaction(async (tx) => {
      // 1. Deletar todos os dados existentes na ordem correta
      for (const modelName of deletionOrder) {
        // @ts-ignore
        if (tx[modelName]) {
          // @ts-ignore
          await tx[modelName].deleteMany({})
        }
      }

      // 2. Inserir os novos dados na ordem correta
      for (const modelName of creationOrder) {
        // @ts-ignore
        if (data[modelName] && Array.isArray(data[modelName]) && data[modelName].length > 0) {
          const modelData = data[modelName].map((record: any) => {
            // Converte campos de data de string para objeto Date
            // Essencial para o Prisma aceitar os dados do JSON
            Object.keys(record).forEach((key) => {
              if (
                typeof record[key] === 'string' &&
                /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(record[key])
              ) {
                record[key] = new Date(record[key])
              }
            })
            return record
          })

          // @ts-ignore
          await tx[modelName].createMany({
            data: modelData,
            skipDuplicates: true, // Adicionado por segurança
          })
        }
      }
    })

    return NextResponse.json({ message: 'Dados importados com sucesso!' })
  } catch (error) {
    console.error('Erro detalhado na importação:', error)
    return NextResponse.json(
      {
        error: 'Erro interno do servidor ao importar dados.',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
