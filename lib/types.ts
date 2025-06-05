// Tipos para Usuários e Vendedores
export interface UserInfo {
  id: string;
  name: string | null;
  image?: string | null;
  whatsappLink: string | null;
  storeName?: string | null;
}

// Tipo para Categorias
export interface Category {
  id: string;
  name: string;
}

// Tipo Unificado e Central para Produtos
export interface Product {
  seller: any;
  id: string;
  name: string;
  description: string | null;
  price: number;
  originalPrice?: number | null;
  onPromotion?: boolean | null | undefined; // <- O tipo correto e unificado
  imageUrls: string[];
  user: UserInfo;
  createdAt: string;
  categories: Category[];
  quantity: number;
}