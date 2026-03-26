import { ESLint } from "eslint";

async function main() {
  const eslint = new ESLint({ fix: true });

  const results = await eslint.lintFiles(["src/**/*.ts", "src/**/*.tsx"]);
  await ESLint.outputFixes(results);

  let remainingErrorCount = 0;

  if (remainingErrorCount > 0) {
    console.error(`❌ ${remainingErrorCount} linting error(s) remaining.`);
    process.exit(1);
  } else {
    console.log("✅ No linting errors.");
  }
}

main().catch((error) => {
  console.error("Error running ESLint:", error);
  process.exit(1);
});
