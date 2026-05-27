import prisma from "@/lib/prisma";
import { NotificationClient } from "./components/NotificationClient";
import { Bell } from "lucide-react";

async function getNotifications() {
  try {
    const notifications = await prisma.adminNotification.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        reservation: {
          include: {
            product: { select: { name: true, images: true } },
            user: { select: { name: true } },
          }
        },
        seller: { select: { name: true } }
      }
    });
    return notifications;
  } catch (error) {
    console.error("Falha ao buscar notificações:", error);
    return [];
  }
}

export default async function AdminNotificationsPage() {
  const notifications = await getNotifications();
  return (
    <>
      <div className="flex items-center gap-4">
        <Bell className="h-7 w-7 text-zaca-roxo"/>
        <div>
            <h1 className="text-lg font-semibold md:text-2xl">Notificações de Reservas</h1>
            <p className="text-sm text-muted-foreground">Novas reservas que precisam de notificação manual para o vendedor.</p>
        </div>
      </div>
      <NotificationClient initialNotifications={notifications} />
    </>
  );
}