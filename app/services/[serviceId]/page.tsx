import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import { ServiceDetailsClient } from '../components/ServiceDetailsClient';
import { RelatedServices } from '../components/RelatedServices';

// Função para buscar um único serviço pelo ID
async function getService(serviceId: string) {
  const service = await prisma.product.findUnique({
    where: {
      id: serviceId,
      isService: true, // Garante que estamos a buscar apenas um serviço
    },
    include: {
      user: true, // Inclui os dados do profissional
      category: true,
    },
  });

  // Se o serviço não for encontrado, exibe uma página 404
  if (!service) {
    notFound();
  }
  return service;
}

// Função para buscar serviços relacionados (por exemplo, da mesma categoria)
async function getRelatedServices(categoryId: string, currentServiceId: string) {
    return prisma.product.findMany({
        where: {
            categoryId: categoryId,
            id: { not: currentServiceId }, // Exclui o serviço atual da lista
            isService: true,
            isSold: false,
        },
        include: {
            user: true,
            category: true,
        },
        take: 4, // Limita a 4 serviços relacionados
    });
}


export default async function ServicePage({ params }: { params: { serviceId: string } }) {
  const service = await getService(params.serviceId);
  const relatedServices = await getRelatedServices(service.categoryId, service.id);

  return (
    <div className="bg-slate-50 dark:bg-slate-900">
      <Navbar />
      <main className="container mx-auto px-4 py-12">
        {/* Componente de cliente para lidar com as interações */}
        <ServiceDetailsClient service={service} />

        {/* Secção de serviços relacionados */}
        {relatedServices.length > 0 && (
            <RelatedServices services={relatedServices} />
        )}
      </main>
      <Footer />
    </div>
  );
}
