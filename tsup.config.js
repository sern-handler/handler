import { defineConfig } from 'tsup';
import  ifdefPlugin  from 'esbuild-ifdef'
const shared = {
    entry: ['src/index.ts'],
    external: ['discord.js'],
    platform: 'node',
    clean: true,
    sourcemap: false,
    minify: false,
};
export default defineConfig([
    {
        format: 'esm',
        target: 'node16',
        tsconfig: './tsconfig-esm.json',
        outDir: './dist/esm',
        treeshake: true,
        esbuildPlugins: [
            ifdefPlugin({ variables: { MODE: 'esm' }, verbose: true })
        ],
        outExtension() {
            return {
                js: '.mjs',
            };
        },
        ...shared,
    },
    {
        format: 'cjs',
        esbuildPlugins: [ifdefPlugin({ variables: { MODE: 'cjs' }, verbose: true })],
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
