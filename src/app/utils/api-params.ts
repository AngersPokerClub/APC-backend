export const extractParamsFromPath = (
  req: Request,
  expectedKeys: string[]
): Record<string, string | undefined> => {
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);

  const result: Record<string, string | undefined> = {};
  console.log("🔍 Segments URL :", parts);

  expectedKeys.forEach((key) => {
    const index = parts.findIndex((part) => part === key);
    if (index !== -1 && index + 1 < parts.length) {
      result[key] = parts[index + 1];
      console.log(`✅ ${key} trouvé :`, result[key]);
    } else {
      console.warn(`❌ ${key} introuvable dans l'URL`);
      result[key] = undefined;
    }
  });

  return result;
};
