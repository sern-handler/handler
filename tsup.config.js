import { defineConfig } from 'tsup';

const shared = {
    entry: ['src/index.ts'],
    external: ['discord.js', 'iti'],
    platform: 'node',
    clean: true,
    sourcemap: true,
    treeshake: {
        moduleSideEffects: false,
        correctVarValueBeforeDeclaration: true, //need this to treeshake esm discord.js empty import
        annotations: true,
    },
};
export default defineConfig([
    {
        ...shared,
        format: ['esm', 'cjs'],
        target: 'node18',
        tsconfig: './tsconfig.json',
        outDir: './dist',
        minify: false,
        dts: true,
        entry: ['src/_internal.ts'],
    },
    {
        format: ['esm', 'cjs'],
        target: 'node18',
        tsconfig: './tsconfig.json',
        outDir: './dist',
        minify: false,
        dts: true,
        ...shared,
    },
 ]);
