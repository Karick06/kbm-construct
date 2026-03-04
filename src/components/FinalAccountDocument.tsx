'use client';

import type { FinalAccount } from '@/lib/payment-document-models';
import { formatCurrencyUK, formatDateUK } from '@/lib/payment-document-models';

interface FinalAccountDocumentProps {
  account: FinalAccount;
  company?: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
}

export function FinalAccountDocument({ account, company }: FinalAccountDocumentProps) {
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
              <p className="text-sm font-bold">FINAL ACCOUNT</p>
            </div>
            <p className="text-xs text-gray-600">Date: {formatDateUK(account.dateGenerated)}</p>
          </div>
        </div>
      </div>

      {/* Project Information */}
      <div className="mb-6">
        <h2 className="text-xs font-bold uppercase border-b border-gray-400 pb-2 mb-3">PROJECT INFORMATION</h2>
        
        <table className="w-full text-xs">
          <tbody>
            <tr>
              <td className="font-semibold pr-4 py-1 w-1/3">Project:</td>
              <td className="py-1">{account.projectName}</td>
              <td className="font-semibold pr-4 py-1 w-1/4">Client:</td>
              <td className="py-1">{account.client}</td>
            </tr>
            <tr>
              <td className="font-semibold pr-4 py-1">Contractor:</td>
              <td className="py-1">{account.contractor}</td>
              <td className="font-semibold pr-4 py-1">Completion Date:</td>
              <td className="py-1">{formatDateUK(account.completionDate)}</td>
            </tr>
            <tr>
              <td className="font-semibold pr-4 py-1">Start Date:</td>
              <td className="py-1">{formatDateUK(account.startDate)}</td>
              <td className="font-semibold pr-4 py-1">Value of Work:</td>
              <td className="py-1 font-bold">{formatCurrencyUK(account.valueOfWorkCompleted)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Contract Value Summary */}
      <div className="mb-6">
        <h2 className="text-xs font-bold uppercase border-b border-gray-400 pb-2 mb-3">CONTRACT VALUE SUMMARY</h2>
        
        <table className="w-full text-xs border border-gray-400">
          <tbody>
            <tr className="border-b border-gray-400">
              <td className="border-r border-gray-400 px-3 py-2 w-2/3 font-semibold">Original Contract Sum</td>
              <td className="px-3 py-2 text-right font-bold">{formatCurrencyUK(account.originalContractSum)}</td>
            </tr>
            {account.authorizedVariations !== 0 && (
              <tr className="border-b border-gray-400">
                <td className="border-r border-gray-400 px-3 py-2 font-semibold">Authorized Variations</td>
                <td className="px-3 py-2 text-right font-bold">{formatCurrencyUK(account.authorizedVariations)}</td>
              </tr>
            )}
            {account.contractualAdjustments !== 0 && (
              <tr className="border-b border-gray-400">
                <td className="border-r border-gray-400 px-3 py-2 font-semibold">Contractual Adjustments</td>
                <td className="px-3 py-2 text-right font-bold">{formatCurrencyUK(account.contractualAdjustments)}</td>
              </tr>
            )}
            <tr className="bg-gray-100 font-semibold">
              <td className="border-r border-gray-400 px-3 py-2">Final Contract Sum</td>
              <td className="px-3 py-2 text-right">{formatCurrencyUK(account.finalContractSum)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Variations (if any) */}
      {account.variations && account.variations.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-bold uppercase border-b border-gray-400 pb-2 mb-3">VARIATIONS DETAIL</h2>
          
          <table className="w-full text-xs border border-gray-400">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-400 px-3 py-2 text-left font-semibold w-1/6">Var No.</th>
                <th className="border border-gray-400 px-3 py-2 text-left font-semibold">Description</th>
                <th className="border border-gray-400 px-3 py-2 text-center font-semibold w-1/12">Status</th>
                <th className="border border-gray-400 px-3 py-2 text-right font-semibold w-1/6">Amount</th>
                <th className="border border-gray-400 px-3 py-2 text-right font-semibold w-1/6">Approved</th>
              </tr>
            </thead>
            <tbody>
              {account.variations.map((var_, idx) => (
                <tr key={idx} className="border-b border-gray-400">
                  <td className="border border-gray-400 px-3 py-1 font-mono">{var_.variationNumber}</td>
                  <td className="border border-gray-400 px-3 py-1">{var_.description}</td>
                  <td className="border border-gray-400 px-3 py-1 text-center">
                    <span className={`text-xs font-bold px-2 py-1 rounded ${
                      var_.status === 'approved' ? 'bg-green-100 text-green-800' :
                      var_.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {var_.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="border border-gray-400 px-3 py-1 text-right">{formatCurrencyUK(var_.amount)}</td>
                  <td className="border border-gray-400 px-3 py-1 text-right font-bold">{formatCurrencyUK(var_.approvedAmount || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Financial Settlement */}
      <div className="mb-6">
        <h2 className="text-xs font-bold uppercase border-b border-gray-400 pb-2 mb-3">FINANCIAL SETTLEMENT</h2>
        
        <table className="w-full text-xs border border-gray-400">
          <tbody>
            <tr className="border-b border-gray-400">
              <td className="border-r border-gray-400 px-3 py-2 w-2/3 font-semibold">Final Contract Sum</td>
              <td className="px-3 py-2 text-right font-bold">{formatCurrencyUK(account.finalContractSum)}</td>
            </tr>
            <tr className="border-b border-gray-400">
              <td className="border-r border-gray-400 px-3 py-2 font-semibold">Total Claimed to Date</td>
              <td className="px-3 py-2 text-right font-bold text-orange-600">{formatCurrencyUK(account.totalClaimedToDate)}</td>
            </tr>
            <tr className="border-b border-gray-400">
              <td className="border-r border-gray-400 px-3 py-2 font-semibold">Retention Held</td>
              <td className="px-3 py-2 text-right font-bold text-red-600">{formatCurrencyUK(account.retentionHeld)}</td>
            </tr>
            <tr className="border-b border-gray-400">
              <td className="border-r border-gray-400 px-3 py-2 font-semibold">Total Net Payments</td>
              <td className="px-3 py-2 text-right font-bold">{formatCurrencyUK(account.totalNetPayments)}</td>
            </tr>
            <tr className="bg-yellow-100 font-semibold">
              <td className="border-r border-gray-400 px-3 py-2">Final Balance Due</td>
              <td className="px-3 py-2 text-right text-lg">{formatCurrencyUK(account.finalBalance)}</td>
            </tr>
            {account.retentionToBeReleased > 0 && (
              <tr className="bg-green-100 font-semibold">
                <td className="border-r border-gray-400 px-3 py-2">Retention to be Released</td>
                <td className="px-3 py-2 text-right text-lg">{formatCurrencyUK(account.retentionToBeReleased)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Sign-off Section */}
      <div className="mb-6">
        <h2 className="text-xs font-bold uppercase border-b border-gray-400 pb-2 mb-3">SIGN-OFF</h2>
        
        <div className="grid grid-cols-2 gap-6 text-xs mt-4">
          <div>
            <p className="font-semibold mb-2">Contractor:</p>
            <div className="border-t border-gray-400 mt-8 pt-2">
              {account.signedByContractor ? (
                <p className="font-bold text-green-600">✓ Signed</p>
              ) : (
                <p className="text-gray-400">Signature: _________________</p>
              )}
            </div>
            {account.contractorSignDate && (
              <p className="text-xs text-gray-600 mt-1">Date: {formatDateUK(account.contractorSignDate)}</p>
            )}
          </div>
          <div>
            <p className="font-semibold mb-2">Architect/Contract Administrator:</p>
            <div className="border-t border-gray-400 mt-8 pt-2">
              {account.signedByArchitect ? (
                <p className="font-bold text-green-600">✓ Signed</p>
              ) : (
                <p className="text-gray-400">Signature: _________________</p>
              )}
            </div>
            {account.architectSignDate && (
              <p className="text-xs text-gray-600 mt-1">Date: {formatDateUK(account.architectSignDate)}</p>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t-2 border-gray-800 mt-6 pt-4 text-center text-xs text-gray-600">
        <p>This Final Account has been agreed and signed by all parties</p>
        <p>Page 1 of 1</p>
      </div>
    </div>
  );
}
