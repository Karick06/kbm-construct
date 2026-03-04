"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createRAMSDocument,
  FOCUSED_WORK_TYPES,
  getMergedTemplateForWorkTypes,
  TIER1_PROFILE_REQUIREMENTS,
  splitMultiline,
  type RAMSDocument,
  type Tier1Profile,
  type WorkType,
  updateRAMSDocument,
  loadRAMSDocumentsFromAPI,
  saveRAMSDocumentToAPI,
  deleteRAMSDocumentFromAPI,
} from "@/lib/rams-data";
import { projects } from "@/lib/sample-data";

const workTypes = FOCUSED_WORK_TYPES;
const projectOptions = [...projects];
const tier1Profiles = Object.keys(TIER1_PROFILE_REQUIREMENTS) as Tier1Profile[];

function listToText(items: string[]): string {
  return items.join("\n");
}

function getDocWorkTypes(doc: RAMSDocument): WorkType[] {
  return doc.workTypes && doc.workTypes.length > 0 ? doc.workTypes : [doc.workType];
}

function formatWorkTypes(workTypes: WorkType[]): string {
  return workTypes.join(" • ");
}

function escapeHtml(value: string | undefined | null): string {
  if (!value) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderList(items: string[]): string {
  return items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

function renderChecklist(items: string[]): string {
  return items
    .map(
      (item) =>
        `<li><span style="display:inline-block;width:14px;height:14px;border:1px solid #9ca3af;border-radius:2px;margin-right:8px;vertical-align:middle;"></span>${escapeHtml(item)}</li>`,
    )
    .join("");
}

function getRiskColor(level: string): string {
  const normalized = level.toLowerCase();
  if (normalized === "low") return "#10b981"; // Green
  if (normalized === "medium") return "#f59e0b"; // Amber
  if (normalized === "high") return "#ef4444"; // Red
  return "#6b7280"; // Gray fallback
}

function getRiskTextColor(level: string): string {
  const normalized = level.toLowerCase();
  if (normalized === "medium") return "#111827";
  return "#ffffff";
}

function getRiskCellStyle(level: string): string {
  return `font-weight: 600; color: ${getRiskTextColor(level)}; background-color: ${getRiskColor(level)}; padding: 6px 8px; -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact;`;
}

function generateMapLink(siteLat?: number, siteLon?: number, hospitalLat?: number, hospitalLon?: number): string {
  // Generate Google Maps link to view the location
  if (!siteLat || !siteLon) return "";
  
  if (hospitalLat && hospitalLon) {
    // Create a directions link from site to hospital
    return `https://www.google.com/maps/dir/${siteLat},${siteLon}/${hospitalLat},${hospitalLon}`;
  } else {
    // Just show the site location
    return `https://www.google.com/maps/search/?api=1&query=${siteLat},${siteLon}`;
  }
}

function buildRAMSPrintableHtml(doc: RAMSDocument): string {
  const printDate = new Date().toLocaleDateString("en-GB");
  const tier1Profile = doc.tier1Profile ?? "Standard";
  const profileChecklist = TIER1_PROFILE_REQUIREMENTS[tier1Profile] ?? TIER1_PROFILE_REQUIREMENTS.Standard;
  const mapLink = generateMapLink(doc.siteLat, doc.siteLon, doc.hospitalLat, doc.hospitalLon);
  const docWorkTypes = getDocWorkTypes(doc);
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(doc.title)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif; color: #1f2937; line-height: 1.5; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact; }
    
    .page { page-break-after: always; padding: 20mm 15mm; min-height: 297mm; }
    
    .header-brand {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      padding-bottom: 12px;
      border-bottom: 2px solid #e5e7eb;
    }
    .header-left { display: flex; flex-direction: column; align-items: flex-start; }
    .header-logo {
      background-color: #000000;
      padding: 12px 16px;
      border-radius: 4px;
      display: inline-block;
      margin-bottom: 8px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      color-adjust: exact;
    }
    .header-logo img { height: 60px; max-width: 200px; object-fit: contain; display: block; }
    .header-subtitle { font-size: 12px; color: #666; margin-top: 4px; }
    .rev-status {
      display: flex;
      gap: 16px;
    }
    .rev-status-item {
      text-align: center;
      padding: 4px 12px;
      background: #f3f4f6;
      border-radius: 4px;
      font-size: 11px;
    }
    .rev-status-label { color: #666; font-weight: 600; }
    .rev-status-value { color: #1f2937; font-weight: bold; font-size: 12px; }
    
    .status-draft { background: #fef3c7; -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact; }
    .status-pending { background: #dbeafe; -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact; }
    .status-approved { background: #dcfce7; -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact; }
    
    h1 { 
      font-size: 20px; 
      font-weight: 700;
      margin-bottom: 4px;
      color: #1f2937;
    }
    .subtitle { font-size: 12px; color: #666; margin-bottom: 16px; }
    
    .document-info {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-bottom: 20px;
      padding: 12px;
      background: #f9fafb;
      border-radius: 6px;
    }
    .info-item { }
    .info-label { font-size: 10px; font-weight: 600; color: #666; text-transform: uppercase; }
    .info-value { font-size: 12px; color: #1f2937; margin-top: 2px; }
    
    h2 { 
      font-size: 13px; 
      font-weight: 700;
      margin-top: 18px;
      margin-bottom: 8px;
      padding-bottom: 4px;
      border-bottom: 2px solid #e5e7eb;
      color: #1f2937;
    }
    
    .content-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .content-grid-full { display: grid; grid-template-columns: 1fr; }
    
    ul { margin-left: 20px; margin-top: 6px; font-size: 11px; }
    ul li { margin-bottom: 3px; }
    
    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin-top: 8px;
      font-size: 10px;
    }
    th, td { 
      border: 1px solid #d1d5db; 
      padding: 6px 8px;
      text-align: left;
    }
    th { background: #f3f4f6; font-weight: 600; }
    tr:nth-child(even) { background: #f9fafb; }
    
    .signature-section {
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #d1d5db;
    }
    
    .signatures {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-top: 12px;
    }
    
    .signature-box {
      border: 1px solid #d1d5db;
      padding: 8px;
      border-radius: 4px;
      min-height: 80px;
    }
    
    .sig-line {
      border-top: 1px solid #1f2937;
      margin-top: 8px;
      padding-top: 2px;
      font-size: 9px;
      font-weight: 600;
    }
    
    .sig-date {
      margin-top: 4px;
      font-size: 9px;
      text-align: center;
      padding-top: 4px;
      border-top: 1px solid #d1d5db;
    }
    
    .footer {
      margin-top: 20px;
      padding-top: 12px;
      border-top: 1px solid #e5e7eb;
      font-size: 9px;
      color: #666;
      display: flex;
      justify-content: space-between;
    }
    
    @media print {
      body { margin: 0; padding: 0; }
      .page { padding: 10mm; min-height: auto; page-break-after: always; }
      .no-print { display: none !important; }
      h2 { page-break-after: avoid; }
      table { page-break-inside: avoid; }
      .signature-section { page-break-inside: avoid; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- Header with branding -->
    <div class="header-brand">
          <div class="header-left">
            <div class="header-logo">
              <img src="/valescape-logo.png" alt="Valescape" />
            </div>
            <div class="header-subtitle">Risk Assessment & Method Statement</div>
      </div>
      <div class="rev-status">
        <div class="rev-status-item ${doc.approvalStatus === "Draft" ? "status-draft" : doc.approvalStatus === "Pending Approval" ? "status-pending" : "status-approved"}">
          <div class="rev-status-label">Status</div>
          <div class="rev-status-value">${escapeHtml(doc.approvalStatus)}</div>
        </div>
        <div class="rev-status-item">
          <div class="rev-status-label">Revision</div>
          <div class="rev-status-value">Rev ${doc.revision}</div>
        </div>
      </div>
    </div>

    <!-- Document Title -->
    <h1>${escapeHtml(doc.title)}</h1>
    <p class="subtitle">Document ID: ${escapeHtml(doc.id)}</p>

    <!-- Document Information -->
    <div class="document-info">
      <div class="info-item">
        <div class="info-label">Project</div>
        <div class="info-value">${escapeHtml(doc.projectName)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Project Manager</div>
        <div class="info-value">${escapeHtml(doc.projectManager || "Not set")}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Project Phase</div>
        <div class="info-value">${escapeHtml(doc.projectPhase || "Not set")}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Location</div>
        <div class="info-value">${escapeHtml(doc.location)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Work Elements</div>
        <div class="info-value">${escapeHtml(docWorkTypes.join(" • "))}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Prepared By</div>
        <div class="info-value">${escapeHtml(doc.author)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Issue Date</div>
        <div class="info-value">${escapeHtml(doc.issueDate)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Review Date</div>
        <div class="info-value">${escapeHtml(doc.reviewDate || "Not set")}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Tier 1 Profile</div>
        <div class="info-value">${escapeHtml(tier1Profile)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Site Postcode</div>
        <div class="info-value">${escapeHtml(doc.sitePostcode || "Not set")}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Nearest A&E</div>
        <div class="info-value">${escapeHtml(doc.nearestHospitalName || "Not set")}</div>
      </div>
    </div>

    <!-- Content Sections -->
    <div class="content-grid">
      <section>
        <h2>PPE Required</h2>
        <ul>${renderList(doc.ppeRequired)}</ul>
      </section>
      <section>
        <h2>Plant & Equipment</h2>
        <ul>${renderList(doc.plantEquipment)}</ul>
      </section>
    </div>

    <section class="content-grid-full">
      <h2>Method Statement Steps</h2>
      <ul>${renderList(doc.methodStatementSteps)}</ul>
    </section>

    <section class="content-grid-full">
      <h2>Emergency Procedures</h2>
      <ul>${renderList(doc.emergencyProcedures)}</ul>
    </section>

    <div class="content-grid">
      <section>
        <h2>Environmental Controls</h2>
        <ul>${renderList(doc.environmentalControls)}</ul>
      </section>
      <section>
        <h2>Permits Required</h2>
        <ul>${renderList(doc.permitsRequired)}</ul>
      </section>
    </div>

    <section class="content-grid-full">
      <h2>Tier 1 Submission Checklist</h2>
      <ul>${renderChecklist(profileChecklist)}</ul>
    </section>

    <section class="content-grid-full">
      <h2>Emergency A&E Contact & Location Map</h2>
      <ul>
        <li><strong>Hospital:</strong> ${escapeHtml(doc.nearestHospitalName || "Not set")}</li>
        <li><strong>Address:</strong> ${escapeHtml(doc.nearestHospitalAddress || "Not set")}</li>
        <li><strong>Phone:</strong> ${escapeHtml(doc.nearestHospitalPhone || "Not set")}</li>
        <li><strong>Distance:</strong> ${doc.nearestHospitalDistanceKm ? `${doc.nearestHospitalDistanceKm} km` : "Not set"}</li>
        ${doc.siteLat && doc.siteLon ? `<li><strong>Site Coordinates:</strong> ${doc.siteLat.toFixed(4)}, ${doc.siteLon.toFixed(4)}</li>` : ""}
        ${doc.hospitalLat && doc.hospitalLon ? `<li><strong>Hospital Coordinates:</strong> ${doc.hospitalLat.toFixed(4)}, ${doc.hospitalLon.toFixed(4)}</li>` : ""}
      </ul>
      ${mapLink ? `
        <div style="margin-top: 12px; padding: 12px; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 4px;">
          <p style="margin: 0; font-size: 13px; color: #0c4a6e;">
            <strong>📍 View Route to Hospital:</strong> 
            <a href="${mapLink}" target="_blank" style="color: #0284c7; text-decoration: underline; margin-left: 4px;">Open in Google Maps</a>
          </p>
          <p style="margin: 8px 0 0 0; font-size: 11px; color: #64748b;">Click the link above to view directions from the site to the nearest A&E facility.</p>
        </div>
      ` : ""}
    </section>

    <section class="content-grid-full">
      <h2>Risk Assessment Matrix</h2>
      <table>
        <thead>
          <tr>
            <th width="25%">Hazard</th>
            <th width="20%">Initial Risk</th>
            <th width="35%">Control Measures</th>
            <th width="20%">Residual Risk</th>
          </tr>
        </thead>
        <tbody>
          ${doc.riskAssessment
            .map(
              (risk) => '<tr><td>' + escapeHtml(risk.hazard) + '</td><td style="' + getRiskCellStyle(risk.initialRisk) + '">' + escapeHtml(risk.initialRisk) + '</td><td>' + escapeHtml(risk.controls) + '</td><td style="' + getRiskCellStyle(risk.residualRisk) + '">' + escapeHtml(risk.residualRisk) + '</td></tr>',
            )
            .join("")}
        </tbody>
      </table>
    </section>

    <!-- Approval Signatures -->
    <div class="signature-section">
      <h2>Approval & Signatures</h2>
      <div class="signatures">
        <div style="border-right: 1px solid #e5e7eb; padding-right: 10px;">
          <div style="font-size: 10px; font-weight: 600; margin-bottom: 6px;">Prepared By</div>
          <div class="signature-box">
            <div style="min-height: 40px;"></div>
            <div class="sig-line">${escapeHtml(doc.author)}</div>
            <div class="sig-date">Date: _______________</div>
          </div>
        </div>
        <div style="padding-left: 10px;">
          <div style="font-size: 10px; font-weight: 600; margin-bottom: 6px;">Approved By</div>
          <div class="signature-box">
            <div style="min-height: 40px;"></div>
            <div class="sig-line">${escapeHtml(doc.approver || "Compliance Lead")}</div>
            <div class="sig-date">Date: _______________</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <span>KBM Construct Limited | Compliance Document</span>
      <span>Printed: ${printDate} | Document ID: ${escapeHtml(doc.id)}</span>
    </div>
  </div>

  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>`;
}

export default function CompliancePage() {
  const [docs, setDocs] = useState<RAMSDocument[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [filterWorkType, setFilterWorkType] = useState<"all" | WorkType>("all");
  const [filterProject, setFilterProject] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [title, setTitle] = useState("");
  const [projectName, setProjectName] = useState<string>(projectOptions[0]?.name ?? "");
  const [projectManager, setProjectManager] = useState<string>(projectOptions[0]?.manager ?? "");
  const [projectPhase, setProjectPhase] = useState<string>(projectOptions[0]?.phase ?? "");
  const [location, setLocation] = useState("");
  const [sitePostcode, setSitePostcode] = useState("");
  const [siteLat, setSiteLat] = useState<number | null>(null);
  const [siteLon, setSiteLon] = useState<number | null>(null);
  const [nearestHospitalName, setNearestHospitalName] = useState("");
  const [nearestHospitalAddress, setNearestHospitalAddress] = useState("");
  const [nearestHospitalDistanceKm, setNearestHospitalDistanceKm] = useState<number | null>(null);
  const [nearestHospitalPhone, setNearestHospitalPhone] = useState("");
  const [hospitalLat, setHospitalLat] = useState<number | null>(null);
  const [hospitalLon, setHospitalLon] = useState<number | null>(null);
  const [postcodeLookupStatus, setPostcodeLookupStatus] = useState<"idle" | "loading" | "resolved" | "error">("idle");
  const [selectedWorkTypes, setSelectedWorkTypes] = useState<WorkType[]>([workTypes[0]]);
  const [author, setAuthor] = useState("Site Manager");
  const [approver, setApprover] = useState("Compliance Lead");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [reviewDate, setReviewDate] = useState("");
  const [tier1Profile, setTier1Profile] = useState<Tier1Profile>("Standard");
  const [approvalStatus, setApprovalStatus] = useState<"Draft" | "Pending Approval" | "Approved">("Draft");

  const [ppeText, setPpeText] = useState("");
  const [plantText, setPlantText] = useState("");
  const [methodText, setMethodText] = useState("");
  const [emergencyText, setEmergencyText] = useState("");
  const [environmentText, setEnvironmentText] = useState("");
  const [permitsText, setPermitsText] = useState("");

  useEffect(() => {
    async function loadDocuments() {
      const loadedDocs = await loadRAMSDocumentsFromAPI();
      setDocs(loadedDocs);
      if (loadedDocs.length > 0) {
        setSelectedDocId(loadedDocs[0].id);
      }
    }
    loadDocuments();
  }, []);

  useEffect(() => {
    const selectedTemplate = getMergedTemplateForWorkTypes(selectedWorkTypes);
    setPpeText(listToText(selectedTemplate.ppeRequired));
    setPlantText(listToText(selectedTemplate.plantEquipment));
    setMethodText(listToText(selectedTemplate.methodStatementSteps));
    setEmergencyText(listToText(selectedTemplate.emergencyProcedures));
    setEnvironmentText(listToText(selectedTemplate.environmentalControls));
    setPermitsText(listToText(selectedTemplate.permitsRequired));
  }, [selectedWorkTypes]);

  const selectedDoc = useMemo(
    () => docs.find((doc) => doc.id === selectedDocId) ?? null,
    [docs, selectedDocId],
  );

  const filteredDocs = useMemo(() => {
    return docs.filter((doc) => {
      const docWorkTypes = getDocWorkTypes(doc);
      const matchesWorkType = filterWorkType === "all" || docWorkTypes.includes(filterWorkType);
      const matchesProject = filterProject === "all" || doc.projectName === filterProject;
      const term = searchTerm.trim().toLowerCase();
      const matchesSearch =
        term.length === 0 ||
        doc.title.toLowerCase().includes(term) ||
        doc.projectName.toLowerCase().includes(term) ||
        doc.location.toLowerCase().includes(term);
      return matchesWorkType && matchesProject && matchesSearch;
    });
  }, [docs, filterWorkType, filterProject, searchTerm]);

  const handleProjectSelection = (nextProjectName: string) => {
    setProjectName(nextProjectName);
    const selectedProject = projectOptions.find((project) => project.name === nextProjectName);
    if (!selectedProject) {
      setProjectManager("");
      setProjectPhase("");
      return;
    }
    setProjectManager(selectedProject.manager);
    setProjectPhase(selectedProject.phase);
  };

  const handleGenerate = async () => {
    if (!title || !projectName || !location) {
      alert("Please complete title, project name and location.");
      return;
    }
    if (selectedWorkTypes.length === 0) {
      alert("Please select at least one work element.");
      return;
    }

    const generated = createRAMSDocument({
      title,
      projectId: projectName,
      projectName,
      projectManager,
      projectPhase,
      location,
      sitePostcode: sitePostcode || undefined,
      siteLat: siteLat ?? undefined,
      siteLon: siteLon ?? undefined,
      nearestHospitalName: nearestHospitalName || undefined,
      nearestHospitalAddress: nearestHospitalAddress || undefined,
      nearestHospitalDistanceKm: nearestHospitalDistanceKm ?? undefined,
      nearestHospitalPhone: nearestHospitalPhone || undefined,
      hospitalLat: hospitalLat ?? undefined,
      hospitalLon: hospitalLon ?? undefined,
      workType: selectedWorkTypes[0],
      workTypes: selectedWorkTypes,
      author,
      approver,
      issueDate,
      reviewDate: reviewDate || undefined,
      tier1Profile,
      approvalStatus,
    });

    await saveRAMSDocumentToAPI(generated);
    setDocs((prev) => [generated, ...prev]);
    setSelectedDocId(generated.id);
  };

  const handleSaveEdits = async () => {
    if (!selectedDoc) return;

    const updated = updateRAMSDocument({
      ...selectedDoc,
      ppeRequired: splitMultiline(ppeText),
      plantEquipment: splitMultiline(plantText),
      methodStatementSteps: splitMultiline(methodText),
      emergencyProcedures: splitMultiline(emergencyText),
      environmentalControls: splitMultiline(environmentText),
      permitsRequired: splitMultiline(permitsText),
    });

    await saveRAMSDocumentToAPI(updated);
    setDocs((prev) => prev.map((doc) => (doc.id === updated.id ? updated : doc)));
    alert("RAMS document updated.");
  };

  const handleDelete = async () => {
    if (!selectedDoc) return;
    if (!confirm(`Delete RAMS document: ${selectedDoc.title}?`)) return;

    await deleteRAMSDocumentFromAPI(selectedDoc.id);
    const nextDocs = docs.filter((doc) => doc.id !== selectedDoc.id);
    setDocs(nextDocs);
    setSelectedDocId(nextDocs[0]?.id ?? null);
  };

  const handleExportPrint = () => {
    if (!selectedDoc) return;
    const exportWindow = window.open("", "_blank", "width=1000,height=800");
    if (!exportWindow) {
      alert("Unable to open print window. Please allow pop-ups for this site.");
      return;
    }

    exportWindow.document.open();
    exportWindow.document.write(buildRAMSPrintableHtml(selectedDoc));
    exportWindow.document.close();
  };

  useEffect(() => {
    if (!selectedDoc) return;
    setPpeText(listToText(selectedDoc.ppeRequired));
    setPlantText(listToText(selectedDoc.plantEquipment));
    setMethodText(listToText(selectedDoc.methodStatementSteps));
    setEmergencyText(listToText(selectedDoc.emergencyProcedures));
    setEnvironmentText(listToText(selectedDoc.environmentalControls));
    setPermitsText(listToText(selectedDoc.permitsRequired));
  }, [selectedDocId]);

  useEffect(() => {
    const cleanedPostcode = sitePostcode.trim().toUpperCase();
    if (cleanedPostcode.length < 5) {
      setNearestHospitalName("");
      setNearestHospitalAddress("");
      setNearestHospitalDistanceKm(null);
      setNearestHospitalPhone("");
      setSiteLat(null);
      setSiteLon(null);
      setHospitalLat(null);
      setHospitalLon(null);
      setPostcodeLookupStatus("idle");
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        setPostcodeLookupStatus("loading");
        
        // Get site coordinates from postcodes.io
        const postcodeLookup = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(cleanedPostcode)}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        
        if (!postcodeLookup.ok) {
          throw new Error("Postcode lookup failed");
        }
        
        const postcodeData = (await postcodeLookup.json()) as {
          status: number;
          result?: { latitude: number; longitude: number };
        };
        
        if (postcodeData.status !== 200 || !postcodeData.result) {
          throw new Error("Invalid postcode");
        }
        
        setSiteLat(postcodeData.result.latitude);
        setSiteLon(postcodeData.result.longitude);
        
        // Get nearest hospital from API
        const response = await fetch(`/api/aande/nearest?postcode=${encodeURIComponent(cleanedPostcode)}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error("A&E lookup failed");
        }
        const payload = (await response.json()) as {
          success: boolean;
          data?: {
            name: string;
            address: string;
            phone: string;
            distanceKm: number;
            lat?: number;
            lon?: number;
          };
        };

        if (!payload.success || !payload.data) {
          throw new Error("Invalid A&E response");
        }

        setNearestHospitalName(payload.data.name);
        setNearestHospitalAddress(payload.data.address);
        setNearestHospitalDistanceKm(payload.data.distanceKm);
        setNearestHospitalPhone(payload.data.phone);
        setHospitalLat(payload.data.lat ?? null);
        setHospitalLon(payload.data.lon ?? null);
        setPostcodeLookupStatus("resolved");
      } catch {
        setNearestHospitalName("");
        setNearestHospitalAddress("");
        setNearestHospitalDistanceKm(null);
        setNearestHospitalPhone("");
        setSiteLat(null);
        setSiteLon(null);
        setHospitalLat(null);
        setHospitalLon(null);
        setPostcodeLookupStatus("error");
      }
    }, 500);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [sitePostcode]);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
        <h1 className="text-2xl font-bold text-white">Risk Assessments & Method Statements</h1>
        <p className="mt-1 text-sm text-gray-400">
          Generate RAMS documents based on work type templates, then edit and save project-specific controls.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-lg border border-gray-700 bg-gray-800 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Create RAMS</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-gray-400">Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white" placeholder="e.g. RAMS - Drainage Works" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-gray-400">Work Elements</label>
              <div className="max-h-40 space-y-2 overflow-y-auto rounded border border-gray-600 bg-gray-900 px-3 py-2">
                {workTypes.map((type) => {
                  const checked = selectedWorkTypes.includes(type);
                  return (
                    <label key={type} className="flex items-center gap-2 text-sm text-white">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedWorkTypes((prev) => [...prev, type]);
                          } else {
                            setSelectedWorkTypes((prev) => prev.filter((item) => item !== type));
                          }
                        }}
                        className="h-4 w-4 rounded border-gray-500 bg-gray-800 text-orange-500 focus:ring-orange-500"
                      />
                      <span>{type}</span>
                    </label>
                  );
                })}
              </div>
              <p className="mt-1 text-xs text-gray-500">Tick one or more elements to build a combined RAMS document.</p>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-gray-400">Project Name</label>
              <select value={projectName} onChange={(e) => handleProjectSelection(e.target.value)} className="w-full rounded border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white">
                {projectOptions.map((project) => (
                  <option key={project.name} value={project.name}>{project.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-gray-400">Location</label>
              <input value={location} onChange={(e) => setLocation(e.target.value)} className="w-full rounded border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-gray-400">Site Postcode</label>
              <input value={sitePostcode} onChange={(e) => setSitePostcode(e.target.value.toUpperCase())} className="w-full rounded border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white" placeholder="e.g. M13 9WL" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-gray-400">Project Manager</label>
              <input value={projectManager} onChange={(e) => setProjectManager(e.target.value)} className="w-full rounded border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-gray-400">Project Phase</label>
              <input value={projectPhase} onChange={(e) => setProjectPhase(e.target.value)} className="w-full rounded border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-gray-400">Author</label>
              <input value={author} onChange={(e) => setAuthor(e.target.value)} className="w-full rounded border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-gray-400">Approver</label>
              <input value={approver} onChange={(e) => setApprover(e.target.value)} className="w-full rounded border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-gray-400">Issue Date</label>
              <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className="w-full rounded border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-gray-400">Review Date</label>
              <input type="date" value={reviewDate} onChange={(e) => setReviewDate(e.target.value)} className="w-full rounded border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-gray-400">Approval Status</label>
              <select value={approvalStatus} onChange={(e) => setApprovalStatus(e.target.value as "Draft" | "Pending Approval" | "Approved")} className="w-full rounded border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white">
                <option value="Draft">Draft</option>
                <option value="Pending Approval">Pending Approval</option>
                <option value="Approved">Approved</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-gray-400">Tier 1 Profile</label>
              <select value={tier1Profile} onChange={(e) => setTier1Profile(e.target.value as Tier1Profile)} className="w-full rounded border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white">
                {tier1Profiles.map((profile) => (
                  <option key={profile} value={profile}>{profile}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded border border-gray-700 bg-gray-900 p-3 text-xs text-gray-300 space-y-1">
            <p className="font-semibold text-gray-200">Nearest A&E (auto-populated from postcode)</p>
            {postcodeLookupStatus === "loading" && <p>Looking up nearest A&E…</p>}
            {postcodeLookupStatus === "error" && <p className="text-red-300">Unable to resolve postcode. Please check postcode format.</p>}
            {(postcodeLookupStatus === "resolved" || nearestHospitalName) && (
              <>
                <p><span className="text-gray-400">Hospital:</span> {nearestHospitalName}</p>
                <p><span className="text-gray-400">Address:</span> {nearestHospitalAddress}</p>
                <p><span className="text-gray-400">Phone:</span> {nearestHospitalPhone}</p>
                <p><span className="text-gray-400">Distance:</span> {nearestHospitalDistanceKm ?? "-"} km</p>
              </>
            )}
          </div>

          <div className="rounded border border-gray-700 bg-gray-900 p-3 text-xs text-gray-400">
            Template preview loaded for <span className="text-white font-semibold">{selectedWorkTypes.length} selected element(s)</span> with merged controls (PPE, plant, sequencing, permits, emergency and environmental controls). Review and tailor to project-specific constraints before issue.
          </div>

          <button onClick={handleGenerate} className="rounded bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600">
            Generate RAMS Document
          </button>
        </div>

        <div className="rounded-lg border border-gray-700 bg-gray-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">RAMS Library</h2>
            <span className="text-xs text-gray-400">{filteredDocs.length} document(s)</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search title/project/location" className="w-full rounded border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white" />
            <select value={filterWorkType} onChange={(e) => setFilterWorkType(e.target.value as "all" | WorkType)} className="w-full rounded border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white">
              <option value="all">All Work Types</option>
              {workTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)} className="w-full rounded border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white sm:col-span-2">
              <option value="all">All Projects</option>
              {projectOptions.map((project) => (
                <option key={project.name} value={project.name}>{project.name}</option>
              ))}
            </select>
          </div>

          <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {filteredDocs.map((doc) => (
              <button
                key={doc.id}
                onClick={() => setSelectedDocId(doc.id)}
                className={`w-full rounded border px-3 py-3 text-left transition ${selectedDocId === doc.id ? "border-orange-500 bg-orange-500/10" : "border-gray-700 bg-gray-900 hover:bg-gray-900/70"}`}
              >
                <p className="text-sm font-semibold text-white">{doc.title}</p>
                <p className="text-xs text-gray-400">{doc.projectName} • {formatWorkTypes(getDocWorkTypes(doc))}</p>
                <p className="text-xs text-gray-500">Manager: {doc.projectManager || "Not set"} • Phase: {doc.projectPhase || "Not set"}</p>
                <p className="text-xs text-gray-500">Tier 1: {doc.tier1Profile || "Standard"}</p>
                <p className="text-xs text-gray-500">A&E: {doc.nearestHospitalName || "Not set"}</p>
                <p className="text-xs text-gray-500 mt-1">Last updated: {new Date(doc.lastModifiedDate).toLocaleString()}</p>
              </button>
            ))}
            {filteredDocs.length === 0 && (
              <div className="rounded border border-dashed border-gray-700 p-6 text-center text-sm text-gray-400">No RAMS documents found.</div>
            )}
          </div>
        </div>
      </div>

      {selectedDoc && (
        <div className="rounded-lg border border-gray-700 bg-gray-800 p-6 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">{selectedDoc.title}</h2>
              <p className="text-sm text-gray-400">{selectedDoc.projectName} • {selectedDoc.location} • {formatWorkTypes(getDocWorkTypes(selectedDoc))}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={handleExportPrint} className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Export PDF / Print</button>
              <button onClick={handleSaveEdits} className="rounded bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700">Save Changes</button>
              <button onClick={handleDelete} className="rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">Delete</button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded border border-gray-700 bg-gray-900 p-3">
              <p className="text-xs uppercase text-gray-400">Author</p>
              <p className="text-sm text-white mt-1">{selectedDoc.author}</p>
            </div>
            <div className="rounded border border-gray-700 bg-gray-900 p-3">
              <p className="text-xs uppercase text-gray-400">Issue Date</p>
              <p className="text-sm text-white mt-1">{selectedDoc.issueDate}</p>
            </div>
            <div className="rounded border border-gray-700 bg-gray-900 p-3">
              <p className="text-xs uppercase text-gray-400">Review Date</p>
              <p className="text-sm text-white mt-1">{selectedDoc.reviewDate || "Not set"}</p>
            </div>
            <div className="rounded border border-gray-700 bg-gray-900 p-3">
              <p className="text-xs uppercase text-gray-400">Project Manager</p>
              <p className="text-sm text-white mt-1">{selectedDoc.projectManager || "Not set"}</p>
            </div>
            <div className="rounded border border-gray-700 bg-gray-900 p-3">
              <p className="text-xs uppercase text-gray-400">Project Phase</p>
              <p className="text-sm text-white mt-1">{selectedDoc.projectPhase || "Not set"}</p>
            </div>
            <div className="rounded border border-gray-700 bg-gray-900 p-3">
              <p className="text-xs uppercase text-gray-400">Status</p>
              <select value={selectedDoc.approvalStatus} onChange={(e) => setDocs((prev) => prev.map((doc) => doc.id === selectedDoc.id ? {...doc, approvalStatus: e.target.value as "Draft" | "Pending Approval" | "Approved"} : doc))} className="mt-1 w-full rounded border border-gray-600 bg-gray-800 px-2 py-1 text-xs text-white">
                <option value="Draft">Draft</option>
                <option value="Pending Approval">Pending Approval</option>
                <option value="Approved">Approved</option>
              </select>
            </div>
            <div className="rounded border border-gray-700 bg-gray-900 p-3">
              <p className="text-xs uppercase text-gray-400">Revision</p>
              <input type="number" min="1" value={selectedDoc.revision} onChange={(e) => setDocs((prev) => prev.map((doc) => doc.id === selectedDoc.id ? {...doc, revision: parseInt(e.target.value) || 1} : doc))} className="mt-1 w-full rounded border border-gray-600 bg-gray-800 px-2 py-1 text-xs text-white" />
            </div>
            <div className="rounded border border-gray-700 bg-gray-900 p-3">
              <p className="text-xs uppercase text-gray-400">Approver</p>
              <p className="text-sm text-white mt-1">{selectedDoc.approver || "Not set"}</p>
            </div>
            <div className="rounded border border-gray-700 bg-gray-900 p-3">
              <p className="text-xs uppercase text-gray-400">Tier 1 Profile</p>
              <p className="text-sm text-white mt-1">{selectedDoc.tier1Profile || "Standard"}</p>
            </div>
            <div className="rounded border border-gray-700 bg-gray-900 p-3">
              <p className="text-xs uppercase text-gray-400">Site Postcode</p>
              <p className="text-sm text-white mt-1">{selectedDoc.sitePostcode || "Not set"}</p>
            </div>
            <div className="rounded border border-gray-700 bg-gray-900 p-3 sm:col-span-2">
              <p className="text-xs uppercase text-gray-400">Nearest A&E</p>
              <p className="text-sm text-white mt-1">{selectedDoc.nearestHospitalName || "Not set"}</p>
              <p className="text-xs text-gray-400 mt-1">{selectedDoc.nearestHospitalAddress || ""}</p>
              <p className="text-xs text-gray-400 mt-1">{selectedDoc.nearestHospitalPhone ? `${selectedDoc.nearestHospitalPhone} • ` : ""}{selectedDoc.nearestHospitalDistanceKm ? `${selectedDoc.nearestHospitalDistanceKm} km` : ""}</p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-gray-400">PPE Required (one per line)</label>
              <textarea value={ppeText} onChange={(e) => setPpeText(e.target.value)} rows={6} className="w-full rounded border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-gray-400">Plant & Equipment (one per line)</label>
              <textarea value={plantText} onChange={(e) => setPlantText(e.target.value)} rows={6} className="w-full rounded border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-gray-400">Method Statement Steps (one per line)</label>
              <textarea value={methodText} onChange={(e) => setMethodText(e.target.value)} rows={8} className="w-full rounded border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-gray-400">Emergency Procedures (one per line)</label>
              <textarea value={emergencyText} onChange={(e) => setEmergencyText(e.target.value)} rows={8} className="w-full rounded border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-gray-400">Environmental Controls (one per line)</label>
              <textarea value={environmentText} onChange={(e) => setEnvironmentText(e.target.value)} rows={6} className="w-full rounded border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-gray-400">Permits Required (one per line)</label>
              <textarea value={permitsText} onChange={(e) => setPermitsText(e.target.value)} rows={6} className="w-full rounded border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white" />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase text-gray-400 mb-2">Risk Assessment Matrix</h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse overflow-hidden rounded border border-gray-700">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs uppercase text-gray-400">Hazard</th>
                    <th className="px-3 py-2 text-left text-xs uppercase text-gray-400">Initial</th>
                    <th className="px-3 py-2 text-left text-xs uppercase text-gray-400">Controls</th>
                    <th className="px-3 py-2 text-left text-xs uppercase text-gray-400">Residual</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedDoc.riskAssessment.map((risk, index) => (
                    <tr key={`${risk.hazard}-${index}`} className="border-t border-gray-700 bg-gray-800">
                      <td className="px-3 py-2 text-sm text-white">{risk.hazard}</td>
                      <td className="px-3 py-2 text-sm text-yellow-300">{risk.initialRisk}</td>
                      <td className="px-3 py-2 text-sm text-gray-300">{risk.controls}</td>
                      <td className="px-3 py-2 text-sm text-green-300">{risk.residualRisk}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
