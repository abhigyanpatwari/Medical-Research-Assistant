import { readLines } from "https://deno.land/std/io/mod.ts";

async function main() {
  console.log("Paste your markdown content (type 'END' on a new line when done):");
  const lines: string[] = [];
  
  for await (const line of readLines(Deno.stdin)) {
    if (line === "END") break;
    lines.push(line);
  }

  const input = lines.join("\n");
  const cleanedText = input
    .replace(/"\s*\+\s*"/g, "") // Remove " + "
    .replace(/^"|"$/g, "")      // Remove start/end quotes
    .replace(/\\n/g, "\n")      // Convert \n to newlines
    .replace(/"\s*\+\s*$/gm, "") // Remove " + at line ends
    .trim();

  await Deno.writeTextFile("output.md", cleanedText);
  console.log("Content has been written to output.md");
}

if (import.meta.main) {
  main();
}