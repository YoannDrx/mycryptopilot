export const formatId = (id: string) => {
  return id
    .replace(/\s/g, "_")
    .replace(/[^a-zA-Z0-9_]/g, "")
    .toLowerCase();
};
