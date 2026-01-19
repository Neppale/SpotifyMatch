import * as crypto from 'crypto';
import * as dotenv from 'dotenv';

dotenv.config();

const secret = process.argv[2];

if (!secret) {
  console.error('Error: Secret argument is required');
  console.error('Usage: npm run encrypt-secret <secret>');
  process.exit(1);
}

const masterKey = process.env.SECRETS_MASTER_KEY;
if (!masterKey) {
  console.error('Error: SECRETS_MASTER_KEY environment variable is not set');
  process.exit(1);
}

const key = crypto.createHash('sha256').update(masterKey).digest().slice(0, 24);

const iv = crypto.randomBytes(16);

const cipher = crypto.createCipheriv('aes-192-cbc', key, iv);

let encrypted = cipher.update(secret, 'utf8');
encrypted = Buffer.concat([encrypted, cipher.final()]);

const encryptedWithIv = Buffer.concat([iv, encrypted]);
const encryptedBase64 = encryptedWithIv.toString('base64');

console.log(encryptedBase64);
