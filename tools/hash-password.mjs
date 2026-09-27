// Genera i valori PASSWORD_* per config.js senza mai scrivere la password su disco.
// Uso (la password non compare a schermo né nella cronologia della shell):
//   read -rs PW && printf '%s' "$PW" | node tools/hash-password.mjs; unset PW
import { pbkdf2Sync, randomBytes } from 'node:crypto';

const ITERAZIONI = 600000;

let input = '';
for await (const chunk of process.stdin) input += chunk;
const password = input.trim().toLowerCase(); // come fa il form: maiuscole e spazi ai lati ignorati
if (!password) {
  console.error('Nessuna password ricevuta su stdin.');
  process.exit(1);
}

const salt = randomBytes(16).toString('hex');
const hash = pbkdf2Sync(password, salt, ITERAZIONI, 32, 'sha256').toString('hex');
console.log(`  PASSWORD_SALT: '${salt}',`);
console.log(`  PASSWORD_ITERAZIONI: ${ITERAZIONI},`);
console.log(`  PASSWORD_HASH: '${hash}',`);
