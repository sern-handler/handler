import { defineConfig } from 'tsup';
import { writeFile } from 'fs/promises';
import ifdefPlugin from 'esbuild-ifdef';
const shared = {
    entry: ['src/index.ts'],
    external: ['discord.js', 'iti'],
    platform: 'node',
    clean: true,
    sourcemap: false,
    treeshake: {
        moduleSideEffects: false,
        correctVarValueBeforeDeclaration: true, //need this to treeshake esm discord.js empty import
        annotations: true,
    },
    dts: false
};
export default defineConfig([
    {
        format: 'esm',
        target: 'node18',
        tsconfig: './tsconfig-esm.json',
        outDir: './dist/esm',
        splitting: true,
        esbuildPlugins: [ifdefPlugin({ variables: { MODE: 'esm' }, verbose: true })],
        outExtension() {
            return {
                js: '.mjs',
            };
        },
        async onSuccess() {
            console.log('writing json esm');
            await writeFile('./dist/esm/package.json', JSON.stringify({ type: 'module' }));
        },
        ...shared,
    },
    {
        format: 'cjs',
        esbuildPlugins: [ifdefPlugin({ variables: { MODE: 'cjs' }, verbose: true })],
        splitting: false,
        target: 'node18',
        tsconfig: './tsconfig-cjs.json',
        outDir: './dist/cjs',
        outExtension() {
            return {
                js: '.cjs',
            };
        },
        async onSuccess() {
            console.log('writing json commonjs');
            await writeFile('./dist/cjs/package.json', JSON.stringify({ type: 'commonjs' }));
        },
        ...shared,
    }, 
    {
        dts: {
            only: true
        },
        entry: ['src/index.ts'],
        outDir: 'dist'
    }
]);
