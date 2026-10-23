export function splitTextLines(text: string | string[], separateElements: boolean): string[] {
    const lines = (Array.isArray(text) ? text : [text])
        .flatMap((line) => line.split("\n"));

    return separateElements ? lines : [lines.join("\n")];
}
