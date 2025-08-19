// components/modals/PixPaymentModal.tsx

'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';

interface PixPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  valor: string;
  purchaseType: 'ACHADINHO_TURBO' | 'CARROSSEL_PRACA' | 'PLANO'; // Adicione outros tipos se necessário
  productId?: string;
  onPaymentSuccess: () => void;
}

export function PixPaymentModal({
  isOpen,
  onClose,
  valor,
  purchaseType,
  productId,
  onPaymentSuccess,
}: PixPaymentModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [txid, setTxid] = useState<string | null>(null);
  const [isPaid, setIsPaid] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reset state on open
      setIsLoading(true);
      setQrCode(null);
      setTxid(null);
      setIsPaid(false);

      const generatePix = async () => {
        try {
          const response = await fetch('/api/pix', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              valor: valor,
              tipo: purchaseType,
              productId: productId,
            }),
          });

          if (!response.ok) {
            throw new Error('Falha ao gerar o QR Code do PIX.');
          }

          const data = await response.json();
          setQrCode(data.imagemQrcode);
          setTxid(data.txid);
        } catch (error) {
          console.error(error);
          toast.error('Erro ao gerar PIX. Tente novamente.');
          onClose();
        } finally {
          setIsLoading(false);
        }
      };

      generatePix();
    }
  }, [isOpen, valor, purchaseType, productId, onClose]);

  useEffect(() => {
    if (!txid || !isOpen || isPaid) return;

    // Polling a cada 5 segundos
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/pix/status/${txid}`);
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'CONFIRMED') {
            setIsPaid(true);
            toast.success('Pagamento confirmado com sucesso!');
            clearInterval(interval);
            onPaymentSuccess();
            setTimeout(() => {
              onClose();
            }, 2000); // Fecha o modal após 2 segundos
          }
        }
      } catch (error) {
        console.error('Erro no polling de status do PIX:', error);
      }
    }, 5000); // 5 segundos

    return () => clearInterval(interval);
  }, [txid, isOpen, isPaid, onClose, onPaymentSuccess]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Pagar com PIX</DialogTitle>
          <DialogDescription>
            Escaneie o QR Code abaixo com o app do seu banco.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center p-4">
          {isLoading ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
              <p>Gerando seu QR Code...</p>
            </div>
          ) : isPaid ? (
            <div className="flex flex-col items-center gap-4 text-green-600">
              <CheckCircle2 className="h-16 w-16" />
              <p className="text-xl font-semibold">Pagamento Aprovado!</p>
              <p>Seu serviço já foi ativado.</p>
            </div>
          ) : qrCode ? (
            <Image
              src={qrCode}
              alt="QR Code PIX"
              width={250}
              height={250}
              unoptimized
            />
          ) : (
            <p>Não foi possível carregar o QR Code.</p>
          )}
        </div>
        <DialogFooter>
            <p className="text-sm text-muted-foreground text-center w-full">
              {!isPaid && 'Aguardando confirmação do pagamento...'}
            </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}