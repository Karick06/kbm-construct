import { NextResponse } from "next/server";
import mammoth from "mammoth";

export const runtime = "nodejs";

const MAX_FILE_SIZE_MB = 12;
const SUPPORTED_TYPES = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
const ALLOWED_MODELS = ["gpt-4.1-mini", "gpt-4.1", "gpt-4o-mini"];

type ReviewOutput = {
  summary: string;
  keyTerms: string[];
  riskFlags: string[];
  clauseReview: Array<{ clause: string; concern: string; suggestion: string }>;
  redlines: string[];
};

const SYSTEM_PROMPT =
  "You are a commercial contracts reviewer for a construction QS team. " +
  "Return concise, actionable findings with risk flags, key terms, clause review, and redline suggestions. " +
  "Focus on payment terms, retention, LDs, caps, termination, PI/insurance, variations, dispute resolution.";

function isSupportedType(type: string): boolean {
  return SUPPORTED_TYPES.includes(type);
}

async function extractText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  if (file.type === "application/pdf") {
    // Use unpdf - lightweight PDF parser for Node.js
    const { extractText: unpdfExtract } = await import("unpdf");
    const { text } = await unpdfExtract(uint8Array);
    return Array.isArray(text) ? text.join(" ") : text || "";
  }

  if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const buffer = Buffer.from(arrayBuffer);
    const result = await mammoth.extractRawText({ buffer });
    return result.value || "";
  }

  return "";
}

function resolveModel(model?: string | null): string {
  if (model && ALLOWED_MODELS.includes(model)) {
    return model;
  }
  return "gpt-4.1-mini";
}

async function callOpenAI(inputText: string, model: string): Promise<ReviewOutput> {
  // Check for Azure OpenAI configuration
  const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const azureApiKey = process.env.AZURE_OPENAI_API_KEY;
  const azureDeployment = process.env.AZURE_OPENAI_DEPLOYMENT;
  const azureApiVersion = process.env.AZURE_OPENAI_API_VERSION || "2024-02-15-preview";
  
  const isAzure = !!(azureEndpoint && azureApiKey && azureDeployment);
  
  // Fallback to regular OpenAI
  if (!isAzure) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("Missing OPENAI_API_KEY or Azure OpenAI configuration");
    }
  }

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content:
        "Review this contract and return JSON with fields: summary (string), keyTerms (string[]), " +
        "riskFlags (string[]), clauseReview (array of {clause, concern, suggestion}), redlines (string[]). " +
        "Keep clauseReview to max 8 items. Text follows:\n\n" +
        inputText.slice(0, 16000),
    },
  ];

  let url: string;
  let headers: Record<string, string>;
  let payload: any;

  if (isAzure) {
    // Azure OpenAI configuration
    url = `${azureEndpoint}/openai/deployments/${azureDeployment}/chat/completions?api-version=${azureApiVersion}`;
    headers = {
      "Content-Type": "application/json",
      "api-key": azureApiKey!,
    };
    payload = {
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages,
    };
  } else {
    // Regular OpenAI configuration
    url = "https://api.openai.com/v1/chat/completions";
    headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    };
    payload = {
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages,
    };
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Empty AI response");
  }

  return JSON.parse(content) as ReviewOutput;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "File is required." }, { status: 400 });
    }

    if (!isSupportedType(file.type)) {
      return NextResponse.json({ error: "Unsupported file type." }, { status: 400 });
    }

    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > MAX_FILE_SIZE_MB) {
      return NextResponse.json({ error: "File is too large." }, { status: 400 });
    }

    const text = await extractText(file);
    if (!text.trim()) {
      return NextResponse.json({ error: "No text extracted from file." }, { status: 400 });
    }

    const requestedModel = formData.get("model");
    const model = resolveModel(typeof requestedModel === "string" ? requestedModel : null);

    const review = await callOpenAI(text, model);
    return NextResponse.json({ review, model });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
