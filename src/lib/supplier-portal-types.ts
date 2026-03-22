export type SupplierEnquiryCategory = "labour" | "plant" | "materials" | "subcontract";

export type SupplierEnquiryStatus = "draft" | "sent" | "closed";

export type LinkedRecordType = "estimate" | "project" | "overhead";

export type SupplierEnquiryItem = {
  id: string;
  itemCode?: string;
  description: string;
  unit: string;
  quantity: number;
  notes?: string;
};

export type SupplierEnquiryDocument = {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  dataUrl: string;
};

export type SupplierInvite = {
  id: string;
  supplierId?: string;
  supplierName: string;
  supplierEmail: string;
  inviteToken: string;
  sentAt?: string;
  viewedAt?: string;
  respondedAt?: string;
  status: "pending" | "viewed" | "responded";
};

export type SupplierLineResponse = {
  itemId: string;
  unitRate: number;
  total: number;
  notes?: string;
};

export type SupplierAdditionalLine = {
  id: string;
  label: string;
  quantity?: number;
  unit?: string;
  unitRate?: number;
  amount: number;
};

export type SupplierQuoteDocument = {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  dataUrl: string;
};

export type SupplierEnquiryResponse = {
  id: string;
  enquiryId: string;
  inviteToken: string;
  supplierName: string;
  supplierEmail: string;
  submittedAt: string;
  currency: string;
  validityDays?: number;
  validityDate?: string;
  leadTime?: string;
  notes?: string;
  lineItems: SupplierLineResponse[];
  additionalLines?: SupplierAdditionalLine[];
  quoteDocuments?: SupplierQuoteDocument[];
  grandTotal: number;
};

export type SupplierEnquiry = {
  id: string;
  reference: string;
  title: string;
  category: SupplierEnquiryCategory;
  linkedRecordType?: LinkedRecordType;
  linkedRecordId?: string;
  linkedRecordName?: string;
  requiredBy?: string;
  notes?: string;
  items: SupplierEnquiryItem[];
  documents: SupplierEnquiryDocument[];
  invites: SupplierInvite[];
  responses: SupplierEnquiryResponse[];
  status: SupplierEnquiryStatus;
  createdAt: string;
  createdBy?: string;
  sentAt?: string;
};

export type SupplierPortalPayload = {
  enquiries: SupplierEnquiry[];
};
