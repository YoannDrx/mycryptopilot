import { nanoid } from "nanoid";
import { User } from "next-auth";

export const formatId = (id: string) => {
  return id
    .replace(/\s/g, "_")
    .replace(/[^a-zA-Z0-9_]/g, "")
    .toLowerCase();
};

export const getIdFromUser = (user: User) => {
  if (user.name) {
    return `${formatId(user.name)}-${nanoid(3)}`;
  }

  if (user.email) {
    const email = user.email.split("@")[0].split("+")[0];
    return `${formatId(email)}-${nanoid(3)}`;
  }

  return nanoid(6);
};
