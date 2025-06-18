import prisma from "@/lib/prisma";
import Image from "next/image";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription
} from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ProductActions } from "./components/ProductActions";

// Busca os produtos e as categorias em paralelo
async function getDataForPage() {
  try {
    const [products, categories] = await Promise.all([
      prisma.product.findMany({
        include: {
          user: { select: { name: true, email: true } },
          category: { select: { name: true } },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.category.findMany({
        orderBy: { name: 'asc' }
      })
    ]);
    return { products, categories };
  } catch (error) {
    console.error("Falha ao buscar dados para a página de produtos do admin:", error);
    return { products: [], categories: [] };
  }
}

export default async function AdminProductsPage() {
  const { products, categories } = await getDataForPage();

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Gerenciamento de Produtos</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todos os Produtos da Plataforma</CardTitle>
          <CardDescription>
            Visualize, edite e gerencie todos os produtos cadastrados pelos vendedores.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden w-[80px] sm:table-cell">Imagem</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead className="hidden md:table-cell">Preço</TableHead>
                <TableHead><span className="sr-only">Ações</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="hidden sm:table-cell">
                    <Image
                      alt={product.name}
                      className="aspect-square rounded-md object-cover"
                      height="64"
                      src={product.images[0] || '/img-placeholder.png'}
                      width="64"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{product.category?.name || 'Sem Categoria'}</Badge>
                  </TableCell>
                  <TableCell>{product.user?.name ?? 'N/A'}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    R$ {product.price.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <ProductActions product={product} categories={categories} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}