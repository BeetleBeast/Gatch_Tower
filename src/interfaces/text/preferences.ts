import type { TextPreferences } from "../../types/index";

export interface TextPreferencesPort {
    getPreferences(): TextPreferences;
}