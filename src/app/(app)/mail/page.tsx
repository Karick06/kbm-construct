"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { useAuth } from "@/lib/auth-context";
import {
  addLinkToMessage,
  getEmailLinksFromStorage,
  getLinksForConversation,
  getLinkedMessagesForRecord,
  inheritConversationLinks,
  removeLinkFromMessage,
  saveEmailLinksToStorage,
  syncEmailLinksFromServer,
  type EmailLinkMap,
  type EmailLinkedRecord,
  type EmailLinkedRecordType,
} from "@/lib/email-links";
import { getEstimateJobsFromStorage, getEnquiriesFromStorage, type EstimateJob } from "@/lib/enquiries-store";
import { getProjectsFromStorage, getPaymentApplicationsFromStorage } from "@/lib/operations-data";
import { createTaskFromEmail } from "@/lib/tasks-store";
import { createEmailApproval, getEmailApprovalsFromStorage, syncEmailApprovalsFromServer, type EmailApprovalItem } from "@/lib/email-approvals";
import { getEmailRulesFromStorage, createEmailRule, getMatchingEmailRules, syncEmailRulesFromServer, getSenderDomain, type EmailAutoLinkRule } from "@/lib/email-rules";
import { getSharedMailboxesFromStorage, syncSharedMailboxesFromServer, type SharedMailbox } from "@/lib/shared-mailboxes";
import { getEmailAuditFromStorage, logEmailAudit, syncEmailAuditFromServer, type EmailAuditEntry } from "@/lib/email-audit";
import { saveEmailAttachmentRecord, syncSavedEmailAttachmentsFromServer } from "@/lib/email-attachments";
import type { InvoiceApplication } from "@/lib/operations-models";

type MailFolder = {
  id: string;
  displayName: string;
  totalItemCount: number;
  unreadItemCount: number;
  wellKnownName?: string;
};

type MailAddress = {
  name?: string;
  address?: string;
};

type MailMessageSummary = {
  id: string;
  folderId?: string;
  folderName?: string;
  mailbox?: string;
  subject: string;
  bodyPreview?: string;
  receivedDateTime?: string;
  isRead?: boolean;
  hasAttachments?: boolean;
  importance?: string;
  conversationId?: string;
  from?: MailAddress;
  toRecipients?: MailAddress[];
};

type MailMessageDetail = MailMessageSummary & {
  body?: {
    contentType?: "text" | "html";
    content?: string;
  };
  ccRecipients?: MailAddress[];
  internetMessageId?: string;
};

type MailAttachment = {
  id: string;
  name: string;
  contentType?: string;
  size?: number;
  contentBytes?: string;
};

type ComposeAttachment = {
  id: string;
  name: string;
  contentType?: string;
  contentBytes: string;
  size: number;
};

type ProjectRecord = {
  id: string;
  name: string;
  client: string;
  estimateId?: string;
  href: string;
};

type EstimateRecord = {
  id: string;
  name: string;
  client: string;
  href: string;
};

type GenericRecord = {
  id: string;
  label: string;
  href: string;
};

type LinkCandidate = {
  type: EmailLinkedRecordType;
  recordId: string;
  label: string;
  href: string;
  score?: number;
  reason?: string;
};

function toPlainText(body?: { contentType?: "text" | "html"; content?: string }) {
  if (!body?.content) return "";
  if (body.contentType === "text") return body.content;

  return body.content
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function formatDate(value?: string) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelativeDate(value?: string) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";

  const now = new Date();
  const diffMs = now.getTime() - parsed.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return parsed.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function formatAddress(address?: MailAddress) {
  if (!address) return "";
  if (address.name && address.address) return `${address.name} <${address.address}>`;
  return address.address || address.name || "";
}

function splitRecipients(value: string) {
  return value
    .split(/[;,]/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((address) => ({ address }));
}

function formatFileSize(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function pillTone(folder?: string) {
  const normalized = String(folder || "").toLowerCase();
  if (normalized === "inbox") return "bg-sky-500/15 text-sky-200 border-sky-400/20";
  if (normalized === "sentitems") return "bg-emerald-500/15 text-emerald-200 border-emerald-400/20";
  if (normalized === "drafts") return "bg-amber-500/15 text-amber-100 border-amber-400/20";
  return "bg-gray-500/15 text-gray-200 border-gray-400/20";
}

function buildClients(): GenericRecord[] {
  const enquiries = getEnquiriesFromStorage();
  const seen = new Set<string>();
  return enquiries
    .map((enq) => ({
      id: enq.client.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      label: enq.client,
      href: `/clients`,
    }))
    .filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
}

function buildInvoices(): GenericRecord[] {
  try {
    const apps = getPaymentApplicationsFromStorage();
    const projectNameById = getProjectsFromStorage().reduce<Record<string, string>>((acc, project) => {
      acc[project.id] = project.projectName;
      return acc;
    }, {});

    const toInvoiceRecordId = (application: InvoiceApplication) =>
      `APP-${String(application.applicationNumber).padStart(4, "0")}`;

    return apps.map((application) => {
      const invoiceId = toInvoiceRecordId(application);
      const projectName = projectNameById[application.projectId] || application.projectId;
      return {
        id: invoiceId,
        label: `${invoiceId} · ${projectName}`,
        href: "/invoices",
      };
    });
  } catch {
    return [];
  }
}

function toCanonicalInvoiceId(applicationNumber: number): string {
  return `APP-${String(applicationNumber).padStart(4, "0")}`;
}

function buildLegacyInvoiceIdMap(): Map<string, string> {
  const map = new Map<string, string>();

  getPaymentApplicationsFromStorage().forEach((application) => {
    const canonicalId = toCanonicalInvoiceId(application.applicationNumber);
    map.set(application.id.toLowerCase(), canonicalId);
    map.set(`app-${application.applicationNumber}`.toLowerCase(), canonicalId);
    map.set(canonicalId.toLowerCase(), canonicalId);
  });

  return map;
}

function normalizeInvoiceRecordId(recordId: string, legacyMap: Map<string, string>): string {
  const canonicalMatch = /^APP-(\d+)$/i.exec(recordId);
  if (canonicalMatch) {
    return toCanonicalInvoiceId(Number(canonicalMatch[1]));
  }

  return legacyMap.get(recordId.toLowerCase()) || recordId;
}

async function migrateLegacyInvoiceLinks(): Promise<boolean> {
  const legacyMap = buildLegacyInvoiceIdMap();
  if (legacyMap.size === 0) return false;

  const existing = getEmailLinksFromStorage();
  let mutated = false;
  const next: EmailLinkMap = {};

  Object.entries(existing).forEach(([messageId, entry]) => {
    const transformed = entry.links.map((link) => {
      if (link.type !== "invoice") return link;

      const normalizedId = normalizeInvoiceRecordId(link.recordId, legacyMap);
      if (normalizedId === link.recordId) return link;

      mutated = true;
      return {
        ...link,
        recordId: normalizedId,
        label: link.label.startsWith(`${link.recordId} ·`)
          ? `${normalizedId} ·${link.label.slice(link.recordId.length + 2)}`
          : link.label,
      };
    });

    const deduped: typeof transformed = [];
    const seen = new Set<string>();
    transformed.forEach((link) => {
      const key = `${link.type}:${link.recordId}`;
      if (seen.has(key)) {
        mutated = true;
        return;
      }
      seen.add(key);
      deduped.push(link);
    });

    next[messageId] = {
      ...entry,
      links: deduped,
    };
  });

  if (!mutated) return false;

  saveEmailLinksToStorage(next);

  try {
    await fetch("/api/email-links", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ links: next }),
    });
  } catch {
    // local migration is still valid when offline
  }

  return true;
}

function buildSuppliers(): GenericRecord[] {
  try {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem("kbm_suppliers") : null;
    const suppliers = stored ? (JSON.parse(stored) as Array<{ id: string; name: string }>) : [];
    return suppliers.map((supplier) => ({
      id: supplier.id,
      label: supplier.name,
      href: "/suppliers",
    }));
  } catch {
    return [];
  }
}

function buildPurchaseOrders(): GenericRecord[] {
  try {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem("procurement_orders") : null;
    const orders = stored ? (JSON.parse(stored) as Array<{ id: string; supplier?: string; projectName?: string }>) : [];
    return orders.map((order) => ({
      id: order.id,
      label: `${order.id} · ${order.supplier || order.projectName || "Purchase Order"}`,
      href: "/purchase-orders",
    }));
  } catch {
    return [];
  }
}

