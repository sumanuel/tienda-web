#!/usr/bin/env node
/**
 * Arranque de desarrollo de T-Suma con UN solo comando y UNA sola terminal:
 *
 *   npm run dev          levanta API (4000) + web (3000)
 *   npm run dev:stop     detiene lo que haya quedado de este proyecto
 *   npm run dev:restart  detiene y vuelve a levantar
 *
 * Qué resuelve respecto a los scripts anteriores:
 * - Todo vive bajo este proceso: Ctrl+C (o cerrar la terminal) detiene la API y
 *   la web con todos sus procesos hijos (tsx watch y los workers de Next).
 * - Si un proceso cae, el otro se detiene también: no queda una mitad viva.
 * - Antes de arrancar revisa los puertos. Si los ocupa un resto de ESTE
 *   proyecto lo cierra (con su proceso padre, para que no reaparezca); si los
 *   ocupa otro programa, no lo toca y avisa cuál es.
 *
 * Solo usa Node; no agrega dependencias.
 */
import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BACKEND = path.join(ROOT, 'backend');
const IS_WIN = process.platform === 'win32';

const WEB_PORT = Number(process.env.WEB_PORT || 3000);
const API_PORT = Number(process.env.API_PORT || 4000);

const color = (code, text) =>
  process.stdout.isTTY ? `\x1b[${code}m${text}\x1b[0m` : text;
const info = (text) => console.log(`${color(36, '[dev]')} ${text}`);
const warn = (text) => console.log(`${color(33, '[dev]')} ${text}`);
const fail = (text) => console.error(`${color(31, '[dev]')} ${text}`);

// ---------------------------------------------------------------------------
// Procesos del sistema
// ---------------------------------------------------------------------------

/** Tabla de procesos: [{ pid, ppid, name, cmd }] */
function processTable() {
  try {
    if (IS_WIN) {
      const result = spawnSync(
        'powershell',
        [
          '-NoProfile',
          '-Command',
          'Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId,Name,CommandLine | ConvertTo-Json -Compress',
        ],
        { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, windowsHide: true }
      );
      const parsed = JSON.parse(result.stdout || '[]');
      return (Array.isArray(parsed) ? parsed : [parsed]).map((p) => ({
        pid: p.ProcessId,
        ppid: p.ParentProcessId,
        name: p.Name || '',
        cmd: p.CommandLine || '',
      }));
    }
    const result = spawnSync('ps', ['-eo', 'pid=,ppid=,comm=,args='], {
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    });
    return result.stdout
      .split('\n')
      .map((line) => line.trim().match(/^(\d+)\s+(\d+)\s+(\S+)\s*(.*)$/))
      .filter(Boolean)
      .map((m) => ({ pid: +m[1], ppid: +m[2], name: m[3], cmd: m[4] }));
  } catch {
    return [];
  }
}

/** PIDs que escuchan en un puerto TCP */
function listeningPids(port) {
  const pids = new Set();
  try {
    if (IS_WIN) {
      const out = spawnSync('netstat', ['-ano', '-p', 'tcp'], {
        encoding: 'utf8',
      }).stdout;
      for (const line of out.split('\n')) {
        const m = line.match(/^\s*TCP\s+\S+:(\d+)\s+\S+\s+LISTENING\s+(\d+)/i);
        if (m && Number(m[1]) === port) pids.add(Number(m[2]));
      }
    } else {
      const out = spawnSync('lsof', ['-ti', `tcp:${port}`, '-sTCP:LISTEN'], {
        encoding: 'utf8',
      }).stdout;
      for (const pid of out.split('\n').filter(Boolean)) pids.add(Number(pid));
    }
  } catch {
    // sin netstat/lsof no se puede saber: se asume libre y el arranque fallará con EADDRINUSE
  }
  pids.delete(0);
  return [...pids];
}

const normalize = (text) => {
  let value = text;
  try {
    value = decodeURIComponent(value); // file:///D:/Mis%20proyectos/...
  } catch {
    // texto con % suelto: se compara tal cual
  }
  return value.replace(/\\/g, '/').toLowerCase();
};
const ROOT_KEY = normalize(ROOT);

/** ¿Es un proceso lanzado desde esta carpeta del proyecto? */
const belongsToProject = (proc) => normalize(proc.cmd).includes(ROOT_KEY);

/** Procesos de desarrollo del proyecto: servidor de Next o API con tsx */
const isDevRunner = (proc) =>
  belongsToProject(proc) &&
  /node(\.exe)?$/i.test(proc.name) &&
  /\/next\/dist\/|next-server|\/tsx\/dist\/|src\/server\.ts/i.test(
    normalize(proc.cmd)
  );

