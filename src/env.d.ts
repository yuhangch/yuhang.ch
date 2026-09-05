/// <reference types="astro/client" />

import type { Locale } from './utils/locale';

declare global {
    namespace App {
        interface Locals {
            locale: Locale;
            originalPathname: string;
            originalUrl: URL;
        }
    }
}

export {};
