import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { externalSupabase } from '@/integrations/external-supabase/client';
import { useKeywordsClassification } from '@/hooks/useKeywordsClassification';
import {
  NOMBRES_GRUPOS_PRIVADOS,
  COLOR_POR_GRUPO_PRIVADO,
  type GrupoPrivado,
} from '@/lib/clasificacion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  LabelList,
  Cell,
  Tooltip,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface Row {
  Tema: string | null;
  Date: string | null;
}

function hace30dISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString();
}

export default function PrivadosNoticias() {
  const { data: keywordsData, isLoading: loadingKw } = useKeywordsClassification();

  const noticias = useQuery({
    queryKey: ['privados_noticias_30d'],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<Row[]> => {
      const { data, error } = await externalSupabase
        .from('noticias_general_filtradas')
        .select('Tema, Date')
        .eq('titularidad', 'Privado')
        .gte('Date', hace30dISO())
        .limit(10000);
      if (error) {
        console.error('[PrivadosNoticias] error noticias:', error);
        return [];
      }
      return (data ?? []) as Row[];
    },
  });

  const { datos, total } = useMemo(() => {
    if (!keywordsData?.clasificar || !noticias.data) {
      return { datos: [] as { grupo: GrupoPrivado; count: number; color: string }[], total: 0 };
    }
    const counts = new Map<GrupoPrivado, number>();
    NOMBRES_GRUPOS_PRIVADOS.forEach(g => counts.set(g, 0));
    let total = 0;
    for (const row of noticias.data) {
      const c = keywordsData.clasificar(row.Tema);
      if (!c || c.bloque !== 'privados' || !c.grupoHospitalario) continue;
      const g = c.grupoHospitalario as GrupoPrivado;
      if (!NOMBRES_GRUPOS_PRIVADOS.includes(g)) continue;
      counts.set(g, (counts.get(g) ?? 0) + 1);
      total++;
    }
    const datos = NOMBRES_GRUPOS_PRIVADOS
      .map(grupo => ({
        grupo,
        count: counts.get(grupo) ?? 0,
        color: COLOR_POR_GRUPO_PRIVADO[grupo],
      }))
      .sort((a, b) => b.count - a.count);
    return { datos, total };
  }, [keywordsData, noticias.data]);

  const isLoading = loadingKw || noticias.isLoading;
  const quironRank = datos.findIndex(d => d.grupo === 'Quirónsalud') + 1;
  const quironCount = datos.find(d => d.grupo === 'Quirónsalud')?.count ?? 0;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Sanidad privada · Medios · últimos 30 días
        </p>
        <h1 className="text-2xl font-bold text-foreground">Menciones en medios</h1>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Total privados</p>
          <p className="mt-2 text-3xl font-bold text-foreground">
            {total.toLocaleString('es-ES')}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Quirónsalud</p>
          <p className="mt-2 text-3xl font-bold text-primary">
            {quironCount.toLocaleString('es-ES')}
          </p>
          <p className="text-xs text-muted-foreground">
            {total > 0 ? `${((quironCount / total) * 100).toFixed(1)}% del total` : '—'}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Posición</p>
          <p className="mt-2 text-3xl font-bold text-foreground">#{quironRank || '—'}</p>
          <p className="text-xs text-muted-foreground">de 8 grupos privados</p>
        </Card>
      </div>

      {/* Bar chart */}
      <Card className="p-4">
        {isLoading ? (
          <div className="flex h-80 items-center justify-center">
            <Skeleton className="h-full w-full" />
          </div>
        ) : datos.length === 0 || total === 0 ? (
          <div className="flex h-80 items-center justify-center text-sm text-muted-foreground">
            Sin menciones en los últimos 30 días
          </div>
        ) : (
          <div className="h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={datos} margin={{ top: 16, right: 24, left: 8, bottom: 8 }}>
                <XAxis
                  dataKey="grupo"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={70}
                />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                  formatter={(value: number) => [value.toLocaleString('es-ES'), 'Menciones']}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {datos.map(d => (
                    <Cell key={d.grupo} fill={d.color} />
                  ))}
                  <LabelList
                    dataKey="count"
                    position="top"
                    style={{ fontSize: 11, fill: 'hsl(var(--foreground))' }}
                    formatter={(v: number) => v.toLocaleString('es-ES')}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </div>
  );
}