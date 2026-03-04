'use client';

import type { ApplicationForPayment } from '@/lib/payment-document-models';
import { formatCurrencyUK, formatDateUK } from '@/lib/payment-document-models';

interface ApplicationDocumentProps {
  application: ApplicationForPayment;
  project: any;
  company?: {
    name: string;
    address: string;
    phone: string;
    email: string;
    website?: string;
  };
}

export function ApplicationForPaymentDocument({ application, project, company }: ApplicationDocumentProps) {
  const totals = {
    previouslyValued: application.previouslyValued,
    thisValuation: application.thisValuation,
    totalValuation: application.totalValuation,
    retention: application.retentionAmount,
    deductions: application.defectsDeduction + application.otherDeductions,
    netPayable: application.netPayment,
    grossPayment: application.thisValuation
  };

  return (
    <div className="w-full bg-white text-gray-900 font-sans" style={{ fontSize: '11pt' }}>
      {/* Header */}
      <div className="border-b-2 border-gray-800 pb-4 mb-6">
        <div className="flex items-start justify-between">
          <div>
            {company && (
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">{company.name}</h1>
                <p className="text-xs text-gray-600">{company.address}</p>
                {company.phone && <p className="text-xs text-gray-600">Phone: {company.phone}</p>}
                {company.email && <p className="text-xs text-gray-600">Email: {company.email}</p>}
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-xs mb-2">
              <p className="font-semibold">Document Type:</p>
              <p className="text-sm font-bold">APPLICATION FOR PAYMENT</p>
            </div>
          </div>
        </div>
      </div>

      {/* Project Details */}
      <div className="mb-6">
        <table className="w-full text-xs">
          <tbody>
            <tr>
              <td className="font-semibold pr-4 py-1 w-1/3">Project:</td>
              <td className="py-1">{project?.projectName}</td>
              <td className="font-semibold pr-4 py-1 w-1/4">Application No.:</td>
              <td className="py-1 font-bold">{application.applicationNumber}</td>
            </tr>
            <tr>
              <td className="font-semibold pr-4 py-1">Client:</td>
              <td className="py-1">{project?.client}</td>
              <td className="font-semibold pr-4 py-1">Submission Date:</td>
              <td className="py-1">{formatDateUK(application.submissionDate)}</td>
            </tr>
            <tr>
              <td className="font-semibold pr-4 py-1">Location:</td>
              <td className="py-1">{project?.location || 'N/A'}</td>
              <td className="font-semibold pr-4 py-1">Period:</td>
              <td className="py-1">{formatDateUK(application.periodStart)} - {formatDateUK(application.periodEnd)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Valuation Summary */}
      <div className="mb-6">
        <h2 className="text-xs font-bold uppercase border-b border-gray-400 pb-2 mb-3">VALUATION SUMMARY</h2>
        
        <table className="w-full text-xs mb-4 border border-gray-400">
          <thead>
            <tr className="bg-gray-200">
              <th className="border border-gray-400 px-3 py-2 text-left font-semibold">Description</th>
              <th className="border border-gray-400 px-3 py-2 text-right font-semibold">Amount (£)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-400 px-3 py-1">Contract Sum</td>
              <td className="border border-gray-400 px-3 py-1 text-right font-semibold">{formatCurrencyUK(application.contractSum)}</td>
            </tr>
            {application.totalVariations > 0 && (
              <tr>
                <td className="border border-gray-400 px-3 py-1">Authorized Variations</td>
                <td className="border border-gray-400 px-3 py-1 text-right font-semibold">{formatCurrencyUK(application.totalVariations)}</td>
              </tr>
            )}
            <tr className="font-semibold bg-gray-100">
              <td className="border border-gray-400 px-3 py-1">Adjusted Contract Sum</td>
              <td className="border border-gray-400 px-3 py-1 text-right">{formatCurrencyUK(application.adjustedContractSum)}</td>
            </tr>
          </tbody>
        </table>

        {/* Line Items */}
        <table className="w-full text-xs mb-4 border border-gray-400">
          <thead>
            <tr className="bg-gray-200">
              <th className="border border-gray-400 px-3 py-2 text-left font-semibold">Item No.</th>
              <th className="border border-gray-400 px-3 py-2 text-left font-semibold">Description</th>
              <th className="border border-gray-400 px-3 py-2 text-right font-semibold">Previously Claimed</th>
              <th className="border border-gray-400 px-3 py-2 text-right font-semibold">This Application</th>
              <th className="border border-gray-400 px-3 py-2 text-right font-semibold">Total Claimed</th>
              <th className="border border-gray-400 px-3 py-2 text-right font-semibold">Outstanding</th>
            </tr>
          </thead>
          <tbody>
            {application.lineItems && application.lineItems.map((item: any) => (
              <tr key={item.id}>
                <td className="border border-gray-400 px-3 py-1">{item.itemNumber}</td>
                <td className="border border-gray-400 px-3 py-1">{item.description}</td>
                <td className="border border-gray-400 px-3 py-1 text-right">{formatCurrencyUK(item.previouslyClaimed || 0)}</td>
                <td className="border border-gray-400 px-3 py-1 text-right">{formatCurrencyUK(item.thisApplicationClaimed || 0)}</td>
                <td className="border border-gray-400 px-3 py-1 text-right">{formatCurrencyUK(item.totalClaimed || 0)}</td>
                <td className="border border-gray-400 px-3 py-1 text-right">{formatCurrencyUK(item.outstandingAmount || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Certification of Valuation */}
      <div className="mb-6">
        <h2 className="text-xs font-bold uppercase border-b border-gray-400 pb-2 mb-3">CERTIFICATION OF VALUATION</h2>
        
        <table className="w-full text-xs border border-gray-400">
          <tbody>
            <tr className="border-b border-gray-400">
              <td className="border-r border-gray-400 px-3 py-2 w-1/2 font-semibold">Previously Valued</td>
              <td className="px-3 py-2 text-right font-bold">{formatCurrencyUK(totals.previouslyValued)}</td>
            </tr>
            <tr className="border-b border-gray-400">
              <td className="border-r border-gray-400 px-3 py-2 font-semibold">Value of this Certificate</td>
              <td className="px-3 py-2 text-right font-bold text-orange-600">{formatCurrencyUK(totals.thisValuation)}</td>
            </tr>
            <tr className="bg-gray-100 font-semibold">
              <td className="border-r border-gray-400 px-3 py-2">Total Cumulative Valuation</td>
              <td className="px-3 py-2 text-right">{formatCurrencyUK(totals.totalValuation)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Deductions */}
      <div className="mb-6">
        <h2 className="text-xs font-bold uppercase border-b border-gray-400 pb-2 mb-3">DEDUCTIONS</h2>
        
        <table className="w-full text-xs border border-gray-400">
          <tbody>
            <tr className="border-b border-gray-400">
              <td className="border-r border-gray-400 px-3 py-2 w-1/2 font-semibold">Retention ({application.retentionPercentage}%)</td>
              <td className="px-3 py-2 text-right font-bold">{formatCurrencyUK(totals.retention)}</td>
            </tr>
            {(application.defectsDeduction > 0 || application.otherDeductions > 0) && (
              <>
                {application.defectsDeduction > 0 && (
                  <tr className="border-b border-gray-400">
                    <td className="border-r border-gray-400 px-3 py-2 font-semibold">Defects Deduction</td>
                    <td className="px-3 py-2 text-right font-bold">{formatCurrencyUK(application.defectsDeduction)}</td>
                  </tr>
                )}
                {application.otherDeductions > 0 && (
                  <tr className="border-b border-gray-400">
                    <td className="border-r border-gray-400 px-3 py-2 font-semibold">Other Deductions</td>
                    <td className="px-3 py-2 text-right font-bold">{formatCurrencyUK(application.otherDeductions)}</td>
                  </tr>
                )}
              </>
            )}
            <tr className="bg-gray-100 font-semibold">
              <td className="border-r border-gray-400 px-3 py-2">Total Deductions</td>
              <td className="px-3 py-2 text-right">{formatCurrencyUK(application.totalDeductions)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Payment Certification */}
      <div className="mb-6">
        <h2 className="text-xs font-bold uppercase border-b border-gray-400 pb-2 mb-3">PAYMENT CERTIFICATION</h2>
        
        <table className="w-full text-xs border border-gray-400">
          <tbody>
            <tr className="border-b border-gray-400">
              <td className="border-r border-gray-400 px-3 py-2 w-1/2 font-semibold">Gross Valuation</td>
              <td className="px-3 py-2 text-right font-bold">{formatCurrencyUK(totals.grossPayment)}</td>
            </tr>
            <tr className="border-b border-gray-400">
              <td className="border-r border-gray-400 px-3 py-2 font-semibold">Less: Deductions</td>
              <td className="px-3 py-2 text-right font-bold text-red-600">({formatCurrencyUK(application.totalDeductions)})</td>
            </tr>
            <tr className="bg-gray-100 border-b border-gray-400">
              <td className="border-r border-gray-400 px-3 py-2 font-semibold">Net Payment Due</td>
              <td className="px-3 py-2 text-right font-bold text-lg">{formatCurrencyUK(totals.netPayable)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Status & Approvals */}
      <div className="mb-6">
        <h2 className="text-xs font-bold uppercase border-b border-gray-400 pb-2 mb-3">APPROVALS & STATUS</h2>
        
        <div className="grid grid-cols-3 gap-4 text-xs">
          <div>
            <p className="font-semibold mb-2">Status:</p>
            <p className={`px-2 py-1 rounded text-white font-bold ${
              application.status === 'paid' ? 'bg-green-600' :
              application.status === 'approved' ? 'bg-blue-600' :
              application.status === 'submitted' ? 'bg-yellow-600' :
              'bg-gray-600'
            }`}>
              {application.status.toUpperCase()}
            </p>
          </div>
          <div>
            <p className="font-semibold mb-2">Contractor Signed:</p>
            <p className={`px-2 py-1 rounded text-white font-bold ${application.contractorSigned ? 'bg-green-600' : 'bg-gray-400'}`}>
              {application.contractorSigned ? '✓ YES' : '✗ NO'}
            </p>
          </div>
          <div>
            <p className="font-semibold mb-2">Architect Approved:</p>
            <p className={`px-2 py-1 rounded text-white font-bold ${application.architectSigned ? 'bg-green-600' : 'bg-gray-400'}`}>
              {application.architectSigned ? '✓ YES' : '✗ NO'}
            </p>
          </div>
        </div>
      </div>

      {/* Payment Reference */}
      {application.paymentDate && (
        <div className="mb-6 border-t border-gray-400 pt-4">
          <p className="text-xs"><span className="font-semibold">Payment Date:</span> {formatDateUK(application.paymentDate)}</p>
          {application.paymentReference && (
            <p className="text-xs"><span className="font-semibold">Payment Reference:</span> {application.paymentReference}</p>
          )}
        </div>
      )}

      {/* Notes */}
      {application.notes && (
        <div className="mb-6 border-t border-gray-400 pt-4">
          <p className="text-xs font-semibold mb-2">Notes:</p>
          <p className="text-xs whitespace-pre-wrap">{application.notes}</p>
        </div>
      )}

      {/* Footer */}
      <div className="border-t-2 border-gray-800 mt-6 pt-4 text-center text-xs text-gray-600">
        <p>This document is generated by KBM Construct</p>
        <p>Page 1 of 1</p>
      </div>
    </div>
  );
}
