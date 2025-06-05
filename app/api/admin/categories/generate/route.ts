// app/api/admin/categories/generate/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Verifique o caminho correto
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, SchemaType } from '@google/generative-ai'; // Importar HarmCategory e HarmBlockThreshold
import { z } from 'zod';
import { toast } from 'sonner';

const genAISchema = z.object({
  count: z.number().int().min(1, "A quantidade deve ser no mínimo 1.").max(15, "Para melhor performance, gere no máximo 15 categorias por vez."), // Limite ajustado
});

// Configuração da API do Gemini
// Mova a inicialização para dentro da função ou para um local onde a variável de ambiente seja carregada
// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
// const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

// Defina as configurações de segurança
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

export async function POST(request: Request) {
  // Inicializa a API do Gemini aqui para garantir que process.env.GEMINI_API_KEY esteja disponível
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

    // 1. Busca as categorias existentes para dar contexto à IA
    const existingCategories = await prisma.category.findMany({
      select: { name: true },
      orderBy: { name: 'asc' },
    });
    const existingCategoryNames = existingCategories.map(cat => cat.name);
    const existingCategoriesString = existingCategoryNames.length > 0 ? existingCategoryNames.join(', ') : "Nenhuma categoria existente ainda";

    // 2. Cria um prompt inteligente e abrangente para o Gemini
    const prompt = `
      Você é um especialista em e-commerce criativo, com vasta experiência na organização de grandes marketplaces online.
      Sua tarefa é gerar ${count} novas e relevantes sugestões de nomes de categorias de produtos para um marketplace geral e diversificado chamado 'Zacaplace'.
      Este marketplace vende uma ampla gama de itens, incluindo, mas não se limitando a: roupas (masculina, feminina, infantil), calçados, acessórios de moda, joias, relógios, eletrônicos (smartphones, notebooks, áudio), artigos para casa (decoração, cozinha, cama e banho), produtos de beleza e cuidados pessoais, brinquedos, artigos esportivos, livros e material de escritório.
      
      As categorias devem ser:
      - Curtas e concisas (idealmente 2-3 palavras).
      - Intuitivas e de fácil compreensão para os clientes.
      - Comercialmente atraentes e relevantes para as tendências atuais de e-commerce.
      - Variadas, cobrindo diferentes segmentos de produtos.
      
      IMPORTANTE: As seguintes categorias já existem em nosso sistema, portanto, NÃO as repita e evite variações muito próximas: 
      [${existingCategoriesString}].
      
      Seu retorno deve ser ESTRITAMENTE um array JSON de strings, contendo apenas os nomes das novas categorias. Não inclua nenhum texto adicional, explicações, saudações, ou formatação markdown como \`\`\`json antes ou depois do array.
      O array deve conter exatamente ${count} strings, a menos que seja impossível gerar essa quantidade de categorias únicas e novas com base nas existentes.
      
      Exemplo de formato de retorno esperado se fossem pedidas 3 categorias: 
      ["Tecnologia Vestível", "Decoração Minimalista", "Aventuras ao Ar Livre"]
    `;

    // 3. Chama a API do Gemini com as configurações de segurança
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
    const responseText = result.response.text(); // A resposta já deve vir como uma string JSON
    
    // 4. Trata e valida a resposta da IA
    let newCategoryNames: string[] = [];
    try {
        // O Gemini, com responseMimeType e responseSchema, deve retornar um JSON válido.
        // A limpeza de ```json pode não ser mais necessária, mas mantemos por segurança.
        const cleanedResponse = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsedResponse = JSON.parse(cleanedResponse);

        // Verifica se a resposta é de fato um array de strings
        if (!Array.isArray(parsedResponse) || !parsedResponse.every(item => typeof item === 'string')) {
            console.error("Resposta da IA não é um array de strings:", parsedResponse);
            throw new Error('A resposta da IA não é um array de strings válido.');
        }
        newCategoryNames = parsedResponse;

    } catch (e: any) {
        console.error("Erro ao fazer o parse da resposta JSON da IA:", responseText, "Erro original:", e.message);
        // Tentar extrair um array de strings de uma resposta malformada como último recurso
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

    // Filtra novamente para garantir que não haja duplicatas com as existentes (case-insensitive)
    // e também remove duplicatas dentro das novas sugestões
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

    // 5. Salva as novas categorias no banco de dados
    const created = await prisma.category.createMany({
      data: trulyNewCategories.map(name => ({ name })),
      skipDuplicates: true, // Garante que não haverá erro se a IA repetir um nome (apesar do filtro acima)
    });

    return NextResponse.json({ 
        message: `${created.count} novas categorias foram geradas e salvas com sucesso!`,
        newCategories: trulyNewCategories, // Retorna apenas as que foram efetivamente criadas ou são novas
    }, { status: 201 });

  } catch (error) {
    console.error("Erro na geração de categorias com IA:", error);
    // Verifica se o erro é do Gemini por conteúdo bloqueado
    if (error instanceof Error && error.message.includes(" thí content is blocked")) { // A API do Gemini pode retornar erros de bloqueio de conteúdo
        return NextResponse.json({ message: 'A sugestão de categoria foi bloqueada por políticas de segurança. Tente um pedido diferente.' }, { status: 400 });
    }
    return NextResponse.json({ message: error instanceof Error ? error.message : "Erro interno do servidor ao gerar categorias." }, { status: 500 });
  }
}
