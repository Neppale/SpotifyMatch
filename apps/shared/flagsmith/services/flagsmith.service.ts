import { Injectable } from '@nestjs/common';
import flagsmith, { Flagsmith } from 'flagsmith-nodejs';
import * as crypto from 'crypto';

interface AvailableClient {
  id: string;
  secret: string;
}

@Injectable()
export class FlagsmithService {
  private flagsmithClient: Flagsmith;
  private cachedClients: AvailableClient[] | null = null;
  private lastUpdatedAt: Date | null = null;
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  constructor() {
    const environmentKey = process.env.FLAGSMITH_KEY;
    if (!environmentKey) {
      throw new Error('FLAGSMITH_KEY environment variable is not set');
    }
    this.flagsmithClient = new Flagsmith({
      environmentKey: environmentKey,
    });
  }

  async getAvailableClients(): Promise<AvailableClient[]> {
    const now = new Date();
    
    if (
      this.cachedClients !== null &&
      this.lastUpdatedAt !== null &&
      now.getTime() - this.lastUpdatedAt.getTime() < this.CACHE_TTL_MS
    ) {
      return this.cachedClients;
    }

    const flags = await this.flagsmithClient.getEnvironmentFlags();
    const featureValue = flags.getFeatureValue('available_clients');
    
    if (!featureValue) {
      this.cachedClients = [];
      this.lastUpdatedAt = now;
      return [];
    }

    const clients = featureValue as unknown as AvailableClient[];
    this.cachedClients = clients;
    this.lastUpdatedAt = now;
    return clients;
  }

  decryptSecret(encryptedSecret: string): string {
    const masterKey = process.env.SECRETS_MASTER_KEY;
    if (!masterKey) {
      throw new Error('SECRETS_MASTER_KEY environment variable is not set');
    }


    const key = crypto.createHash('sha256').update(masterKey).digest().slice(0, 24);

    const encryptedBuffer = Buffer.from(encryptedSecret, 'base64');

    if (encryptedBuffer.length < 16) {
      throw new Error('Encrypted secret is too short to contain IV');
    }

    const iv = encryptedBuffer.slice(0, 16);
    const ciphertext = encryptedBuffer.slice(16);

    const decipher = crypto.createDecipheriv('aes-192-cbc', key, iv);

    let decrypted = decipher.update(ciphertext);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString('utf8');
  }
}
