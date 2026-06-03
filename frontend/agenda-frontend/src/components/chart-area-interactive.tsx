import * as React from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useIsMobile } from '@/hooks/use-mobile';

export interface DashboardChartPoint {
  date: string;
  inscripciones: number;
  cupos: number;
}

const chartConfig = {
  inscripciones: {
    label: 'Inscripciones',
    color: 'var(--primary)',
  },
  cupos: {
    label: 'Cupos libres',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig;

export function ChartAreaInteractive({ data }: { data: DashboardChartPoint[] }) {
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = React.useState('30d');

  React.useEffect(() => {
    if (isMobile) setTimeRange('7d');
  }, [isMobile]);

  const filteredData = React.useMemo(() => {
    if (data.length === 0) return [];

    const latestDate = data.reduce((latest, item) => {
      const current = new Date(item.date);
      return current > latest ? current : latest;
    }, new Date(data[0].date));
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const startDate = new Date(latestDate);
    startDate.setDate(startDate.getDate() - days);

    return data.filter((item) => new Date(item.date) >= startDate);
  }, [data, timeRange]);

  return (
    <Card>
      <CardHeader className="relative">
        <CardTitle>Actividad de capacitaciones</CardTitle>
        <CardDescription>Inscripciones y cupos libres por fecha programada</CardDescription>
        <div className="absolute right-4 top-4">
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={(value) => value && setTimeRange(value)}
            variant="outline"
            className="hidden lg:flex"
          >
            <ToggleGroupItem value="90d" className="h-8 px-2.5">
              90 dias
            </ToggleGroupItem>
            <ToggleGroupItem value="30d" className="h-8 px-2.5">
              30 dias
            </ToggleGroupItem>
            <ToggleGroupItem value="7d" className="h-8 px-2.5">
              7 dias
            </ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="flex w-32 lg:hidden" aria-label="Rango">
              <SelectValue placeholder="30 dias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="90d">90 dias</SelectItem>
              <SelectItem value="30d">30 dias</SelectItem>
              <SelectItem value="7d">7 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[260px] w-full">
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillInscripciones" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-inscripciones)" stopOpacity={0.45} />
                <stop offset="95%" stopColor="var(--color-inscripciones)" stopOpacity={0.06} />
              </linearGradient>
              <linearGradient id="fillCupos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-cupos)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="var(--color-cupos)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={28}
              tickFormatter={(value: string) =>
                new Date(value).toLocaleDateString('es-MX', {
                  month: 'short',
                  day: 'numeric',
                })
              }
            />
            <YAxis width={32} tickLine={false} axisLine={false} allowDecimals={false} />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) =>
                    new Date(String(value)).toLocaleDateString('es-MX', {
                      month: 'long',
                      day: 'numeric',
                    })
                  }
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="cupos"
              type="natural"
              fill="url(#fillCupos)"
              stroke="var(--color-cupos)"
              strokeWidth={2}
            />
            <Area
              dataKey="inscripciones"
              type="natural"
              fill="url(#fillInscripciones)"
              stroke="var(--color-inscripciones)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
