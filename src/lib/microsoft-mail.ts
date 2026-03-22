type GraphMessageAddress = {
  name?: string;
  address?: string;
};

export type MailFolderSummary = {
  id: string;
  displayName: string;
  totalItemCount: number;
  unreadItemCount: number;
  wellKnownName?: string;
};

export type MailMessageSummary = {
  id: string;
  subject: string;
  bodyPreview?: string;
  receivedDateTime?: string;
  isRead?: boolean;
  hasAttachments?: boolean;
  importance?: string;
  conversationId?: string;
  from?: GraphMessageAddress;
  toRecipients?: GraphMessageAddress[];
};

export type MailMessageDetail = MailMessageSummary & {
  body?: {
    contentType?: "text" | "html";
    content?: string;
  };
  ccRecipients?: GraphMessageAddress[];
  internetMessageId?: string;
};

export type MailAttachment = {
  id: string;
  name: string;
  contentType?: string;
  size?: number;
  isInline?: boolean;
  contentBytes?: string;
};

export type CalendarEventSummary = {
  id: string;
  subject: string;
  start?: string;
  end?: string;
  location?: string;
  organizer?: GraphMessageAddress;
  isAllDay?: boolean;
};

export type CalendarEventInput = {
  subject: string;
  body?: string;
  start: string;
  end: string;
  location?: string;
  attendees?: MailSendRecipient[];
};

export type ContactSummary = {
  id: string;
  displayName: string;
  emailAddresses: GraphMessageAddress[];
  businessPhones?: string[];
  mobilePhone?: string;
  companyName?: string;
};

export type ContactInput = {
  givenName?: string;
  surname?: string;
  displayName: string;
  emailAddresses: MailSendRecipient[];
  businessPhones?: string[];
  mobilePhone?: string;
  companyName?: string;
};

type MailFileAttachmentInput = {
  name: string;
  contentType?: string;
  contentBytes: string;
};

type MailSendRecipient = {
  name?: string;
  address: string;
};

export type MailComposeInput = {
  subject: string;
  body: string;
  bodyType?: "text" | "html";
  to: MailSendRecipient[];
  cc?: MailSendRecipient[];
  attachments?: MailFileAttachmentInput[];
};

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

function graphMailboxPath(mailbox: string | undefined, resourcePath: string) {
  const normalizedMailbox = String(mailbox || "").trim();
  const base = normalizedMailbox ? `/users/${encodeURIComponent(normalizedMailbox)}` : "/me";
  return `${base}${resourcePath}`;
}

function mapGraphAddress(entry: any): GraphMessageAddress {
  if (!entry?.emailAddress) return {};
  return {
    name: entry.emailAddress.name,
    address: entry.emailAddress.address,
  };
}

function toGraphRecipients(recipients: MailSendRecipient[] = []) {
  return recipients
    .map((recipient) => ({
      emailAddress: {
        name: recipient.name || recipient.address,
        address: recipient.address,
      },
    }))
    .filter((recipient) => Boolean(recipient.emailAddress.address));
}

