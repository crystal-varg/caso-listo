import { INestApplication } from '@nestjs/common';
export declare function bootTestApp(): Promise<INestApplication>;
export declare function randomEmail(): string;
export declare function extractCookie(setCookie: string | string[] | undefined, name: string): string | undefined;
