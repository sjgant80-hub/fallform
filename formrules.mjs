// formrules.mjs — a form that says a question is required, and means it.
//
// ⚑ THE ASTERISK WAS DECORATION ON HALF THE FIELD TYPES. Marking a question required in the builder
// draws a red star and adds the browser's `required` attribute — for text, email, textarea and radio.
// For a phone number, a number, a date, or a set of checkboxes it added nothing at all:
//
//     a phone number rendered as a plain tel input      — no required attribute
//     a number rendered as a plain number input          — no required attribute
//     a date rendered as a plain date input              — no required attribute
//     a set of checkboxes rendered as plain checkboxes   — no required attribute
//
// So a form owner ticks "required" on the phone number, sees the star appear, publishes it, and
// collects responses with no phone number in them. Nothing warns anybody: the builder shows the rule
// and the form does not have it.
//
// ⚑ AND THE SUBMIT HANDLER CHECKED NOTHING. Whatever the browser let through was pushed straight into
// storage. The browser's own validation is a convenience for the person typing, not a rule — it is
// off in some contexts, trivially removed in others, and absent entirely when a response arrives from
// anywhere but that page. A rule the form owner set has to be checked where the response is accepted.
//
// Pure: no DOM, no storage. Fields and answers come in; a list of what is wrong comes out.

export const TYPES = ['text', 'email', 'tel', 'number', 'date', 'textarea', 'radio', 'checkbox'];

/** Has this question been answered at all? Type-aware, because "empty" differs by type. */
export function isAnswered(field, value) {
  const f = (field && typeof field === 'object') ? field : {};
  if (f.type === 'checkbox') return Array.isArray(value) && value.length > 0;
  if (value === undefined || value === null) return false;
  if (Array.isArray(value)) return value.length > 0;
  return String(value).trim() !== '';
}

/**
 * Is the answer the right shape for the question?
 *
 * Deliberately loose on email — guessing at exotic-but-valid addresses turns real people away. Strict
 * on number and date, because those are asked for when something is going to be counted or diarised.
 */
export function isWellFormed(field, value) {
  const f = (field && typeof field === 'object') ? field : {};
  if (!isAnswered(f, value)) return true;          // absence is the required rule's business, not this one
  const s = Array.isArray(value) ? '' : String(value).trim();

  if (f.type === 'email') return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s) && s.length <= 254;
  if (f.type === 'number') return /^-?\d+(\.\d+)?$/.test(s.replace(/,/g, ''));
  if (f.type === 'date') {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    if (!m) return false;
    const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    // ⚑ 31 April is a typo, not a date. Rolling it to 1 May files somebody's answer under a day they
    // did not choose.
    return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
  }
  if (f.type === 'tel') return /[\d]/.test(s) && s.replace(/[^\d]/g, '').length >= 6;

  // ⚑ An answer to a multiple-choice question has to be one of the choices. Without this, a response
  // arriving from anywhere but the page can carry any string at all and it lands in the results as
  // though somebody had picked it.
  if (f.type === 'radio') return !Array.isArray(f.options) || f.options.length === 0 || f.options.includes(s);
  if (f.type === 'checkbox') {
    if (!Array.isArray(f.options) || !f.options.length) return true;
    return (Array.isArray(value) ? value : []).every(v => f.options.includes(String(v)));
  }
  return true;
}

function labelOf(field, index) {
  const f = (field && typeof field === 'object') ? field : {};
  const l = typeof f.label === 'string' ? f.label.trim() : '';
  return l || `question ${index + 1}`;
}

/**
 * ⚑ THE CHECK THE FORM ACTUALLY HAS, rather than the one it drew.
 *
 * Every problem at once, each naming the question by its label — a person told "something is missing"
 * on a twenty-question form will guess, and guess wrong.
 */
export function validate(fields, answers, opts) {
  const list = (Array.isArray(fields) ? fields : []).filter(f => f && typeof f === 'object');
  const data = (answers && typeof answers === 'object') ? answers : {};
  const o = (opts && typeof opts === 'object') ? opts : {};
  const problems = [];

  list.forEach((f, i) => {
    const id = f.id == null ? '' : String(f.id);
    const value = id ? data[id] : undefined;
    const label = labelOf(f, i);

    if (f.required === true && !isAnswered(f, value)) {
      problems.push({ fieldId: id, label, kind: 'missing', message: `${label} is required` });
      return;                                   // one complaint per question, not two
    }
    if (!isWellFormed(f, value)) {
      problems.push({ fieldId: id, label, kind: 'malformed', message: `${label} is not a valid ${f.type || 'answer'}` });
    }
  });

  // ⚑ An answer to a question that is not on the form. Silently keeping it lets a response carry
  // fields the owner never asked for; silently dropping it loses data somebody typed. It is reported,
  // and the caller decides.
  const known = new Set(list.map(f => String(f.id)));
  const unexpected = Object.keys(data).filter(k => !known.has(k));

  return { ok: problems.length === 0, problems, unexpected, checked: list.length };
}

/**
 * The answers, keyed by field, with nothing that was not asked for.
 *
 * Returns null when the response does not pass, so a caller cannot store an invalid one by reaching
 * past the check — the same reason addBooking returns a list rather than a boolean.
 */
export function accept(fields, answers, opts) {
  const result = validate(fields, answers, opts);
  if (!result.ok) return { ok: false, problems: result.problems, unexpected: result.unexpected, data: null };

  const list = (Array.isArray(fields) ? fields : []).filter(f => f && typeof f === 'object');
  const src = (answers && typeof answers === 'object') ? answers : {};
  const data = {};
  for (const f of list) {
    const id = f.id == null ? '' : String(f.id);
    if (!id) continue;
    const v = src[id];
    data[id] = f.type === 'checkbox'
      ? (Array.isArray(v) ? v.map(String) : [])
      : (v === undefined || v === null ? '' : String(v).trim());
  }
  return { ok: true, problems: [], unexpected: result.unexpected, data };
}

/**
 * ⚑ WHICH FIELD TYPES CAN ACTUALLY HOLD A RULE THE BUILDER OFFERS.
 *
 * This exists so the fault that started this file cannot come back quietly: the builder must not offer
 * "required" on a type the form will not enforce. Every type here is enforced by validate(), so the
 * answer is all of them — and a test asserts it, which is what stops the next field type being added
 * with a star and no rule.
 */
export function enforcesRequired(type) {
  return TYPES.includes(type);
}

export default { TYPES, isAnswered, isWellFormed, validate, accept, enforcesRequired };
