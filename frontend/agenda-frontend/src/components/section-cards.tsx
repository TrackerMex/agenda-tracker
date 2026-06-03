import type { ComponentType } from 'react';
import { ArrowUpRight, Minus } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export interface SectionCardItem {
  label: string;
  value: number | string;
  description: string;
  detail: string;
  icon: ComponentType<{ className?: string }>;
  trend?: string;
  tone?: 'default' | 'success' | 'warning' | 'info';
}

const toneClass = {
  default: 'text-primary',
  success: 'text-emerald-600 dark:text-emerald-400',
  warning: 'text-amber-600 dark:text-amber-400',
  info: 'text-sky-600 dark:text-sky-400',
};

export function SectionCards({ items }: { items: SectionCardItem[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        const tone = item.tone ?? 'default';

        return (
          <Card key={item.label} className="shadow-sm">
            <CardHeader className="relative p-4">
              <CardDescription>{item.label}</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums">
                {item.value}
              </CardTitle>
              <div className="absolute right-4 top-4">
                <Badge variant="outline" className="gap-1 rounded-md text-xs">
                  {item.trend ? (
                    <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                  ) : (
                    <Minus className="h-3 w-3" aria-hidden="true" />
                  )}
                  {item.trend ?? 'Hoy'}
                </Badge>
              </div>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1 px-4 pb-4 pt-0 text-sm">
              <div className="flex items-center gap-2 font-medium">
                <Icon className={`h-4 w-4 ${toneClass[tone]}`} aria-hidden="true" />
                {item.description}
              </div>
              <div className="text-muted-foreground">{item.detail}</div>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
