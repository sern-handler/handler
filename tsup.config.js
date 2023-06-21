import { defineConfig } from 'tsup';
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
    }
};
export default defineConfig([
    {
        format: ['esm', 'cjs'],
        target: 'node18',
        tsconfig: './tsconfig.json',
        outDir: './dist',
        splitting: true,
        dts: true,
        ...shared,
    },
//    {
//        format: 'cjs',
//        esbuildPlugins: [ifdefPlugin({ variables: { MODE: 'cjs' }, verbose: true })],
//        splitting: false,
//        target: 'node18',
//        tsconfig: './tsconfig-cjs.json',
//        outDir: './dist/cjs',
//        outExtension() {
//            return {
//                js: '.cjs',
//            };
//        },
//        async onSuccess() {
//            console.log('writing json commonjs');
//            await writeFile('./dist/cjs/package.json', JSON.stringify({ type: 'commonjs' }));
//        },
//        ...shared,
//    },
//    {
//        dts: {
//            only: true,
//        },
//        entry: ['src/index.ts'],
//        outDir: 'dist',
//    },
]);
