"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

type PublicEnquiry = {
  id: string;
  reference: string;
  title: string;
  category: "labour" | "plant" | "materials" | "subcontract";
  requiredBy?: string;
  notes?: string;
  linkedRecordName?: string;
  items: Array<{ id: string; itemCode?: string; description: string; unit: string; quantity: number; notes?: string }>;
  documents: Array<{ id: string; fileName: string; dataUrl: string }>;
};

type AdditionalLine = {
  id: string;
  label: string;
  quantity: string;
  unit: string;
  unitRate: string;
};

type QuoteDocument = {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  dataUrl: string;
};

const extraPresets = ["Delivery", "Collection", "Transport", "Travel", "Waste"];

function formatCurrency(value: number, currency = "GBP") {
  return value.toLocaleString("en-GB", { style: "currency", currency });
}

function toCategoryLabel(category: PublicEnquiry["category"]) {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

function inputDateToDisplay(value: string) {
  if (!value) return "dd/mm/yyyy";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "dd/mm/yyyy";
  return parsed.toLocaleDateString("en-GB");
}

async function filesToDataUrls(fileList: FileList | null): Promise<QuoteDocument[]> {
  if (!fileList) return [];

  return Promise.all(
    Array.from(fileList).map(
      (file) =>
        new Promise<QuoteDocument>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve({
              id: crypto.randomUUID(),
              fileName: file.name,
              fileType: file.type || "application/octet-stream",
              fileSize: file.size,
              dataUrl: String(reader.result || ""),
            });
          };
          reader.readAsDataURL(file);
        })
    )
  );
}

