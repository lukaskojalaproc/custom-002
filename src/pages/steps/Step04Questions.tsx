import { useState } from 'react';
import { MessageSquarePlus, Send } from 'lucide-react';
import { Button, Checkbox, Empty, Field, Input, Modal, Segmented, Select, StatusBadge, Tabs, Textarea, useToast } from '../../components/ui';
import { QA_TOPICS, RELATED_DOCS } from '../../lib/constants';
import { daysBetween, fmtDateShort, isoDate, uid } from '../../lib/format';
import { logActivity, useContractors } from '../../lib/store';
import type { Question, QuestionCategory, Tender } from '../../lib/types';
import { MiniStat, StepShell, useTenderUpdate, type StepProps } from './shared';

const CATS: QuestionCategory[] = ['Techninis', 'Komercinis', 'Teisinis'];

function QuestionModal({ t, question, onClose }: { t: Tender; question?: Question; onClose: () => void }) {
  const update = useTenderUpdate(t);
  const cs = useContractors();
  const toast = useToast();
  const askers = t.participants.filter((p) => p.status !== 'atsisakė');
  const [q, setQ] = useState<Question>(
    () =>
      question ?? {
        id: uid('q'),
        contractorId: askers[0]?.contractorId ?? '',
        askedAt: isoDate(),
        category: 'Techninis',
        topic: QA_TOPICS[0],
        text: '',
        relatedDoc: RELATED_DOCS[0],
        sentToAll: true,
      },
  );
  const set = <K extends keyof Question>(k: K, v: Question[K]) => setQ((x) => ({ ...x, [k]: v }));
  const valid = q.text.trim().length > 3 && !!q.contractorId;

  const save = () => {
    const answered = !!q.answer?.trim();
    const next: Question = {
      ...q,
      answer: answered ? q.answer : undefined,
      answeredAt: answered ? q.answeredAt ?? isoDate() : undefined,
    };
    update((d) => {
      const i = d.questions.findIndex((x) => x.id === q.id);
      if (i >= 0) d.questions[i] = next;
      else d.questions.push(next);
      if (answered && !question?.answer) logActivity(d, `Atsakyta į ${cs[q.contractorId]?.name} klausimą`);
      if (!question) logActivity(d, `Užregistruotas ${cs[q.contractorId]?.name} klausimas`);
    });
    toast(question ? 'Klausimas atnaujintas' : 'Klausimas užregistruotas');
    onClose();
  };

  return (
    <Modal
      title={question ? 'Klausimas ir atsakymas' : 'Registruoti rangovo klausimą'}
      onClose={onClose}
      width={720}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Atšaukti
          </Button>
          <Button disabled={!valid} onClick={save}>
            Išsaugoti
          </Button>
        </>
      }
    >
      <div className="grid-2">
        <Field label="Klausimą pateikęs rangovas">
          <Select
            options={askers.map((p) => ({ value: p.contractorId, label: cs[p.contractorId]?.name ?? p.contractorId }))}
            value={q.contractorId}
            onChange={(e) => set('contractorId', e.target.value)}
          />
        </Field>
        <Field label="Klausimo data">
          <Input type="date" value={q.askedAt} onChange={(e) => set('askedAt', e.target.value)} />
        </Field>
        <div className="field">
          <span className="field-label">Kategorija</span>
          <Segmented options={CATS.map((c) => ({ value: c, label: c }))} value={q.category} onChange={(v) => set('category', v)} />
        </div>
        <Field label="Tema">
          <Select options={QA_TOPICS} value={q.topic} onChange={(e) => set('topic', e.target.value)} />
        </Field>
        <Field label="Klausimo tekstas" className="span-2">
          <Textarea rows={3} value={q.text} onChange={(e) => set('text', e.target.value)} />
        </Field>
        <Field label="Susijęs dokumentas">
          <Select options={RELATED_DOCS} value={q.relatedDoc} onChange={(e) => set('relatedDoc', e.target.value)} />
        </Field>
        <div />
        <Field label="Užsakovo / pirkimų atsakymas" className="span-2" hint="Atsakymas koordinuojamas su užsakovu, projektuotojais ir techniniais konsultantais.">
          <Textarea rows={3} value={q.answer ?? ''} onChange={(e) => set('answer', e.target.value)} placeholder="Įrašykite atsakymą…" />
        </Field>
        <div className="span-2">
          <Checkbox
            checked={q.sentToAll}
            onChange={(v) => set('sentToAll', v)}
            label="Siųsti atsakymą visiems konkurso dalyviams (vienodos konkurso sąlygos)"
          />
        </div>
      </div>
    </Modal>
  );
}

