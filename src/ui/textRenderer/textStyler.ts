import type { TextColoringOptions } from "../../types/index";

interface TextMatch {
    text: string;
    start: number;
    colorIndex: number;
}

export class TextStyler {
    public apply(target: HTMLElement, coloring: TextColoringOptions): void {
        if (coloring.OnlySnippet) this.applySnippetColors(target, coloring);
        else this.applyWholeTextColor(target, coloring);
    }

    public restore(target: HTMLElement, defaultColor: string): void {
        target.style.color = defaultColor;
        target.style.backgroundColor = "";

        target.querySelectorAll<HTMLElement>("[data-text-style]").forEach((element) => {
            element.style.color = "";
            element.style.backgroundColor = "";
            element.removeAttribute("data-text-style");
        });
    }

    private applyWholeTextColor(
        target: HTMLElement,
        coloring: Extract<TextColoringOptions, { OnlySnippet: false }>,
    ): void {
        target.style.color = coloring.Color[0] ?? target.style.color;
        target.style.backgroundColor = coloring.Background[0] ?? "";
    }

    private applySnippetColors(
        target: HTMLElement,
        coloring: Extract<TextColoringOptions, { OnlySnippet: true }>,
    ): void {
        const text = target.textContent ?? "";
        const matches = this.findMatches(text, coloring.snippet);
        if (matches.length === 0) return;

        target.replaceChildren(this.createHighlightedContent(text, matches, coloring));
    }

    private findMatches(text: string, snippets: string[]): TextMatch[] {
        return snippets
            .map((snippet, colorIndex) => ({
                text: snippet,
                start: snippet.length > 0 ? text.indexOf(snippet) : -1,
                colorIndex,
            }))
            .filter((match) => match.start >= 0)
            .sort((left, right) => left.start - right.start);
    }

    private createHighlightedContent(
        text: string,
        matches: TextMatch[],
        coloring: Extract<TextColoringOptions, { OnlySnippet: true }>,
    ): DocumentFragment {
        const fragment = document.createDocumentFragment();
        let currentPosition = 0;

        for (const match of matches) {
            if (match.start < currentPosition) continue;

            fragment.append(document.createTextNode(text.slice(currentPosition, match.start)));
            fragment.append(this.createHighlight(match, coloring));
            currentPosition = match.start + match.text.length;
        }

        fragment.append(document.createTextNode(text.slice(currentPosition)));
        return fragment;
    }

    private createHighlight(
        match: TextMatch,
        coloring: Extract<TextColoringOptions, { OnlySnippet: true }>,
    ): HTMLSpanElement {
        const highlight = document.createElement("span");
        highlight.dataset.textStyle = "true";
        highlight.textContent = match.text;
        highlight.style.color = coloring.Color[match.colorIndex] ?? coloring.Color[0] ?? "";
        highlight.style.backgroundColor = coloring.Background[match.colorIndex] ?? "";
        return highlight;
    }
}
