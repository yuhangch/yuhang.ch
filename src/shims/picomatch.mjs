import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const picomatch = require('picomatch');

export default picomatch;
export const {
    compileRe,
    constants,
    isMatch,
    makeRe,
    parse,
    scan,
    test,
    toRegex,
} = picomatch;
