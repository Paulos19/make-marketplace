import "./global.css";

import { Stack } from 'expo-router';
import React, { useMemo } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Sidebar } from '../components/Sidebar';
import { CustomAlertProvider } from '../components/ui/CustomAlert';

export default function RootLayout() {
  // Memoize screenOptions
  const memoizedScreenOptions = useMemo(() => ({
    headerShown: false, // Mantém o cabeçalho oculto para todas as telas
    contentStyle: { flex: 1, padding: 0, margin: 0, backgroundColor: '#FFFFFF' }, // Garante que o conteúdo ocupe toda a tela
  }), []); // Empty dependency array as options are static

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={memoizedScreenOptions}>
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/register" />
        <Stack.Screen name="auth/forgot-password" />
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="products" />
        <Stack.Screen name="products/[productId]" />
        <Stack.Screen name="dashboard/sales" />
        {/* Add other screens here as you develop them */}
      </Stack>
      <Sidebar />
      <CustomAlertProvider />
    </>
  );
}
