import { NextRequest, NextResponse } from "next/server";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse");

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await pdfParse(buffer);
    const text = result.text.trim();

    if (!text) {
      return NextResponse.json({ error: "Could not extract text from PDF" }, { status: 422 });
    }

    const wordCount = text.split(/\s+/).filter(Boolean).length;
    return NextResponse.json({ text, wordCount });
  } catch {
    return NextResponse.json({ error: "Could not read PDF" }, { status: 500 });
  }
}
