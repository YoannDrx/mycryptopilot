"use server";

import { authAction } from "@/lib/server-actions/safe-actions";
import { z } from "zod";
import {
  SettingsDetailsFormSchema,
  SettingsNotificationFormSchema,
} from "./settings.schema";

export const updateSettingsAction = authAction(
  z.union([SettingsDetailsFormSchema, SettingsNotificationFormSchema]),
  async (data) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // Update the data from the server and return the fresh data
    return data;
  },
);
