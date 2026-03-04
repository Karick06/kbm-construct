// =============================================================================
// DATA INTEGRATION BRIDGE
// =============================================================================
// Facilitates bidirectional data transfer and linking between Commercial
// and Operations modules. Enables cross-referencing, data synchronization,
// and integrated reporting across both systems.
// =============================================================================

import type { InvoiceApplication } from './operations-models';
import type { Valuation, CommercialVariation, CostReport } from './commercial-models';

// Link types for cross-module references
export type LinkType =
  | 'valuation-to-invoice'
  | 'variation-to-defect'
  | 'variation-to-variation'
  | 'cost-to-budget'
  | 'contract-to-subcontract';

export interface DataLink {
  id: string;
  linkType: LinkType;
  sourceModule: 'commercial' | 'operations';
  sourceId: string;
  sourceType: string;
  targetModule: 'commercial' | 'operations';
  targetId: string;
  targetType: string;
  createdDate: string;
  createdBy: string;
  bidirectional: boolean;
  metadata?: Record<string, any>;
}

export interface CrossRefData {
  commercialVariations: CommercialVariation[];
  operationsDefects: any[];
  valuations: Valuation[];
  invoices: InvoiceApplication[];
  costReports: CostReport[];
}

// Link management
export const DataLinkManager = {
  /**
   * Create a bidirectional link between commercial and operations data
   */
  createLink: (
    sourceModule: 'commercial' | 'operations',
    sourceId: string,
    sourceType: string,
    targetModule: 'commercial' | 'operations',
    targetId: string,
    targetType: string,
    linkType: LinkType,
    createdBy: string
  ): DataLink => {
    return {
      id: `link-${Date.now()}-${Math.random()}`,
      linkType,
      sourceModule,
      sourceId,
      sourceType,
      targetModule,
      targetId,
      targetType,
      createdDate: new Date().toISOString(),
      createdBy,
      bidirectional: true,
      metadata: {},
    };
  },

  /**
   * Get all linked items for a specific source
   */
  getLinkedItems: (links: DataLink[], sourceId: string, sourceType: string) => {
    return links.filter(link => link.sourceId === sourceId && link.sourceType === sourceType);
  },

  /**
   * Find reverse links (target pointing to source)
   */
  getReverseLinks: (links: DataLink[], targetId: string, targetType: string) => {
    return links.filter(link => link.targetId === targetId && link.targetType === targetType);
  },
};

// Data synchronization utilities
export const DataSynchronizer = {
  /**
   * Sync commercial valuation to operations invoice
   * When a valuation is certified, it can automatically update related invoices
   */
  syncValuationToInvoice: (valuation: Valuation, invoice: InvoiceApplication): Partial<InvoiceApplication> => {
    if (valuation.status !== 'certified') {
      return {};
    }

    return {
      thisPayment: valuation.certifiedValue,
      status: 'certified',
    };
  },

  /**
   * Calculate cost impact when variations are approved
   * Flows variation costs to cost reports
   */
  calculateVariationImpact: (
    variation: CommercialVariation,
    costReports: CostReport[]
  ): Partial<CostReport>[] => {
    if (variation.status !== 'approved' && variation.status !== 'completed') {
      return [];
    }

    return costReports
      .filter(cr => cr.projectId === variation.projectId)
      .map(cr => ({
        ...cr,
        committed: cr.committed + (variation.quotedValue || 0),
        forecast: cr.forecast + (variation.quotedValue || 0),
      }));
  },

  /**
   * Update operations defects when commercial raises issues
   * Issues in commercial can map to operations defects
   */
  syncIssueToDefect: (
    issue: any,
    projectId: string
  ): {
    title: string;
    description: string;
    status: string;
    priority: string;
    projectId: string;
  } => {
    return {
      title: issue.title,
      description: `[Commercial Issue] ${issue.description}`,
      status: 'open',
      priority: issue.severity === 'high' ? 'critical' : issue.severity === 'medium' ? 'high' : 'normal',
      projectId,
    };
  },
};

