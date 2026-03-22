"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PermissionGuard from "@/components/PermissionGuard";
import PageHeader from "@/components/PageHeader";
import { getEstimateJobsFromStorage } from "@/lib/enquiries-store";
import { getProjectsFromStorage } from "@/lib/operations-data";

type Supplier = {
  id: string;
  name: string;
  email: string;
  status: "Active" | "On Hold" | "Inactive";
};

type EnquiryItem = {
  id: string;
  itemCode: string;
  description: string;
  unit: string;
  quantity: number;
};

type DocumentAttachment = {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  dataUrl: string;
};

const defaultSuppliers: Supplier[] = [
  { id: "SUP-001", name: "ArcBuild Groundworks Ltd", email: "dave@arcbuild.co.uk", status: "Active" },
  { id: "SUP-002", name: "Northern Steel Fabricators", email: "sarah@northsteel.co.uk", status: "Active" },
  { id: "SUP-003", name: "Crestline MEP Solutions", email: "tom@crestlinemep.co.uk", status: "Active" },
  { id: "SUP-004", name: "Hartwood Joinery", email: "lisa@hartwood.co.uk", status: "On Hold" },
  { id: "SUP-005", name: "Peak Plant Hire", email: "mike@peakplant.co.uk", status: "Active" },
];

const templates = [
  {
    id: "material-basic",
    name: "Material RFQ",
    category: "materials" as const,
    description: "Material supply rates",
    items: [
      { id: crypto.randomUUID(), itemCode: "MAT-001", description: "Ready-mix concrete C32/40", unit: "m3", quantity: 100 },
    ],
  },
  {
    id: "plant-basic",
    name: "Plant Hire RFQ",
    category: "plant" as const,
    description: "Plant and operator rates",
    items: [
      { id: crypto.randomUUID(), itemCode: "PLT-001", description: "13T excavator", unit: "day", quantity: 20 },
    ],
  },
  {
    id: "labour-basic",
    name: "Labour Package RFQ",
    category: "labour" as const,
    description: "Labour-only rates",
    items: [
      { id: crypto.randomUUID(), itemCode: "LAB-001", description: "Groundworker gang", unit: "day", quantity: 30 },
    ],
  },
];

