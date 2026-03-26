export const serializeBigInt = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(serializeBigInt);
  }

  if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => {
        if (typeof value === "bigint") {
          return [key, value.toString()];
        }

        if (value instanceof Date) {
          return [key, value.toISOString()];
        }

        if (typeof value === "object") {
          return [key, serializeBigInt(value)];
        }

        return [key, value];
      })
    );
  }

  return obj;
};
