// formrules.test.mjs — PROOF-OF-PLAY for a form that means what its asterisk says.
import { TYPES, isAnswered, isWellFormed, validate, accept, enforcesRequired } from './formrules.mjs';

let pass = 0, fail = 0;
const ok = (c, m) => { c ? pass++ : fail++; console.log((c ? '  ✓ ' : '  ✗ FAIL ') + m); };
const F = (type, extra = {}) => ({ id: 'q1', type, label: `Your ${type}`, required: true, ...extra });

console.log('\n=== §1 · ⚑ REQUIRED MEANS REQUIRED, ON EVERY TYPE ===');
{
  // The four the form drew a star on and never enforced.
  for (const type of ['tel', 'number', 'date', 'checkbox']) {
    const r = validate([F(type)], {});
    ok(r.ok === false && r.problems[0].kind === 'missing',
       `⚑ a required ${type} left empty is a FAULT — the builder drew the star and the form asked for nothing`);
  }
  // And the four it did enforce, so the fix does not quietly drop them.
  for (const type of ['text', 'email', 'textarea', 'radio']) {
    ok(validate([F(type)], {}).ok === false, `a required ${type} is still enforced`);
  }
  ok(TYPES.every(enforcesRequired),
     '⚑ EVERY type the builder offers can hold the rule — this is the assertion that stops the next field type shipping with a star and no rule');
}

console.log('\n=== §2 · what "empty" means differs by type ===');
{
  ok(isAnswered(F('checkbox'), []) === false, '⚑ an empty checkbox LIST is unanswered — it is not a blank string, so a naive check misses it');
  ok(isAnswered(F('checkbox'), ['a']) === true, 'and a ticked one is answered');
  ok(isAnswered(F('text'), '   ') === false, 'whitespace is not an answer');
  ok(isAnswered(F('text'), '0') === true && isAnswered(F('number'), 0) === true,
     '⚑ but ZERO is an answer — somebody typed it on purpose, and treating it as empty loses a real reply');
  ok(isAnswered(F('text'), undefined) === false && isAnswered(F('text'), null) === false, 'absent is absent');
  ok(validate([F('number')], { q1: 0 }).ok === true, 'so a required number answered with zero passes');
}

console.log('\n=== §3 · the right shape, not just present ===');
{
  ok(validate([F('email')], { q1: 'not-an-email' }).problems[0].kind === 'malformed', 'an email that is not one is caught');
  ok(validate([F('email')], { q1: 'a+tag@b.co.uk' }).ok === true, '⚑ a +tag address is REAL — rejecting it turns a person away');
  ok(validate([F('number')], { q1: 'abc' }).ok === false, 'a number that is not one is caught');
  ok(validate([F('number')], { q1: '1,000' }).ok === true, 'and a typed thousand is still a number');
  ok(validate([F('number')], { q1: '-4.5' }).ok === true, 'negatives and decimals are numbers');
  ok(validate([F('date')], { q1: '2026-04-31' }).ok === false,
     '⚑ 31 April is REFUSED, not rolled to 1 May — filing an answer under a day nobody chose is worse than rejecting it');
  ok(validate([F('date')], { q1: '2024-02-29' }).ok === true, 'a real leap day is fine');
  ok(validate([F('date')], { q1: '31/04/2026' }).ok === false, 'and the format is not a suggestion');
  ok(validate([F('tel')], { q1: 'call me' }).ok === false, 'a phone number needs digits');
  ok(validate([F('tel')], { q1: '+44 7700 900123' }).ok === true, 'and a real one survives its spaces and plus sign');
}

console.log('\n=== §4 · ⚑ AN ANSWER MUST BE ONE OF THE CHOICES ===');
{
  const radio = F('radio', { options: ['Yes', 'No'] });
  ok(validate([radio], { q1: 'Maybe' }).ok === false,
     '⚑ a radio answer that is not one of the options is refused — without this a response from anywhere but the page can carry any string and it lands in the results as though somebody picked it');
  ok(validate([radio], { q1: 'Yes' }).ok === true, 'a real choice passes');
  const check = F('checkbox', { options: ['A', 'B'] });
  ok(validate([check], { q1: ['A', 'Z'] }).ok === false, 'and one bad value spoils a checkbox set');
  ok(validate([check], { q1: ['A', 'B'] }).ok === true, 'while every value being real passes');
  ok(validate([F('radio', { options: [] })], { q1: 'anything' }).ok === true, 'a question with no options set cannot judge an answer');
}

console.log('\n=== §5 · every problem at once, named ===');
{
  const fields = [
    { id: 'a', type: 'text', label: 'Your name', required: true },
    { id: 'b', type: 'email', label: 'Email address', required: true },
    { id: 'c', type: 'tel', label: 'Phone', required: true },
    { id: 'd', type: 'number', label: 'How many?', required: false },
  ];
  const r = validate(fields, { b: 'nope', d: 'lots' });
  ok(r.problems.length === 4, 'four questions are wrong and four are reported');
  ok(r.problems.some(p => p.label === 'Your name' && p.kind === 'missing'), 'the missing name, by its label');
  ok(r.problems.some(p => p.label === 'Email address' && p.kind === 'malformed'), 'the bad email');
  ok(r.problems.some(p => p.label === 'Phone' && p.kind === 'missing'), 'the missing phone');
  ok(r.problems.some(p => p.label === 'How many?' && p.kind === 'malformed'),
     '⚑ and the OPTIONAL number answered with "lots" — optional means you need not answer, not that any answer will do');
  ok(r.problems.every(p => /required|not a valid/.test(p.message)), 'each with a sentence a person can act on');
  ok(r.problems.filter(p => p.fieldId === 'a').length === 1,
     '⚑ one complaint per question — telling somebody a field is both missing and malformed is telling them nothing');
  ok(validate([{ id: 'x', type: 'text', required: true }], {}).problems[0].label === 'question 1',
     'and a question with no label is still identified by its position');
}

