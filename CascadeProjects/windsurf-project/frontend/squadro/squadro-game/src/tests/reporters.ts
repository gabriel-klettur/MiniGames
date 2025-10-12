import type { SuiteResult } from './runSuite';

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

export function toJUnitXml(result: SuiteResult, suiteName = 'SquadroRegression'): string {
  const tests = result.total;
  const failures = result.failed;
  const cases = result.details.map((d) => {
    const name = esc(d.name);
    const cls = esc(suiteName);
    const msg = d.message ? esc(d.message) : '';
    const attrs = `classname="${cls}" name="${name}" time="0"`;
    if (d.ok) return `<testcase ${attrs}/>`;
    return `<testcase ${attrs}><failure message="${msg}"></failure></testcase>`;
  }).join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>` +
    `<testsuite name="${esc(suiteName)}" tests="${tests}" failures="${failures}" time="0">` +
    cases +
    `</testsuite>`;
  return xml;
}
