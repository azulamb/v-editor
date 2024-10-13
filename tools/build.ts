import { bundle } from 'jsr:@deno/emit';

const src = new URL(import.meta.resolve('../src/v-editor.ts'));
const dst = new URL(import.meta.resolve('../docs/v-editor.js'));

const { code } = await bundle(src);
Deno.writeTextFileSync(dst, code);
