import next from "eslint-config-next";

/** eslint-config-next v16 ships a native flat config array, so we spread it
 *  directly rather than going through FlatCompat. */
const eslintConfig = [
  { ignores: [".next/**", "node_modules/**", "drizzle/**", "coverage/**"] },
  ...next,
];

export default eslintConfig;
