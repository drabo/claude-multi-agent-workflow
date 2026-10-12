const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const hook = path.resolve(__dirname, '../../hooks/block-secret-files.sh');
const run = (input) => spawnSync(hook, { input, encoding: 'utf8' });
const withPath = (p) => run(JSON.stringify({ tool_input: { file_path: p } }));
const withNotebook = (p) => run(JSON.stringify({ tool_input: { notebook_path: p } }));
const withCommand = (c) => run(JSON.stringify({ tool_input: { command: c } }));

const blocked = [
  '.env', '/app/.env', '/app/.env.local', '/app/.env.production', '/app/.ENV',
  'server.pem', '/etc/ssl/private/site.pem', 'tls.key', 'Key.PEM',
  '/home/u/.ssh/id_rsa', '/home/u/.ssh/id_ed25519', '/home/u/.ssh/id_ecdsa',
  '/home/u/.aws/credentials', '/app/credentials.json', '/app/secrets.json',
  'cert.p12', 'cert.pfx', 'store.jks', 'prod.tfvars', 'terraform.tfstate',
  'terraform.tfstate.backup', '/home/u/.npmrc', '/home/u/.netrc', '/home/u/.pgpass',
  'admin.kubeconfig',
];
const allowed = [
  'server.js', '/app/routes/users.js', '/app/environment.md', '/app/my.env.js',
  '/app/id_rsa.pub', '/app/credentials.md', '/app/keyboard.txt', '/app/.envrc',
];

for (const p of blocked) {
  test(`blocks ${p}`, () => {
    const r = withPath(p);
    assert.equal(r.status, 2);
    assert.match(r.stderr, /Blocked/);
  });
}

for (const p of allowed) {
  test(`allows ${p}`, () => {
    assert.equal(withPath(p).status, 0);
  });
}

test('blocks notebook_path secrets', () => {
  assert.equal(withNotebook('/app/prod.tfvars').status, 2);
});

for (const c of [
  'echo X=1 > .env',
  'cp a /home/u/.ssh/id_rsa',
  'echo hi | tee "secrets.json"',
  'cat ./server.pem && ls',
  'FOO=bar tee .env.local',
]) {
  test(`blocks bash: ${c}`, () => {
    const r = withCommand(c);
    assert.equal(r.status, 2);
    assert.match(r.stderr, /Blocked/);
  });
}

for (const c of ['ls -la', 'npm test', 'cat id_rsa.pub', 'echo hi > out.txt']) {
  test(`allows bash: ${c}`, () => {
    assert.equal(withCommand(c).status, 0);
  });
}

test('allows when file_path missing', () => {
  assert.equal(run(JSON.stringify({ tool_input: {} })).status, 0);
});

test('allows when tool_input missing', () => {
  assert.equal(run('{}').status, 0);
});

test('fails closed (exit 2) on invalid JSON', () => {
  const r = run('not json');
  assert.equal(r.status, 2);
  assert.match(r.stderr, /malformed JSON/);
});

test('fails closed (exit 2) when jq is missing', () => {
  const r = spawnSync('/bin/bash', [hook], {
    input: '{}',
    encoding: 'utf8',
    env: { PATH: '/nonexistent' },
  });
  assert.equal(r.status, 2);
  assert.match(r.stderr, /jq is required/);
});
