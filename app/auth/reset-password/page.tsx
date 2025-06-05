// app/auth/reset-password/page.tsx
import { Suspense } from 'react';
import ResetPasswordForm from './ResetPasswordForm'; // Importa o novo componente
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Componente de fallback para ser exibido enquanto o Suspense aguarda
function ResetPasswordSkeleton() {
  return (
    <Card className="w-full max-w-md shadow-2xl">
      <CardHeader className="text-center">
        <Skeleton className="h-10 w-48 mx-auto mb-4" />
        <Skeleton className="h-8 w-40 mx-auto" />
        <Skeleton className="h-4 w-full mt-2" />
        <Skeleton className="h-4 w-3/4 mx-auto mt-1" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-950 px-4">
      <Suspense fallback={<ResetPasswordSkeleton />}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}