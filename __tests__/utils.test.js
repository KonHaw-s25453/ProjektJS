const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// require a fresh app instance
const app = require('../app');
const { tryParseVCV, extractModules } = app;

test('tryParseVCV handles deflated JSON buffer', () => {
  const obj = { modules: [{ plugin: 'A', model: 'X' }] };
  const buf = Buffer.from(JSON.stringify(obj), 'utf8');
  const def = zlib.deflateSync(buf);
  const parsed = tryParseVCV(def);
  expect(parsed).toBeDefined();
  expect(parsed.modules).toBeDefined();
  expect(Array.isArray(parsed.modules)).toBe(true);
  expect(parsed.modules[0].plugin).toBe('A');
});

test('tryParseVCV handles plain JSON buffer', () => {
  const obj = { plugin: 'Plain', model: 'M' };
  const buf = Buffer.from(JSON.stringify(obj), 'utf8');
  const parsed = tryParseVCV(buf);
  expect(parsed).toBeDefined();
  expect(parsed.plugin).toBe('Plain');
});

test('tryParseVCV returns null for invalid data', () => {
  const buf = Buffer.from('not json and not deflated', 'utf8');
  const parsed = tryParseVCV(buf);
  expect(parsed).toBeNull();
});

test('extractModules finds nested modules and dedupes', () => {
  const data = {
    a: { plugin: 'P1', model: 'M1' },
    arr: [ { plugin: 'P2', model: 'M2' }, { nested: { plugin: 'P1', model: 'M1' } } ]
  };
  const mods = extractModules(data);
  expect(Array.isArray(mods)).toBe(true);
  // should dedupe P1::M1
  const keys = mods.map(m => `${m.plugin}::${m.model}`);
  expect(keys).toContain('P1::M1');
  expect(keys).toContain('P2::M2');
  expect(keys.filter(k => k === 'P1::M1').length).toBe(1);
});