function buildProjects(): ProjectRecord[] {
  return getProjectsFromStorage().map((project) => ({
    id: project.id,
    name: project.projectName,
    client: project.client,
    estimateId: project.estimateId,
    href: `/projects/${project.id}`,
  }));
}

function buildEstimates(): EstimateRecord[] {
  return getEstimateJobsFromStorage().map((estimate: EstimateJob) => ({
    id: estimate.id,
    name: estimate.projectName,
    client: estimate.client,
    href: `/estimating-overview?estimateId=${encodeURIComponent(estimate.id)}`,
  }));
}

function collectSuggestions(
  message: MailMessageSummary | MailMessageDetail | null,
  projects: ProjectRecord[],
  estimates: EstimateRecord[],
  clients: GenericRecord[],
  suppliers: GenericRecord[],
  invoices: GenericRecord[],
  purchaseOrders: GenericRecord[],
  currentLinks: EmailLinkedRecord[]
): LinkCandidate[] {
  if (!message) return [];

  const haystack = [
    message.subject,
    message.bodyPreview,
    message.from?.name,
    message.from?.address,
    ...(message.toRecipients || []).map(formatAddress),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const linkedKeys = new Set(currentLinks.map((entry) => `${entry.type}:${entry.recordId}`));

  const scoreTextMatch = (primary: string, secondary?: string) => {
    let score = 0;
    if (primary && haystack.includes(primary.toLowerCase())) score += 90;
    if (secondary && haystack.includes(secondary.toLowerCase())) score += 60;
    return score;
  };

  const projectMatches = projects
    .map((project) => {
      const name = project.name.toLowerCase();
      const client = project.client.toLowerCase();
      const score = Math.max(scoreTextMatch(project.id), scoreTextMatch(name), scoreTextMatch(client));
      return score > 0
        ? {
            type: "project" as const,
            recordId: project.id,
            label: `${project.id} · ${project.name}`,
            href: project.href,
            score,
            reason: haystack.includes(project.id.toLowerCase()) ? "Project reference found in subject/body" : "Project/client name matched",
          }
        : null;
    })
    .filter(Boolean) as LinkCandidate[];

  const estimateMatches = estimates
    .map((estimate) => {
      const name = estimate.name.toLowerCase();
      const client = estimate.client.toLowerCase();
      const score = Math.max(scoreTextMatch(estimate.id), scoreTextMatch(name), scoreTextMatch(client));
      return score > 0
        ? {
            type: "estimate" as const,
            recordId: estimate.id,
            label: `${estimate.id} · ${estimate.name}`,
            href: estimate.href,
            score,
            reason: haystack.includes(estimate.id.toLowerCase()) ? "Estimate reference found" : "Estimate/client name matched",
          }
        : null;
    })
    .filter(Boolean) as LinkCandidate[];

  const genericMatches = [
    ...clients.map((client) => ({ type: "client" as const, record: client, reason: "Client name matched" })),
    ...suppliers.map((supplier) => ({ type: "supplier" as const, record: supplier, reason: "Supplier name or sender matched" })),
    ...invoices.map((invoice) => ({ type: "invoice" as const, record: invoice, reason: "Invoice reference matched" })),
    ...purchaseOrders.map((purchaseOrder) => ({ type: "purchase-order" as const, record: purchaseOrder, reason: "Purchase order reference matched" })),
  ]
    .map((entry) => {
      const score = scoreTextMatch(entry.record.id, entry.record.label);
      return score > 0
        ? {
            type: entry.type,
            recordId: entry.record.id,
            label: entry.record.label,
            href: entry.record.href,
            score,
            reason: entry.reason,
          }
        : null;
    })
    .filter(Boolean) as LinkCandidate[];

  return [...projectMatches, ...estimateMatches, ...genericMatches]
    .filter(
    (entry, index, list) =>
      !linkedKeys.has(`${entry.type}:${entry.recordId}`) &&
      list.findIndex((candidate) => `${candidate.type}:${candidate.recordId}` === `${entry.type}:${entry.recordId}`) === index
    )
    .sort((left, right) => (right.score || 0) - (left.score || 0));
}

const LINK_TYPE_OPTIONS: { value: EmailLinkedRecordType; label: string }[] = [
  { value: "project", label: "Project" },
  { value: "estimate", label: "Estimate" },
  { value: "client", label: "Client" },
  { value: "invoice", label: "Invoice" },
  { value: "purchase-order", label: "Purchase Order" },
  { value: "supplier", label: "Supplier" },
];

async function filesToComposeAttachments(fileList: FileList | null): Promise<ComposeAttachment[]> {
  if (!fileList) return [];

  return Promise.all(
    Array.from(fileList).map(
      (file) =>
        new Promise<ComposeAttachment>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = String(reader.result || "");
            const contentBytes = result.includes(",") ? result.split(",")[1] : result;
            resolve({
              id: `compose-file-${crypto.randomUUID()}`,
              name: file.name,
              contentType: file.type || "application/octet-stream",
              contentBytes,
              size: file.size,
            });
          };
          reader.readAsDataURL(file);
        })
    )
  );
}

