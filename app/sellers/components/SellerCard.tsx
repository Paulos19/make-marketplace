"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { User } from "@prisma/client"
import { Star } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

type SellerWithRating = User & {
    averageRating: number;
    totalReviews: number;
}

interface SellerCardProps {
    seller: SellerWithRating
}

export const SellerCard = ({ seller }: SellerCardProps) => {
    return (
        <Link href={`/seller/${seller.id}`} className="block group">
            <Card className="overflow-hidden h-full flex flex-col transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <CardHeader className="p-0">
                    <div className="h-32 bg-gray-100 dark:bg-gray-800 relative">
                        {seller.sellerBannerImageUrl && (
                            <Image
                                src={seller.sellerBannerImageUrl}
                                alt={`Banner de ${seller.storeName || seller.name}`}
                                fill
                                className="object-cover"
                            />
                        )}
                    </div>
                    <div className="flex justify-center -mt-12">
                         <Avatar className="h-24 w-24 border-4 border-background">
                            <AvatarImage src={seller.image || undefined} />
                            <AvatarFallback>{seller.storeName?.charAt(0) || seller.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                    </div>
                </CardHeader>
                <CardContent className="text-center mt-4 flex-grow">
                    <h3 className="text-xl font-bold">{seller.storeName || seller.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{seller.profileDescription || "Descubra os produtos deste vendedor."}</p>
                </CardContent>
                <CardFooter className="justify-center">
                    {/* Exibição da Avaliação */}
                    <div className="flex items-center justify-center gap-1.5 mt-2 text-sm">
                        {seller.totalReviews > 0 ? (
                            <>
                                <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                                <span className="font-bold">{seller.averageRating.toFixed(1)}</span>
                                <span className="text-muted-foreground">({seller.totalReviews})</span>
                            </>
                        ) : (
                             <span className="text-xs text-muted-foreground">Nenhuma avaliação</span>
                        )}
                    </div>
                </CardFooter>
            </Card>
        </Link>
    )
}
