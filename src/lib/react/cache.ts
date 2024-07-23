// To avoid calling many time same function, you can cache them with react `cache` method

import { cache } from "react";
import {
  getCurrentOrganization,
  getRequiredCurrentOrganization,
} from "../organizations/getCurrentOrganization";

export const getCurrentOrganizationCache = cache(getCurrentOrganization);
export const getRequiredCurrentOrganizationCache = cache(
  getRequiredCurrentOrganization,
);
