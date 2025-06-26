import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '../../auth/[...nextauth]/route'

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

export async function GET() {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  try {
    const data: { [key: string]: unknown[] } = {}
    for (const modelName of modelNames) {
      // @ts-expect-error: Prisma client does not have dynamic model access in types
      if (prisma[modelName]) {
        // @ts-expect-error: Prisma client does not have dynamic model access in types
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

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  try {
    const data = await request.json()
    
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

    await prisma.$transaction(async (tx) => {
      for (const modelName of deletionOrder) {
        // @ts-expect-error: Prisma client does not have dynamic model access in types
        if (tx[modelName]) {
          // @ts-expect-error: Prisma client does not have dynamic model access in types
          await tx[modelName].deleteMany({})
        }
      }
      for (const modelName of creationOrder) {
        if (data[modelName] && Array.isArray(data[modelName]) && data[modelName].length > 0) {
          const modelData = data[modelName].map((record: Record<string, unknown>) => {
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

          // @ts-expect-error: Prisma client does not have dynamic model access in types
          await tx[modelName].createMany({
            data: modelData,
            skipDuplicates: true,
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
