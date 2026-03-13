import { Injectable } from '@nestjs/common';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

@Injectable()
export class PasswordService {
  createHash(password: string): { salt: string; hash: string } {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(password, salt, 64).toString('hex');
    return { salt, hash };
  }

  verify(password: string, salt: string, expectedHash: string): boolean {
    const actualHash = scryptSync(password, salt, 64).toString('hex');
    return timingSafeEqual(
      Buffer.from(actualHash, 'hex'),
      Buffer.from(expectedHash, 'hex'),
    );
  }
}