export function Step04({ t }: StepProps) {
  const update = useTenderUpdate(t);
  const cs = useContractors();
  const toast = useToast();
  const [cat, setCat] = useState<'all' | QuestionCategory>('all');
  const [openOnly, setOpenOnly] = useState(false);
  const [editing, setEditing] = useState<Question | 'new' | null>(null);
  const sent = !!t.invitation.sentAt;

  const unanswered = t.questions.filter((q) => !q.answer).length;
  const pendingBroadcast = t.questions.filter((q) => q.answer && !q.sentToAll).length;
  const daysLeft = daysBetween(isoDate(), t.invitation.questionsDeadline);
  const list = t.questions
    .filter((q) => cat === 'all' || q.category === cat)
    .filter((q) => !openOnly || !q.answer)
    .sort((a, b) => (a.askedAt < b.askedAt ? 1 : -1));

  const broadcast = () => {
    update((d) => {
      d.questions.forEach((q) => {
        if (q.answer) q.sentToAll = true;
      });
      logActivity(d, 'K&A lentelė išsiųsta visiems dalyviams');
    });
    toast(`K&A lentelė išsiųsta ${t.participants.filter((p) => p.status !== 'atsisakė').length} dalyviams`);
  };

  const blocker = !sent ? 'Pirmiausia išsiųskite kvietimą (3 etapas)' : unanswered ? `Liko neatsakytų klausimų: ${unanswered}` : null;

  return (
    <StepShell
      t={t}
      n={4}
      blocker={blocker}
      actions={
        <>
          <Button size="sm" variant="secondary" icon={<Send size={15} />} disabled={!t.questions.some((q) => q.answer)} onClick={broadcast}>
            Siųsti K&A visiems
          </Button>
          <Button size="sm" icon={<MessageSquarePlus size={15} />} disabled={!sent} onClick={() => setEditing('new')}>
            Registruoti klausimą
          </Button>
        </>
      }
    >
      <div className="mini-stats">
        <MiniStat label="Klausimų" value={t.questions.length} />
        <MiniStat label="Neatsakyta" value={unanswered} />
        <MiniStat label="Laukia išsiuntimo visiems" value={pendingBroadcast} />
        <MiniStat
          label="Klausimų terminas"
          value={daysLeft > 0 ? `po ${daysLeft} d.` : daysLeft === 0 ? 'Šiandien' : 'Pasibaigė'}
        />
      </div>

      <div>
        <div className="row between wrap gap">
          <Tabs
            value={cat}
            onChange={setCat}
            items={[
              { value: 'all', label: 'Visi', count: t.questions.length },
              ...CATS.map((c) => ({ value: c, label: c, count: t.questions.filter((q) => q.category === c).length })),
            ]}
          />
          <Checkbox label="Tik neatsakyti" checked={openOnly} onChange={setOpenOnly} />
        </div>
        {list.length === 0 ? (
          <div className="panel panel-soft">
            <Empty title="Klausimų nėra" text={sent ? 'Užregistruokite rangovų klausimus, kai jie bus gauti.' : 'Klausimai priimami išsiuntus kvietimą.'} />
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Rangovas / data</th>
                  <th>Kategorija</th>
                  <th>Klausimas</th>
                  <th>Atsakymas</th>
                </tr>
              </thead>
              <tbody>
                {list.map((q) => (
                  <tr key={q.id} className="is-click" onClick={() => setEditing(q)}>
                    <td style={{ minWidth: 150 }}>
                      <div className="cell-title">{cs[q.contractorId]?.name}</div>
                      <div className="cell-sub">{fmtDateShort(q.askedAt)}</div>
                    </td>
                    <td>
                      <StatusBadge value={q.category} />
                    </td>
                    <td style={{ minWidth: 240 }}>
                      <div className="cell-sub">
                        {q.topic} · {q.relatedDoc}
                      </div>
                      <div>{q.text}</div>
                    </td>
                    <td style={{ minWidth: 240 }}>
                      {q.answer ? (
                        <>
                          <div>{q.answer}</div>
                          <div className="row gap wrap mt-sm">
                            <span className="cell-sub">Atsakyta {fmtDateShort(q.answeredAt)}</span>
                            {q.sentToAll ? <span className="chip chip-ok">Išsiųsta visiems</span> : <span className="chip">Tik klausėjui</span>}
                          </div>
                        </>
                      ) : (
                        <span className="chip chip-warn">Laukia atsakymo</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {editing && <QuestionModal t={t} question={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}
    </StepShell>
  );
}
