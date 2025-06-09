"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoreHorizontal, Trash2, KeyRound, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { PasswordInput } from "@/components/ui/PasswordInput"; // <<< INÍCIO DA CORREÇÃO 1

interface UserActionsProps {
  userId: string;
  userEmail: string | null;
}

export function UserActions({ userId, userEmail }: UserActionsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Função para alterar a senha
  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error("A nova senha deve ter no mínimo 6 caracteres.");
      return;
    }
    setIsChangingPassword(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Falha ao alterar senha.");
      }
      toast.success(`Senha do usuário ${userEmail} alterada com sucesso!`);
      setIsPasswordModalOpen(false);
      setNewPassword("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ocorreu um erro.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Função para excluir o usuário
  const handleDeleteUser = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Falha ao excluir usuário.");
      }
      toast.success(`Usuário ${userEmail} excluído com sucesso!`);
      setIsDeleteAlertOpen(false);
      router.refresh(); 
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ocorreu um erro.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        {/* ... (código do DropdownMenu inalterado) ... */}
      </DropdownMenu>

      {/* Modal para Alterar Senha */}
      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white dark:bg-slate-800">
          <DialogHeader>
            <DialogTitle>Alterar Senha</DialogTitle>
            <DialogDescription>
              Digite a nova senha para o usuário <strong>{userEmail}</strong>. Ele precisará usar esta nova senha no próximo login.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-password" className="text-right">Nova Senha</Label>
              {/* <<< INÍCIO DA CORREÇÃO 2: Usar PasswordInput >>> */}
              <PasswordInput
                id="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="col-span-3"
                placeholder="Mínimo 6 caracteres"
              />
              {/* <<< FIM DA CORREÇÃO 2 >>> */}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={handleChangePassword} disabled={isChangingPassword}>
              {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Nova Senha
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Alerta de Confirmação para Exclusão */}
      <Dialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-slate-800">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><AlertTriangle className="text-red-500"/>Tem Certeza Absoluta?</DialogTitle>
                <DialogDescription>
                    Esta ação não pode ser desfeita. Isso irá excluir permanentemente o usuário <strong>{userEmail}</strong> e todos os seus dados, incluindo produtos e reservas.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter className="sm:justify-end gap-2">
                <DialogClose asChild>
                    <Button type="button" variant="secondary">Cancelar</Button>
                </DialogClose>
                <Button type="button" variant="destructive" onClick={handleDeleteUser} disabled={isDeleting}>
                    {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sim, excluir usuário
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}