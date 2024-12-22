export default {
  semi: true,
  singleQuote: false,
  trailingComma: "all",
  tabWidth: 2,
  printWidth: 80,
  arrowParens: "avoid",
  bracketSpacing: true,
  quoteProps: "as-needed",
  endOfLine: "lf",
  htmlWhitespaceSensitivity: "ignore",
  overrides: [
    {
      files: ["*.ts", "*.tsx"],
      excludeFiles: ["**/node_modules/**"],
    },
  ],
};
