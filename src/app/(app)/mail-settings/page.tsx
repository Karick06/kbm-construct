"use client";

import { useEffect, useMemo, useState } from "react";
import PermissionGuard from "@/components/PermissionGuard";
import PageHeader from "@/components/PageHeader";
import {
  createEmailRule,
  deleteEmailRule,
  getEmailRulesFromStorage,
  syncEmailRulesFromServer,
  type EmailAutoLinkRule,
} from "@/lib/email-rules";
import {
  createSharedMailbox,
  deleteSharedMailbox,
  getSharedMailboxesFromStorage,
  syncSharedMailboxesFromServer,
  type SharedMailbox,
} from "@/lib/shared-mailboxes";
import {
  getEmailApprovalsFromStorage,
  syncEmailApprovalsFromServer,
  updateEmailApprovalStatus,
  type EmailApprovalItem,
} from "@/lib/email-approvals";
import { getEmailAuditFromStorage, syncEmailAuditFromServer, type EmailAuditEntry } from "@/lib/email-audit";
import { type EmailLinkedRecordType } from "@/lib/email-links";

const RECORD_TYPE_OPTIONS: EmailLinkedRecordType[] = [
  "project",
  "estimate",
  "client",
  "supplier",
  "invoice",
  "purchase-order",
];

export default function MailSettingsPage() {
  const [mailboxes, setMailboxes] = useState<SharedMailbox[]>([]);
  const [rules, setRules] = useState<EmailAutoLinkRule[]>([]);
  const [approvals, setApprovals] = useState<EmailApprovalItem[]>([]);
  const [audit, setAudit] = useState<EmailAuditEntry[]>([]);

  const [mailboxName, setMailboxName] = useState("");
  const [mailboxAddress, setMailboxAddress] = useState("");

  const [ruleName, setRuleName] = useState("");
  const [ruleMailbox, setRuleMailbox] = useState("");
  const [ruleSenderDomain, setRuleSenderDomain] = useState("");
  const [ruleSenderContains, setRuleSenderContains] = useState("");
  const [ruleSubjectIncludes, setRuleSubjectIncludes] = useState("");
  const [ruleBodyIncludes, setRuleBodyIncludes] = useState("");
  const [ruleRecordType, setRuleRecordType] = useState<EmailLinkedRecordType>("project");
  const [ruleRecordId, setRuleRecordId] = useState("");
  const [ruleRecordLabel, setRuleRecordLabel] = useState("");
  const [ruleRecordHref, setRuleRecordHref] = useState("/projects");
  const [rulePriority, setRulePriority] = useState(50);

  useEffect(() => {
    setMailboxes(getSharedMailboxesFromStorage());
    setRules(getEmailRulesFromStorage());
    setApprovals(getEmailApprovalsFromStorage());
    setAudit(getEmailAuditFromStorage());

    void syncSharedMailboxesFromServer().then(setMailboxes);
    void syncEmailRulesFromServer().then(setRules);
    void syncEmailApprovalsFromServer().then(setApprovals);
    void syncEmailAuditFromServer().then(setAudit);

    const refresh = () => {
      setMailboxes(getSharedMailboxesFromStorage());
      setRules(getEmailRulesFromStorage());
      setApprovals(getEmailApprovalsFromStorage());
      setAudit(getEmailAuditFromStorage());
    };

    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  const pendingApprovals = useMemo(() => approvals.filter((item) => item.status === "pending"), [approvals]);

  const addMailbox = async () => {
    if (!mailboxName.trim() || !mailboxAddress.trim()) return;
    await createSharedMailbox({
      displayName: mailboxName.trim(),
      address: mailboxAddress.trim(),
      enabled: true,
    });
    setMailboxes(getSharedMailboxesFromStorage());
    setMailboxName("");
    setMailboxAddress("");
  };

  const addRule = async () => {
    if (!ruleName.trim() || !ruleRecordId.trim() || !ruleRecordLabel.trim() || !ruleRecordHref.trim()) return;

    await createEmailRule({
      name: ruleName.trim(),
      enabled: true,
      mailbox: ruleMailbox.trim() || undefined,
      senderDomain: ruleSenderDomain.trim() || undefined,
      senderContains: ruleSenderContains.trim() || undefined,
      subjectIncludes: ruleSubjectIncludes.trim() || undefined,
      bodyIncludes: ruleBodyIncludes.trim() || undefined,
      recordType: ruleRecordType,
      recordId: ruleRecordId.trim(),
      recordLabel: ruleRecordLabel.trim(),
      recordHref: ruleRecordHref.trim(),
      applyToThread: true,
      priority: rulePriority,
    });

    setRules(getEmailRulesFromStorage());
    setRuleName("");
    setRuleMailbox("");
    setRuleSenderDomain("");
    setRuleSenderContains("");
    setRuleSubjectIncludes("");
    setRuleBodyIncludes("");
    setRuleRecordId("");
    setRuleRecordLabel("");
    setRuleRecordHref("/projects");
    setRulePriority(50);
  };

  return (
    <PermissionGuard permission="user_management">
      <div className="space-y-6">
        <PageHeader
          title="Mail Settings"
          subtitle="Admin setup for shared mailboxes, automation rules, approvals, and audit"
        />

        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-gray-700/50 bg-gray-800/60 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-gray-400">Shared mailboxes</p>
            <p className="mt-2 text-3xl font-semibold text-white">{mailboxes.length}</p>
          </div>
          <div className="rounded-xl border border-gray-700/50 bg-gray-800/60 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-gray-400">Auto-link rules</p>
            <p className="mt-2 text-3xl font-semibold text-emerald-300">{rules.length}</p>
          </div>
          <div className="rounded-xl border border-gray-700/50 bg-gray-800/60 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-gray-400">Pending approvals</p>
            <p className="mt-2 text-3xl font-semibold text-amber-300">{pendingApprovals.length}</p>
          </div>
          <div className="rounded-xl border border-gray-700/50 bg-gray-800/60 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-gray-400">Audit events</p>
            <p className="mt-2 text-3xl font-semibold text-sky-300">{audit.length}</p>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-gray-700/50 bg-gray-800/60 p-5">
            <h2 className="text-lg font-semibold text-white">Shared mailboxes</h2>
            <div className="mt-4 space-y-2">
              {mailboxes.length === 0 ? (
                <p className="text-sm text-gray-400">No shared mailboxes configured.</p>
              ) : (
                mailboxes.map((mailbox) => (
                  <div key={mailbox.id} className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-900/30 p-3">
                    <div>
                      <p className="text-sm font-medium text-white">{mailbox.displayName}</p>
                      <p className="text-xs text-gray-400">{mailbox.address}</p>
                    </div>
                    <button
                      onClick={() => void deleteSharedMailbox(mailbox.id).then(() => setMailboxes(getSharedMailboxesFromStorage()))}
                      className="rounded border border-red-500/40 px-2 py-1 text-xs text-red-200 hover:bg-red-500/10"
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 grid gap-2">
              <input
                value={mailboxName}
                onChange={(event) => setMailboxName(event.target.value)}
                placeholder="Mailbox label"
                className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white"
              />
              <input
                value={mailboxAddress}
                onChange={(event) => setMailboxAddress(event.target.value)}
                placeholder="mailbox@company.com"
                className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white"
              />
              <button
                onClick={() => void addMailbox()}
                className="rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-600"
              >
                Add mailbox
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-gray-700/50 bg-gray-800/60 p-5">
            <h2 className="text-lg font-semibold text-white">Create auto-link rule</h2>
            <div className="mt-4 grid gap-2">
              <input
                value={ruleName}
                onChange={(event) => setRuleName(event.target.value)}
                placeholder="Rule name"
                className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white"
              />
              <select
                value={ruleMailbox}
                onChange={(event) => setRuleMailbox(event.target.value)}
                className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white"
              >
                <option value="">Any mailbox</option>
                {mailboxes.map((mailbox) => (
                  <option key={mailbox.id} value={mailbox.address}>{mailbox.displayName}</option>
                ))}
              </select>
              <input
                value={ruleSenderDomain}
                onChange={(event) => setRuleSenderDomain(event.target.value)}
                placeholder="Sender domain (optional)"
                className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white"
              />
              <input
                value={ruleSenderContains}
                onChange={(event) => setRuleSenderContains(event.target.value)}
                placeholder="Sender contains (optional)"
                className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white"
              />
              <input
                value={ruleSubjectIncludes}
                onChange={(event) => setRuleSubjectIncludes(event.target.value)}
                placeholder="Subject includes (optional)"
                className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white"
              />
              <input
                value={ruleBodyIncludes}
                onChange={(event) => setRuleBodyIncludes(event.target.value)}
                placeholder="Body includes (optional)"
                className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white"
              />
              <select
                value={ruleRecordType}
                onChange={(event) => setRuleRecordType(event.target.value as EmailLinkedRecordType)}
                className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white"
              >
                {RECORD_TYPE_OPTIONS.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <input
                value={ruleRecordId}
                onChange={(event) => setRuleRecordId(event.target.value)}
                placeholder="Record ID"
                className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white"
              />
              <input
                value={ruleRecordLabel}
                onChange={(event) => setRuleRecordLabel(event.target.value)}
                placeholder="Record label"
                className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white"
              />
              <input
                value={ruleRecordHref}
                onChange={(event) => setRuleRecordHref(event.target.value)}
                placeholder="Record href"
                className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white"
              />
              <input
                type="number"
                value={rulePriority}
                onChange={(event) => setRulePriority(Number(event.target.value || 50))}
                placeholder="Priority"
                className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white"
              />
              <button
                onClick={() => void addRule()}
                className="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
              >
                Save rule
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-gray-700/50 bg-gray-800/60 p-5">
          <h2 className="text-lg font-semibold text-white">Active rules</h2>
          <div className="mt-4 space-y-2">
            {rules.length === 0 ? (
              <p className="text-sm text-gray-400">No rules yet.</p>
            ) : (
              rules.map((rule) => (
                <div key={rule.id} className="flex items-start justify-between rounded-lg border border-gray-700 bg-gray-900/30 p-3">
                  <div>
                    <p className="text-sm font-medium text-white">{rule.name}</p>
                    <p className="text-xs text-gray-400">
                      {rule.recordType}:{rule.recordId} · {rule.senderDomain || rule.senderContains || rule.subjectIncludes || "custom"}
                    </p>
                  </div>
                  <button
                    onClick={() => void deleteEmailRule(rule.id).then(() => setRules(getEmailRulesFromStorage()))}
                    className="rounded border border-red-500/40 px-2 py-1 text-xs text-red-200 hover:bg-red-500/10"
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-gray-700/50 bg-gray-800/60 p-5">
            <h2 className="text-lg font-semibold text-white">Approval queue</h2>
            <div className="mt-4 space-y-2">
              {approvals.length === 0 ? (
                <p className="text-sm text-gray-400">No approval items.</p>
              ) : (
                approvals.slice(0, 12).map((item) => (
                  <div key={item.id} className="rounded-lg border border-gray-700 bg-gray-900/30 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-white">{item.recordLabel}</p>
                        <p className="text-xs text-gray-400">{item.type} · {item.status}</p>
                      </div>
                      {item.status === "pending" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => void updateEmailApprovalStatus(item.id, "approved").then(() => setApprovals(getEmailApprovalsFromStorage()))}
                            className="rounded bg-emerald-500 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-600"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => void updateEmailApprovalStatus(item.id, "rejected").then(() => setApprovals(getEmailApprovalsFromStorage()))}
                            className="rounded border border-red-500/40 px-2 py-1 text-xs text-red-200 hover:bg-red-500/10"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl border border-gray-700/50 bg-gray-800/60 p-5">
            <h2 className="text-lg font-semibold text-white">Audit trail</h2>
            <div className="mt-4 space-y-2">
              {audit.length === 0 ? (
                <p className="text-sm text-gray-400">No audit events yet.</p>
              ) : (
                audit.slice(0, 20).map((entry) => (
                  <div key={entry.id} className="rounded-lg border border-gray-700 bg-gray-900/30 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-300">{entry.action}</p>
                      <p className="text-[11px] text-gray-500">{new Date(entry.at).toLocaleString("en-GB")}</p>
                    </div>
                    <p className="mt-1 text-xs text-gray-400">{entry.detail || entry.subject || "—"}</p>
                    {(entry.recordType || entry.recordId) && (
                      <p className="mt-1 text-[11px] text-gray-500">{entry.recordType}:{entry.recordId}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </PermissionGuard>
  );
}
