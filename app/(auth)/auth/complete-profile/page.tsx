"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function CompleteProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [whatsappLink, setWhatsappLink] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.whatsappLink) {
      // Se o usuário já tem o link, redireciona para a home
      router.push("/");
    }
  }, [session, status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!whatsappLink) {
      setError("O link do WhatsApp é obrigatório.");
      return;
    }
    
    if (!whatsappLink.startsWith("https://wa.me/") && !whatsappLink.startsWith("https://api.whatsapp.com/send?phone=")) {
        setError("Link do WhatsApp inválido. Use o formato https://wa.me/seunumerocomcodigo ou https://api.whatsapp.com/send?phone=seunumerocomcodigo");
        return;
    }

    try {
      const response = await fetch("/api/user/update-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsappLink }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Falha ao atualizar o perfil.");
      }
      
      setSuccess("Perfil atualizado com sucesso!");
      // Atualizar a sessão do NextAuth para refletir a mudança
      await update({ ...session, user: { ...session?.user, whatsappLink } });
      router.push("/"); // Redireciona para a home

    } catch (err: any) {
      setError(err.message);
    }
  };

  if (status === "loading") {
    return <div>Carregando...</div>;
  }

  if (status === "unauthenticated") {
    router.push("/auth/signin");
    return null;
  }

  return (
    <div style={{ maxWidth: "400px", margin: "auto", padding: "20px" }}>
      <h1>Completar Perfil</h1>
      <p>Por favor, adicione seu link do WhatsApp para continuar.</p>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="whatsappLink">Link do WhatsApp (ex: https://wa.me/55119XXXXXXXX):</label>
          <input 
            type="url" 
            id="whatsappLink" 
            value={whatsappLink} 
            onChange={(e) => setWhatsappLink(e.target.value)} 
            required 
            placeholder="https://wa.me/55119..." 
            style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
          />
        </div>
        <button type="submit" style={{ padding: "10px 15px", width: "100%" }}>Salvar</button>
      </form>
    </div>
  );
}