export default function SupplierRespondPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [enquiry, setEnquiry] = useState<PublicEnquiry | null>(null);

  const [supplierName, setSupplierName] = useState("");
  const [supplierEmail, setSupplierEmail] = useState("");
  const [currency, setCurrency] = useState("GBP");
  const [deliveryDays, setDeliveryDays] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");

  const [lineRates, setLineRates] = useState<Record<string, string>>({});
  const [lineNotes, setLineNotes] = useState<Record<string, string>>({});
  const [additionalLines, setAdditionalLines] = useState<AdditionalLine[]>([]);
  const [quoteDocuments, setQuoteDocuments] = useState<QuoteDocument[]>([]);

  useEffect(() => {
    if (!token) return;

    async function load() {
      setLoading(true);
      const response = await fetch(`/api/supplier-enquiries/respond/${token}`, { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to load enquiry");
        setLoading(false);
        return;
      }

      setEnquiry(data.enquiry);
      setSupplierName(data.invite?.supplierName || "");
      setSupplierEmail(data.invite?.supplierEmail || "");

      if (data.existingResponse) {
        setSubmitted(true);
      }

      setLoading(false);
    }

    void load();
  }, [token]);

  const requestedSubtotal = useMemo(() => {
    if (!enquiry) return 0;
    return enquiry.items.reduce((sum, item) => {
      const rate = Number(lineRates[item.id] || 0);
      return sum + rate * item.quantity;
    }, 0);
  }, [enquiry, lineRates]);

  const pricedCount = useMemo(() => {
    if (!enquiry) return 0;
    return enquiry.items.filter((item) => Number(lineRates[item.id] || 0) > 0).length;
  }, [enquiry, lineRates]);

  const extrasTotal = useMemo(
    () =>
      additionalLines.reduce(
        (sum, line) => sum + (Number(line.quantity) || 0) * (Number(line.unitRate) || 0),
        0
      ),
    [additionalLines]
  );

  const quoteTotal = requestedSubtotal + extrasTotal;

  const handleAddPreset = (label: string) => {
    setAdditionalLines((previous) => [
      ...previous,
      { id: crypto.randomUUID(), label, quantity: "1", unit: "item", unitRate: "" },
    ]);
  };

  const handleAddCustomLine = () => {
    setAdditionalLines((previous) => [
      ...previous,
      { id: crypto.randomUUID(), label: "Custom", quantity: "1", unit: "item", unitRate: "" },
    ]);
  };

  const handleUploadQuoteDocs = async (fileList: FileList | null) => {
    const uploaded = await filesToDataUrls(fileList);
    if (uploaded.length === 0) return;
    setQuoteDocuments((previous) => [...previous, ...uploaded]);
  };

  const handleSubmit = async () => {
    if (!enquiry || !token) return;

    if (!supplierName.trim() || !supplierEmail.trim()) {
      alert("Please enter supplier name and email");
      return;
    }

    const lineItems = enquiry.items.map((item) => {
      const unitRate = Number(lineRates[item.id] || 0);
      return {
        itemId: item.id,
        unitRate,
        total: unitRate * item.quantity,
        notes: lineNotes[item.id] || undefined,
      };
    });

    if (lineItems.every((line) => line.unitRate <= 0)) {
      alert("Please enter at least one requested item price");
      return;
    }

    const cleanedAdditionalLines = additionalLines
      .map((line) => ({
        id: line.id,
        label: line.label.trim() || "Additional",
        quantity: Number(line.quantity || 0) || undefined,
        unit: line.unit.trim() || undefined,
        unitRate: Number(line.unitRate || 0) || undefined,
        amount: (Number(line.quantity || 0) || 0) * (Number(line.unitRate || 0) || 0),
      }))
      .filter((line) => line.amount > 0);

    const validityDays = validUntil
      ? Math.max(
          0,
          Math.ceil((new Date(validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        )
      : undefined;

    const response = await fetch(`/api/supplier-enquiries/respond/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        supplierName: supplierName.trim(),
        supplierEmail: supplierEmail.trim(),
        currency,
        validityDays,
        validityDate: validUntil || undefined,
        leadTime: deliveryDays.trim() || undefined,
        notes: notes.trim() || undefined,
        lineItems,
        additionalLines: cleanedAdditionalLines,
        quoteDocuments,
        grandTotal: quoteTotal,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      alert(data.error || "Failed to submit quote");
      return;
    }

    setSubmitted(true);
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-950 text-white">Loading enquiry…</div>;
  }

  if (error || !enquiry) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 p-6 text-white">
        <div className="max-w-xl rounded-lg border border-red-700/50 bg-red-900/20 p-6 text-center">
          <h1 className="text-xl font-bold">Supplier Link Invalid</h1>
          <p className="mt-2 text-sm text-red-200">{error || "This link is not available."}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 p-6 text-white">
        <div className="max-w-xl rounded-lg border border-green-700/50 bg-green-900/20 p-6 text-center">
          <h1 className="text-xl font-bold text-green-300">Quote Submitted</h1>
          <p className="mt-2 text-sm text-green-100">
            Thank you. Your quote for {enquiry.reference} has been submitted successfully.
          </p>
        </div>
      </div>
    );
  }

  const panelClass = "rounded-2xl border border-gray-700/70 bg-[#1f232a] p-6";
  const inputClass =
    "w-full rounded-md border border-gray-300/70 bg-gray-700 px-3 py-2 text-sm text-white placeholder:text-gray-200";

  return (
    <div className="min-h-screen bg-[#5a5f66] px-4 py-10 text-white">
      <div className="mx-auto max-w-3xl space-y-4">
        <section className={`${panelClass} shadow-2xl shadow-black/35`}>
          <div className="mb-5 border-b border-gray-700/80 pb-5 text-center">
            <img
              src="https://www.sitesamurai.co.uk/_next/image?url=https%3A%2F%2Fsamuraiimages.lon1.digitaloceanspaces.com%2Flogos%2Fcmkv9r1by0000wb48hp8sh10p-1770553688320.png&w=256&q=75"
              alt="VALESCAPE LTD"
              className="mx-auto h-14 w-auto object-contain"
              style={{ filter: "invert() hue-rotate(180deg)" }}
            />
            <p className="mt-3 text-[11px] uppercase tracking-[0.28em] text-gray-400">Request for Quotation</p>
          </div>

          <h1 className="text-2xl font-bold text-white">{enquiry.reference}</h1>
          <p className="mt-1 text-sm text-gray-300">{enquiry.title}</p>
          <div className="mt-3 flex items-center justify-between text-xs">
            <p className="uppercase tracking-wider text-gray-400">{toCategoryLabel(enquiry.category)}</p>
            <div className="text-right">
              <p className="uppercase tracking-wide text-gray-500">Required By</p>
              <p className="text-sm font-semibold text-amber-300">
                {enquiry.requiredBy ? new Date(enquiry.requiredBy).toLocaleDateString("en-GB") : "Not set"}
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-300">
            Hello {supplierName || "Supplier"}, please review the items below and submit your quotation.
          </p>
        </section>

        <section className={panelClass}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Items Requested ({enquiry.items.length})</h2>
            <div className="flex gap-2">
              <button className="rounded-md border border-gray-600 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-800">Excel template</button>
              <button className="rounded-md border border-gray-600 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-800">Upload sheet</button>
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-400">Enter your pricing for each item</p>

          <div className="mt-4 overflow-hidden rounded-lg border border-gray-700/80">
            <div className="hidden bg-gray-800/70 px-3 py-2 text-[11px] uppercase tracking-wide text-gray-400 md:grid md:grid-cols-12">
              <div className="col-span-6">Description</div>
              <div className="col-span-1">Qty</div>
              <div className="col-span-1">Unit</div>
              <div className="col-span-2 text-right">Unit Price (£)</div>
              <div className="col-span-2 text-right">Amount (£)</div>
            </div>
            {enquiry.items.map((item) => {
              const unitRate = Number(lineRates[item.id] || 0);
              const amount = unitRate * item.quantity;

              return (
                <div key={item.id} className="border-t border-gray-700/80 bg-gray-900/20 first:border-t-0">
                  <div className="grid gap-2 p-3 md:grid-cols-12 md:items-center">
                    <div className="md:col-span-6">
                      <p className="text-sm font-semibold text-white">
                        {item.itemCode ? `${item.itemCode} · ` : ""}
                        {item.description}
                      </p>
                    </div>
                    <div className="md:col-span-1 text-sm text-gray-300">{item.quantity}</div>
                    <div className="md:col-span-1 text-sm text-gray-300">{item.unit}</div>
                    <div className="md:col-span-2">
                      <input
                        value={lineRates[item.id] || ""}
                        onChange={(event) => setLineRates((previous) => ({ ...previous, [item.id]: event.target.value }))}
                        type="number"
                        min={0}
                        step="0.01"
                        placeholder="0.00"
                        className={`${inputClass} text-right`}
                      />
                    </div>
                    <div className="md:col-span-2 text-right text-sm font-semibold text-orange-300">{formatCurrency(amount, currency)}</div>
                  </div>
                  <div className="px-3 pb-3">
                    <input
                      value={lineNotes[item.id] || ""}
                      onChange={(event) => setLineNotes((previous) => ({ ...previous, [item.id]: event.target.value }))}
                      placeholder="Line note (optional)"
                      className="w-full rounded-md border border-gray-300/70 bg-gray-700 px-3 py-2 text-xs text-white placeholder:text-gray-200"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 rounded-lg border border-gray-700/80 bg-gray-800/30 p-3 text-right text-sm text-gray-300">
            Subtotal for requested items: <span className="font-semibold text-white">{formatCurrency(requestedSubtotal, currency)}</span>
          </div>
        </section>

        <section className={panelClass}>
          <h2 className="text-lg font-semibold">Additional lines (optional)</h2>
          <p className="mt-2 text-sm text-gray-400">Add delivery/collection charges, transport, waste disposal and other extras.</p>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={handleAddCustomLine}
              className="rounded-full border border-gray-600 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-800"
            >
              Add line
            </button>
            {extraPresets.map((preset) => (
              <button
                key={preset}
                onClick={() => handleAddPreset(preset)}
                className="rounded-full border border-gray-600 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-800"
              >
                {preset}
              </button>
            ))}
          </div>

          {additionalLines.length === 0 ? (
            <div className="mt-4 rounded-lg border border-dashed border-gray-700 p-6 text-center text-sm text-gray-500">No additional lines added</div>
          ) : (
            <div className="mt-4 space-y-2">
              {additionalLines.map((line) => (
                <div key={line.id} className="grid gap-2 md:grid-cols-12">
                  <input
                    value={line.label}
                    onChange={(event) =>
                      setAdditionalLines((previous) =>
                        previous.map((entry) => (entry.id === line.id ? { ...entry, label: event.target.value } : entry))
                      )
                    }
                    className={`md:col-span-5 ${inputClass}`}
                    placeholder="Charge label"
                  />
                  <input
                    value={line.quantity}
                    onChange={(event) =>
                      setAdditionalLines((previous) =>
                        previous.map((entry) => (entry.id === line.id ? { ...entry, quantity: event.target.value } : entry))
                      )
                    }
                    type="number"
                    min={0}
                    step="0.01"
                    className={`md:col-span-2 ${inputClass}`}
                    placeholder="Qty"
                  />
                  <input
                    value={line.unit}
                    onChange={(event) =>
                      setAdditionalLines((previous) =>
                        previous.map((entry) => (entry.id === line.id ? { ...entry, unit: event.target.value } : entry))
                      )
                    }
                    type="text"
                    className={`md:col-span-2 ${inputClass}`}
                    placeholder="Unit"
                  />
                  <input
                    value={line.unitRate}
                    onChange={(event) =>
                      setAdditionalLines((previous) =>
                        previous.map((entry) => (entry.id === line.id ? { ...entry, unitRate: event.target.value } : entry))
                      )
                    }
                    type="number"
                    min={0}
                    step="0.01"
                    className={`md:col-span-2 ${inputClass}`}
                    placeholder="Unit Rate (£)"
                  />
                  <div className="md:col-span-1 rounded-md border border-gray-700 bg-gray-900/50 px-2 py-2 text-right text-xs font-semibold text-orange-300">
                    {formatCurrency((Number(line.quantity || 0) || 0) * (Number(line.unitRate || 0) || 0), currency)}
                  </div>
                  <button
                    onClick={() => setAdditionalLines((previous) => previous.filter((entry) => entry.id !== line.id))}
                    className="md:col-span-1 rounded-md bg-red-900/40 px-2 py-2 text-xs text-red-200 hover:bg-red-900/70"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <p className="mt-3 text-xs text-gray-500">Use the buttons above to add common extras, or click “Add line” for a custom charge.</p>
        </section>

        <section className={panelClass}>
          <h2 className="text-lg font-semibold">Upload Quote Documents (Optional)</h2>
          <p className="mt-2 text-sm text-gray-400">You can upload your formal quote, specifications, or other supporting documents.</p>

          <label className="mt-4 flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-gray-600 bg-gray-900/40 p-8 text-sm text-gray-300 hover:bg-gray-800/50">
            Click to upload or drag and drop
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(event) => {
                void handleUploadQuoteDocs(event.target.files);
                event.currentTarget.value = "";
              }}
            />
          </label>
          <p className="mt-2 text-xs text-gray-500">PDF, Word, Excel, CSV, Images, ZIP (max 20MB)</p>

          {quoteDocuments.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {quoteDocuments.map((document) => (
                <button
                  key={document.id}
                  onClick={() => setQuoteDocuments((previous) => previous.filter((entry) => entry.id !== document.id))}
                  className="rounded border border-gray-700 px-3 py-1 text-xs text-gray-300 hover:bg-gray-800"
                >
                  {document.fileName} ✕
                </button>
              ))}
            </div>
          )}
        </section>

        {enquiry.documents.length > 0 && (
          <section className={panelClass}>
            <h2 className="text-lg font-semibold">Enquiry Attachments</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {enquiry.documents.map((document) => (
                <a
                  key={document.id}
                  href={document.dataUrl}
                  download={document.fileName}
                  className="rounded border border-gray-700 px-3 py-1 text-xs text-gray-300 hover:bg-gray-800"
                >
                  {document.fileName}
                </a>
              ))}
            </div>
          </section>
        )}

        <section className={panelClass}>
          <h2 className="text-lg font-semibold">Your Quote Summary</h2>

          <div className="mt-4 grid gap-2 text-sm">
            <div className="flex items-center justify-between rounded-md border border-gray-700 bg-gray-800/50 px-3 py-2">
              <span className="text-gray-300">Requested Items ({pricedCount} priced)</span>
              <span className="font-semibold">{formatCurrency(requestedSubtotal, currency)}</span>
            </div>
            <div className="flex items-center justify-between rounded-md border border-gray-700 bg-gray-800/70 px-3 py-2">
              <span className="text-gray-200">Quote Total (excl. VAT)</span>
              <span className="text-lg font-bold text-orange-300">{formatCurrency(quoteTotal, currency)}</span>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-gray-300">Delivery Time (Working Days) *</label>
              <input
                value={deliveryDays}
                onChange={(event) => setDeliveryDays(event.target.value)}
                className={inputClass}
                placeholder="Working days from receipt of order"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-300">Quote Valid Until (optional)</label>
              <input
                type="date"
                value={validUntil}
                onChange={(event) => setValidUntil(event.target.value)}
                className={inputClass}
                aria-label="Quote Valid Until"
              />
              <p className="mt-1 text-[11px] text-gray-500">How long is this quote valid for?</p>
            </div>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <input
              value={supplierName}
              onChange={(event) => setSupplierName(event.target.value)}
              className={inputClass}
              placeholder="Supplier name *"
            />
            <input
              value={supplierEmail}
              onChange={(event) => setSupplierEmail(event.target.value)}
              className={inputClass}
              placeholder="Supplier email *"
            />
          </div>

          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            className={`mt-3 ${inputClass}`}
            placeholder="Additional Notes / Terms"
          />

          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-xs text-gray-500">
              {enquiry.requiredBy
                ? `This link expires on ${new Date(enquiry.requiredBy).toLocaleDateString("en-GB")}`
                : "This link remains active until the enquiry is closed."}
            </p>
            <button onClick={handleSubmit} className="rounded-lg bg-red-600 px-6 py-3 text-sm font-semibold text-white hover:bg-red-700">
              Submit Quote — {formatCurrency(quoteTotal, currency)}
            </button>
          </div>
        </section>

        <footer className="pb-6 text-center text-xs text-gray-500">
          <p>Supplier Portal by KBM Construct</p>
          <p className="mt-1">Powered by VALESCAPE LTD</p>
        </footer>
      </div>
    </div>
  );
}
