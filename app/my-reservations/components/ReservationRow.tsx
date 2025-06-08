'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  TableCell,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ReservationStatus } from '@prisma/client';
import { ReservationWithDetails } from './MyReservationsClient';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface ReservationRowProps {
    reservation: ReservationWithDetails;
    onCancel: (reservationId: string) => void;
}

const statusMap: Record<ReservationStatus, { text: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    PENDING: { text: "Pendente", variant: "default" },
    CONFIRMED: { text: "Confirmada", variant: "default" },
    SOLD: { text: "Concluída", variant: "outline" },
    CANCELED: { text: "Cancelada", variant: "destructive" },
};

export function ReservationRow({ reservation, onCancel }: ReservationRowProps) {
    const { product, status, createdAt, id: reservationId } = reservation;
    
    // Linha corrigida para desestruturar 'user' como 'seller'
    const { name, images, user: seller } = product; 
    
    const statusInfo = statusMap[status];

    const handleContact = () => {
        if (!seller.whatsappLink) {
            ('Este vendedor não forneceu um número de WhatsApp.');
            return;
        }
        const message = `Olá, ${seller.name}! Tenho interesse no produto "${name}" que reservei no marketplace.`;
        const whatsappUrl = `https://wa.me/${seller.whatsappLink}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    return (
        <TableRow>
            <TableCell className="font-medium">
                <Link href={`/products/${product.id}`} className="flex items-center gap-3 hover:underline">
                    <Image 
                        src={images?.[0] || '/placeholder.png'} 
                        alt={name}
                        width={40}
                        height={40}
                        className="rounded-md object-cover bg-muted"
                    />
                    <span className='truncate max-w-[200px]'>{name}</span>
                </Link>
            </TableCell>
            <TableCell>
                <Badge variant={statusInfo.variant}>{statusInfo.text}</Badge>
            </TableCell>
            <TableCell>{seller.name}</TableCell>
            <TableCell>{new Date(createdAt).toLocaleDateString('pt-BR')}</TableCell>
            <TableCell className="text-right space-x-2">
                <Button variant="outline" size="sm" onClick={handleContact}>Contactar Vendedor</Button>
                {status === 'PENDING' && (
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="destructive" size="sm">Cancelar</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                            <DialogTitle>Tem a certeza?</DialogTitle>
                            <DialogDescription>
                                Esta ação não pode ser desfeita. Ao cancelar, o produto voltará a ficar disponível para outros compradores.
                            </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                            <DialogClose>Voltar</DialogClose>
                            <DialogTrigger onClick={() => onCancel(reservationId)}>
                                Sim, cancelar
                            </DialogTrigger>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </TableCell>
        </TableRow>
    );
}