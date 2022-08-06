import { defineConfig } from 'tsup';

export default defineConfig([
    {
        entry: ['src/index.ts'],
        format : 'esm',
        sourcemap: false,
        target: 'node16',
        tsconfig : './tsconfig-esm.json',
        outDir : './dist/esm',
        platform: 'node',
        external: ['discord.js'],
        clean: true,
        treeshake: true,
        outExtension() {
            return {
                js : '.mjs'
            };
        }
    },
    {
        entry: ['src/index.ts'],
        format : 'cjs',
        splitting: false,
        sourcemap: false,
        external: ['discord.js'],
        clean: true,
        target: 'node16',
        tsconfig : './tsconfig-cjs.json',
        outDir : './dist/cjs',
        platform: 'node',
        outExtension() {
            return {
                js : '.cjs'
            };
        }
    }
]);
