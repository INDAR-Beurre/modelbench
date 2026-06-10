// components/ModelChart.tsx
// =========================================================================
// Visual ranking chart for the leaderboard.
//
// Two views in one component, controlled by a small toggle:
//   - "Radar" — a polar chart of the three score axes (design, code, features)
//     for every model, so you can see their *shape*.
//   - "Bars"  — a grouped bar chart of the same data, so you can see their
//     *totals*.
//
// The chart uses the editorial palette: ink/red/blue/violet/lime. We clip
// scores to 0-10 and label every value.
// =========================================================================

'use client';

import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BarChart3, Radar as RadarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ChartRow {
  modelId: string;
  label: string;
  design: number;
  codeQuality: number;
  featureCompleteness: number;
  average: number;
}

const AXES: Array<{ key: keyof Omit<ChartRow, 'modelId' | 'label' | 'average'>; label: string; color: string }> = [
  { key: 'design', label: 'Design', color: '#7b3dff' },
  { key: 'codeQuality', label: 'Code', color: '#1d4dff' },
  { key: 'featureCompleteness', label: 'Features', color: '#ff4d2e' },
];

const PALETTE = ['#ff4d2e', '#1d4dff', '#7b3dff', '#d8ff38', '#ff8ab3', '#17130f', '#5e5548', '#17130f'];

export function ModelChart({ rows, className }: { rows: ChartRow[]; className?: string }) {
  const [view, setView] = useState<'radar' | 'bars'>('bars');

  // For radar: one row per axis, one series per model.
  const radarData = useMemo(
    () =>
      AXES.map((ax) => {
        const point: Record<string, number | string> = { axis: ax.label };
        for (const r of rows) {
          point[r.label] = Number((r[ax.key] as number).toFixed(2));
        }
        return point;
      }),
    [rows],
  );

  // For grouped bars: one row per model, three bars.
  const barsData = useMemo(
    () =>
      rows.map((r) => ({
        label: shortLabel(r.label),
        full: r.label,
        Design: Number(r.design.toFixed(2)),
        Code: Number(r.codeQuality.toFixed(2)),
        Features: Number(r.featureCompleteness.toFixed(2)),
        average: Number(r.average.toFixed(2)),
      })),
    [rows],
  );

  if (rows.length === 0) return null;

  return (
    <div className={cn('rounded-3xl border border-ink bg-paper p-5 shadow-paper-2', className)}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <span className="eyebrow text-muted">— 03.A / The Chart</span>
          <h3 className="mt-1 font-serif text-2xl tracking-tightest text-ink">
            Score breakdown.
          </h3>
          <p className="text-xs text-muted">
            Three axes per model. Average score shown on the right.
          </p>
        </div>
        <div className="inline-flex rounded-pill border border-ink/30 bg-paper p-1 text-[10px] uppercase tracking-eyebrow">
          <button
            type="button"
            onClick={() => setView('bars')}
            className={cn(
              'flex items-center gap-1.5 rounded-pill px-3 py-1.5 transition',
              view === 'bars' ? 'bg-ink text-paper' : 'text-ink/60 hover:text-ink',
            )}
          >
            <BarChart3 className="h-3 w-3" /> Bars
          </button>
          <button
            type="button"
            onClick={() => setView('radar')}
            className={cn(
              'flex items-center gap-1.5 rounded-pill px-3 py-1.5 transition',
              view === 'radar' ? 'bg-ink text-paper' : 'text-ink/60 hover:text-ink',
            )}
          >
            <RadarIcon className="h-3 w-3" /> Radar
          </button>
        </div>
      </div>

      <div className="h-[360px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {view === 'bars' ? (
            <BarChart
              data={barsData}
              margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
              barCategoryGap={18}
            >
              <CartesianGrid stroke="rgba(18,15,10,0.08)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: '#120f0a', fontSize: 11, fontFamily: 'inherit' }}
                axisLine={{ stroke: 'rgba(18,15,10,0.25)' }}
                tickLine={false}
                interval={0}
                angle={-12}
                textAnchor="end"
                height={56}
              />
              <YAxis
                domain={[0, 10]}
                tick={{ fill: '#5e5548', fontSize: 11 }}
                axisLine={{ stroke: 'rgba(18,15,10,0.25)' }}
                tickLine={false}
                width={28}
              />
              <Tooltip
                cursor={{ fill: 'rgba(18,15,10,0.04)' }}
                contentStyle={{
                  background: '#fff7e6',
                  border: '1px solid #120f0a',
                  borderRadius: 12,
                  fontSize: 12,
                  color: '#120f0a',
                }}
                labelStyle={{ color: '#120f0a', fontWeight: 600 }}
                formatter={(value: number | string, name: string) => [
                  typeof value === 'number' ? value.toFixed(1) : value,
                  name,
                ]}
              />
              <Legend
                wrapperStyle={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.15em' }}
                iconType="circle"
              />
              <Bar dataKey="Design" fill={AXES[0].color} radius={[6, 6, 0, 0]} />
              <Bar dataKey="Code" fill={AXES[1].color} radius={[6, 6, 0, 0]} />
              <Bar dataKey="Features" fill={AXES[2].color} radius={[6, 6, 0, 0]} />
            </BarChart>
          ) : (
            <RadarChart data={radarData} outerRadius="78%">
              <PolarGrid stroke="rgba(18,15,10,0.18)" />
              <PolarAngleAxis
                dataKey="axis"
                tick={{ fill: '#120f0a', fontSize: 12, fontWeight: 600 }}
              />
              <PolarRadiusAxis
                domain={[0, 10]}
                tick={{ fill: '#5e5548', fontSize: 10 }}
                stroke="rgba(18,15,10,0.15)"
                tickCount={6}
              />
              {rows.map((r, i) => (
                <Radar
                  key={r.modelId}
                  name={shortLabel(r.label)}
                  dataKey={r.label}
                  stroke={PALETTE[i % PALETTE.length]}
                  fill={PALETTE[i % PALETTE.length]}
                  fillOpacity={0.18}
                  strokeWidth={2}
                />
              ))}
              <Tooltip
                contentStyle={{
                  background: '#fff7e6',
                  border: '1px solid #120f0a',
                  borderRadius: 12,
                  fontSize: 12,
                  color: '#120f0a',
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.15em' }}
                iconType="circle"
              />
            </RadarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function shortLabel(label: string): string {
  // "Llama 3.3 70B (Groq) — best for code review" → "Llama 3.3 70B"
  return label
    .replace(/\s*\(Groq\).*$/i, '')
    .replace(/\s*—.*$/, '')
    .replace(/\s*\(.*?\)\s*$/, '')
    .trim();
}
