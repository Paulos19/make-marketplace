import prisma from "@/lib/prisma";
import { Product } from "@prisma/client";
import { EmailBuilderClient } from "../components/EmailBuilderClient";

async function getProductsForSelection(): Promise<Pick<Product, 'id' | 'name' | 'images'>[]> {
    try {
        const products = await prisma.product.findMany({
            take: 100, 
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
        <div className="flex-1 w-full flex">
            <EmailBuilderClient productsForSelection={products} />
        </div>
    );
}