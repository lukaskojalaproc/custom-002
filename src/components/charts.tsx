import { useState } from 'react';

/* Charts follow the dataviz rules: thin bars (≤ 16px), 4px rounded data-end,
   values at the tip in text ink, recessive reference line, hover tooltip on every mark.
   Palette: single series = brand green; before/after pair = blue #2a78d6 / green #029F74
   (validated: CVD ΔE 20.3, normal-vision ΔE 21.3, both ≥ 3:1 on white). */

export interface BarItem {
  id: string;
  label: string;
  value: number;
  detail?: string;
  muted?: boolean;
  tag?: string;
}

export function BarList({
  items,
  format,
  reference,
  max,
}: {
  items: BarItem[];
  format: (n: number) => string;
  reference?: { value: number; label: string };
  max?: number;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const top = max ?? Math.max(...items.map((i) => i.value), reference?.value ?? 0) * 1.22;
  if (!items.length) return null;
  return (
    <div className="barlist">
      {items.map((it) => (
        <div
          key={it.id}
          className="barlist-row"
          onMouseEnter={() => setHover(it.id)}
          onMouseLeave={() => setHover(null)}
        >
          <div className="barlist-label" title={it.label}>
            {it.label}
            {it.tag && <span className="barlist-tag">{it.tag}</span>}
          </div>
          <div className="barlist-track">
            <div
              className={`barlist-bar ${it.muted ? 'is-muted' : ''}`}
              style={{ width: `${Math.max(0.5, (it.value / top) * 100)}%` }}
            />
            <span className="barlist-value">{format(it.value)}</span>
            {reference && <div className="barlist-ref" style={{ left: `${(reference.value / top) * 100}%` }} />}
            {hover === it.id && (
              <div className="chart-tip" style={{ left: `${Math.min(70, (it.value / top) * 100)}%` }}>
                <strong>{it.label}</strong>
                <span>{format(it.value)}</span>
                {it.detail && <span className="muted">{it.detail}</span>}
              </div>
            )}
          </div>
        </div>
      ))}
      {reference && (
        <div className="chart-legend">
          <span className="legend-ref" /> {reference.label}: {format(reference.value)}
        </div>
      )}
    </div>
  );
}

export interface PairItem {
  id: string;
  label: string;
  a?: number;
  b?: number;
}

export function PairedBars({
  items,
  format,
  labels,
}: {
  items: PairItem[];
  format: (n: number) => string;
  labels: [string, string];
}) {
  const [hover, setHover] = useState<string | null>(null);
  const top = Math.max(...items.flatMap((i) => [i.a ?? 0, i.b ?? 0])) * 1.22;
  if (!items.length) return null;
  return (
    <div className="barlist">
      <div className="chart-legend chart-legend-top">
        <span className="legend-swatch" style={{ background: 'var(--chart-a)' }} /> {labels[0]}
        <span className="legend-swatch" style={{ background: 'var(--chart-b)' }} /> {labels[1]}
      </div>
      {items.map((it) => {
        const change = it.a != null && it.b != null ? ((it.b - it.a) / it.a) * 100 : undefined;
        return (
          <div
            key={it.id}
            className="barlist-row barlist-row-pair"
            onMouseEnter={() => setHover(it.id)}
            onMouseLeave={() => setHover(null)}
          >
            <div className="barlist-label" title={it.label}>
              {it.label}
            </div>
            <div className="barlist-pair">
              {[it.a, it.b].map((v, i) => (
                <div className="barlist-track" key={i}>
                  {v != null ? (
                    <>
                      <div
                        className="barlist-bar"
                        style={{ width: `${(v / top) * 100}%`, background: i === 0 ? 'var(--chart-a)' : 'var(--chart-b)' }}
                      />
                      <span className="barlist-value">{format(v)}</span>
                    </>
                  ) : (
                    <span className="barlist-value muted">nėra duomenų</span>
                  )}
                </div>
              ))}
              {hover === it.id && (
                <div className="chart-tip" style={{ left: '40%' }}>
                  <strong>{it.label}</strong>
                  <span>
                    {labels[0]}: {it.a != null ? format(it.a) : '—'}
                  </span>
                  <span>
                    {labels[1]}: {it.b != null ? format(it.b) : '—'}
                  </span>
                  {change != null && (
                    <span className="muted">
                      Pokytis: {change > 0 ? '+' : ''}
                      {change.toLocaleString('lt-LT', { maximumFractionDigits: 1 })} %
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ScoreMeter({ value, max = 10 }: { value: number; max?: number }) {
  return (
    <div className="meter" title={`${value} / ${max}`}>
      <div style={{ width: `${(value / max) * 100}%` }} />
    </div>
  );
}