export default function NewSupplierEnquiryPage() {
  const router = useRouter();

  const [source, setSource] = useState<"project" | "overhead" | "estimate">("project");
  const [linkedId, setLinkedId] = useState("");
  const [templateId, setTemplateId] = useState("");

  const [title, setTitle] = useState("");
  const [enquiryType, setEnquiryType] = useState<"materials" | "plant" | "labour" | "subcontract">("materials");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");

  const [items, setItems] = useState<EnquiryItem[]>([]);
  const [documents, setDocuments] = useState<DocumentAttachment[]>([]);
  const [supplierPanelOpen, setSupplierPanelOpen] = useState(false);

  const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>([]);
  const [externalName, setExternalName] = useState("");
  const [externalEmail, setExternalEmail] = useState("");
  const [externalRecipients, setExternalRecipients] = useState<Array<{ id: string; supplierName: string; supplierEmail: string }>>([]);

  const [saving, setSaving] = useState(false);

  const suppliers = useMemo(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("kbm_suppliers") : null;
    const parsed = stored ? (JSON.parse(stored) as Supplier[]) : defaultSuppliers;
    return parsed.filter((supplier) => supplier.status === "Active");
  }, []);

  const projects = useMemo(
    () => getProjectsFromStorage().map((project) => ({
      id: project.id,
      name: `${project.projectName} (${project.id})`,
      address: [project.siteAddress.line1, project.siteAddress.city, project.siteAddress.postcode].filter(Boolean).join(", "),
    })),
    []
  );

  const estimates = useMemo(
    () => getEstimateJobsFromStorage().map((estimate) => ({
      id: estimate.id,
      name: `${estimate.projectName} (${estimate.id})`,
      address: estimate.projectAddress || "",
    })),
    []
  );

  const linkedOptions = source === "project" ? projects : source === "estimate" ? estimates : [];

  const selectedSupplierRecipients = suppliers
    .filter((supplier) => selectedSupplierIds.includes(supplier.id))
    .map((supplier) => ({
      supplierId: supplier.id,
      supplierName: supplier.name,
      supplierEmail: supplier.email,
    }));

  const allRecipients = [...selectedSupplierRecipients, ...externalRecipients];

  const applyTemplate = () => {
    const template = templates.find((entry) => entry.id === templateId);
    if (!template) return;
    setEnquiryType(template.category);
    setDescription(template.description);
    setItems(template.items.map((item) => ({ ...item, id: crypto.randomUUID() })));
  };

  const addManualItem = () => {
    setItems((previous) => [
      ...previous,
      { id: crypto.randomUUID(), itemCode: "", description: "", unit: "", quantity: 0 },
    ]);
  };

  const addRateLibraryItem = () => {
    const sampleByType: Record<typeof enquiryType, EnquiryItem> = {
      materials: { id: crypto.randomUUID(), itemCode: "MAT", description: "Material item", unit: "tonne", quantity: 1 },
      plant: { id: crypto.randomUUID(), itemCode: "PLT", description: "Plant hire item", unit: "day", quantity: 1 },
      labour: { id: crypto.randomUUID(), itemCode: "LAB", description: "Labour item", unit: "day", quantity: 1 },
      subcontract: { id: crypto.randomUUID(), itemCode: "SUB", description: "Subcontract package item", unit: "item", quantity: 1 },
    };

    setItems((previous) => [...previous, sampleByType[enquiryType]]);
  };

  const uploadDocuments = async (fileList: FileList | null) => {
    if (!fileList) return;
    const uploaded = await Promise.all(
      Array.from(fileList).map(
        (file) =>
          new Promise<DocumentAttachment>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              resolve({
                id: crypto.randomUUID(),
                fileName: file.name,
                fileType: file.type || "application/octet-stream",
                fileSize: file.size,
                uploadedAt: new Date().toISOString(),
                dataUrl: String(reader.result || ""),
              });
            };
            reader.readAsDataURL(file);
          })
      )
    );

    setDocuments((previous) => [...previous, ...uploaded]);
  };

  const addExternalRecipient = () => {
    const name = externalName.trim();
    const email = externalEmail.trim().toLowerCase();
    if (!name || !email) return;
    setExternalRecipients((previous) => [
      ...previous,
      { id: crypto.randomUUID(), supplierName: name, supplierEmail: email },
    ]);
    setExternalName("");
    setExternalEmail("");
  };

  const createEnquiry = async (sendNow: boolean) => {
    if (!title.trim()) {
      alert("Please enter an enquiry title");
      return;
    }

    if (items.length === 0) {
      alert("Please add at least one item");
      return;
    }

    if (sendNow && allRecipients.length === 0) {
      alert("Please select at least one supplier");
      return;
    }

    setSaving(true);

    const cleanItems = items
      .map((item) => ({
        id: item.id,
        itemCode: item.itemCode || undefined,
        description: item.description,
        unit: item.unit || "item",
        quantity: Number(item.quantity) || 0,
      }))
      .filter((item) => item.description.trim() && item.quantity > 0);

    if (cleanItems.length === 0) {
      alert("Please add valid item rows before saving");
      setSaving(false);
      return;
    }

    const linkedRecord = linkedOptions.find((option) => option.id === linkedId);

    const createResponse = await fetch("/api/supplier-enquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        category: enquiryType,
        linkedRecordType: source,
        linkedRecordId: linkedId || undefined,
        linkedRecordName: linkedRecord?.name,
        requiredBy: dueDate || undefined,
        notes: description || undefined,
        items: cleanItems,
        documents,
      }),
    });

    const created = await createResponse.json();
    if (!createResponse.ok) {
      alert(created.error || "Failed to create enquiry");
      setSaving(false);
      return;
    }

    if (!sendNow) {
      setSaving(false);
      router.push(`/supplier-portal/${created.id}`);
      return;
    }

    const sendResponse = await fetch(`/api/supplier-enquiries/${created.id}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipients: allRecipients,
      }),
    });

    const sendData = await sendResponse.json();
    if (!sendResponse.ok) {
      alert(sendData.error || "Failed to send enquiry");
      setSaving(false);
      return;
    }

    setSaving(false);
    router.push(`/supplier-portal/${created.id}`);
  };

  return (
    <PermissionGuard permission="procurement">
      <div className="mx-auto max-w-5xl space-y-6">
        <PageHeader
          title="New Supplier Enquiry"
          subtitle="Request quotes from multiple suppliers"
          actions={
            <button
              onClick={() => router.push("/supplier-portal")}
              className="rounded-lg border border-gray-600 px-4 py-2 text-sm text-gray-200 hover:bg-gray-800"
            >
              Back to List
            </button>
          }
        />

        <section className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-gray-700/50 bg-gray-800/80 p-4">
            <p className="text-xs uppercase text-gray-400">Items</p>
            <p className="mt-1 text-2xl font-bold text-white">{items.length}</p>
          </div>
          <div className="rounded-xl border border-gray-700/50 bg-gray-800/80 p-4">
            <p className="text-xs uppercase text-gray-400">Recipients</p>
            <p className="mt-1 text-2xl font-bold text-white">{allRecipients.length}</p>
          </div>
          <div className="rounded-xl border border-gray-700/50 bg-gray-800/80 p-4">
            <p className="text-xs uppercase text-gray-400">Status</p>
            <p className="mt-1 text-2xl font-bold text-white">Draft</p>
          </div>
        </section>

        <section className="rounded-xl border border-gray-700/50 bg-gray-800/70 p-5 space-y-4">
          <h2 className="text-xl font-semibold text-white">Enquiry Source</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {[
              { value: "project", title: "Project", sub: "Link to an active project" },
              { value: "overhead", title: "Overhead", sub: "Book costs to a location" },
              { value: "estimate", title: "Estimate", sub: "Link to a tender estimate" },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setSource(option.value as typeof source);
                  setLinkedId("");
                }}
                className={`rounded-xl border p-4 text-left transition ${
                  source === option.value ? "border-orange-500 bg-orange-500/10" : "border-gray-700 bg-gray-800"
                }`}
              >
                <p className="font-semibold text-white">{option.title}</p>
                <p className="text-xs text-gray-400">{option.sub}</p>
              </button>
            ))}
          </div>

          {source !== "overhead" && (
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">
                Select {source === "project" ? "Project" : "Estimate"}
              </label>
              <select
                value={linkedId}
                onChange={(event) => {
                  const value = event.target.value;
                  setLinkedId(value);
                  const selected = linkedOptions.find((option) => option.id === value);
                  if (selected?.address) setDeliveryAddress(selected.address);
                }}
                className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-white"
              >
                <option value="">Select...</option>
                {linkedOptions.map((option) => (
                  <option key={option.id} value={option.id}>{option.name}</option>
                ))}
              </select>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-gray-700/50 bg-gray-800/70 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Enquiry Template</h2>
            <button onClick={() => router.push("/library-templates")} className="text-sm text-orange-400 hover:text-orange-300">Manage templates</button>
          </div>
          <div className="flex flex-col gap-3 md:flex-row">
            <select
              value={templateId}
              onChange={(event) => setTemplateId(event.target.value)}
              className="flex-1 rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-white"
            >
              <option value="">No template</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>{template.name}</option>
              ))}
            </select>
            <button
              onClick={applyTemplate}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
            >
              Apply Template
            </button>
          </div>
        </section>

        <section className="rounded-xl border border-gray-700/50 bg-gray-800/70 p-5 space-y-4">
          <h2 className="text-xl font-semibold text-white">Enquiry Details</h2>
          <div className="space-y-3">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Concrete supplies for Phase 1"
              className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-white"
            />
            <div className="grid gap-3 md:grid-cols-2">
              <select
                value={enquiryType}
                onChange={(event) => setEnquiryType(event.target.value as typeof enquiryType)}
                className="rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-white"
              >
                <option value="materials">Material</option>
                <option value="plant">Plant</option>
                <option value="labour">Labour</option>
                <option value="subcontract">Subcontract</option>
              </select>
              <input
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                className="rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-white"
              />
            </div>
            <textarea
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Additional details for suppliers..."
              className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-white"
            />
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm text-gray-300">Site / Delivery Address (sent to suppliers)</label>
                <button
                  onClick={() => {
                    const selected = linkedOptions.find((option) => option.id === linkedId);
                    setDeliveryAddress(selected?.address || "");
                  }}
                  className="text-xs text-gray-400 hover:text-gray-200"
                >
                  Use project address
                </button>
              </div>
              <textarea
                rows={2}
                value={deliveryAddress}
                onChange={(event) => setDeliveryAddress(event.target.value)}
                placeholder="Select source to auto-fill, or type manually"
                className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-white"
              />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-gray-700/50 bg-gray-800/70 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Items to Quote</h2>
            <div className="flex gap-2">
              <button onClick={addRateLibraryItem} className="rounded-lg border border-gray-600 px-3 py-2 text-sm text-gray-200 hover:bg-gray-700">From Rate Library</button>
              <button onClick={addManualItem} className="rounded-lg border border-gray-600 px-3 py-2 text-sm text-gray-200 hover:bg-gray-700">+ Manual Entry</button>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-600 p-10 text-center text-gray-400">
              No items added yet
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="grid gap-2 md:grid-cols-12">
                  <input
                    value={item.itemCode}
                    onChange={(event) =>
                      setItems((previous) => previous.map((entry) => entry.id === item.id ? { ...entry, itemCode: event.target.value } : entry))
                    }
                    placeholder="Code"
                    className="md:col-span-2 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white"
                  />
                  <input
                    value={item.description}
                    onChange={(event) =>
                      setItems((previous) => previous.map((entry) => entry.id === item.id ? { ...entry, description: event.target.value } : entry))
                    }
                    placeholder="Description"
                    className="md:col-span-5 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white"
                  />
                  <input
                    value={item.unit}
                    onChange={(event) =>
                      setItems((previous) => previous.map((entry) => entry.id === item.id ? { ...entry, unit: event.target.value } : entry))
                    }
                    placeholder="Unit"
                    className="md:col-span-2 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white"
                  />
                  <input
                    type="number"
                    min={0}
                    value={item.quantity}
                    onChange={(event) =>
                      setItems((previous) => previous.map((entry) => entry.id === item.id ? { ...entry, quantity: Number(event.target.value) } : entry))
                    }
                    placeholder="Qty"
                    className="md:col-span-2 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white"
                  />
                  <button
                    onClick={() => setItems((previous) => previous.filter((entry) => entry.id !== item.id))}
                    className="md:col-span-1 rounded-lg bg-red-900/40 px-2 py-2 text-xs text-red-200 hover:bg-red-900/70"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-gray-700/50 bg-gray-800/70 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Documents & Attachments</h2>
            <label className="cursor-pointer rounded-lg border border-gray-600 px-3 py-2 text-sm text-gray-200 hover:bg-gray-700">
              Upload Files
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(event) => {
                  void uploadDocuments(event.target.files);
                  event.currentTarget.value = "";
                }}
              />
            </label>
          </div>

          {documents.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-600 p-10 text-center text-gray-400">
              No documents attached
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {documents.map((document) => (
                <button
                  key={document.id}
                  onClick={() => setDocuments((previous) => previous.filter((entry) => entry.id !== document.id))}
                  className="rounded border border-gray-600 px-3 py-1 text-xs text-gray-200 hover:bg-gray-700"
                >
                  {document.fileName} ✕
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-gray-700/50 bg-gray-800/70 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Select Suppliers</h2>
            <button
              onClick={() => setSupplierPanelOpen((previous) => !previous)}
              className="rounded-lg border border-gray-600 px-3 py-2 text-sm text-gray-200 hover:bg-gray-700"
            >
              {supplierPanelOpen ? "Hide suppliers" : "Select suppliers"}
            </button>
          </div>

          <div className="rounded-lg border border-gray-700 bg-gray-900/40 p-4 text-sm text-gray-300">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-blue-900/40 px-2 py-1 text-xs text-blue-300">{selectedSupplierRecipients.length} suppliers</span>
              <span className="rounded-full bg-yellow-900/40 px-2 py-1 text-xs text-yellow-300">{externalRecipients.length} external</span>
            </div>
            <p className="mt-3 text-gray-400">
              {allRecipients.length === 0
                ? "No suppliers selected yet."
                : allRecipients.map((recipient) => recipient.supplierName).join(", ")}
            </p>
          </div>

          {supplierPanelOpen && (
            <div className="rounded-lg border border-gray-700 bg-gray-900/40 p-4 space-y-4">
              <div className="grid gap-2 md:grid-cols-2">
                {suppliers.map((supplier) => (
                  <label key={supplier.id} className="flex items-center gap-2 rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200">
                    <input
                      type="checkbox"
                      checked={selectedSupplierIds.includes(supplier.id)}
                      onChange={(event) =>
                        setSelectedSupplierIds((previous) =>
                          event.target.checked
                            ? [...previous, supplier.id]
                            : previous.filter((id) => id !== supplier.id)
                        )
                      }
                    />
                    <span>{supplier.name}</span>
                  </label>
                ))}
              </div>

              <div className="grid gap-2 md:grid-cols-3">
                <input
                  value={externalName}
                  onChange={(event) => setExternalName(event.target.value)}
                  placeholder="External supplier name"
                  className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white"
                />
                <input
                  value={externalEmail}
                  onChange={(event) => setExternalEmail(event.target.value)}
                  placeholder="External supplier email"
                  className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white"
                />
                <button onClick={addExternalRecipient} className="rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-600">
                  Add external
                </button>
              </div>

              {externalRecipients.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {externalRecipients.map((recipient) => (
                    <button
                      key={recipient.id}
                      onClick={() => setExternalRecipients((previous) => previous.filter((entry) => entry.id !== recipient.id))}
                      className="rounded border border-gray-600 px-2 py-1 text-xs text-gray-200 hover:bg-gray-700"
                    >
                      {recipient.supplierName} ({recipient.supplierEmail}) ✕
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        <section className="sticky bottom-0 rounded-xl border border-gray-700/70 bg-gray-900/95 p-4 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-gray-400">
              {items.length} items · {allRecipients.length} recipients selected
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => void createEnquiry(false)}
                disabled={saving}
                className="rounded-lg border border-gray-600 px-4 py-2 text-sm text-gray-200 hover:bg-gray-800 disabled:opacity-50"
              >
                Save as Draft
              </button>
              <button
                onClick={() => void createEnquiry(true)}
                disabled={saving}
                className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Create & Send"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </PermissionGuard>
  );
}
