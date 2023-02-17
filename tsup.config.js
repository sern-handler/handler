import { defineConfig } from 'tsup';
const shared = {
    entry: ['src/index.ts'],
    external: ['discord.js'],
    platform: 'node',
    clean: true,
    sourcemap: false,
    minify: true
};
export default defineConfig([
    {
        format: 'esm',
        target: 'node16',
        tsconfig: './tsconfig-esm.json',
        outDir: './dist/esm',
        treeshake: true,
        outExtension() {
            return {
                js: '.mjs',
            };
        },
        ...shared,
    },
    {
        format: 'cjs',
        splitting: false,
        target: 'node16',
        tsconfig: './tsconfig-cjs.json',
        outDir: './dist/cjs',
        outExtension() {
            return {
                js: '.cjs',
            };
        },
        ...shared,
    },
]);
