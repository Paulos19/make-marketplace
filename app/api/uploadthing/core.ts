import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

const f = createUploadthing();

export const ourFileRouter = {
  // Upload de imagens de produtos (até 5 imagens)
  productImage: f({
    image: { maxFileSize: "8MB", maxFileCount: 5 },
  })
    .middleware(async () => {
      const session = await getServerSession(authOptions);
      if (!session?.user) throw new Error("Não autorizado");
      return { userId: session.user.email ?? "unknown" };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload de produto completo para:", metadata.userId);
      console.log("URL do arquivo:", file.ufsUrl);
      return { url: file.ufsUrl };
    }),

  // Upload de avatar/foto de perfil (1 imagem)
  profileImage: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      const session = await getServerSession(authOptions);
      if (!session?.user) throw new Error("Não autorizado");
      return { userId: session.user.email ?? "unknown" };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload de perfil completo para:", metadata.userId);
      return { url: file.ufsUrl };
    }),

  // Upload de banners (1 imagem grande)
  bannerImage: f({
    image: { maxFileSize: "16MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      const session = await getServerSession(authOptions);
      if (!session?.user) throw new Error("Não autorizado");
      return { userId: session.user.email ?? "unknown" };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload de banner completo para:", metadata.userId);
      return { url: file.ufsUrl };
    }),

  // Upload genérico (até 5 imagens)
  imageUploader: f({
    image: { maxFileSize: "8MB", maxFileCount: 5 },
  })
    .middleware(async () => {
      const session = await getServerSession(authOptions);
      if (!session?.user) throw new Error("Não autorizado");
      return { userId: session.user.email ?? "unknown" };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload completo para:", metadata.userId);
      return { url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
