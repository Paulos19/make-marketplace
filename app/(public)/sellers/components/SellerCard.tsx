"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User } from "@prisma/client"
import { Star, ArrowRight } from "lucide-react"
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
        <Link href={`/seller/${seller.id}`} className="block group h-full">
            <div className="h-full relative bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] overflow-hidden flex flex-col transition-all duration-500 hover:bg-white/10 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.8)]">
                
                {/* Banner Image */}
                <div className="h-40 relative w-full overflow-hidden bg-[#0a0a0a]">
                    {seller.sellerBannerImageUrl ? (
                        <Image
                            src={seller.sellerBannerImageUrl}
                            alt={`Banner de ${seller.storeName || seller.name}`}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100"
                        />
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] to-[#050505]"></div>
                    )}
                    {/* Gradient overlay to blend banner into card */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-80"></div>
                </div>

                {/* Avatar */}
                <div className="flex justify-center -mt-16 relative z-10">
                    <div className="relative rounded-full p-2 bg-transparent transition-transform duration-500 group-hover:scale-110">
                        <Avatar className="h-28 w-28 border-4 border-[#111111] shadow-2xl relative z-10">
                            <AvatarImage src={seller.image || undefined} className="object-cover" />
                            <AvatarFallback className="bg-black text-xl font-bold text-white">
                                {seller.storeName?.charAt(0) || seller.name?.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        {/* Glow effect behind avatar on hover */}
                        <div className="absolute inset-0 rounded-full bg-white/30 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0 scale-75"></div>
                    </div>
                </div>

                {/* Content */}
                <div className="px-6 pb-8 text-center flex-grow flex flex-col items-center">
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-gray-200 transition-colors">
                        {seller.storeName || seller.name}
                    </h3>
                    
                    <p className="text-sm text-white/50 line-clamp-2 mb-8 px-2">
                        {seller.profileDescription || "Descubra os produtos incríveis oferecidos por esta loja parceira."}
                    </p>

                    {/* Stats / Badges */}
                    <div className="mt-auto flex items-center justify-between w-full gap-4">
                        <div className="flex flex-col items-center justify-center px-4 py-2 bg-black/40 rounded-2xl border border-white/5 flex-1 shadow-inner">
                            <span className="text-[10px] uppercase tracking-wider font-bold text-white/30 mb-1">Avaliação</span>
                            <div className="flex items-center gap-1.5">
                                {seller.totalReviews > 0 ? (
                                    <>
                                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
                                        <span className="font-bold text-white text-base leading-none">{seller.averageRating.toFixed(1)}</span>
                                        <span className="text-white/40 text-xs ml-1 leading-none">({seller.totalReviews})</span>
                                    </>
                                ) : (
                                    <span className="text-sm text-white/30 font-medium">--</span>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-center w-14 h-14 bg-white border border-white/10 rounded-2xl group-hover:scale-105 transition-all duration-300 shadow-lg text-black">
                             <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-1" />
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    )
}
