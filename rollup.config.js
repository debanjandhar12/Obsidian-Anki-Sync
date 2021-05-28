import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import { string } from "rollup-plugin-string";
import copy from 'rollup-plugin-copy'

const isProd = (process.env.BUILD === 'production');


export default {
  input: './src/main.ts',
  output: {
    dir: './out/',
    sourcemap: 'inline',
    sourcemapExcludeSources: isProd,
    format: 'cjs',
    exports: 'default',
  },
  plugins: [nodeResolve(), commonjs(), typescript(), string({ include: "**/*.html" }), copy({ targets: [{ src: './manifest.json', dest: 'out' }] })],
  external: ["obsidian", "path"]
};
