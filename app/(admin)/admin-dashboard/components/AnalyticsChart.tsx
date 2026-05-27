'use client';

import { useState, useEffect } from 'react';
import {
  ComposedChart, // <--- Trocado para ComposedChart
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface ChartData {
  date: string;
  produtos: number;
  usuarios: number;
  assinaturas: number;
}

export default function AnalyticsChart() {
  const [data, setData] = useState<ChartData[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>((new Date().getMonth() + 1).toString());
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [availableMonths, setAvailableMonths] = useState<{ month: string, year: string }[]>([]);

  useEffect(() => {
    const months = [];
    const currentDate = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      months.push({
        month: (date.getMonth() + 1).toString(),
        year: date.getFullYear().toString(),
      });
    }
    setAvailableMonths(months);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/admin/dashboard-stats?month=${selectedMonth}&year=${selectedYear}`);
        if (response.ok) {
          const result = await response.json();
          // Renomeia as chaves para corresponder ao gráfico
          const formattedData = result.map((item: any) => ({
            date: item.date.split('-')[2], // Usa apenas o dia no eixo X
            produtos: item.products,
            usuarios: item.users,
            assinaturas: item.subscriptions,
          }));
          setData(formattedData);
        }
      } catch (error) {
        console.error('Erro ao buscar dados do gráfico:', error);
      }
    };
    fetchData();
  }, [selectedMonth, selectedYear]);

  const handleMonthChange = (value: string) => {
    const [year, month] = value.split('-');
    setSelectedYear(year);
    setSelectedMonth(month);
  };
  
  const selectedMonthName = new Date(parseInt(selectedYear), parseInt(selectedMonth) - 1)
        .toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <CardTitle>Análise Mensal</CardTitle>
            <CardDescription>
              Dados de novos produtos, usuários e assinaturas em {selectedMonthName}.
            </CardDescription>
          </div>
          <Select onValueChange={handleMonthChange} defaultValue={`${selectedYear}-${selectedMonth}`}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Selecione o mês" />
            </SelectTrigger>
            <SelectContent>
              {availableMonths.map(({ month, year }) => (
                <SelectItem key={`${year}-${month}`} value={`${year}-${month}`}>
                  {new Date(parseInt(year), parseInt(month) - 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius)',
              }}
            />
            <Legend />
            {/* As barras (torres) */}
            <Bar dataKey="produtos" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="usuarios" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="assinaturas" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
            
            {/* As linhas sobre as barras */}
            <Line type="monotone" dataKey="produtos" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="usuarios" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="assinaturas" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}