// app/admin-dashboard/marketing/page.tsx
import prisma from "@/lib/prisma";
import { Product } from "@prisma/client";
import { EmailBuilderClient } from "../components/EmailBuilderClient";


// Função para buscar os produtos que podem ser destacados no email
async function getProductsForSelection(): Promise<Pick<Product, 'id' | 'name' | 'images'>[]> {
    try {
        const products = await prisma.product.findMany({
            take: 100, // Limita a 100 produtos para a seleção
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                images: true,
            }
        });
        return products;
    } catch (error) {
        console.error("Falha ao buscar produtos para o seletor:", error);
        return [];
    }
}

export default async function EmailMarketingPage() {
    const products = await getProductsForSelection();

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-lg font-semibold md:text-2xl">Campanhas de Email</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Crie e envie e-mails de marketing para seus usuários e inscritos na newsletter.
                </p>
            </div>
            
            {/* Passamos os produtos para o componente cliente */}
            <EmailBuilderClient productsForSelection={products} />
        </div>
    );
}