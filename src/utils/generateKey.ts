import { randomBytes } from 'crypto';

function generateApiKey(length: number): string {
    const bytes = randomBytes(Math.ceil(length / 2));

    const apiKey = bytes.toString('hex').slice(0, length);

    return apiKey;
}

const apiKey = generateApiKey(32);
console.log(apiKey);
