import { nanoid } from "nanoid";

export const formatId = (id: string) => {
  return id
    .replace(/\s/g, "_")
    .replace(/[^a-zA-Z0-9_]/g, "")
    .toLowerCase();
};

export const getIdFromUser = (user: {
  name?: string | null;
  email?: string | null;
}) => {
  if (user.name) {
    return `${formatId(user.name)}-${nanoid(3)}`;
  }

  if (user.email) {
    const name = getNameFromEmail(user.email);
    return `${formatId(name)}-${nanoid(3)}`;
  }

  return nanoid(6);
};

export const getNameFromEmail = (email: string) => {
  return email.split("@")[0].split("+")[0];
};
