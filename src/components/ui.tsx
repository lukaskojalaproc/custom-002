import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { AlertTriangle, Check, CheckCircle2, Info, X } from 'lucide-react';
import { initials } from '../lib/format';

/* ---------- Button ---------- */

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'sm' | 'md';
  icon?: ReactNode;
}

export function Button({ variant = 'primary', size = 'md', icon, children, className = '', type = 'button', ...rest }: ButtonProps) {
  return (
    <button type={type} className={`btn btn-${variant} ${size === 'sm' ? 'btn-sm' : ''} ${className}`} {...rest}>
      {icon}
      {children != null && children !== false && <span>{children}</span>}
    </button>
  );
}

export function IconButton({ label, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button type="button" className="icon-btn" aria-label={label} title={label} {...rest}>
      {children}
    </button>
  );
}

/* ---------- Card ---------- */

export function Card({
  title,
  subtitle,
  actions,
  children,
  className = '',
  flush = false,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  flush?: boolean;
}) {
  return (
    <section className={`card ${flush ? 'card-flush' : ''} ${className}`}>
      {(title || actions) && (
        <header className="card-head">
          <div>
            {title && <h3 className="card-title">{title}</h3>}
            {subtitle && <p className="card-sub">{subtitle}</p>}
          </div>
          {actions && <div className="card-actions">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

/* ---------- Badge ---------- */

export type Tone = 'green' | 'gray' | 'amber' | 'red' | 'navy' | 'blue';

export function Badge({ tone = 'gray', children, dot = false }: { tone?: Tone; children: ReactNode; dot?: boolean }) {
  return (
    <span className={`badge badge-${tone}`}>
      {dot && <span className="badge-dot" />}
      {children}
    </span>
  );
}

const TONE_MAP: Record<string, Tone> = {
  // generic
  paruošta: 'green', rengiama: 'amber', nepradėta: 'gray',
  // participation
  atrinktas: 'gray', pakviestas: 'blue', patvirtino: 'navy', atsisakė: 'red', pateikė: 'green',
  // offers
  tinkamas: 'green', tikslintinas: 'amber', atmestinas: 'red',
  pateikta: 'green', nepateikta: 'red', nepilna: 'amber', pateiktas: 'green', nepateiktas: 'red',
  pateikti: 'green', trūksta: 'red',
  // legal
  sutarta: 'green', atvira: 'amber', atmesta: 'red',
  // final
  atitinka: 'green', neatitinka: 'red', likusios: 'amber', panaikintos: 'green',
  kviesti: 'green', svarstyti: 'amber', atmesti: 'red',
  aukštas: 'green', vidutinis: 'amber', žemas: 'red',
  // tender status
  Ruošiamas: 'gray', Konkursas: 'blue', Derybos: 'amber', Sprendimas: 'navy', Užbaigtas: 'green',
  // leveling
  įtraukta: 'green', neįtraukta: 'red', išlyga: 'amber',
  Techninis: 'blue', Komercinis: 'navy', Teisinis: 'amber',
};

export function StatusBadge({ value, label }: { value: string; label?: string }) {
  const text = label ?? value.charAt(0).toUpperCase() + value.slice(1);
  return <Badge tone={TONE_MAP[value] ?? 'gray'}>{text}</Badge>;
}

/* ---------- Form ---------- */

export function Field({
  label,
  hint,
  children,
  className = '',
  required,
}: {
  label: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
  required?: boolean;
}) {
  return (
    <label className={`field ${className}`}>
      <span className="field-label">
        {label}
        {required && <span className="req"> *</span>}
      </span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

export function Input({ className = '', ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`input ${className}`} {...rest} />;
}

export function NumberInput({
  value,
  onChange,
  className = '',
  ...rest
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & { value: number | undefined; onChange: (n: number) => void }) {
  return (
    <input
      type="number"
      className={`input input-num ${className}`}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
      {...rest}
    />
  );
}

type Opt = string | { value: string; label: string };

export function Select({ options, className = '', ...rest }: SelectHTMLAttributes<HTMLSelectElement> & { options: Opt[] }) {
  return (
    <select className={`input select ${className}`} {...rest}>
      {options.map((o) => {
        const v = typeof o === 'string' ? o : o.value;
        const l = typeof o === 'string' ? o.charAt(0).toUpperCase() + o.slice(1) : o.label;
        return (
          <option key={v} value={v}>
            {l}
          </option>
        );
      })}
    </select>
  );
}

export function Textarea({ className = '', ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`input textarea ${className}`} {...rest} />;
}

export function Checkbox({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; disabled?: boolean }) {
  return (
    <label className={`checkbox ${disabled ? 'is-disabled' : ''}`}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span className="checkbox-box">{checked && <Check size={12} strokeWidth={3} />}</span>
      <span>{label}</span>
    </label>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  size?: 'sm' | 'md';
}) {
  return (
    <div className={`segmented ${size === 'sm' ? 'segmented-sm' : ''}`} role="radiogroup">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          className={value === o.value ? 'is-active' : ''}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- Tabs ---------- */

export function Tabs<T extends string>({
  items,
  value,
  onChange,
}: {
  items: { value: T; label: ReactNode; count?: number }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="tabs" role="tablist">
      {items.map((it) => (
        <button
          key={it.value}
          role="tab"
          type="button"
          aria-selected={value === it.value}
          className={`tab ${value === it.value ? 'is-active' : ''}`}
          onClick={() => onChange(it.value)}
        >
          {it.label}
          {it.count != null && <span className="tab-count">{it.count}</span>}
        </button>
      ))}
    </div>
  );
}

/* ---------- Modal ---------- */

export function Modal({
  title,
  subtitle,
  onClose,
  children,
  footer,
  width = 640,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    document.body.classList.add('no-scroll');
    return () => {
      window.removeEventListener('keydown', h);
      document.body.classList.remove('no-scroll');
    };
  }, [onClose]);
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" style={{ maxWidth: width }} role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h3>{title}</h3>
            {subtitle && <p className="muted">{subtitle}</p>}
          </div>
          <IconButton label="Uždaryti" onClick={onClose}>
            <X size={18} />
          </IconButton>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

/* ---------- Misc ---------- */

export function PageHeader({ title, subtitle, actions, eyebrow }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode; eyebrow?: ReactNode }) {
  return (
    <div className="page-head">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {subtitle && <p className="page-sub">{subtitle}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}

export function Stat({ label, value, sub, icon }: { label: string; value: ReactNode; sub?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="stat">
      <div className="stat-top">
        <span className="stat-label">{label}</span>
        {icon && <span className="stat-icon">{icon}</span>}
      </div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

export function Progress({ value, tone = 'green' }: { value: number; tone?: 'green' | 'navy' }) {
  return (
    <div className={`progress progress-${tone}`} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function Empty({ icon, title, text, action }: { icon?: ReactNode; title: string; text?: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty">
      {icon && <div className="empty-icon">{icon}</div>}
      <div className="empty-title">{title}</div>
      {text && <p className="muted">{text}</p>}
      {action && <div className="empty-action">{action}</div>}
    </div>
  );
}

export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.38 }} aria-hidden>
      {initials(name)}
    </span>
  );
}

export function Callout({ tone = 'info', title, children }: { tone?: 'info' | 'warning' | 'success'; title?: ReactNode; children?: ReactNode }) {
  const Icon = tone === 'warning' ? AlertTriangle : tone === 'success' ? CheckCircle2 : Info;
  return (
    <div className={`callout callout-${tone}`}>
      <Icon size={18} />
      <div>
        {title && <strong>{title}</strong>}
        {children && <div>{children}</div>}
      </div>
    </div>
  );
}

export function KV({ items }: { items: [ReactNode, ReactNode][] }) {
  return (
    <dl className="kv">
      {items.map(([k, v], i) => (
        <div key={i}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/* ---------- Toasts ---------- */

type ToastTone = 'success' | 'info' | 'warning';
interface ToastItem {
  id: number;
  msg: string;
  tone: ToastTone;
}

const ToastCtx = createContext<(msg: string, tone?: ToastTone) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const push = useCallback((msg: string, tone: ToastTone = 'success') => {
    const id = Date.now() + Math.random();
    setItems((x) => [...x, { id, msg, tone }]);
    window.setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), 3200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toasts" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`toast toast-${t.tone}`}>
            {t.tone === 'warning' ? <AlertTriangle size={18} /> : t.tone === 'info' ? <Info size={18} /> : <CheckCircle2 size={18} />}
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);