// Cross-reference helpers
export const CrossReferenceUtils = {
  /**
   * Get all commercial items linked to a project
   */
  getProjectCommercialItems: (projectId: string, commercialData: any[]) => {
    return commercialData.filter(item => item.projectId === projectId);
  },

  /**
   * Get all operations items linked to a project
   */
  getProjectOperationsItems: (projectId: string, operationsData: any[]) => {
    return operationsData.filter(item => item.projectId === projectId);
  },

  /**
   * Calculate total project financial position
   * Combines commercial forecasts with operations actuals
   */
  getProjectFinancialPosition: (
    totalBudget: number,
    commercialForecast: number,
    operationsActual: number
  ) => {
    return {
      totalBudget,
      commercialForecast,
      operationsActual,
      variance: totalBudget - commercialForecast,
      burnThroughActual: ((operationsActual / totalBudget) * 100).toFixed(1),
      burnThroughForecast: ((commercialForecast / totalBudget) * 100).toFixed(1),
      onTrack: totalBudget >= commercialForecast,
      atRisk: totalBudget < commercialForecast && commercialForecast <= totalBudget * 1.1,
      overBudget: commercialForecast > totalBudget * 1.1,
    };
  },

  /**
   * Match variations between systems for unified reporting
   */
  matchVariations: (
    commercialVariations: CommercialVariation[],
    operationsVariations: any[]
  ) => {
    return commercialVariations.map(comVar => {
      const operationsMatch = operationsVariations.find(
        opVar =>
          opVar.projectId === comVar.projectId &&
          opVar.variationRef &&
          comVar.variationRef &&
          opVar.variationRef.toLowerCase().includes(comVar.variationRef.toLowerCase())
      );

      return {
        commercialVariation: comVar,
        operationsVariation: operationsMatch || null,
        linked: !!operationsMatch,
        status: comVar.status,
        value: comVar.quotedValue,
      };
    });
  },

  /**
   * Get unified cost breakdown across both systems
   */
  getUnifiedCostBreakdown: (costReports: CostReport[], invoices: InvoiceApplication[]) => {
    const commercialTotal = costReports.reduce((sum, cr) => sum + cr.forecast, 0);
    const operationsTotal = invoices.reduce((sum, inv) => sum + inv.thisPayment, 0);
    const committedTotal = costReports.reduce((sum, cr) => sum + cr.committed, 0);

    return {
      commercial: {
        forecast: commercialTotal,
        committed: committedTotal,
      },
      operations: {
        actual: operationsTotal,
      },
      combined: {
        totalForecast: commercialTotal,
        totalActual: operationsTotal,
        difference: commercialTotal - operationsTotal,
        percentageActual: ((operationsTotal / commercialTotal) * 100).toFixed(1),
      },
    };
  },
};

// Data export utilities for reporting
export const DataExporter = {
  /**
   * Export commercial data with operational context
   */
  exportCommercialWithContext: (
    valuations: Valuation[],
    variations: CommercialVariation[],
    projectId: string,
    operationsData: any
  ) => {
    return {
      projectId,
      exportDate: new Date().toISOString(),
      commercial: {
        valuations,
        variations,
        totalValuationsApplied: valuations.reduce((sum, v) => sum + v.appliedValue, 0),
        totalVariationsQuoted: variations.reduce((sum, v) => sum + (v.quotedValue || 0), 0),
      },
      operationsContext: operationsData,
      summary: {
        valuationCount: valuations.length,
        variationCount: variations.length,
        certificationsApproved: valuations.filter(v => v.status === 'certified').length,
        variationsApproved: variations.filter(v => v.status === 'approved').length,
      },
    };
  },

  /**
   * Export operations data with commercial context
   */
  exportOperationsWithContext: (
    invoices: InvoiceApplication[],
    projectId: string,
    commercialData: any
  ) => {
    return {
      projectId,
      exportDate: new Date().toISOString(),
      operations: {
        invoices,
        totalInvoiced: invoices.reduce((sum, inv) => sum + inv.thisPayment, 0),
      },
      commercialContext: commercialData,
      summary: {
        invoiceCount: invoices.length,
        totalValue: invoices.reduce((sum, inv) => sum + inv.thisPayment, 0),
        processedCount: invoices.filter(inv => inv.status === 'paid').length,
      },
    };
  },
};

// Integration status tracking
export interface IntegrationStatus {
  projectId: string;
  linkedItemsCount: number;
  lastSyncDate: string;
  syncStatus: 'synced' | 'pending' | 'failed';
  dataConsistency: 'consistent' | 'warning' | 'critical';
  warnings: string[];
  recommendations: string[];
}

export const IntegrationChecker = {
  /**
   * Check data consistency between commercial and operations
   */
  checkDataConsistency: (
    projectId: string,
    commercialItems: any[],
    operationsItems: any[],
    links: DataLink[]
  ): IntegrationStatus => {
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Check for unlinked items
    const unlinkedCommercial = commercialItems.filter(
      ci => !links.some(l => l.sourceId === ci.id && l.sourceModule === 'commercial')
    );
    const unlinkedOperations = operationsItems.filter(
      oi => !links.some(l => l.sourceId === oi.id && l.sourceModule === 'operations')
    );

    if (unlinkedCommercial.length > 0) {
      warnings.push(`${unlinkedCommercial.length} commercial items not linked to operations`);
      recommendations.push('Review and link unlinked commercial items to operations data');
    }

    if (unlinkedOperations.length > 0) {
      warnings.push(`${unlinkedOperations.length} operations items not linked to commercial`);
      recommendations.push('Check for missing commercial equivalents for operations items');
    }

    // Determine consistency level
    let dataConsistency: 'consistent' | 'warning' | 'critical' = 'consistent';
    if (warnings.length > 2) {
      dataConsistency = 'critical';
    } else if (warnings.length > 0) {
      dataConsistency = 'warning';
    }

    return {
      projectId,
      linkedItemsCount: links.filter(l => l.sourceModule === 'commercial' || l.sourceModule === 'operations').length,
      lastSyncDate: new Date().toISOString(),
      syncStatus: 'synced',
      dataConsistency,
      warnings,
      recommendations,
    };
  },
};
