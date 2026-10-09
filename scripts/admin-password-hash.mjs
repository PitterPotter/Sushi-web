import { randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { promisify } from 'node:util';
import readline from 'node:readline';

const scrypt = promisify(scryptCallback);

function readHidden(label) {
  return new Promise((resolve, reject) => {
    const input = process.stdin;
    if (!input.isTTY) return reject(new Error('Run this script directly in a terminal.'));
    readline.emitKeypressEvents(input);
    input.setRawMode(true);
    input.resume();
    process.stderr.write(label);
    let value = '';

    const finish = (error) => {
      input.off('keypress', onKey);
      input.setRawMode(false);
      process.stderr.write('\n');
      error ? reject(error) : resolve(value);
    };
    const onKey = (char, key) => {
      if (key.ctrl && key.name === 'c') return finish(new Error('Cancelled.'));
      if (key.name === 'return') return finish();
      if (key.name === 'backspace') { value = value.slice(0, -1); return; }
      if (!key.ctrl && char && char.length === 1 && value.length < 256) value += char;
    };
    input.on('keypress', onKey);
  });
}

try {
  const password = await readHidden('New admin password (16+ characters, not echoed): ');
  if (password.length < 16) throw new Error('Password must be at least 16 characters.');
  const confirmation = await readHidden('Confirm password: ');
  if (password !== confirmation) throw new Error('Passwords do not match.');
  const salt = randomBytes(16).toString('hex');
  const hash = await scrypt(password, salt, 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  process.stdout.write(`scrypt$16384$8$1$${salt}$${hash.toString('hex')}\n`);
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
