// app/api/admin/categories/generate/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, SchemaType } from '@google/generative-ai';
import { z } from 'zod';
import { toast } from 'sonner';

const genAISchema = z.object({
  count: z.number().int().min(1, "A quantidade deve ser no mínimo 1.").max(15, "Para melhor performance, gere no máximo 15 categorias por vez."),
});

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("Chave da API do Gemini não configurada.");
    return NextResponse.json({ message: 'Configuração do servidor incompleta para IA.' }, { status: 500 });
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== UserRole.ADMIN) {
      return NextResponse.json({ message: 'Acesso negado. Apenas administradores podem gerar categorias.' }, { status: 403 });
    }

    const body = await request.json();
    const validation = genAISchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: validation.error.errors[0].message }, { status: 400 });
    }
    
    const { count } = validation.data;

    const existingCategories = await prisma.category.findMany({
      select: { name: true },
      orderBy: { name: 'asc' },
    });
    const existingCategoryNames = existingCategories.map(cat => cat.name);
    const existingCategoriesString = existingCategoryNames.length > 0 ? existingCategoryNames.join(', ') : "Nenhuma categoria existente ainda";

    // <<< INÍCIO DA ATUALIZAÇÃO DO PROMPT >>>
    const prompt = `
      Você é um especialista em branding e marketing para o e-commerce brasileiro "Zacaplace", inspirado no humor dos Trapalhões.
      O tom da marca é divertido, popular e com um "sotaque" do interior de Minas Gerais.

      Sua tarefa é gerar ${count} nomes de categorias.

      **OBJETIVO PRINCIPAL:** Sua resposta DEVE INCLUIR os nomes da lista de exemplos abaixo, a menos que eles já estejam na lista de "Categorias Existentes".

      **EXEMPLOS DE CATEGORIAS (CRIE ESTAS PRIMEIRO):**
      - Beleza & Cuidados
      - Zacapimba no Visual! (Maquiagem)
      - Cheirinho de Estouro! (Perfumes e Colônias)
      - Creme, Cremoso e Cumpadi! (Cuidados com a Pele e Corpo)
      - Cabelo de Zaca! (Produtos para Cabelo)
      - Moda & Estilo
      - Tá Bonita, Psiu! (Roupas Femininas)
      - Olha o Close, Rapá! (Roupas Masculinas)
      - Acessório é Tudo, Bobo! (Bijus, Óculos, Bolsas, Relógios)
      - Chinelo, Sandália e Estouro! (Calçados)
      - Casa & Decoração
      - Casa de Zaca (Decoração e Utilidades)
      - Coisa Linda na Cozinha! (Cozinha e Mesa Posta)
      - Pra Dormir Igual o Dedéco (Cama, Banho e Aromas)
      - Presentes & Criativos
      - Mimo do Cumpadi (Presentes Criativos)
      - Coisa Boa, Boba! (Achados Únicos)
      - Psiu! Olha Isso Aqui! (Produtos em Destaque / Curadoria)
      - Tecnologia & Gadgets
      - Zaca Tech! (Acessórios e Gadgets)
      - Fone no Ouvido e Alegria no Peito! (Fones, Caixas de Som, etc.)
      - Bagulho do Bom! (Coisas Tech Baratinhas)
      - Infantil & Bebê
      - Mini Trapalhadas (Moda e Brinquedos Infantis)
      - Coisa Fofa, Psiu! (Enxoval & Cuidados para Bebê)
      - Cuidados Pessoais e Saúde
      - Zaca Zen! (Bem-estar & Relaxamento)
      - Saúde de Rir! (Cuidados Pessoais e Suplementos)
      - Ofertas & Descontos
      - Achadinhos da Semana (Destaques com Desconto)
      - Promoção? Tô Dentro! (Liquidações)
      - Num Guento de Barato! (Produtos abaixo de R$ XX,00)

      Se após incluir os exemplos faltantes ainda não tiver atingido o total de ${count} categorias, crie novas seguindo EXATAMENTE o mesmo estilo.

      **CATEGORIAS EXISTENTES (NÃO REPITA ESTAS):** [${existingCategoriesString}].

      **FORMATO DE SAÍDA OBRIGATÓRIO:** Retorne **APENAS e ESTRITAMENTE** um array JSON de strings.
      Exemplo de formato: ["Parafernália do Dedé", "Barato do Didi"]
    `;
    // <<< FIM DA ATUALIZAÇÃO DO PROMPT >>>

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{text: prompt}]}],
      safetySettings,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING }
        }
      }
    });
    const responseText = result.response.text(); 
    
    let newCategoryNames: string[] = [];
    try {
        const parsedResponse = JSON.parse(responseText);

        if (!Array.isArray(parsedResponse) || !parsedResponse.every(item => typeof item === 'string')) {
            console.error("Resposta da IA não é um array de strings:", parsedResponse);
            throw new Error('A resposta da IA não é um array de strings válido.');
        }
        newCategoryNames = parsedResponse;

    } catch (e: any) {
        console.error("Erro ao fazer o parse da resposta JSON da IA:", responseText, "Erro original:", e.message);
        const extracted = responseText.match(/"([^"]*)"/g);
        if (extracted) {
            newCategoryNames = extracted.map(s => s.replace(/"/g, ''));
            if (newCategoryNames.length === 0) {
                 throw new Error("A IA retornou uma resposta em um formato inesperado. Tente novamente.");
            }
            toast.warning("Formato da resposta da IA corrigido, mas pode não ser ideal.");
        } else {
            throw new Error("A IA retornou uma resposta em um formato inesperado. Tente novamente.");
        }
    }

    const uniqueGenerated = [...new Set(newCategoryNames.map(name => name.trim()).filter(name => name.length > 0))];
    const trulyNewCategories = uniqueGenerated.filter(
      newName => !existingCategoryNames.some(oldName => oldName.toLowerCase() === newName.toLowerCase())
    );

    if (trulyNewCategories.length === 0) {
      let message = "A IA não conseguiu gerar novas categorias únicas com base nas existentes";
      if (newCategoryNames.length > 0 && uniqueGenerated.length > 0 && trulyNewCategories.length === 0) {
        message = "A IA gerou categorias, mas todas já existem ou são duplicatas das sugestões. Tente refinar o pedido ou adicionar mais categorias manualmente."
      }
      return NextResponse.json({ message }, { status: 400 });
    }

    const created = await prisma.category.createMany({
      data: trulyNewCategories.map(name => ({ name })),
      skipDuplicates: true,
    });

    return NextResponse.json({ 
        message: `${created.count} novas categorias foram geradas e salvas com sucesso!`,
        newCategories: trulyNewCategories,
    }, { status: 201 });

  } catch (error) {
    console.error("Erro na geração de categorias com IA:", error);
    if (error instanceof Error && error.message.includes("content is blocked")) {
        return NextResponse.json({ message: 'A sugestão de categoria foi bloqueada por políticas de segurança. Tente um pedido diferente.' }, { status: 400 });
    }
    return NextResponse.json({ message: error instanceof Error ? error.message : "Erro interno do servidor ao gerar categorias." }, { status: 500 });
  }
}
