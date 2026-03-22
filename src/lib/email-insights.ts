import { getEmailLinksFromStorage, type EmailLinkedRecordType, type EmailMessageSnapshot } from "@/lib/email-links";

export type EmailRecordActivity = {
  total: number;
  unread: number;
  attachments: number;
  highImportance: number;
  lastInboundAt?: string;
  lastOutboundAt?: string;
  lastContactAt?: string;
  awaitingResponse: boolean;
  latestMessages: EmailMessageSnapshot[];
};

function sortByDate(messages: EmailMessageSnapshot[]) {
  return [...messages].sort((left, right) => new Date(right.receivedDateTime || 0).getTime() - new Date(left.receivedDateTime || 0).getTime());
}

export function getEmailActivityForRecord(recordType: EmailLinkedRecordType, recordId: string): EmailRecordActivity {
  const entries = Object.values(getEmailLinksFromStorage())
    .filter((entry) => entry.links.some((link) => link.type === recordType && link.recordId === recordId))
    .map((entry) => entry.message);

  const sorted = sortByDate(entries);
  const inbound = sorted.filter((message) => (message.folderName || "").toLowerCase() !== "sentitems");
  const outbound = sorted.filter((message) => (message.folderName || "").toLowerCase() === "sentitems");

  const lastInboundAt = inbound[0]?.receivedDateTime;
  const lastOutboundAt = outbound[0]?.receivedDateTime;
  const lastContactAt = sorted[0]?.receivedDateTime;
  const inboundTime = lastInboundAt ? new Date(lastInboundAt).getTime() : 0;
  const outboundTime = lastOutboundAt ? new Date(lastOutboundAt).getTime() : 0;
  const awaitingResponse = Boolean(lastInboundAt) && (!lastOutboundAt || inboundTime > outboundTime);

  return {
    total: sorted.length,
    unread: sorted.filter((message) => message.isRead === false).length,
    attachments: sorted.filter((message) => message.hasAttachments).length,
    highImportance: sorted.filter((message) => message.importance === "high").length,
    lastInboundAt,
    lastOutboundAt,
    lastContactAt,
    awaitingResponse,
    latestMessages: sorted.slice(0, 5),
  };
}
