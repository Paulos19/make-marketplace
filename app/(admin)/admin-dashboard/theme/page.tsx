// app/admin-dashboard/theme/page.tsx
import prisma from "@/lib/prisma";
import { ThemeForm } from "./components/ThemeForm";

// Busca as configurações de tema atuais do banco de dados
async function getThemeSettings() {
    // Usamos um ID fixo para ter sempre uma única linha de configuração
    const settings = await prisma.themeSettings.findUnique({
        where: { id: "global_theme_settings" },
    });
    // Se não houver configurações, retorna valores padrão para o formulário
    if (!settings) {
        return {
            zaca_roxo: "262 64% 49%",
            zaca_azul: "217 91% 60%",
        };
    }
    return settings;
}

export default async function AdminThemePage() {
    const currentTheme = await getThemeSettings();

    return (
        <>
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">Customizar Aparência do Site</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-2 mb-6">
                Altere as cores principais da sua loja. Os valores devem estar no formato HSL (ex: "262 64% 49%").
            </p>

            {/* Passamos as configurações atuais para o formulário cliente */}
            <ThemeForm currentTheme={currentTheme} />
        </>
    );
}