export default function MailPage() {
  const searchParams = useSearchParams();
  const { user, hasPermission } = useAuth();
  const [folders, setFolders] = useState<MailFolder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState("");
  const [sharedMailboxes, setSharedMailboxes] = useState<SharedMailbox[]>([]);
  const [selectedMailbox, setSelectedMailbox] = useState("");
  const [messages, setMessages] = useState<MailMessageSummary[]>([]);
  const [selectedMessageId, setSelectedMessageId] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<MailMessageDetail | null>(null);
  const [attachments, setAttachments] = useState<MailAttachment[]>([]);

  const [loadingFolders, setLoadingFolders] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(false);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [showCompose, setShowCompose] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeCc, setComposeCc] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composeAttachments, setComposeAttachments] = useState<ComposeAttachment[]>([]);
  const [sending, setSending] = useState(false);

  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [estimates, setEstimates] = useState<EstimateRecord[]>([]);
  const [clients, setClients] = useState<GenericRecord[]>([]);
  const [suppliers, setSuppliers] = useState<GenericRecord[]>([]);
  const [invoices, setInvoices] = useState<GenericRecord[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<GenericRecord[]>([]);
  const [messageLinks, setMessageLinks] = useState<EmailLinkMap>({});
  const [emailRules, setEmailRules] = useState<EmailAutoLinkRule[]>([]);
  const [approvalItems, setApprovalItems] = useState<EmailApprovalItem[]>([]);
  const [auditEntries, setAuditEntries] = useState<EmailAuditEntry[]>([]);
  const [linkType, setLinkType] = useState<EmailLinkedRecordType>("project");
  const [selectedRecordId, setSelectedRecordId] = useState("");
  const [linking, setLinking] = useState(false);
  const [savingAttachmentId, setSavingAttachmentId] = useState("");
  const [creatingTask, setCreatingTask] = useState(false);
  const [sendingApproval, setSendingApproval] = useState(false);

  const [composeLinkType, setComposeLinkType] = useState<EmailLinkedRecordType | "">("");
  const [composeLinkRecordId, setComposeLinkRecordId] = useState("");

  const recordTypeParam = searchParams.get("recordType");
  const recordIdParam = searchParams.get("recordId");
  const messageIdParam = searchParams.get("messageId");
  const mailboxParam = searchParams.get("mailbox") || "";
  const isRecordFocused =
    Boolean(recordIdParam) && ["project", "estimate", "client", "supplier", "invoice", "purchase-order"].includes(String(recordTypeParam));

  const mailboxQuery = selectedMailbox ? `&mailbox=${encodeURIComponent(selectedMailbox)}` : "";
  const canManageMailSetup = hasPermission("user_management");
  const canViewSensitiveContent =
    hasPermission("documents") || hasPermission("invoices") || hasPermission("procurement") || hasPermission("clients") || hasPermission("user_management");

  const selectedFolder = useMemo(
    () => folders.find((folder) => folder.id === selectedFolderId),
    [folders, selectedFolderId]
  );

  const linkedRecordsForSelectedMessage = useMemo(
    () => (selectedMessageId ? messageLinks[selectedMessageId]?.links || [] : []),
    [messageLinks, selectedMessageId]
  );

  const recordFocusedMessages = useMemo(() => {
    if (!isRecordFocused || !recordTypeParam || !recordIdParam) return [];

    return getLinkedMessagesForRecord(recordTypeParam as EmailLinkedRecordType, recordIdParam).map((message) => ({
      id: message.messageId,
      folderId: message.folderId,
      folderName: message.folderName,
      mailbox: message.mailbox,
      subject: message.subject,
      bodyPreview: message.bodyPreview,
      receivedDateTime: message.receivedDateTime,
      isRead: message.isRead,
      hasAttachments: message.hasAttachments,
      importance: message.importance,
      conversationId: message.conversationId,
      from: message.from,
      toRecipients: [],
    })) as MailMessageSummary[];
  }, [isRecordFocused, messageLinks, recordIdParam, recordTypeParam]);

  const visibleMessages = useMemo(
    () => (isRecordFocused ? recordFocusedMessages : messages),
    [isRecordFocused, messages, recordFocusedMessages]
  );

  const availableLinkRecords = useMemo((): GenericRecord[] => {
    if (linkType === "project") {
      return projects.map((project) => ({ id: project.id, label: `${project.id} · ${project.name}`, href: project.href }));
    }
    if (linkType === "estimate") {
      return estimates.map((estimate) => ({ id: estimate.id, label: `${estimate.id} · ${estimate.name}`, href: estimate.href }));
    }
    if (linkType === "client") return clients;
    if (linkType === "invoice") return invoices;
    if (linkType === "supplier") return suppliers;
    if (linkType === "purchase-order") return purchaseOrders;
    return [];
  }, [clients, estimates, invoices, linkType, projects, purchaseOrders, suppliers]);

  const composeAvailableRecords = useMemo((): GenericRecord[] => {
    if (!composeLinkType) return [];
    if (composeLinkType === "project") return projects.map((p) => ({ id: p.id, label: `${p.id} · ${p.name}`, href: p.href }));
    if (composeLinkType === "estimate") return estimates.map((e) => ({ id: e.id, label: `${e.id} · ${e.name}`, href: e.href }));
    if (composeLinkType === "client") return clients;
    if (composeLinkType === "invoice") return invoices;
    if (composeLinkType === "supplier") return suppliers;
    if (composeLinkType === "purchase-order") return purchaseOrders;
    return [];
  }, [clients, composeLinkType, estimates, invoices, projects, purchaseOrders, suppliers]);

  const suggestedLinks = useMemo(
    () => collectSuggestions(selectedMessage, projects, estimates, clients, suppliers, invoices, purchaseOrders, linkedRecordsForSelectedMessage),
    [selectedMessage, projects, estimates, clients, suppliers, invoices, purchaseOrders, linkedRecordsForSelectedMessage]
  );

  const filteredMessages = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return visibleMessages;

    return visibleMessages.filter((message) => {
      const fields = [
        message.subject,
        message.bodyPreview,
        message.from?.name,
        message.from?.address,
        ...(messageLinks[message.id]?.links || []).map((entry) => entry.label),
      ]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase());

      return fields.some((field) => field.includes(query));
    });
  }, [messageLinks, search, visibleMessages]);

  const resetCompose = () => {
    setComposeTo("");
    setComposeCc("");
    setComposeSubject("");
    setComposeBody("");
    setComposeAttachments([]);
    setComposeLinkType("");
    setComposeLinkRecordId("");
  };

  const loadFolders = async () => {
    setLoadingFolders(true);
    setError("");

    try {
      const response = await fetch(`/api/mail/folders?${selectedMailbox ? `mailbox=${encodeURIComponent(selectedMailbox)}` : ""}`, { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to load mailbox folders");
        return;
      }

      const loadedFolders = (data.folders || []) as MailFolder[];
      setFolders(loadedFolders);

      const inbox = loadedFolders.find((folder) => (folder.wellKnownName || "").toLowerCase() === "inbox");
      setSelectedFolderId((current) => current || inbox?.id || loadedFolders[0]?.id || "");
    } catch (loadError) {
      console.error(loadError);
      setError("Failed to load mailbox folders");
    } finally {
      setLoadingFolders(false);
    }
  };

  const loadMessages = async (folderId: string) => {
    if (!folderId) return;

    setLoadingMessages(true);
    setError("");

    try {
      const response = await fetch(`/api/mail/messages?folderId=${encodeURIComponent(folderId)}&top=50${mailboxQuery}`, {
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to load messages");
        setMessages([]);
        return;
      }

      const loaded = ((data.messages || []) as MailMessageSummary[]).map((message) => ({
        ...message,
        folderId,
        folderName: selectedFolder?.wellKnownName,
        mailbox: selectedMailbox || undefined,
      }));
      setMessages(loaded);
      setSelectedMessageId((current) => {
        if (current && loaded.some((message) => message.id === current)) return current;
        return loaded[0]?.id || "";
      });
    } catch (loadError) {
      console.error(loadError);
      setError("Failed to load messages");
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const loadMessage = async (messageId: string) => {
    if (!messageId) {
      setSelectedMessage(null);
      setAttachments([]);
      return;
    }

    setLoadingMessage(true);
    setLoadingAttachments(true);
    setError("");

    try {
      const [messageResponse, attachmentResponse] = await Promise.all([
        fetch(`/api/mail/messages/${encodeURIComponent(messageId)}?${selectedMailbox ? `mailbox=${encodeURIComponent(selectedMailbox)}` : ""}`, { cache: "no-store" }),
        fetch(`/api/mail/messages/${encodeURIComponent(messageId)}/attachments?${selectedMailbox ? `mailbox=${encodeURIComponent(selectedMailbox)}` : ""}`, { cache: "no-store" }),
      ]);

      const messageData = await messageResponse.json();
      const attachmentData = await attachmentResponse.json();

      if (!messageResponse.ok) {
        setError(messageData.error || "Failed to load message");
        return;
      }

      const hydratedMessage = {
        ...(messageData.message as MailMessageDetail),
        folderId: selectedFolderId || undefined,
        folderName: selectedFolder?.wellKnownName,
        mailbox: selectedMailbox || undefined,
      };
      setSelectedMessage(hydratedMessage);
      setAttachments(attachmentResponse.ok ? ((attachmentData.attachments || []) as MailAttachment[]) : []);

      if (hydratedMessage.conversationId) {
        inheritConversationLinks(messageId, {
          folderId: selectedFolderId || undefined,
          folderName: selectedFolder?.wellKnownName,
          mailbox: selectedMailbox || undefined,
          subject: hydratedMessage.subject || "(No subject)",
          bodyPreview: hydratedMessage.bodyPreview,
          receivedDateTime: hydratedMessage.receivedDateTime,
          isRead: hydratedMessage.isRead,
          hasAttachments: hydratedMessage.hasAttachments,
          importance: hydratedMessage.importance,
          conversationId: hydratedMessage.conversationId,
          internetMessageId: hydratedMessage.internetMessageId,
          from: hydratedMessage.from,
        });
      }

      const matchingRules = getMatchingEmailRules(
        emailRules,
        {
          messageId,
          folderId: selectedFolderId || undefined,
          folderName: selectedFolder?.wellKnownName,
          mailbox: selectedMailbox || undefined,
          subject: hydratedMessage.subject || "(No subject)",
          bodyPreview: hydratedMessage.bodyPreview,
          receivedDateTime: hydratedMessage.receivedDateTime,
          isRead: hydratedMessage.isRead,
          hasAttachments: hydratedMessage.hasAttachments,
          importance: hydratedMessage.importance,
          conversationId: hydratedMessage.conversationId,
          internetMessageId: hydratedMessage.internetMessageId,
          from: hydratedMessage.from,
        },
        selectedMailbox
      );

      if (matchingRules.length > 0) {
        matchingRules.forEach((rule) => {
          addLinkToMessage(messageId, {
            folderId: selectedFolderId || undefined,
            folderName: selectedFolder?.wellKnownName,
            mailbox: selectedMailbox || undefined,
            subject: hydratedMessage.subject || "(No subject)",
            bodyPreview: hydratedMessage.bodyPreview,
            receivedDateTime: hydratedMessage.receivedDateTime,
            isRead: hydratedMessage.isRead,
            hasAttachments: hydratedMessage.hasAttachments,
            importance: hydratedMessage.importance,
            conversationId: hydratedMessage.conversationId,
            internetMessageId: hydratedMessage.internetMessageId,
            from: hydratedMessage.from,
          }, {
            type: rule.recordType,
            recordId: rule.recordId,
            label: rule.recordLabel,
            href: rule.recordHref,
          });

          void logEmailAudit({
            action: "auto-link",
            actorEmail: user?.email,
            actorName: user?.name,
            mailbox: selectedMailbox || undefined,
            messageId,
            subject: hydratedMessage.subject,
            recordType: rule.recordType,
            recordId: rule.recordId,
            detail: `Rule applied: ${rule.name}`,
          });
        });
        setMessageLinks(getEmailLinksFromStorage());
      }

      void logEmailAudit({
        action: "view-message",
        actorEmail: user?.email,
        actorName: user?.name,
        mailbox: selectedMailbox || undefined,
        messageId,
        subject: hydratedMessage.subject,
        detail: "Opened email preview",
      });
    } catch (loadError) {
      console.error(loadError);
      setError("Failed to load message");
    } finally {
      setLoadingMessage(false);
      setLoadingAttachments(false);
    }
  };

  useEffect(() => {
    if (mailboxParam) {
      setSelectedMailbox(mailboxParam);
    }
  }, [mailboxParam]);

  useEffect(() => {
    void loadFolders();
    setProjects(buildProjects());
    setEstimates(buildEstimates());
    setClients(buildClients());
    setSuppliers(buildSuppliers());
    setInvoices(buildInvoices());
    setPurchaseOrders(buildPurchaseOrders());
    setSharedMailboxes(getSharedMailboxesFromStorage());
    setEmailRules(getEmailRulesFromStorage());
    setApprovalItems(getEmailApprovalsFromStorage());
    setAuditEntries(getEmailAuditFromStorage());
    setMessageLinks(getEmailLinksFromStorage());

    // Hydrate from server then refresh local cache
    void syncEmailLinksFromServer().then(async () => {
      await migrateLegacyInvoiceLinks();
      setMessageLinks(getEmailLinksFromStorage());
    });
    void syncSharedMailboxesFromServer().then(setSharedMailboxes);
    void syncEmailRulesFromServer().then(setEmailRules);
    void syncEmailApprovalsFromServer().then(setApprovalItems);
    void syncEmailAuditFromServer().then(setAuditEntries);
    void syncSavedEmailAttachmentsFromServer();

    const handleStorage = () => {
      setMessageLinks(getEmailLinksFromStorage());
      setEmailRules(getEmailRulesFromStorage());
      setSharedMailboxes(getSharedMailboxesFromStorage());
      setApprovalItems(getEmailApprovalsFromStorage());
      setAuditEntries(getEmailAuditFromStorage());
      setSuppliers(buildSuppliers());
      setPurchaseOrders(buildPurchaseOrders());
    };
    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleStorage);
    };
  }, [selectedMailbox]);

  useEffect(() => {
    if (!isRecordFocused && selectedFolderId) {
      void loadMessages(selectedFolderId);
    }
  }, [isRecordFocused, selectedFolderId, selectedMailbox]);

  useEffect(() => {
    if (messageIdParam) {
      setSelectedMessageId(messageIdParam);
      return;
    }

    if (isRecordFocused && recordFocusedMessages.length > 0) {
      setSelectedMessageId((current) =>
        current && recordFocusedMessages.some((message) => message.id === current)
          ? current
          : recordFocusedMessages[0].id
      );
    }
  }, [isRecordFocused, messageIdParam, recordFocusedMessages]);

  useEffect(() => {
    if (selectedMessageId) {
      void loadMessage(selectedMessageId);
    }
  }, [selectedMessageId]);

  useEffect(() => {
    setSelectedRecordId("");
  }, [linkType, selectedMessageId]);

  const sendMessage = async () => {
    if (!composeTo.trim() || !composeSubject.trim() || !composeBody.trim()) {
      setError("To, subject, and body are required");
      return;
    }

    setSending(true);
    setError("");

    try {
      const response = await fetch("/api/mail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mailbox: selectedMailbox || undefined,
          to: splitRecipients(composeTo),
          cc: splitRecipients(composeCc),
          subject: composeSubject,
          body: composeBody,
          bodyType: "text",
          attachments: composeAttachments.map((file) => ({
            name: file.name,
            contentType: file.contentType,
            contentBytes: file.contentBytes,
          })),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Failed to send message");
        return;
      }

      // Capture compose-link values before resetCompose clears them
      const capturedSubject = composeSubject.trim();
      const capturedLinkType = composeLinkType;
      const capturedLinkRecordId = composeLinkRecordId;
      const capturedLinkLabel = composeAvailableRecords.find((r) => r.id === composeLinkRecordId)?.label || composeLinkRecordId;
      const capturedLinkHref = composeAvailableRecords.find((r) => r.id === composeLinkRecordId)?.href || "#";

      setShowCompose(false);
      resetCompose();

      const sentFolder = folders.find(
        (folder) => (folder.wellKnownName || "").toLowerCase() === "sentitems"
      );

      // Auto-link the sent message to a record if one was selected
      if (capturedLinkType && capturedLinkRecordId) {
        const targetLink = {
          type: capturedLinkType,
          recordId: capturedLinkRecordId,
          label: capturedLinkLabel,
          href: capturedLinkHref,
        };

        // Give Exchange a moment to save the sent item, then look it up
        setTimeout(async () => {
          try {
            const sentFolderId = sentFolder?.id;
            if (!sentFolderId) return;
            const response = await fetch(
              `/api/mail/messages?folderId=${encodeURIComponent(sentFolderId)}&top=5`,
              { cache: "no-store" }
            );
            if (!response.ok) return;
            const data = (await response.json()) as { messages?: MailMessageSummary[] };
            const match = (data.messages || []).find(
              (m) => (m.subject || "").toLowerCase() === capturedSubject.toLowerCase()
            );
            if (match) {
              addLinkToMessage(
                match.id,
                {
                  folderId: sentFolderId,
                  folderName: "sentitems",
                  mailbox: selectedMailbox || undefined,
                  subject: match.subject || capturedSubject,
                  bodyPreview: match.bodyPreview,
                  receivedDateTime: match.receivedDateTime,
                  isRead: match.isRead,
                  hasAttachments: match.hasAttachments,
                  importance: match.importance,
                  conversationId: match.conversationId,
                  from: match.from,
                },
                targetLink
              );
              setMessageLinks(getEmailLinksFromStorage());
              void logEmailAudit({
                action: "link-message",
                actorEmail: user?.email,
                actorName: user?.name,
                mailbox: selectedMailbox || undefined,
                messageId: match.id,
                subject: match.subject,
                recordType: targetLink.type,
                recordId: targetLink.recordId,
                detail: "Auto-linked sent email from compose action",
              });
            }
          } catch {
            // Auto-link failed silently
          }
        }, 3000);
      }

      if (sentFolder) {
        setSelectedFolderId(sentFolder.id);
      } else {
        await loadMessages(selectedFolderId);
      }
    } catch (sendError) {
      console.error(sendError);
      setError("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const sendReply = async () => {
    if (!selectedMessage || !replyText.trim()) {
      setError("Reply text is required");
      return;
    }

    setReplying(true);
    setError("");

    try {
      const response = await fetch(`/api/mail/reply/${encodeURIComponent(selectedMessage.id)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: replyText, mailbox: selectedMailbox || undefined }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Failed to send reply");
        return;
      }

      setShowReply(false);
      setReplyText("");
    } catch (replyError) {
      console.error(replyError);
      setError("Failed to send reply");
    } finally {
      setReplying(false);
    }
  };

  const toggleReadState = async (message: MailMessageSummary | MailMessageDetail) => {
    try {
      const response = await fetch(`/api/mail/messages/${encodeURIComponent(message.id)}/read`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: !message.isRead, mailbox: selectedMailbox || undefined }),
      });

      if (!response.ok) return;

      setMessages((previous) =>
        previous.map((entry) => (entry.id === message.id ? { ...entry, isRead: !entry.isRead } : entry))
      );
      setSelectedMessage((previous) =>
        previous?.id === message.id ? { ...previous, isRead: !previous.isRead } : previous
      );
    } catch (toggleError) {
      console.error(toggleError);
    }
  };

  const deleteMessage = async () => {
    if (!selectedMessageId || !window.confirm("Delete this message?")) return;

    setDeleting(true);
    setError("");

    try {
      const response = await fetch(`/api/mail/messages/${encodeURIComponent(selectedMessageId)}/delete${selectedMailbox ? `?mailbox=${encodeURIComponent(selectedMailbox)}` : ""}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to delete message");
        return;
      }

      const remaining = messages.filter((message) => message.id !== selectedMessageId);
      setMessages(remaining);
      setSelectedMessageId(remaining[0]?.id || "");
      setSelectedMessage(null);
      setAttachments([]);
    } catch (deleteError) {
      console.error(deleteError);
      setError("Failed to delete message");
    } finally {
      setDeleting(false);
    }
  };

  const handleAddRecordLink = (candidate?: LinkCandidate) => {
    if (!selectedMessageId) return;

    const record =
      candidate ||
      availableLinkRecords.find((entry) => entry.id === selectedRecordId)
        ? {
            type: candidate?.type || linkType,
            recordId: candidate?.recordId || selectedRecordId,
            label:
              candidate?.label ||
              availableLinkRecords.find((entry) => entry.id === selectedRecordId)?.label ||
              "",
            href:
              candidate?.href ||
              availableLinkRecords.find((entry) => entry.id === selectedRecordId)?.href ||
              "",
          }
        : null;

    if (!record?.recordId || !record.label || !record.href) return;
    if (!selectedMessage) return;

    setLinking(true);
    addLinkToMessage(
      selectedMessageId,
      {
        folderId: selectedFolderId || undefined,
        folderName: selectedFolder?.wellKnownName,
        mailbox: selectedMailbox || undefined,
        subject: selectedMessage.subject || "(No subject)",
        bodyPreview: selectedMessage.bodyPreview,
        receivedDateTime: selectedMessage.receivedDateTime,
        isRead: selectedMessage.isRead,
        hasAttachments: selectedMessage.hasAttachments,
        importance: selectedMessage.importance,
        conversationId: selectedMessage.conversationId,
        internetMessageId: selectedMessage.internetMessageId,
        from: selectedMessage.from,
      },
      record
    );
    setMessageLinks(getEmailLinksFromStorage());
    setSelectedRecordId("");
    setLinking(false);
    void logEmailAudit({
      action: "link-message",
      actorEmail: user?.email,
      actorName: user?.name,
      mailbox: selectedMailbox || undefined,
      messageId: selectedMessageId,
      subject: selectedMessage.subject,
      recordType: record.type,
      recordId: record.recordId,
      detail: "Manual link added",
    });
  };

  const handleRemoveLink = (linkId: string) => {
    if (!selectedMessageId) return;
    const existingLink = linkedRecordsForSelectedMessage.find((link) => link.id === linkId);
    removeLinkFromMessage(selectedMessageId, linkId);
    setMessageLinks(getEmailLinksFromStorage());
    void logEmailAudit({
      action: "remove-link",
      actorEmail: user?.email,
      actorName: user?.name,
      mailbox: selectedMailbox || undefined,
      messageId: selectedMessageId,
      subject: selectedMessage?.subject,
      recordType: existingLink?.type,
      recordId: existingLink?.recordId,
      detail: "Link removed",
    });
  };

  const handleLinkThread = () => {
    if (!selectedMessage?.conversationId || !selectedMessageId || linkedRecordsForSelectedMessage.length === 0) return;

    visibleMessages
      .filter((message) => message.conversationId === selectedMessage.conversationId)
      .forEach((message) => {
        linkedRecordsForSelectedMessage.forEach((link) => {
          addLinkToMessage(
            message.id,
            {
              folderId: message.folderId,
              folderName: message.folderName,
              mailbox: message.mailbox || selectedMailbox || undefined,
              subject: message.subject,
              bodyPreview: message.bodyPreview,
              receivedDateTime: message.receivedDateTime,
              isRead: message.isRead,
              hasAttachments: message.hasAttachments,
              importance: message.importance,
              conversationId: message.conversationId,
              from: message.from,
            },
            {
              type: link.type,
              recordId: link.recordId,
              label: link.label,
              href: link.href,
            }
          );
        });
      });

    setMessageLinks(getEmailLinksFromStorage());
    void logEmailAudit({
      action: "link-thread",
      actorEmail: user?.email,
      actorName: user?.name,
      mailbox: selectedMailbox || undefined,
      messageId: selectedMessageId,
      subject: selectedMessage.subject,
      detail: `Linked entire thread (${visibleMessages.filter((message) => message.conversationId === selectedMessage.conversationId).length} messages)`,
    });
  };

  const handleCreateTask = () => {
    if (!selectedMessage) return;
    setCreatingTask(true);
    const primaryLink = linkedRecordsForSelectedMessage[0];
    const task = createTaskFromEmail({
      title: selectedMessage.subject || "Follow up email",
      description: selectedMessage.bodyPreview || "Created from linked email",
      project: primaryLink?.label || formatAddress(selectedMessage.from) || "General",
      assignee: user?.name || "Unassigned",
      priority: selectedMessage.importance === "high" ? "High" : "Medium",
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      tags: ["Email", selectedMessage.hasAttachments ? "Attachment" : "Follow-up"],
      source: "email",
      sourceMessageId: selectedMessage.id,
      sourceRecordType: primaryLink?.type,
      sourceRecordId: primaryLink?.recordId,
    });
    setCreatingTask(false);
    void logEmailAudit({
      action: "create-task",
      actorEmail: user?.email,
      actorName: user?.name,
      mailbox: selectedMailbox || undefined,
      messageId: selectedMessage.id,
      subject: selectedMessage.subject,
      recordType: primaryLink?.type,
      recordId: primaryLink?.recordId,
      detail: `Task created: ${task.id}`,
    });
  };

  const handleSaveAttachment = async (attachment: MailAttachment) => {
    if (!selectedMessage || linkedRecordsForSelectedMessage.length === 0) return;
    const target = linkedRecordsForSelectedMessage[0];
    setSavingAttachmentId(attachment.id);
    await saveEmailAttachmentRecord({
      messageId: selectedMessage.id,
      messageSubject: selectedMessage.subject || "(No subject)",
      attachmentId: attachment.id,
      name: attachment.name,
      contentType: attachment.contentType,
      size: attachment.size,
      mailbox: selectedMailbox || undefined,
      contentBytes: (attachment as MailAttachment & { contentBytes?: string }).contentBytes,
      recordType: target.type,
      recordId: target.recordId,
      recordLabel: target.label,
    });
    setSavingAttachmentId("");
    void logEmailAudit({
      action: "save-attachment",
      actorEmail: user?.email,
      actorName: user?.name,
      mailbox: selectedMailbox || undefined,
      messageId: selectedMessage.id,
      subject: selectedMessage.subject,
      recordType: target.type,
      recordId: target.recordId,
      detail: `Saved attachment ${attachment.name}`,
    });
  };

  const handleSendToApproval = async () => {
    if (!selectedMessage) return;
    const target = linkedRecordsForSelectedMessage.find((link) => link.type === "invoice" || link.type === "purchase-order");
    if (!target) {
      setError("Link the email to an invoice or purchase order before routing it for approval");
      return;
    }
    setSendingApproval(true);
    await createEmailApproval({
      type: target.type === "invoice" ? "invoice" : target.type === "purchase-order" ? "purchase-order" : "generic",
      recordType: target.type,
      recordId: target.recordId,
      recordLabel: target.label,
      messageId: selectedMessage.id,
      messageSubject: selectedMessage.subject || "(No subject)",
      requestedBy: user?.name,
      approver: target.type === "invoice" ? "Commercial Manager" : "Procurement Lead",
      notes: `Created from mailbox correspondence${selectedMailbox ? ` (${selectedMailbox})` : ""}`,
      mailbox: selectedMailbox || undefined,
    });
    setApprovalItems(getEmailApprovalsFromStorage());
    setSendingApproval(false);
    void logEmailAudit({
      action: "send-approval",
      actorEmail: user?.email,
      actorName: user?.name,
      mailbox: selectedMailbox || undefined,
      messageId: selectedMessage.id,
      subject: selectedMessage.subject,
      recordType: target.type,
      recordId: target.recordId,
      detail: "Routed to approval queue",
    });
  };

  const handleCreateSenderRule = async () => {
    if (!selectedMessage || linkedRecordsForSelectedMessage.length === 0) return;
    const target = linkedRecordsForSelectedMessage[0];
    const senderDomain = getSenderDomain({ from: selectedMessage.from });
    const senderAddress = selectedMessage.from?.address;
    if (!senderDomain && !senderAddress) return;
    const created = await createEmailRule({
      name: `${target.label} auto-link rule`,
      enabled: true,
      mailbox: selectedMailbox || undefined,
      senderDomain: senderDomain || undefined,
      senderContains: !senderDomain ? senderAddress : undefined,
      subjectIncludes: "",
      bodyIncludes: "",
      recordType: target.type,
      recordId: target.recordId,
      recordLabel: target.label,
      recordHref: target.href,
      applyToThread: true,
      priority: 50,
    });
    if (created) {
      setEmailRules(getEmailRulesFromStorage());
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Mail"
        subtitle={
          isRecordFocused && recordTypeParam && recordIdParam
            ? `Dedicated email workspace · filtered to ${recordTypeParam} ${recordIdParam}`
            : "Dedicated company email workspace with project and estimate linking"
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <select
              value={selectedMailbox}
              onChange={(event) => {
                setSelectedMailbox(event.target.value);
                setSelectedFolderId("");
                void logEmailAudit({
                  action: "switch-mailbox",
                  actorEmail: user?.email,
                  actorName: user?.name,
                  mailbox: event.target.value || undefined,
                  detail: event.target.value ? `Switched to ${event.target.value}` : "Switched to personal mailbox",
                });
              }}
              className="rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white"
            >
              <option value="">My mailbox</option>
              {sharedMailboxes.map((mailbox) => (
                <option key={mailbox.id} value={mailbox.address}>
                  {mailbox.displayName}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                setShowCompose(true);
                setShowReply(false);
              }}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
            >
              Compose
            </button>
            <button
              onClick={() => {
                void loadFolders();
                if (selectedFolderId) void loadMessages(selectedFolderId);
              }}
              className="rounded-lg border border-gray-600 px-4 py-2 text-sm text-gray-200 hover:bg-gray-700"
            >
              Refresh
            </button>
            <Link
              href="/chat"
              className="rounded-lg border border-gray-600 px-4 py-2 text-sm text-gray-200 hover:bg-gray-700"
            >
              Chat
            </Link>
            {canManageMailSetup && (
              <Link
                href="/settings?tab=admin"
                className="rounded-lg border border-gray-600 px-4 py-2 text-sm text-gray-200 hover:bg-gray-700"
              >
                Mail settings
              </Link>
            )}
          </div>
        }
      />

      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <section className="grid gap-4 xl:grid-cols-[260px_minmax(340px,420px)_minmax(420px,1fr)]">
        <aside className="app-panel p-4">
          <div className="mb-4 rounded-xl border border-gray-700/70 bg-gray-900/40 p-3">
            <p className="text-[11px] uppercase tracking-[0.24em] text-gray-400">Mailbox</p>
            <p className="mt-2 text-2xl font-semibold text-white">{visibleMessages.length}</p>
            <p className="text-sm text-gray-400">
              {isRecordFocused
                ? `linked emails for ${recordTypeParam} ${recordIdParam}`
                : `messages in ${selectedFolder?.displayName || "current folder"}`}
            </p>
          </div>

          {isRecordFocused && recordTypeParam && recordIdParam && (
            <div className="mb-4 rounded-xl border border-orange-400/30 bg-orange-500/10 p-3 text-sm text-orange-100">
              <p className="font-semibold">Correspondence view active</p>
              <p className="mt-1 text-orange-100/80">Showing emails linked to {recordTypeParam} {recordIdParam}.</p>
              <Link href="/mail" className="mt-2 inline-block text-xs font-semibold text-orange-200 underline">
                Clear filter
              </Link>
            </div>
          )}

          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-300">Folders</h2>
            {selectedFolder?.wellKnownName && (
              <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase ${pillTone(selectedFolder.wellKnownName)}`}>
                {selectedFolder.wellKnownName}
              </span>
            )}
          </div>

          {loadingFolders ? (
            <p className="text-sm text-gray-400">Loading folders…</p>
          ) : (
            <div className="space-y-1.5">
              {folders.map((folder) => {
                const selected = folder.id === selectedFolderId;
                return (
                  <button
                    key={folder.id}
                    onClick={() => setSelectedFolderId(folder.id)}
                    className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                      selected
                        ? "border-orange-400/60 bg-orange-500/10"
                        : "border-gray-700/70 bg-gray-900/25 hover:bg-gray-800/50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-white">{folder.displayName}</span>
                      <span className="rounded-full bg-gray-700/70 px-2 py-0.5 text-[11px] text-gray-200">
                        {folder.unreadItemCount}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-400">{folder.totalItemCount} total items</p>
                  </button>
                );
              })}
            </div>
          )}

          <div className="mt-4 rounded-xl border border-gray-700/70 bg-gray-900/30 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-400">Mail controls</p>
            <p className="mt-2 text-xs text-gray-400">
              {canManageMailSetup
                ? "Admin setup for shared mailboxes and permissions is in User Settings."
                : "Approval queue and linked-email controls are available based on your permissions."}
            </p>
            <div className="mt-3 flex flex-col gap-2">
              {canManageMailSetup && (
                <Link href="/settings?tab=admin" className="rounded-lg border border-gray-600 px-3 py-2 text-xs font-semibold text-gray-100 hover:bg-gray-700">
                  Open admin settings
                </Link>
              )}
              <Link href="/approvals" className="rounded-lg border border-purple-500/30 px-3 py-2 text-xs font-semibold text-purple-200 hover:bg-purple-500/10">
                Open approvals queue
              </Link>
            </div>
          </div>
        </aside>

        <section className="app-panel overflow-hidden">
          <div className="border-b border-gray-700/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-gray-400">Conversation list</p>
                <h2 className="mt-1 text-lg font-semibold text-white">
                  {isRecordFocused ? "Linked correspondence" : selectedFolder?.displayName || "Messages"}
                </h2>
              </div>
              <span className="rounded-full border border-gray-600 px-2 py-1 text-xs text-gray-300">
                {filteredMessages.length} shown
              </span>
            </div>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search subject, sender, content or linked record"
              className="mt-4 w-full rounded-xl border border-gray-700 bg-gray-900/70 px-4 py-2.5 text-sm text-white"
            />
          </div>

          <div className="max-h-[72vh] overflow-auto p-3">
            {loadingMessages ? (
              <p className="p-3 text-sm text-gray-400">Loading messages…</p>
            ) : filteredMessages.length === 0 ? (
              <p className="p-3 text-sm text-gray-400">No messages found.</p>
            ) : (
              <div className="space-y-2">
                {filteredMessages.map((message) => {
                  const selected = message.id === selectedMessageId;
                  const links = messageLinks[message.id]?.links || [];
                  const threadLinks = message.conversationId ? getLinksForConversation(message.conversationId) : [];

                  return (
                    <button
                      key={message.id}
                      onClick={() => {
                        setSelectedMessageId(message.id);
                        setShowReply(false);
                      }}
                      className={`w-full rounded-2xl border p-4 text-left transition ${
                        selected
                          ? "border-orange-400/60 bg-orange-500/10"
                          : "border-gray-700/70 bg-gray-900/25 hover:bg-gray-800/45"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            {!message.isRead && <span className="h-2.5 w-2.5 rounded-full bg-orange-400" />}
                            <p className={`truncate text-sm ${message.isRead ? "text-gray-100" : "font-semibold text-white"}`}>
                              {message.subject || "(No subject)"}
                            </p>
                            {message.hasAttachments && <span className="text-xs text-gray-400">📎</span>}
                          </div>
                          <p className="mt-1 truncate text-xs text-gray-400">{formatAddress(message.from) || "Unknown sender"}</p>
                          <p className="mt-2 line-clamp-2 text-xs text-gray-300">{message.bodyPreview || "No preview available."}</p>
                          {(links.length > 0 || threadLinks.length > 0) && (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {(links.length > 0 ? links : threadLinks).slice(0, 2).map((link) => (
                                <span
                                  key={`${link.id}-${message.id}`}
                                  className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2 py-1 text-[10px] font-medium text-emerald-200"
                                >
                                  {link.type}: {link.recordId}
                                </span>
                              ))}
                              {links.length === 0 && threadLinks.length > 0 && (
                                <span className="rounded-full border border-sky-400/20 bg-sky-500/10 px-2 py-1 text-[10px] text-sky-200">
                                  Thread-linked
                                </span>
                              )}
                              {(links.length > 2 || threadLinks.length > 2) && (
                                <span className="rounded-full border border-gray-600 px-2 py-1 text-[10px] text-gray-300">
                                  +{Math.max(links.length, threadLinks.length) - 2} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] text-gray-400">{formatRelativeDate(message.receivedDateTime)}</p>
                          {message.importance === "high" && (
                            <span className="mt-2 inline-block rounded-full bg-red-500/15 px-2 py-1 text-[10px] uppercase text-red-200">
                              High
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className="app-panel overflow-hidden">
          {!selectedMessageId ? (
            <div className="flex h-full min-h-[60vh] items-center justify-center p-8 text-sm text-gray-400">
              Select a message to view it.
            </div>
          ) : loadingMessage ? (
            <div className="flex h-full min-h-[60vh] items-center justify-center p-8 text-sm text-gray-400">
              Loading message…
            </div>
          ) : !selectedMessage ? (
            <div className="flex h-full min-h-[60vh] items-center justify-center p-8 text-sm text-gray-400">
              Unable to load the selected message.
            </div>
          ) : (
            <div className="grid h-full min-h-[72vh] lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="border-b border-gray-700/70 lg:border-b-0 lg:border-r lg:border-gray-700/70">
                <div className="border-b border-gray-700/70 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-gray-400">Email preview</p>
                      <h2 className="mt-2 text-2xl font-semibold text-white">{selectedMessage.subject || "(No subject)"}</h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedMessage.conversationId && linkedRecordsForSelectedMessage.length > 0 && (
                        <button
                          onClick={handleLinkThread}
                          className="rounded-lg border border-sky-500/40 px-3 py-2 text-xs text-sky-200 hover:bg-sky-500/10"
                        >
                          Link thread
                        </button>
                      )}
                      <button
                        onClick={handleCreateTask}
                        disabled={creatingTask}
                        className="rounded-lg border border-gray-600 px-3 py-2 text-xs text-gray-200 hover:bg-gray-700 disabled:opacity-50"
                      >
                        {creatingTask ? "Creating task…" : "Create task"}
                      </button>
                      <button
                        onClick={() => void handleSendToApproval()}
                        disabled={sendingApproval}
                        className="rounded-lg border border-purple-500/40 px-3 py-2 text-xs text-purple-200 hover:bg-purple-500/10 disabled:opacity-50"
                      >
                        {sendingApproval ? "Routing…" : "Send to approval"}
                      </button>
                      <button
                        onClick={() => {
                          setShowReply(true);
                          setReplyText("");
                          setShowCompose(false);
                        }}
                        className="rounded-lg bg-orange-500 px-3 py-2 text-xs font-semibold text-white hover:bg-orange-600"
                      >
                        Reply
                      </button>
                      <button
                        onClick={() => void toggleReadState(selectedMessage)}
                        className="rounded-lg border border-gray-600 px-3 py-2 text-xs text-gray-200 hover:bg-gray-700"
                      >
                        Mark as {selectedMessage.isRead ? "Unread" : "Read"}
                      </button>
                      <button
                        onClick={() => void deleteMessage()}
                        disabled={deleting}
                        className="rounded-lg border border-red-600 px-3 py-2 text-xs text-red-200 hover:bg-red-700/20 disabled:opacity-50"
                      >
                        {deleting ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 text-sm text-gray-300">
                    <p><span className="text-gray-500">From:</span> {formatAddress(selectedMessage.from) || "—"}</p>
                    <p><span className="text-gray-500">To:</span> {(selectedMessage.toRecipients || []).map(formatAddress).filter(Boolean).join(", ") || "—"}</p>
                    <p><span className="text-gray-500">Cc:</span> {(selectedMessage.ccRecipients || []).map(formatAddress).filter(Boolean).join(", ") || "—"}</p>
                    <p><span className="text-gray-500">Received:</span> {formatDate(selectedMessage.receivedDateTime) || "—"}</p>
                  </div>
                </div>

                <div className="space-y-4 p-5">
                  {!canViewSensitiveContent && (
                    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
                      Sensitive correspondence is redacted. Ask an authorised user with document, invoice, procurement, or client permissions for full content.
                    </div>
                  )}

                  {showReply && (
                    <div className="rounded-2xl border border-gray-700 bg-gray-900/50 p-4">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-300">Reply</p>
                      <textarea
                        value={replyText}
                        onChange={(event) => setReplyText(event.target.value)}
                        rows={5}
                        placeholder="Write your reply"
                        className="w-full rounded-xl border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white"
                      />
                      <div className="mt-3 flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setShowReply(false);
                            setReplyText("");
                          }}
                          className="rounded-lg border border-gray-600 px-3 py-2 text-xs text-gray-200 hover:bg-gray-700"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => void sendReply()}
                          disabled={replying}
                          className="rounded-lg bg-orange-500 px-3 py-2 text-xs font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
                        >
                          {replying ? "Sending…" : "Send Reply"}
                        </button>
                      </div>
                    </div>
                  )}

                  {attachments.length > 0 && (
                    <div className="rounded-2xl border border-gray-700 bg-gray-900/35 p-4">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-300">
                        Attachments {loadingAttachments ? "· Loading…" : ""}
                      </p>
                      <div className="space-y-2">
                        {attachments.map((attachment) => (
                          <div
                            key={attachment.id}
                            className="flex items-center justify-between gap-3 rounded-xl border border-gray-700 bg-gray-800/50 px-3 py-2 text-sm text-gray-200"
                          >
                            <div className="min-w-0 flex-1">
                              <span className="truncate">📎 {attachment.name}</span>
                              <p className="text-xs text-gray-400">{formatFileSize(attachment.size)}</p>
                            </div>
                            <button
                              onClick={() => void handleSaveAttachment(attachment)}
                              disabled={!canViewSensitiveContent || linkedRecordsForSelectedMessage.length === 0 || savingAttachmentId === attachment.id}
                              className="rounded-lg border border-gray-600 px-2.5 py-1.5 text-[11px] text-gray-200 hover:bg-gray-700 disabled:opacity-50"
                            >
                              {savingAttachmentId === attachment.id ? "Saving…" : "Save to record"}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="rounded-2xl border border-gray-700 bg-gray-900/30 p-4">
                    <pre className="whitespace-pre-wrap text-sm leading-6 text-gray-100">
                      {canViewSensitiveContent ? (toPlainText(selectedMessage.body) || selectedMessage.bodyPreview || "(No body)") : (selectedMessage.bodyPreview || "Message preview hidden")}
                    </pre>
                  </div>
                </div>
              </div>

              <aside className="space-y-4 p-5">
                <div className="rounded-2xl border border-gray-700 bg-gray-900/35 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-400">Linked records</p>
                  <p className="mt-2 text-sm text-gray-300">
                    Emails can now link at thread level, auto-link from rules, create tasks, route invoice/PO approvals, and save attachments to records.
                  </p>

                  <div className="mt-4 space-y-2">
                    {linkedRecordsForSelectedMessage.length === 0 ? (
                      <p className="text-sm text-gray-400">No links yet.</p>
                    ) : (
                      linkedRecordsForSelectedMessage.map((link) => (
                        <div key={link.id} className="rounded-xl border border-gray-700 bg-gray-800/60 p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-xs uppercase tracking-wide text-gray-500">{link.type}</p>
                              <p className="mt-1 text-sm font-medium text-white">{link.label}</p>
                            </div>
                            <button
                              onClick={() => handleRemoveLink(link.id)}
                              className="text-xs text-red-300 hover:text-red-200"
                            >
                              Remove
                            </button>
                          </div>
                          <Link href={link.href} className="mt-2 inline-block text-xs text-orange-300 hover:text-orange-200">
                            Open record →
                          </Link>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {selectedMessage.conversationId && getLinksForConversation(selectedMessage.conversationId).length > linkedRecordsForSelectedMessage.length && (
                  <div className="rounded-2xl border border-sky-400/20 bg-sky-500/10 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">Thread context</p>
                    <p className="mt-2 text-sm text-sky-50">
                      {getLinksForConversation(selectedMessage.conversationId).length} linked records exist on this thread.
                    </p>
                    <button onClick={handleLinkThread} className="mt-3 rounded-lg bg-sky-500 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-600">
                      Apply thread links to visible messages
                    </button>
                  </div>
                )}

                <div className="rounded-2xl border border-gray-700 bg-gray-900/35 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-400">Add link</p>
                  <div className="mt-3 space-y-2">
                    <select
                      value={linkType}
                      onChange={(event) => setLinkType(event.target.value as EmailLinkedRecordType)}
                      className="w-full rounded-xl border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white"
                    >
                      {LINK_TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <select
                      value={selectedRecordId}
                      onChange={(event) => setSelectedRecordId(event.target.value)}
                      className="w-full rounded-xl border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white"
                    >
                      <option value="">Select {linkType}</option>
                      {availableLinkRecords.map((record) => (
                        <option key={record.id} value={record.id}>
                          {record.label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleAddRecordLink()}
                      disabled={!selectedRecordId || linking}
                      className="w-full rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
                    >
                      Link to {linkType}
                    </button>
                  </div>
                </div>

                {suggestedLinks.length > 0 && (
                  <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200">Suggested matches</p>
                    <div className="mt-3 space-y-2">
                      {suggestedLinks.slice(0, 4).map((candidate) => (
                        <div key={`${candidate.type}:${candidate.recordId}`} className="rounded-xl border border-emerald-400/20 bg-black/10 p-3">
                          <p className="text-xs uppercase tracking-wide text-emerald-100">{candidate.type}</p>
                          <p className="mt-1 text-sm text-white">{candidate.label}</p>
                          <p className="mt-1 text-[11px] text-emerald-100/80">{candidate.reason} · score {candidate.score || 0}</p>
                          <div className="mt-2 flex gap-2">
                            <button
                              onClick={() => handleAddRecordLink(candidate)}
                              className="rounded-lg bg-emerald-500 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600"
                            >
                              Link
                            </button>
                            <Link href={candidate.href} className="rounded-lg border border-emerald-300/30 px-2.5 py-1.5 text-xs text-emerald-50 hover:bg-emerald-500/10">
                              Open
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedMessage.from?.address && linkedRecordsForSelectedMessage.length > 0 && (
                  <div className="rounded-2xl border border-indigo-400/20 bg-indigo-500/10 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-200">Inbound auto-link rule</p>
                    <p className="mt-2 text-sm text-indigo-50">Create a rule to auto-link future inbound mail from this sender/domain.</p>
                    <button onClick={() => void handleCreateSenderRule()} className="mt-3 rounded-lg bg-indigo-500 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-600">
                      Create sender rule
                    </button>
                  </div>
                )}

                {approvalItems.length > 0 && (
                  <div className="rounded-2xl border border-purple-400/20 bg-purple-500/10 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-purple-200">Approval queue</p>
                    <div className="mt-3 space-y-2">
                      {approvalItems.slice(0, 3).map((item) => (
                        <div key={item.id} className="rounded-xl border border-purple-400/20 bg-black/10 p-3">
                          <p className="text-xs uppercase tracking-wide text-purple-100">{item.type}</p>
                          <p className="mt-1 text-sm text-white">{item.recordLabel}</p>
                          <p className="mt-1 text-[11px] text-purple-100/80">{item.status} · {item.approver || "Approver pending"}</p>
                        </div>
                      ))}
                      <Link href="/approvals" className="inline-block text-xs font-semibold text-purple-100 underline">Open approvals →</Link>
                    </div>
                  </div>
                )}

                {auditEntries.length > 0 && (
                  <div className="rounded-2xl border border-gray-700 bg-gray-900/35 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-400">Audit trail</p>
                    <div className="mt-3 space-y-2">
                      {auditEntries.slice(0, 5).map((entry) => (
                        <div key={entry.id} className="rounded-lg border border-gray-700 bg-gray-800/50 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-medium text-white">{entry.action}</p>
                            <span className="text-[11px] text-gray-500">{formatRelativeDate(entry.at)}</span>
                          </div>
                          <p className="mt-1 text-[11px] text-gray-400">{entry.detail || entry.subject || "Email action"}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </aside>
            </div>
          )}
        </section>
      </section>

      {showCompose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4">
          <div className="w-full max-w-4xl rounded-2xl border border-gray-600 bg-[#1f232a] shadow-2xl shadow-black/40">
            <div className="flex items-center justify-between border-b border-gray-700/70 px-5 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-gray-400">New message</p>
                <h3 className="mt-1 text-lg font-semibold text-white">Compose email</h3>
              </div>
              <button
                onClick={() => {
                  setShowCompose(false);
                  resetCompose();
                }}
                className="rounded-lg border border-gray-600 px-3 py-2 text-xs text-gray-200 hover:bg-gray-700"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 p-5">
              <input
                value={composeTo}
                onChange={(event) => setComposeTo(event.target.value)}
                placeholder="To (comma or semicolon separated)"
                className="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-2.5 text-sm text-white"
              />
              <input
                value={composeCc}
                onChange={(event) => setComposeCc(event.target.value)}
                placeholder="Cc (optional)"
                className="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-2.5 text-sm text-white"
              />
              <input
                value={composeSubject}
                onChange={(event) => setComposeSubject(event.target.value)}
                placeholder="Subject"
                className="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-2.5 text-sm text-white"
              />
              <textarea
                value={composeBody}
                onChange={(event) => setComposeBody(event.target.value)}
                rows={14}
                placeholder="Write your email"
                className="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-sm text-white"
              />

              <div className="rounded-2xl border border-gray-700 bg-gray-900/35 p-4">
                <p className="mb-3 text-sm font-semibold text-white">Link this email to a record <span className="text-xs font-normal text-gray-400">(optional)</span></p>
                <div className="flex gap-2">
                  <select
                    value={composeLinkType}
                    onChange={(e) => { setComposeLinkType(e.target.value as EmailLinkedRecordType | ""); setComposeLinkRecordId(""); }}
                    className="flex-1 rounded-xl border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white"
                  >
                    <option value="">No link</option>
                    {LINK_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  {composeLinkType && (
                    <select
                      value={composeLinkRecordId}
                      onChange={(e) => setComposeLinkRecordId(e.target.value)}
                      className="flex-1 rounded-xl border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white"
                    >
                      <option value="">Select {composeLinkType}</option>
                      {composeAvailableRecords.map((r) => (
                        <option key={r.id} value={r.id}>{r.label}</option>
                      ))}
                    </select>
                  )}
                </div>
                {composeLinkType && composeLinkRecordId && (
                  <p className="mt-2 text-xs text-emerald-300">✓ Sent email will be auto-linked to this record.</p>
                )}
              </div>

              <div className="rounded-2xl border border-gray-700 bg-gray-900/35 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">Attachments</p>
                    <p className="text-xs text-gray-400">Upload files to send with this message</p>
                  </div>
                  <label className="cursor-pointer rounded-lg border border-gray-600 px-3 py-2 text-xs text-gray-200 hover:bg-gray-700">
                    Add files
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={async (event) => {
                        const uploaded = await filesToComposeAttachments(event.target.files);
                        setComposeAttachments((previous) => [...previous, ...uploaded]);
                        event.currentTarget.value = "";
                      }}
                    />
                  </label>
                </div>

                {composeAttachments.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {composeAttachments.map((file) => (
                      <button
                        key={file.id}
                        onClick={() => setComposeAttachments((previous) => previous.filter((entry) => entry.id !== file.id))}
                        className="rounded-lg border border-gray-600 px-3 py-1.5 text-xs text-gray-200 hover:bg-gray-700"
                      >
                        {file.name} · {formatFileSize(file.size)} ✕
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-gray-400">No attachments added.</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-gray-700/70 px-5 py-4">
              <button
                onClick={() => {
                  setShowCompose(false);
                  resetCompose();
                }}
                className="rounded-lg border border-gray-600 px-4 py-2 text-sm text-gray-200 hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => void sendMessage()}
                disabled={sending}
                className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
              >
                {sending ? "Sending…" : "Send email"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