console.log('\n=== §6 · ⚑ NOTHING IS STORED THAT DID NOT PASS ===');
{
  const fields = [{ id: 'a', type: 'text', label: 'Name', required: true }];
  const bad = accept(fields, {});
  ok(bad.ok === false && bad.data === null,
     '⚑ a failed response yields NO data — a caller cannot reach past the check and store it anyway');
  const good = accept(fields, { a: '  Sam  ' });
  ok(good.ok === true && good.data.a === 'Sam', 'a good one comes back trimmed');
  ok(accept([{ id: 'c', type: 'checkbox', options: ['A'] }], { c: ['A'] }).data.c.length === 1, 'a checkbox answer stays a list');
  ok(Array.isArray(accept([{ id: 'c', type: 'checkbox' }], {}).data.c), '⚑ and an unticked checkbox is an empty LIST, not an empty string — the shape a reader will loop over');
  ok(accept([{ id: 'a', type: 'text' }], {}).data.a === '', 'an unanswered optional question is empty, not missing from the record');
}

console.log('\n=== §7 · an answer to a question nobody asked ===');
{
  const r = validate([{ id: 'a', type: 'text' }], { a: 'x', rogue: 'y' });
  ok(r.unexpected.length === 1 && r.unexpected[0] === 'rogue',
     '⚑ an answer to a field that is not on the form is REPORTED — silently keeping it stores questions the owner never asked, and silently dropping it loses what somebody typed');
  ok(r.ok === true, 'though it does not by itself make the response invalid — that is the caller\'s call');
  ok(accept([{ id: 'a', type: 'text' }], { a: 'x', rogue: 'y' }).data.rogue === undefined, 'and the stored record carries only the real questions');
}

console.log('\n=== §8 · pure under garbage ===');
{
  const junk = [null, undefined, '', 0, [], {}, NaN, 'x', [null], [{ id: 1 }], { q1: {} }];
  let threw = null;
  for (const j of junk) {
    try { isAnswered(j, j); isWellFormed(j, j); validate(j, j); accept(j, j); enforcesRequired(j); } catch (e) { threw = `${JSON.stringify(j)} → ${e.message}`; }
  }
  ok(threw === null, 'no input throws' + (threw ? ' — ' + threw : ''));
  ok(validate([], {}).ok === true && validate([], {}).checked === 0, 'a form with no questions cannot be failed');
  ok(validate([null, 'x', { id: 'a', type: 'text', required: true }], {}).problems.length === 1, 'rubbish among the fields is skipped, not validated');
  ok(enforcesRequired('sparkle') === false, 'and a type nobody has implemented does not claim to hold a rule');
}

console.log('\n=== §9 · the exact edges ===');
{
  ok(isWellFormed(F('tel'), '012345') === true,
     '⚑ a six-digit phone number is accepted — the shortest real ones are that long, and a rule set one digit too high turns real people away');
  ok(isWellFormed(F('tel'), '01234') === false, 'and five digits is not a phone number');

  const long = 'a'.repeat(254 - '@example.com'.length) + '@example.com';
  ok(long.length === 254 && isWellFormed(F('email'), long) === true, 'an address of exactly 254 characters is deliverable and accepted');
  ok(isWellFormed(F('email'), long + 'a') === false, 'and one character more is not');

  ok(isAnswered(F('text'), []) === false,
     '⚑ an EMPTY array is unanswered whatever the field type — a checkbox is not the only way a list arrives');
  ok(isAnswered(F('text'), ['x']) === true, 'and a list with something in it is an answer');
}

console.log('\n=== §10 · a question with no choices set ===');
{
  const bare = { id: 'q1', type: 'checkbox', label: 'Pick', required: false };
  ok(isWellFormed(bare, ['anything']) === true,
     '⚑ a checkbox question with no options configured cannot judge an answer, so it accepts one — refusing every answer to a half-built question would block a form the owner is still writing');
  ok(isWellFormed({ ...bare, options: [] }, ['anything']) === true, 'an empty option list is the same case');
  ok(isWellFormed({ ...bare, options: ['A'] }, ['anything']) === false, 'but once there are choices, an answer must be one of them');
  ok(isWellFormed({ id: 'q1', type: 'radio' }, 'anything') === true, 'and the same for a radio question');
}

console.log('\n=== §11 · the message when the type is missing ===');
{
  const r = validate([{ id: 'q1', label: 'Mystery', required: false }], { q1: [] });
  ok(r.ok === true, 'a field with no type and an empty list is simply unanswered');
  const bad = validate([{ id: 'q1', type: 'email', label: 'Email' }], { q1: 'nope' });
  ok(/not a valid email/.test(bad.problems[0].message),
     '⚑ the message names the TYPE that was expected — "not valid" alone tells nobody what to change');
}

console.log(`\n${fail === 0 ? '✓ ALL PASS' : '✗ FAILURES'} — ${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
