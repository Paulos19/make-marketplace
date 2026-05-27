'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Download, Upload, Loader2, AlertTriangle } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export default function DataSyncPage() {
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleExport = async () => {
    setIsExporting(true)
    toast.info('Iniciando a exportação dos dados. Isso pode levar um momento...')

    try {
      const response = await fetch('/api/admin/data-sync')
      if (!response.ok) {
        throw new Error('Falha ao buscar os dados do servidor.')
      }
      const data = await response.json()

      const jsonString = JSON.stringify(data, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = url
      a.download = 'database-backup.json'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('Exportação concluída com sucesso!', {
        description: 'O arquivo database-backup.json foi baixado.',
      })
    } catch (error) {
      console.error('Erro na exportação:', error)
      toast.error('Erro na exportação', {
        description:
          error instanceof Error
            ? error.message
            : 'Ocorreu um erro desconhecido.',
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFile(event.target.files[0])
    }
  }

  const handleImport = async () => {
    if (!selectedFile) {
      toast.warning('Nenhum arquivo selecionado', {
        description: 'Por favor, escolha um arquivo de backup para importar.',
      })
      return
    }

    setIsImporting(true)
    toast.info(
      'Iniciando a importação. Este processo é crítico, não feche esta página.',
    )

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        if (!event.target?.result) {
          throw new Error('Não foi possível ler o arquivo.')
        }
        const data = JSON.parse(event.target.result as string)

        const response = await fetch('/api/admin/data-sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Falha na importação dos dados.')
        }

        toast.success('Importação concluída com sucesso!', {
          description: 'Seus dados foram restaurados.',
        })
      } catch (error) {
        console.error('Erro na importação:', error)
        toast.error('Erro na importação', {
          description:
            error instanceof Error
              ? error.message
              : 'Verifique o console para mais detalhes.',
        })
      } finally {
        setIsImporting(false)
        setSelectedFile(null)
      }
    }
    reader.onerror = () => {
        toast.error('Erro ao ler o arquivo selecionado.');
        setIsImporting(false);
    }
    reader.readAsText(selectedFile)
  }

  return (
    <div className="container mx-auto max-w-4xl py-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">Sincronização de Dados</h1>
        <p className="text-muted-foreground">
          Faça o backup ou restaure todos os dados do seu marketplace.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Card de Exportação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Exportar Dados
            </CardTitle>
            <CardDescription>
              Baixe todos os dados do seu banco de dados em um único arquivo
              JSON. Guarde este arquivo em um local seguro.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full"
            >
              {isExporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Baixar Backup
            </Button>
          </CardContent>
        </Card>

        {/* Card de Importação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Importar Dados
            </CardTitle>
            <CardDescription>
              Restaure seu banco de dados a partir de um arquivo de backup
              JSON. Isso irá apagar os dados existentes antes de importar.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="file"
              accept=".json"
              onChange={handleFileChange}
              disabled={isImporting}
            />
            <Button
              onClick={handleImport}
              disabled={!selectedFile || isImporting}
              className="w-full"
              variant="destructive"
            >
              {isImporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Importar e Substituir Dados
            </Button>
          </CardContent>
        </Card>
      </div>
      <Card className="mt-8 border-yellow-500/50 bg-yellow-50/50">
        <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
                <AlertTriangle className="h-5 w-5"/>
                Instruções Importantes
            </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-yellow-700">
            <p><strong>1. Exporte:</strong> Clique em "Baixar Backup" para salvar seus dados.</p>
            <p><strong>2. Resete o Banco de Dados:</strong> No terminal, rode o comando <code className="rounded bg-yellow-200 px-1 py-0.5 font-mono">npx prisma migrate reset</code>. Isso irá apagar tudo e aplicar as migrações mais recentes.</p>
            <p><strong>3. Importe:</strong> Volte a esta página, selecione o arquivo que você baixou e clique em "Importar e Substituir Dados".</p>
        </CardContent>
      </Card>
    </div>
  )
}
