"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'

interface ReservationDetails {
    productName: string;
    sellerName: string;
}

export default function ReviewPage() {
    const params = useParams();
    const router = useRouter();
    const token = params.token as string;

    const [details, setDetails] = useState<ReservationDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!token) return;

        const fetchReservationDetails = async () => {
            try {
                setIsLoading(true);
                const res = await fetch(`/api/reviews/${token}`);
                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || 'Link de avaliação inválido ou expirado.');
                }
                const data = await res.json();
                setDetails(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchReservationDetails();
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) {
            toast.error('Por favor, selecione uma nota de 1 a 5 estrelas.');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, rating, comment }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Falha ao enviar avaliação.');
            }

            toast.success('Avaliação enviada com sucesso! Obrigado.');
            router.push('/');

        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Card className="w-full max-w-lg">
                    <CardHeader><Skeleton className="h-8 w-3/4" /></CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-10 w-1/2" />
                        <Skeleton className="h-24 w-full" />
                    </CardContent>
                    <CardFooter><Skeleton className="h-10 w-full" /></CardFooter>
                </Card>
            </div>
        )
    }

    if (error) {
        return (
             <div className="flex min-h-screen items-center justify-center text-center">
                <div>
                    <h2 className="text-2xl font-bold text-destructive">Erro</h2>
                    <p className="text-muted-foreground">{error}</p>
                    <Button onClick={() => router.push('/')} className="mt-4">Voltar para a Home</Button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
            <Card className="w-full max-w-lg">
                <CardHeader>
                    <CardTitle className="text-2xl">Avalie sua Compra</CardTitle>
                    <CardDescription>
                        Você está avaliando o produto <strong>{details?.productName}</strong> do vendedor <strong>{details?.sellerName}</strong>.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-6">
                        <div className="text-center">
                            <p className="mb-2 font-medium">Sua nota</p>
                            <div className="flex justify-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        className={cn(
                                            "h-10 w-10 cursor-pointer transition-colors",
                                            (hoverRating || rating) >= star
                                                ? 'text-yellow-400 fill-yellow-400'
                                                : 'text-gray-300'
                                        )}
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        onClick={() => setRating(star)}
                                    />
                                ))}
                            </div>
                        </div>
                        <div>
                            <label htmlFor="comment" className="block text-sm font-medium mb-1">Seu comentário (opcional)</label>
                            <Textarea
                                id="comment"
                                placeholder="Descreva sua experiência com o produto e o vendedor..."
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? 'Enviando...' : 'Enviar Avaliação'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