async function graphRequest<T>(accessToken: string, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${GRAPH_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    let message = `Graph request failed (${response.status})`;
    try {
      const payload = await response.json();
      message = payload?.error?.message || message;
    } catch {
      // no-op
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
}

export async function listMailFolders(accessToken: string, mailbox?: string): Promise<MailFolderSummary[]> {
  const payload = await graphRequest<{ value: any[] }>(
    accessToken,
    `${graphMailboxPath(mailbox, "/mailFolders")}?$top=50&$select=id,displayName,totalItemCount,unreadItemCount,wellKnownName`
  );

  const orderedWellKnown = ["inbox", "sentitems", "drafts", "archive", "deleteditems"];

  return payload.value
    .map((folder) => ({
      id: folder.id,
      displayName: folder.displayName,
      totalItemCount: folder.totalItemCount || 0,
      unreadItemCount: folder.unreadItemCount || 0,
      wellKnownName: folder.wellKnownName,
    }))
    .sort((left, right) => {
      const leftIndex = orderedWellKnown.indexOf((left.wellKnownName || "").toLowerCase());
      const rightIndex = orderedWellKnown.indexOf((right.wellKnownName || "").toLowerCase());
      const l = leftIndex === -1 ? 999 : leftIndex;
      const r = rightIndex === -1 ? 999 : rightIndex;
      if (l !== r) return l - r;
      return left.displayName.localeCompare(right.displayName);
    });
}

export async function listFolderMessages(
  accessToken: string,
  folderId: string,
  top = 30,
  mailbox?: string
): Promise<MailMessageSummary[]> {
  const encodedFolderId = encodeURIComponent(folderId);
  const payload = await graphRequest<{ value: any[] }>(
    accessToken,
    `${graphMailboxPath(mailbox, `/mailFolders/${encodedFolderId}/messages`)}?$top=${top}&$orderby=receivedDateTime desc&$select=id,subject,from,toRecipients,receivedDateTime,isRead,bodyPreview,importance,hasAttachments,conversationId`
  );

  return payload.value.map((message) => ({
    id: message.id,
    subject: message.subject || "(No subject)",
    bodyPreview: message.bodyPreview,
    receivedDateTime: message.receivedDateTime,
    isRead: message.isRead,
    hasAttachments: message.hasAttachments,
    importance: message.importance,
    conversationId: message.conversationId,
    from: mapGraphAddress(message.from),
    toRecipients: (message.toRecipients || []).map(mapGraphAddress),
  }));
}

export async function getMessageById(accessToken: string, messageId: string, mailbox?: string): Promise<MailMessageDetail> {
  const encodedMessageId = encodeURIComponent(messageId);
  const message = await graphRequest<any>(
    accessToken,
    `${graphMailboxPath(mailbox, `/messages/${encodedMessageId}`)}?$select=id,subject,from,toRecipients,ccRecipients,receivedDateTime,isRead,bodyPreview,importance,hasAttachments,body,internetMessageId,conversationId`
  );

  return {
    id: message.id,
    subject: message.subject || "(No subject)",
    bodyPreview: message.bodyPreview,
    receivedDateTime: message.receivedDateTime,
    isRead: message.isRead,
    hasAttachments: message.hasAttachments,
    importance: message.importance,
    conversationId: message.conversationId,
    from: mapGraphAddress(message.from),
    toRecipients: (message.toRecipients || []).map(mapGraphAddress),
    ccRecipients: (message.ccRecipients || []).map(mapGraphAddress),
    body: message.body,
    internetMessageId: message.internetMessageId,
  };
}

export async function listMessageAttachments(accessToken: string, messageId: string, mailbox?: string): Promise<MailAttachment[]> {
  const encodedMessageId = encodeURIComponent(messageId);
  const payload = await graphRequest<{ value: any[] }>(
    accessToken,
    `${graphMailboxPath(mailbox, `/messages/${encodedMessageId}/attachments`)}?$select=id,name,contentType,size,isInline,contentBytes`
  );

  return payload.value
    .filter((attachment) => attachment["@odata.type"] === "#microsoft.graph.fileAttachment" || attachment.contentBytes)
    .map((attachment) => ({
      id: attachment.id,
      name: attachment.name,
      contentType: attachment.contentType,
      size: attachment.size,
      isInline: attachment.isInline,
      contentBytes: attachment.contentBytes,
    }));
}

export async function sendNewMessage(accessToken: string, payload: MailComposeInput, mailbox?: string): Promise<void> {
  await graphRequest(
    accessToken,
    graphMailboxPath(mailbox, "/sendMail"),
    {
      method: "POST",
      body: JSON.stringify({
        message: {
          subject: payload.subject,
          body: {
            contentType: payload.bodyType === "text" ? "Text" : "HTML",
            content: payload.body,
          },
          toRecipients: toGraphRecipients(payload.to),
          ccRecipients: toGraphRecipients(payload.cc),
          attachments: (payload.attachments || []).map((attachment) => ({
            "@odata.type": "#microsoft.graph.fileAttachment",
            name: attachment.name,
            contentType: attachment.contentType || "application/octet-stream",
            contentBytes: attachment.contentBytes,
          })),
        },
        saveToSentItems: true,
      }),
    }
  );
}

export async function replyToMessage(accessToken: string, messageId: string, replyBody: string, mailbox?: string): Promise<void> {
  const encodedMessageId = encodeURIComponent(messageId);
  await graphRequest(
    accessToken,
    graphMailboxPath(mailbox, `/messages/${encodedMessageId}/reply`),
    {
      method: "POST",
      body: JSON.stringify({
        comment: replyBody,
      }),
    }
  );
}

export async function setMessageReadState(accessToken: string, messageId: string, isRead: boolean, mailbox?: string): Promise<void> {
  const encodedMessageId = encodeURIComponent(messageId);
  await graphRequest(
    accessToken,
    graphMailboxPath(mailbox, `/messages/${encodedMessageId}`),
    {
      method: "PATCH",
      body: JSON.stringify({ isRead }),
    }
  );
}

export async function deleteMessage(accessToken: string, messageId: string, mailbox?: string): Promise<void> {
  const encodedMessageId = encodeURIComponent(messageId);
  await graphRequest(
    accessToken,
    graphMailboxPath(mailbox, `/messages/${encodedMessageId}`),
    {
      method: "DELETE",
    }
  );
}

export async function listCalendarEvents(accessToken: string, startDateTime?: string, endDateTime?: string): Promise<CalendarEventSummary[]> {
  const params = new URLSearchParams();
  if (startDateTime) params.set("startDateTime", startDateTime);
  if (endDateTime) params.set("endDateTime", endDateTime);

  const path = params.toString()
    ? `/me/calendarView?${params.toString()}&$top=50&$orderby=start/dateTime&$select=id,subject,start,end,location,organizer,isAllDay`
    : "/me/events?$top=50&$orderby=start/dateTime&$select=id,subject,start,end,location,organizer,isAllDay";

  const payload = await graphRequest<{ value: any[] }>(accessToken, path);

  return payload.value.map((event) => ({
    id: event.id,
    subject: event.subject || "(No subject)",
    start: event.start?.dateTime,
    end: event.end?.dateTime,
    location: event.location?.displayName,
    organizer: mapGraphAddress(event.organizer),
    isAllDay: event.isAllDay,
  }));
}

export async function createCalendarEvent(accessToken: string, event: CalendarEventInput): Promise<void> {
  await graphRequest(
    accessToken,
    "/me/events",
    {
      method: "POST",
      body: JSON.stringify({
        subject: event.subject,
        body: event.body
          ? {
              contentType: "Text",
              content: event.body,
            }
          : undefined,
        start: {
          dateTime: event.start,
          timeZone: "Europe/London",
        },
        end: {
          dateTime: event.end,
          timeZone: "Europe/London",
        },
        location: event.location
          ? {
              displayName: event.location,
            }
          : undefined,
        attendees: toGraphRecipients(event.attendees),
      }),
    }
  );
}

export async function listContacts(accessToken: string): Promise<ContactSummary[]> {
  const payload = await graphRequest<{ value: any[] }>(
    accessToken,
    "/me/contacts?$top=100&$orderby=displayName&$select=id,displayName,emailAddresses,businessPhones,mobilePhone,companyName,givenName,surname"
  );

  return payload.value.map((contact) => ({
    id: contact.id,
    displayName: contact.displayName || [contact.givenName, contact.surname].filter(Boolean).join(" ") || "Unnamed Contact",
    emailAddresses: (contact.emailAddresses || []).map((entry: any) => ({
      name: entry.name,
      address: entry.address,
    })),
    businessPhones: contact.businessPhones || [],
    mobilePhone: contact.mobilePhone,
    companyName: contact.companyName,
  }));
}

export async function createContact(accessToken: string, contact: ContactInput): Promise<void> {
  await graphRequest(
    accessToken,
    "/me/contacts",
    {
      method: "POST",
      body: JSON.stringify({
        givenName: contact.givenName,
        surname: contact.surname,
        displayName: contact.displayName,
        emailAddresses: contact.emailAddresses.map((entry) => ({
          name: entry.name || entry.address,
          address: entry.address,
        })),
        businessPhones: contact.businessPhones || [],
        mobilePhone: contact.mobilePhone,
        companyName: contact.companyName,
      }),
    }
  );
}