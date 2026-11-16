#!/usr/bin/env node
// Survey or write the registry's latest versions for a package.json.
//
//   node latest.mjs [path/to/package.json]                 survey only
//   node latest.mjs [path/to/package.json] -w              write latest into package.json
//   node latest.mjs [path/to/package.json] -w -x a,b       write, holding back packages a and b
//
// Versions come from `npm view`, so the registry, proxy and CA settings of the
// machine's npm config apply. Only package.json is edited; the lockfile is left
// to the project's own package manager.
import { execFile } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { promisify } from 'node:util';

const run = promisify(execFile);
const args = process.argv.slice(2);
const write = args.includes('-w');
const excludeAt = args.indexOf('-x');
const exclude = excludeAt === -1 ? [] : (args[excludeAt + 1] ?? '').split(',');
const file =
  args.find(
    (a, i) => !a.startsWith('-') && (excludeAt === -1 || i !== excludeAt + 1),
  ) ?? 'package.json';
const FIELDS = ['dependencies', 'devDependencies', 'optionalDependencies'];
const CONCURRENCY = 4;
const ORDER = { major: 0, minor: 1, patch: 2 };

const source = readFileSync(file, 'utf8');
const pkg = JSON.parse(source);
const jobs = FIELDS.flatMap((field) =>
  Object.entries(pkg[field] ?? {}).flatMap(([name, range]) => {
    // Plain semver ranges only; tags, URLs, workspace: and npm: aliases are skipped.
    const match = /^(\^|~|>=|)(\d+\.\d+\.\d+\S*)$/.exec(range);

    return match
      ? [{ field, name, range, prefix: match[1], current: match[2] }]
      : [];
  }),
);
const bumpType = (from, to) => {
  const [a, b] = [from, to].map((v) => v.split('.').map((n) => parseInt(n)));

  if (a[0] !== b[0]) return 'major';

  return a[1] === b[1] ? 'patch' : 'minor';
};
const rows = [];
const failures = [];
const worker = async () => {
  for (let job = jobs.shift(); job; job = jobs.shift()) {
    try {
      const { stdout } = await run('npm', [
        'view',
        job.name,
        'dist-tags.latest',
      ]);
      const latest = stdout.trim();

      if (latest && latest !== job.current) {
        const held = exclude.includes(job.name);

        rows.push({ ...job, latest, held, type: bumpType(job.current, latest) });
        if (write && !held) pkg[job.field][job.name] = job.prefix + latest;
      }
    } catch (error) {
      failures.push(`${job.name}: ${String(error.stderr ?? error).trim()}`);
    }
  }
};

await Promise.all(Array.from({ length: CONCURRENCY }, worker));

rows.sort(
  (a, b) => ORDER[a.type] - ORDER[b.type] || a.name.localeCompare(b.name),
);
for (const row of rows) {
  console.log(
    [
      row.type.padEnd(5),
      row.name,
      `${row.range} -> ${row.prefix}${row.latest}`,
      row.held ? '(held back)' : '',
    ]
      .join('  ')
      .trimEnd(),
  );
}
if (!rows.length && !failures.length) console.log('Everything is up to date.');
if (write && rows.some((row) => !row.held)) {
  const indent = /^(\s+)"/m.exec(source)?.[1] ?? '  ';

  writeFileSync(file, `${JSON.stringify(pkg, null, indent)}\n`);
}
if (failures.length) {
  console.error(`\nCould not query ${failures.length} package(s):`);
  for (const failure of failures) console.error(`  ${failure}`);
  process.exitCode = 1;
}
