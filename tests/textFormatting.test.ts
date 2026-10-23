import { describe, expect, it } from "vitest";
import { splitTextLines } from "../src/ui/textRenderer/textFormatting";

describe("splitTextLines", () => {
    it("splits newline-delimited text into separately rendered lines", () => {
        expect(splitTextLines("First line\nSecond line", true)).toEqual([
            "First line",
            "Second line",
        ]);
    });

    it("flattens newlines inside arrays of authored lines", () => {
        expect(splitTextLines(["First\ncontinued", "Second"], true)).toEqual([
            "First",
            "continued",
            "Second",
        ]);
    });

    it("preserves newlines in one element when separate line elements are disabled", () => {
        expect(splitTextLines(["First\ncontinued", "Second"], false)).toEqual([
            "First\ncontinued\nSecond",
        ]);
    });
});