/** Antepasado más alto que siga siendo del proyecto (p. ej. el `tsx watch` que reinicia a su hijo) */
function topProjectAncestor(pid, byPid, protectedPids) {
  let current = pid;
  for (;;) {
    const parent = byPid.get(byPid.get(current)?.ppid);
    if (!parent || protectedPids.has(parent.pid) || !belongsToProject(parent))
      return current;
    current = parent.pid;
  }
}

/** Este proceso y sus antepasados (npm, la terminal) no se tocan nunca */
function selfAndAncestors(byPid) {
  const set = new Set();
  let current = process.pid;
  while (current && !set.has(current)) {
    set.add(current);
    current = byPid.get(current)?.ppid;
  }
  return set;
}

function killTree(pid) {
  try {
    if (IS_WIN) {
      spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], {
        windowsHide: true,
        stdio: 'ignore',
      });
    } else {
      try {
        process.kill(-pid, 'SIGKILL'); // grupo de procesos
      } catch {
        process.kill(pid, 'SIGKILL');
      }
    }
  } catch {
    // ya había terminado
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitUntilFree(port, timeoutMs = 6000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (listeningPids(port).length === 0) return true;
    await sleep(250);
  }
  return false;
}

/**
 * Libera los puertos del proyecto. Cierra los restos de este proyecto (y su
 * proceso padre) y devuelve los puertos que ocupa OTRO programa.
 */
async function freePorts(ports, { label = 'resto' } = {}) {
  const table = processTable();
  const byPid = new Map(table.map((p) => [p.pid, p]));
  const protectedPids = selfAndAncestors(byPid);
  const foreign = [];
  const targets = new Set();

  // Restos de desarrollo de este proyecto, ocupen o no un puerto: un
  // `tsx watch` huérfano volvería a levantar el servidor apenas se cierre su hijo
  for (const proc of table) {
    if (!protectedPids.has(proc.pid) && isDevRunner(proc)) {
      targets.add(topProjectAncestor(proc.pid, byPid, protectedPids));
    }
  }

  for (const port of ports) {
    for (const pid of listeningPids(port)) {
      const proc = byPid.get(pid);
      if (protectedPids.has(pid)) continue;
      if (proc && belongsToProject(proc)) {
        targets.add(topProjectAncestor(pid, byPid, protectedPids));
      } else {
        foreign.push({
          port,
          pid,
          name: proc?.name || '(desconocido)',
          cmd: proc?.cmd || '',
        });
      }
    }
  }

  for (const pid of targets) {
    const proc = byPid.get(pid);
    warn(
      `Cerrando ${label} del proyecto: ${proc?.name || 'proceso'} (PID ${pid})`
    );
    killTree(pid);
  }
  if (targets.size > 0) {
    for (const port of ports) {
      if (!foreign.some((f) => f.port === port)) await waitUntilFree(port);
    }
  }
  return foreign;
}

// ---------------------------------------------------------------------------
// Modos stop / start
// ---------------------------------------------------------------------------

async function stopAll() {
  const foreign = await freePorts([WEB_PORT, API_PORT]);
  for (const f of foreign) {
    warn(
      `Puerto ${f.port} ocupado por otro programa (${f.name}, PID ${f.pid}); no se toca.`
    );
  }
  const stillBusy = [WEB_PORT, API_PORT].filter(
    (p) => listeningPids(p).length > 0
  );
  if (stillBusy.length === 0) info('Proyecto detenido: puertos libres.');
  return foreign.length === 0;
}

function pipeWithPrefix(stream, prefix, target) {
  let pending = '';
  stream.on('data', (chunk) => {
    pending += chunk.toString();
    const lines = pending.split(/\r?\n/);
    pending = lines.pop() ?? '';
    for (const line of lines)
      if (line.trim()) target.write(`${prefix} ${line}\n`);
  });
  stream.on('end', () => {
    if (pending.trim()) target.write(`${prefix} ${pending}\n`);
  });
}

