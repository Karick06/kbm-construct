import type { EmailLinkedRecordType, EmailMessageSnapshot } from "@/lib/email-links";

export type EmailAutoLinkRule = {
  id: string;
  name: string;
  enabled: boolean;
  mailbox?: string;
  senderDomain?: string;
  senderContains?: string;
  subjectIncludes?: string;
  bodyIncludes?: string;
  recordType: EmailLinkedRecordType;
  recordId: string;
  recordLabel: string;
  recordHref: string;
  applyToThread?: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = "kbm_email_rules_v1";

function safeParse(value: string | null): EmailAutoLinkRule[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as EmailAutoLinkRule[]) : [];
  } catch {
    return [];
  }
}

export function getEmailRulesFromStorage(): EmailAutoLinkRule[] {
  if (typeof window === "undefined") return [];
  return safeParse(window.localStorage.getItem(STORAGE_KEY));
}

export function saveEmailRulesToStorage(value: EmailAutoLinkRule[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

export async function syncEmailRulesFromServer(): Promise<EmailAutoLinkRule[]> {
  try {
    const response = await fetch("/api/email-rules", { cache: "no-store" });
    if (!response.ok) return getEmailRulesFromStorage();
    const data = (await response.json()) as { rules?: EmailAutoLinkRule[] };
    const rules = Array.isArray(data.rules) ? data.rules : [];
    saveEmailRulesToStorage(rules);
    return rules;
  } catch {
    return getEmailRulesFromStorage();
  }
}

export async function createEmailRule(
  rule: Omit<EmailAutoLinkRule, "id" | "createdAt" | "updatedAt">
): Promise<EmailAutoLinkRule | null> {
  try {
    const response = await fetch("/api/email-rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rule),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { rule?: EmailAutoLinkRule; rules?: EmailAutoLinkRule[] };
    if (data.rules) saveEmailRulesToStorage(data.rules);
    return data.rule || null;
  } catch {
    return null;
  }
}

export async function deleteEmailRule(ruleId: string): Promise<void> {
  try {
    const response = await fetch(`/api/email-rules?id=${encodeURIComponent(ruleId)}`, { method: "DELETE" });
    if (!response.ok) return;
    const data = (await response.json()) as { rules?: EmailAutoLinkRule[] };
    if (data.rules) saveEmailRulesToStorage(data.rules);
  } catch {
    // ignore
  }
}

function normalize(value?: string) {
  return String(value || "").trim().toLowerCase();
}

export function getSenderDomain(snapshot: Pick<EmailMessageSnapshot, "from">): string {
  const address = normalize(snapshot.from?.address);
  return address.includes("@") ? address.split("@").pop() || "" : "";
}

export function ruleMatchesMessage(
  rule: EmailAutoLinkRule,
  message: EmailMessageSnapshot,
  mailbox?: string
): boolean {
  if (!rule.enabled) return false;
  if (rule.mailbox && normalize(rule.mailbox) !== normalize(mailbox)) return false;

  const sender = normalize(message.from?.address);
  const subject = normalize(message.subject);
  const body = normalize(message.bodyPreview);
  const domain = getSenderDomain(message);

  if (rule.senderDomain && normalize(rule.senderDomain) !== domain) return false;
  if (rule.senderContains && !sender.includes(normalize(rule.senderContains))) return false;
  if (rule.subjectIncludes && !subject.includes(normalize(rule.subjectIncludes))) return false;
  if (rule.bodyIncludes && !body.includes(normalize(rule.bodyIncludes))) return false;

  return Boolean(rule.senderDomain || rule.senderContains || rule.subjectIncludes || rule.bodyIncludes);
}

export function getMatchingEmailRules(
  rules: EmailAutoLinkRule[],
  message: EmailMessageSnapshot,
  mailbox?: string
): EmailAutoLinkRule[] {
  return rules
    .filter((rule) => ruleMatchesMessage(rule, message, mailbox))
    .sort((left, right) => left.priority - right.priority || left.name.localeCompare(right.name));
}
