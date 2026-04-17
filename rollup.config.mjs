import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

export default {
  input: "src/modules/index.ts",
  output: {
    file: "dist/modules/index.js",
    format: "es",
  },
  plugins: [
    typescript({
      tsconfig: "./tsconfig.json",
      compilerOptions: {
        module: "ESNext",
        target: "ES5",
      },
    }),
    resolve(),
    commonjs(),
  ],
};