function ping(url) {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout: 1500 }, (res) => {
      res.resume();
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function startAll() {
  const tsxCli = path.join(BACKEND, 'node_modules', 'tsx', 'dist', 'cli.mjs');
  const nextCli = path.join(
    ROOT,
    'node_modules',
    'next',
    'dist',
    'bin',
    'next'
  );
  for (const [file, hint] of [
    [tsxCli, 'cd backend && npm install'],
    [nextCli, 'npm install'],
  ]) {
    if (!existsSync(file)) {
      fail(
        `Faltan dependencias (${path.relative(ROOT, file)}). Ejecuta: ${hint}`
      );
      process.exit(1);
    }
  }

  const foreign = await freePorts([WEB_PORT, API_PORT], {
    label: 'resto de una ejecución anterior',
  });
  if (foreign.length > 0) {
    for (const f of foreign) {
      fail(
        `El puerto ${f.port} lo ocupa otro programa: ${f.name} (PID ${f.pid}).`
      );
      if (f.cmd) fail(`  ${f.cmd.slice(0, 160)}`);
    }
    fail('Ciérralo, o usa otros puertos. En PowerShell:');
    fail('  $env:WEB_PORT=3100; $env:API_PORT=4100; npm run dev');
    process.exit(1);
  }

  // Se pasan los puertos explícitamente: PORT en el entorno no debe mezclar la web con la API
  const apiEnv = {
    ...process.env,
    PORT: String(API_PORT),
    FORCE_COLOR: '1',
    ...(process.env.WEB_PORT && !process.env.FRONTEND_URL
      ? { FRONTEND_URL: `http://localhost:${WEB_PORT}` }
      : {}),
  };
  const webEnv = {
    ...process.env,
    PORT: String(WEB_PORT),
    FORCE_COLOR: '1',
    API_PROXY_TARGET:
      process.env.API_PROXY_TARGET || `http://127.0.0.1:${API_PORT}`,
  };

  // En POSIX cada servicio va en su propio grupo para poder cerrarlo completo
  const spawnOptions = {
    windowsHide: true,
    detached: !IS_WIN,
    stdio: ['ignore', 'pipe', 'pipe'],
  };
  const api = spawn(
    process.execPath,
    [tsxCli, 'watch', '--clear-screen=false', 'src/server.ts'],
    {
      ...spawnOptions,
      cwd: BACKEND,
      env: apiEnv,
    }
  );
  const web = spawn(
    process.execPath,
    [nextCli, 'dev', '-p', String(WEB_PORT)],
    {
      ...spawnOptions,
      cwd: ROOT,
      env: webEnv,
    }
  );

  const services = [
    { name: 'api', child: api, tag: color(35, '[api]') },
    { name: 'web', child: web, tag: color(32, '[web]') },
  ];
  for (const { child, tag } of services) {
    pipeWithPrefix(child.stdout, tag, process.stdout);
    pipeWithPrefix(child.stderr, tag, process.stderr);
  }

  let closing = false;
  const shutdown = async (code, reason) => {
    if (closing) return;
    closing = true;
    if (reason) warn(reason);
    info('Deteniendo API y web...');
    for (const { child } of services) if (child.pid) killTree(child.pid);
    // Red de seguridad: lo que hubiera quedado escuchando de este proyecto
    await waitUntilFree(WEB_PORT, 4000);
    await waitUntilFree(API_PORT, 4000);
    await freePorts([WEB_PORT, API_PORT], { label: 'proceso que seguía vivo' });
    info('Listo, puertos libres.');
    process.exit(code);
  };

  for (const { name, child } of services) {
    child.on('exit', (code, signal) => {
      if (!closing) {
        void shutdown(
          code || 1,
          `${name} terminó (${signal || `código ${code}`}); se detiene el resto.`
        );
      }
    });
  }

  for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP', 'SIGBREAK']) {
    process.on(signal, () => void shutdown(0, `Señal ${signal} recibida.`));
  }
  process.on('uncaughtException', (error) => {
    fail(String(error?.stack || error));
    void shutdown(1);
  });
  // Último recurso si el proceso muere sin pasar por shutdown
  process.on('exit', () => {
    if (!closing)
      for (const { child } of services) if (child.pid) killTree(child.pid);
  });

  info(`Iniciando API (puerto ${API_PORT}) y web (puerto ${WEB_PORT})...`);

  // Aviso cuando la API responde; la web se anuncia sola en su propia salida
  for (let i = 0; i < 90 && !closing; i++) {
    if (await ping(`http://127.0.0.1:${API_PORT}/health`)) {
      console.log('');
      console.log(
        color(36, '  ================================================')
      );
      console.log(`  Web: ${color(1, `http://localhost:${WEB_PORT}`)}`);
      console.log(`  API: ${color(1, `http://localhost:${API_PORT}`)}`);
      console.log('  Ctrl+C detiene todo.  npm run dev:stop  limpia restos.');
      console.log(
        color(36, '  ================================================')
      );
      console.log('');
      return;
    }
    await sleep(1000);
  }
  if (!closing)
    warn('La API no respondió en 90 s; revisa los mensajes [api] de arriba.');
}

// ---------------------------------------------------------------------------

const args = new Set(process.argv.slice(2));
if (args.has('--stop')) {
  process.exit((await stopAll()) ? 0 : 1);
} else if (args.has('--restart')) {
  await stopAll();
  await startAll();
} else {
  await startAll();
}
