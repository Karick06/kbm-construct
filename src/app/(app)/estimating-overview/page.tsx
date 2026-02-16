"use client";

import * as XLSX from "xlsx";
import { useState, useEffect } from "react";
import { LABOUR_RATES } from "@/lib/labour-rates";
import { PLANT_RATES } from "@/lib/plant-rates";
import { MATERIAL_RATES } from "@/lib/material-rates";
import { loadSMM7Data, type SMM7Item } from "@/lib/smm7-data";
import { loadCESSMData, type CESSMItem } from "@/lib/cessm-data";
import { loadValescapeData, type ValescapeItem } from "@/lib/valescape-data";
import { loadLabourRatesFromCSV, type CSVLabourRate } from "@/lib/csv-labour-rates";
import { loadPlantRatesFromCSV, type CSVPlantRate } from "@/lib/csv-plant-rates";
import { loadMaterialRatesFromCSV, type CSVMaterialRate } from "@/lib/csv-material-rates";
import { parseBOQFile, type parsedBOQRow } from "@/lib/boq-parser";
import { initialEstimateJobs, type EstimateJob, type BOQItem, type RateComponent, getEstimateJobsFromStorage, saveEstimateJobsToStorage, getEnquiriesFromStorage, type Enquiry, formatFileSize, getFileIcon } from "@/lib/enquiries-store";
import { formatDate } from "@/lib/date-utils";
import { generateQuotePDF, generateTraditionalBoQPDF, type TraditionalQuoteData } from "@/lib/pdf-generator";
import { syncEstimateToIntegratedProject, updateProjectFromEstimate } from "@/lib/client-integration";

interface TreeNode {
  id: string;
  description: string;
  level: number;
  unit?: string;
  quantity?: number;
  children: TreeNode[];
  isSection: boolean;
  path: string[];
  sellPrice?: number;
}

const estimateJobsData: EstimateJob[] = [
  // New Assignments
  {
    id: "EST-2024-048",
    enquiryId: "ENQ-2024-001",
    client: "Premier Group",
    projectName: "Central Office Complex",
    value: "£5.2M",
    receivedDate: "14 Feb 2024",
    status: "new-assignment",
  },
  {
    id: "EST-2024-049",
    enquiryId: "ENQ-2024-002",
    client: "Riverside Developers",
    projectName: "Thames Waterside Development",
    value: "£8.9M",
    receivedDate: "13 Feb 2024",
    status: "new-assignment",
  },
  {
    id: "EST-2024-050",
    enquiryId: "ENQ-2024-003",
    client: "Olympia Construction",
    projectName: "Sports Complex Refurbishment",
    value: "£3.7M",
    receivedDate: "12 Feb 2024",
    status: "new-assignment",
  },
  
  // In Progress
  {
    id: "EST-2024-045",
    enquiryId: "ENQ-2024-010",
    client: "Thames Developments",
    projectName: "Mixed-Use Residential Block",
    value: "£4.8M",
    receivedDate: "08 Feb 2024",
    assignedTo: "Sarah Johnson",
    estimator: "Sarah Johnson",
    status: "in-progress",
    progress: 65,
    notes: "BOQ buildup 65% complete, awaiting subcontractor quotes for M&E works",
  },
  {
    id: "EST-2024-046",
    enquiryId: "ENQ-2024-011",
    client: "Central Properties",
    projectName: "Warehouse Distribution Centre",
    value: "£2.3M",
    receivedDate: "06 Feb 2024",
    assignedTo: "Mark Thompson",
    estimator: "Mark Thompson",
    status: "in-progress",
    progress: 40,
    notes: "Materials pricing complete, working on preliminaries and plant costs",
  },
  {
    id: "EST-2024-047",
    enquiryId: "ENQ-2024-012",
    client: "Metro Estates",
    projectName: "High-Rise Apartment Tower",
    value: "£6.5M",
    receivedDate: "05 Feb 2024",
    assignedTo: "James Wilson",
    estimator: "James Wilson",
    status: "in-progress",
    progress: 85,
    notes: "Final review stage, checking risk allowances and contingency",
  },
  
  // Quote Submitted
  {
    id: "EST-2024-042",
    enquiryId: "ENQ-2024-020",
    client: "Sterling Group",
    projectName: "Retail Park Extension",
    value: "£890K",
    receivedDate: "28 Jan 2024",
    assignedTo: "Sarah Johnson",
    estimator: "Sarah Johnson",
    status: "quote-submitted",
    quoteRef: "QTE-2024-042",
    submittedDate: "10 Feb 2024",
    notes: "Quote submitted to client, awaiting decision by 20 Feb",
  },
  {
    id: "EST-2024-043",
    enquiryId: "ENQ-2024-021",
    client: "Apex Construction",
    projectName: "Infrastructure Upgrade Project",
    value: "£1.1M",
    receivedDate: "25 Jan 2024",
    assignedTo: "Mark Thompson",
    estimator: "Mark Thompson",
    status: "quote-submitted",
    quoteRef: "QTE-2024-043",
    submittedDate: "08 Feb 2024",
    notes: "Client requested clarifications on programme, follow-up meeting scheduled",
  },
  
  // Won
  {
    id: "EST-2024-038",
    enquiryId: "ENQ-2024-030",
    client: "Greenwich Properties",
    projectName: "Commercial Office Refurbishment",
    value: "£580K",
    receivedDate: "15 Jan 2024",
    assignedTo: "James Wilson",
    estimator: "James Wilson",
    status: "won",
    quoteRef: "QTE-2024-038",
    submittedDate: "28 Jan 2024",
    outcome: "Contract awarded, LOI received",
    notes: "Excellent feedback from client on pricing and programme",
  },
  {
    id: "EST-2024-039",
    enquiryId: "ENQ-2024-031",
    client: "Fortis Developments",
    projectName: "Residential Housing Development",
    value: "£3.2M",
    receivedDate: "12 Jan 2024",
    assignedTo: "Sarah Johnson",
    estimator: "Sarah Johnson",
    status: "won",
    quoteRef: "QTE-2024-039",
    submittedDate: "01 Feb 2024",
    outcome: "Contract signed, mobilization in progress",
    notes: "Client very impressed with detailed breakdown and value engineering suggestions",
  },
  
  // Lost
  {
    id: "EST-2024-040",
    enquiryId: "ENQ-2024-040",
    client: "Budget Builders",
    projectName: "Small Commercial Fit-Out",
    value: "£420K",
    receivedDate: "18 Jan 2024",
    assignedTo: "Mark Thompson",
    estimator: "Mark Thompson",
    status: "lost",
    quoteRef: "QTE-2024-040",
    submittedDate: "03 Feb 2024",
    outcome: "Lost on price",
    notes: "Client went with competitor offering 15% lower price - likely loss leader",
  },
];

const jobsByStatus = {
  "new-assignment": initialEstimateJobs.filter((j) => j.status === "new-assignment"),
  "in-progress": initialEstimateJobs.filter((j) => j.status === "in-progress"),
  "quote-submitted": initialEstimateJobs.filter((j) => j.status === "quote-submitted"),
  "won": initialEstimateJobs.filter((j) => j.status === "won"),
  "lost": initialEstimateJobs.filter((j) => j.status === "lost"),
};

const ESTIMATORS = ['Mick Thompson', 'Sarah Johnson', 'Tom Chen', 'Emily Rodriguez', 'James Wilson'];

const estimatingStats = [
  { label: "New Assignments", value: jobsByStatus["new-assignment"].length.toString(), change: "From BD", icon: "📥" },
  { label: "In Progress", value: jobsByStatus["in-progress"].length.toString(), change: "Being priced", icon: "⏳" },
  { label: "Quotes Out", value: jobsByStatus["quote-submitted"].length.toString(), change: "Awaiting decision", icon: "📤" },
  { label: "Win Rate", value: "65%", change: "Last 3 months", icon: "✅" },
];

const rateLibraries = {
  labour: LABOUR_RATES.map(rate => ({
    role: rate.trade,
    description: rate.description,
    rate: rate.hourlyRate,
    unit: "hr",
    code: rate.code,
  })),
  plant: PLANT_RATES.map(rate => ({
    item: rate.name,
    description: rate.description,
    rate: rate.rate,
    unit: rate.unit,
    code: rate.code,
    category: rate.category,
  })),
  materials: MATERIAL_RATES.map(rate => ({
    item: rate.description,
    rate: rate.rate,
    unit: rate.unit,
    code: rate.code,
    category: rate.category,
    wasteFactor: rate.wasteFactor,
  })),
};

export default function EstimatingOverviewPage() {
  const [jobs, setJobs] = useState<EstimateJob[]>(initialEstimateJobs);
  const [selectedJob, setSelectedJob] = useState<EstimateJob | null>(null);
  const [workingOnJob, setWorkingOnJob] = useState<EstimateJob | null>(null);
  const [showSMM7Modal, setShowSMM7Modal] = useState(false);
  const [showRateLibrary, setShowRateLibrary] = useState(false);
  const [showRateBreakdown, setShowRateBreakdown] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignJobId, setAssignJobId] = useState<string | null>(null);
  const [selectedRateItem, setSelectedRateItem] = useState<BOQItem | null>(null);
  const [editingComponents, setEditingComponents] = useState<RateComponent[]>([]);
  const [editingComponentInputs, setEditingComponentInputs] = useState<{ outputPerUnit: string; unitRate: string }[]>([]);
  const [showAddComponent, setShowAddComponent] = useState(false);
  const [newComponent, setNewComponent] = useState<RateComponent>({
    componentId: '',
    type: 'labour',
    description: '',
    outputPerUnit: 0,
    quantity: 0,
    unit: 'hours',
    unitRate: 0,
    cost: 0
  });
  const [newComponentOutputInput, setNewComponentOutputInput] = useState('');
  const [newComponentUnitRateInput, setNewComponentUnitRateInput] = useState('');
  const [smm7Tree, setSmm7Tree] = useState<TreeNode[]>([]);
  const [cessmTree, setCessmTree] = useState<TreeNode[]>([]);
  const [valescapeTree, setValescapeTree] = useState<TreeNode[]>([]);
  const [smm7Loading, setSmm7Loading] = useState(false);
  const [cessmLoading, setCessmLoading] = useState(false);
  const [valescapeLoading, setValescapeLoading] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [activeLibraryTab, setActiveLibraryTab] = useState<'labour' | 'plant' | 'materials'>('labour');
  const [activeSMM7Tab, setActiveSMM7Tab] = useState<'smm7' | 'cessm' | 'valescape'>('smm7');
  const [smm7Search, setSmm7Search] = useState('');
  const [cessmSearch, setCessmSearch] = useState('');
  const [valescapeSearch, setValescapeSearch] = useState('');
  const [labourSearch, setLabourSearch] = useState('');
  const [plantSearch, setPlantSearch] = useState('');
  const [materialSearch, setMaterialSearch] = useState('');
  const [csvLabourRates, setCsvLabourRates] = useState<CSVLabourRate[]>([]);
  const [csvPlantRates, setCsvPlantRates] = useState<CSVPlantRate[]>([]);
  const [csvMaterialRates, setCsvMaterialRates] = useState<CSVMaterialRate[]>([]);
  const [boqItems, setBoqItems] = useState<BOQItem[]>([
    { id: "1", description: "Excavation and earthworks", unit: "m³", quantity: 450, baseRate: 28.50, rate: 34.20, total: 15390 },
    { id: "2", description: "Concrete foundation", unit: "m³", quantity: 120, baseRate: 185.00, rate: 222.00, total: 26640 },
    { id: "3", description: "Structural steelwork", unit: "tonne", quantity: 45, baseRate: 2850.00, rate: 3420.00, total: 153900 },
    { id: "4", description: "Brickwork external", unit: "m²", quantity: 850, baseRate: 95.00, rate: 114.00, total: 96900 },
    { id: "5", description: "Roof coverings", unit: "m²", quantity: 320, baseRate: 125.00, rate: 150.00, total: 48000 },
  ]);
  const [newItem, setNewItem] = useState({ description: "", unit: "m²", quantity: 0, rate: 0 });
  const [overheadsPercent, setOverheadsPercent] = useState(12);
  const [profitPercent, setProfitPercent] = useState(8);
  const [boqUploadInput, setBoqUploadInput] = useState<HTMLInputElement | null>(null);
  const [isUploadingBoq, setIsUploadingBoq] = useState(false);
  const [boqUploadError, setBoqUploadError] = useState<string>('');
  const [showWonModal, setShowWonModal] = useState(false);
  const [showLostModal, setShowLostModal] = useState(false);
  const [selectedJobForOutcome, setSelectedJobForOutcome] = useState<EstimateJob | null>(null);
  const [winReason, setWinReason] = useState('');
  const [lostReason, setLostReason] = useState('');
  const [lostToCompetitor, setLostToCompetitor] = useState('');

  // Load estimate jobs from localStorage on mount to avoid hydration mismatch
  useEffect(() => {
    const storedJobs = getEstimateJobsFromStorage();
    setJobs(storedJobs);
  }, []);

  // Load CSV rate data on mount
  useEffect(() => {
    loadLabourRatesFromCSV().then(setCsvLabourRates);
    loadPlantRatesFromCSV().then(setCsvPlantRates);
    loadMaterialRatesFromCSV().then(setCsvMaterialRates);
  }, []);

  // Save estimate jobs to localStorage whenever they change
  useEffect(() => {
    saveEstimateJobsToStorage(jobs);
  }, [jobs]);

  // Recalculate BOQ rates and totals when OH/P percentages change
  useEffect(() => {
    const markupFactor = 1 + (overheadsPercent / 100) + (profitPercent / 100);
    const updatedItems = boqItems.map(item => ({
      ...item,
      rate: item.baseRate * markupFactor,
      total: item.quantity * (item.baseRate * markupFactor)
    }));
    setBoqItems(updatedItems);
  }, [overheadsPercent, profitPercent]);

  // Compute jobs by status
  const jobsByStatus = {
    "new-assignment": jobs.filter((j) => j.status === "new-assignment"),
    "in-progress": jobs.filter((j) => j.status === "in-progress"),
    "quote-submitted": jobs.filter((j) => j.status === "quote-submitted"),
    "won": jobs.filter((j) => j.status === "won"),
    "lost": jobs.filter((j) => j.status === "lost"),
  };

  // Build SMM7 tree from flat data
  const buildSMM7Tree = (items: SMM7Item[]): TreeNode[] => {
    const root: TreeNode[] = [];
    const stack: TreeNode[] = [];
    let lastMainSection: TreeNode | null = null;
    let lastLevel1Section: TreeNode | null = null;
    let lastLevel2Section: TreeNode | null = null;
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item || !item.description || !item.description.trim()) continue;

      const hasUnit = Boolean(item.unit);
      const isMainSection = /^[A-Z]\d+:/.test(item.description);
      const position = item.positionLevel;

      if (isMainSection) {
        const node: TreeNode = {
          id: `node-${i}`,
          description: item.description,
          level: 0,
          children: [],
          isSection: true,
          path: [item.description]
        };
        root.push(node);
        lastMainSection = node;
        lastLevel1Section = null;
        lastLevel2Section = null;
        stack.length = 0;
        stack.push(node);
        continue;
      }

      if (!lastMainSection) continue;

      if (hasUnit) {
        const parent = stack[stack.length - 1];
        const duplicate = parent.children.find(
          child => child.description === item.description && child.unit === item.unit
        );
        
        if (!duplicate) {
          const node: TreeNode = {
            id: `node-${i}`,
            description: item.description,
            level: stack.length,
            unit: item.unit,
            quantity: item.quantity,
            children: [],
            isSection: false,
            path: [...parent.path, item.description]
          };
          parent.children.push(node);
        }
        continue;
      }

      if (position === 1) {
        if (!lastLevel1Section) {
          const node: TreeNode = {
            id: `node-${i}`,
            description: item.description,
            level: 1,
            children: [],
            isSection: true,
            path: [...lastMainSection.path, item.description]
          };
          lastMainSection.children.push(node);
          lastLevel1Section = node;
          lastLevel2Section = null;
          stack.length = 1;
          stack.push(node);
        } else if (!lastLevel2Section || stack.length <= 2) {
          const node: TreeNode = {
            id: `node-${i}`,
            description: item.description,
            level: 2,
            children: [],
            isSection: true,
            path: [...lastLevel1Section.path, item.description]
          };
          lastLevel1Section.children.push(node);
          lastLevel2Section = node;
          stack.length = 2;
          stack.push(node);
        } else {
          const parent = stack[stack.length - 1];
          const node: TreeNode = {
            id: `node-${i}`,
            description: item.description,
            level: stack.length,
            children: [],
            isSection: true,
            path: [...parent.path, item.description]
          };
          parent.children.push(node);
          stack.push(node);
        }
      } else if (position === 2) {
        if (stack.length === 1) {
          const node: TreeNode = {
            id: `node-${i}`,
            description: item.description,
            level: 1,
            children: [],
            isSection: true,
            path: [...lastMainSection.path, item.description]
          };
          lastMainSection.children.push(node);
          lastLevel1Section = node;
          lastLevel2Section = null;
          stack.length = 1;
          stack.push(node);
        } else {
          const parent = stack[stack.length - 2];
          const node: TreeNode = {
            id: `node-${i}`,
            description: item.description,
            level: stack.length - 1,
            children: [],
            isSection: true,
            path: [...parent.path, item.description]
          };
          parent.children.push(node);
          stack[stack.length - 1] = node;
        }
      } else {
        const parent = stack[stack.length - 1];
        const node: TreeNode = {
          id: `node-${i}`,
          description: item.description,
          level: stack.length,
          children: [],
          isSection: true,
          path: [...parent.path, item.description]
        };
        parent.children.push(node);
      }
    }

    return root;
  };

  // Build CESSM tree from flat data
  const buildCessmTree = (items: CESSMItem[]): TreeNode[] => {
    const nodesByKey = new Map<string, TreeNode>();
    const nodesByRawId = new Map<string, TreeNode>();

    items.forEach((item) => {
      if (!item.description || !item.description.trim() || !item.id) return;

      const hasUnit = Boolean(item.unit);
      const uniqueId = `cessm-${item.id}-${item.rowIndex}`;
      const node: TreeNode = {
        id: uniqueId,
        description: item.description,
        level: 0,
        unit: item.unit || undefined,
        quantity: 1,
        children: [],
        isSection: !hasUnit,
        path: [item.description],
        sellPrice: item.sellPrice
      };
      if (!nodesByRawId.has(item.id)) {
        nodesByRawId.set(item.id, node);
      }
      nodesByKey.set(uniqueId, node);
    });

    const linkedRoots: TreeNode[] = [];
    items.forEach((item) => {
      const uniqueId = `cessm-${item.id}-${item.rowIndex}`;
      const node = nodesByKey.get(uniqueId);
      if (!node) return;

      const parentId = item.parentId && item.parentId !== '0' ? item.parentId : '';
      const parent = parentId ? nodesByRawId.get(parentId) : undefined;

      if (parent) {
        parent.children.push(node);
        parent.isSection = true;
      } else {
        linkedRoots.push(node);
      }
    });

    const assignLevels = (node: TreeNode, level: number, path: string[]) => {
      node.level = level;
      node.path = path;
      for (const child of node.children) {
        assignLevels(child, level + 1, [...path, child.description]);
      }
    };

    for (const root of linkedRoots) {
      assignLevels(root, 0, [root.description]);
    }

    return linkedRoots;
  };

  const buildValescapeTree = (items: ValescapeItem[]): TreeNode[] => {
    const sections = new Map<string, TreeNode>();
    const roots: TreeNode[] = [];

    for (const item of items) {
      const sectionName = item.section?.trim() || 'Valescape';
      let sectionNode = sections.get(sectionName);

      if (!sectionNode) {
        sectionNode = {
          id: `valescape-section-${sectionName}`,
          description: sectionName,
          level: 0,
          children: [],
          isSection: true,
          path: [sectionName]
        };
        sections.set(sectionName, sectionNode);
        roots.push(sectionNode);
      }

      sectionNode.children.push({
        id: item.id,
        description: item.description,
        level: 1,
        unit: item.unit || undefined,
        quantity: item.quantity,
        children: [],
        isSection: false,
        path: [sectionName, item.description]
      });
    }

    return roots;
  };

  // Load SMM7 data when modal opens
  useEffect(() => {
    if (showSMM7Modal && smm7Tree.length === 0 && !smm7Loading) {
      console.log('Starting SMM7 data load...');
      setSmm7Loading(true);
      loadSMM7Data()
        .then(data => {
          console.log('SMM7 data loaded successfully:', data.length, 'items');
          const tree = buildSMM7Tree(data);
          console.log('SMM7 tree built with', tree.length, 'root nodes');
          setSmm7Tree(tree);
          // Auto-expand first level for better usability
          const firstLevelIds = tree.map(n => n.id);
          setExpandedNodes(new Set(firstLevelIds));
          setSmm7Loading(false);
        })
        .catch(error => {
          console.error('Error loading SMM7 data:', error);
          setSmm7Loading(false);
        });
    }
  }, [showSMM7Modal]);

  // Load CESSM data when CESSM tab is active
  useEffect(() => {
    if (showSMM7Modal && activeSMM7Tab === 'cessm' && cessmTree.length === 0 && !cessmLoading) {
      console.log('Starting CESSM data load...');
      setCessmLoading(true);
      loadCESSMData()
        .then(data => {
          console.log('CESSM data loaded successfully:', data.length, 'items');
          const tree = buildCessmTree(data);
          console.log('CESSM tree built with', tree.length, 'root nodes');
          setCessmTree(tree);
          // Auto-expand first level
          const firstLevelIds = tree.map(n => n.id);
          setExpandedNodes(prev => new Set([...prev, ...firstLevelIds]));
          setCessmLoading(false);
        })
        .catch(error => {
          console.error('Error loading CESSM data:', error);
          setCessmLoading(false);
        });
    }
  }, [showSMM7Modal, activeSMM7Tab]);

  // Load Valescape data when Valescape tab is active
  useEffect(() => {
    if (showSMM7Modal && activeSMM7Tab === 'valescape' && valescapeTree.length === 0 && !valescapeLoading) {
      console.log('Starting Valescape data load...');
      setValescapeLoading(true);
      loadValescapeData()
        .then(data => {
          console.log('Valescape data loaded successfully:', data.length, 'items');
          const tree = buildValescapeTree(data);
          console.log('Valescape tree built with', tree.length, 'root nodes');
          setValescapeTree(tree);
          // Auto-expand first level
          const firstLevelIds = tree.map(n => n.id);
          setExpandedNodes(prev => new Set([...prev, ...firstLevelIds]));
          setValescapeLoading(false);
        })
        .catch(error => {
          console.error('Error loading Valescape data:', error);
          setValescapeLoading(false);
        });
    }
  }, [showSMM7Modal, activeSMM7Tab]);

  // Helper to flatten tree for searching
  const flattenTree = (nodes: TreeNode[]): TreeNode[] => {
    const result: TreeNode[] = [];
    const traverse = (node: TreeNode) => {
      result.push(node);
      node.children.forEach(traverse);
    };
    nodes.forEach(traverse);
    return result;
  };

  // Filter SMM7 tree based on search
  const filteredSmm7Tree = smm7Search.trim() === ''
    ? smm7Tree
    : (() => {
        const flattened = flattenTree(smm7Tree);
        const matched = flattened.filter(node =>
          node.description.toLowerCase().includes(smm7Search.toLowerCase()) ||
          (node.unit && node.unit.toLowerCase().includes(smm7Search.toLowerCase()))
        );
        return matched.slice(0, 200);
      })();

  // Filter CESSM tree based on search
  const filteredCessmTree = cessmSearch.trim() === ''
    ? cessmTree
    : (() => {
        const flattened = flattenTree(cessmTree);
        const matched = flattened.filter(node =>
          node.description.toLowerCase().includes(cessmSearch.toLowerCase()) ||
          (node.unit && node.unit.toLowerCase().includes(cessmSearch.toLowerCase()))
        );
        return matched.slice(0, 200);
      })();

  // Filter Valescape tree based on search
  const filteredValescapeTree = valescapeSearch.trim() === ''
    ? valescapeTree
    : (() => {
        const flattened = flattenTree(valescapeTree);
        const matched = flattened.filter(node =>
          node.description.toLowerCase().includes(valescapeSearch.toLowerCase()) ||
          (node.unit && node.unit.toLowerCase().includes(valescapeSearch.toLowerCase()))
        );
        return matched.slice(0, 200);
      })();

  // Filter rate library data
  const filteredLabourRates = labourSearch.trim() === ''
    ? rateLibraries.labour.slice(0, 100)
    : rateLibraries.labour.filter(item =>
        item.role.toLowerCase().includes(labourSearch.toLowerCase())
      ).slice(0, 200);

  const filteredPlantRates = plantSearch.trim() === ''
    ? rateLibraries.plant.slice(0, 100)
    : rateLibraries.plant.filter(item =>
        item.item.toLowerCase().includes(plantSearch.toLowerCase())
      ).slice(0, 200);

  const filteredMaterialRates = materialSearch.trim() === ''
    ? rateLibraries.materials.slice(0, 100)
    : rateLibraries.materials.filter(item =>
        item.item.toLowerCase().includes(materialSearch.toLowerCase())
      ).slice(0, 200);

  // Toggle expand/collapse of tree nodes
  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  // Count total items in tree
  const countTreeItems = (nodes: TreeNode[]): number => {
    let count = 0;
    const traverse = (node: TreeNode) => {
      count++;
      node.children.forEach(traverse);
    };
    nodes.forEach(traverse);
    return count;
  };

  // Rate breakdown handlers
  const openRateBreakdown = (item: BOQItem) => {
    setSelectedRateItem(item);
    const boqQuantity = item.quantity > 0 ? item.quantity : 0;
    const components = (item.components ?? []).map((component) => {
      const outputPerUnit = boqQuantity > 0
        ? (component.outputPerUnit ?? ((component.quantity ?? 0) > 0
            ? (component.type === 'materials'
              ? (component.quantity ?? 0) / boqQuantity
              : boqQuantity / (component.quantity ?? 0))
            : 0))
        : (component.outputPerUnit ?? 0);
      const quantity = outputPerUnit > 0 && boqQuantity > 0
        ? (component.type === 'materials'
          ? outputPerUnit * boqQuantity
          : boqQuantity / outputPerUnit)
        : (component.quantity ?? 0);
      return {
        ...component,
        outputPerUnit,
        quantity,
        cost: quantity * component.unitRate
      };
    });
    setEditingComponents(components);
    setEditingComponentInputs(
      components.map((component) => ({
        outputPerUnit: component.outputPerUnit ? component.outputPerUnit.toString() : '',
        unitRate: component.unitRate ? component.unitRate.toString() : ''
      }))
    );
    setShowRateBreakdown(true);
  };

  const updateComponent = (index: number, field: keyof RateComponent, value: any) => {
    const updated = [...editingComponents];
    const next = { ...updated[index], [field]: value };
    const boqQuantity = selectedRateItem?.quantity ?? 0;

    if (field === 'outputPerUnit' && boqQuantity > 0) {
      next.quantity = value > 0
        ? (next.type === 'materials' ? value * boqQuantity : boqQuantity / value)
        : 0;
    }

    if (field === 'quantity' && boqQuantity > 0) {
      next.outputPerUnit = value > 0
        ? (next.type === 'materials' ? value / boqQuantity : boqQuantity / value)
        : 0;
    }

    next.cost = (next.quantity ?? 0) * next.unitRate;
    updated[index] = next;
    setEditingComponents(updated);
  };

  const updateComponentOutputInput = (index: number, rawValue: string) => {
    const nextInputs = [...editingComponentInputs];
    nextInputs[index] = {
      ...nextInputs[index],
      outputPerUnit: rawValue
    };
    setEditingComponentInputs(nextInputs);

    const parsed = parseFloat(rawValue);
    updateComponent(index, 'outputPerUnit', Number.isNaN(parsed) ? 0 : parsed);
  };

  const updateComponentUnitRateInput = (index: number, rawValue: string) => {
    const nextInputs = [...editingComponentInputs];
    nextInputs[index] = {
      ...nextInputs[index],
      unitRate: rawValue
    };
    setEditingComponentInputs(nextInputs);

    const parsed = parseFloat(rawValue);
    updateComponent(index, 'unitRate', Number.isNaN(parsed) ? 0 : parsed);
  };

  const removeComponent = (index: number) => {
    setEditingComponents(editingComponents.filter((_, i) => i !== index));
    setEditingComponentInputs(editingComponentInputs.filter((_, i) => i !== index));
  };

  const addNewComponent = () => {
    const boqQuantity = selectedRateItem?.quantity ?? 0;
    const outputPerUnit = newComponent.outputPerUnit ?? 0;
    const quantity = outputPerUnit > 0 && boqQuantity > 0
      ? (newComponent.type === 'materials'
        ? outputPerUnit * boqQuantity
        : boqQuantity / outputPerUnit)
      : (newComponent.quantity ?? 0);

    if (newComponent.description && quantity > 0 && newComponent.unitRate > 0) {
      const component = {
        ...newComponent,
        outputPerUnit,
        quantity,
        componentId: Date.now().toString(),
        cost: quantity * newComponent.unitRate
      };
      setEditingComponents([...editingComponents, component]);
      setEditingComponentInputs([
        ...editingComponentInputs,
        {
          outputPerUnit: outputPerUnit ? outputPerUnit.toString() : '',
          unitRate: newComponent.unitRate ? newComponent.unitRate.toString() : ''
        }
      ]);
      setNewComponent({
        componentId: '',
        type: 'labour',
        description: '',
        outputPerUnit: 0,
        quantity: 0,
        unit: 'hours',
        unitRate: 0,
        cost: 0
      });
      setNewComponentOutputInput('');
      setNewComponentUnitRateInput('');
      setShowAddComponent(false);
    }
  };

  const selectLibraryItem = (type: 'labour' | 'plant' | 'materials', itemId: string) => {
    if (type === 'labour') {
      const labour = csvLabourRates.find(l => l.id === itemId);
      if (labour) {
        setNewComponent({
          ...newComponent,
          type: 'labour',
          componentId: labour.id,
          description: labour.trade,
          unit: 'hours',
          unitRate: labour.hourlyRate
        });
        setNewComponentUnitRateInput(labour.hourlyRate.toString());
      }
    } else if (type === 'plant') {
      const plant = csvPlantRates.find(p => p.id === itemId);
      if (plant) {
        setNewComponent({
          ...newComponent,
          type: 'plant',
          componentId: plant.id,
          description: plant.name,
          unit: plant.unit,
          unitRate: plant.rate
        });
        setNewComponentUnitRateInput(plant.rate.toString());
      }
    } else if (type === 'materials') {
      const material = csvMaterialRates.find(m => m.id === itemId);
      if (material) {
        setNewComponent({
          ...newComponent,
          type: 'materials',
          componentId: material.id,
          description: material.description,
          unit: material.unit,
          unitRate: material.rate * material.wasteFactor
        });
        setNewComponentUnitRateInput((material.rate * material.wasteFactor).toString());
      }
    }
  };

  const saveRateBreakdown = () => {
    if (selectedRateItem) {
      const totalCost = editingComponents.reduce((sum, c) => sum + c.cost, 0);
      const newBaseRate = selectedRateItem.quantity > 0 ? totalCost / selectedRateItem.quantity : totalCost;
      const markupFactor = 1 + (overheadsPercent / 100) + (profitPercent / 100);
      const newRate = newBaseRate * markupFactor;
      
      const updatedItem: BOQItem = {
        ...selectedRateItem,
        components: editingComponents,
        baseRate: newBaseRate,
        rate: newRate,
        total: newRate * selectedRateItem.quantity
      };

      setBoqItems(boqItems.map(item => 
        item.id === selectedRateItem.id ? updatedItem : item
      ));
      setShowRateBreakdown(false);
    }
  };

  // Tree rendering component for SMM7
  const renderSMM7TreeNode = (node: TreeNode, level: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children.length > 0;
    const isLeafNode = !node.isSection && node.unit;

    return (
      <div key={node.id}>
        <div
          className="flex items-center justify-between rounded-lg border border-gray-700/50 bg-gray-700/30 p-3 mb-2"
          style={{ marginLeft: `${level * 20}px` }}
        >
          <div className="flex-1 flex items-center min-w-0 pr-4">
            {hasChildren && (
              <button
                onClick={() => toggleNode(node.id)}
                className="mr-2 text-gray-400 hover:text-white flex-shrink-0 w-5 h-5 flex items-center justify-center"
              >
                {isExpanded ? '−' : '+'}
              </button>
            )}
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${node.isSection ? 'font-bold text-blue-300' : 'text-white'} truncate`}>
                {node.description}
              </p>
              {node.unit && (
                <p className="text-xs text-gray-400 mt-1">
                  Unit: {node.unit}
                </p>
              )}
            </div>
          </div>
          {isLeafNode && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <input
                type="number"
                placeholder="Qty"
                className="w-20 rounded bg-gray-700 px-2 py-1 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                id={`tree-smm7-qty-${node.id}`}
              />
              <input
                type="number"
                placeholder="Rate £"
                className="w-24 rounded bg-gray-700 px-2 py-1 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                id={`tree-smm7-rate-${node.id}`}
              />
              <button
                onClick={() => {
                  const qtyInput = document.getElementById(`tree-smm7-qty-${node.id}`) as HTMLInputElement;
                  const rateInput = document.getElementById(`tree-smm7-rate-${node.id}`) as HTMLInputElement;
                  const qty = parseFloat(qtyInput.value);
                  const rate = parseFloat(rateInput.value);
                  if (qty > 0 && rate > 0) {
                    addSMM7Item(node.description, node.unit!, qty, rate);
                    qtyInput.value = '';
                    rateInput.value = '';
                  }
                }}
                className="rounded bg-blue-500 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-600 transition-colors"
              >
                Add
              </button>
            </div>
          )}
        </div>
        {isExpanded && hasChildren && (
          <div>
            {node.children.map(child => renderSMM7TreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Tree rendering component for CESSM
  const renderCessmTreeNode = (node: TreeNode, level: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children.length > 0;
    const isLeafNode = !node.isSection && node.unit;

    return (
      <div key={node.id}>
        <div
          className="flex items-center justify-between rounded-lg border border-gray-700/50 bg-gray-700/30 p-3 mb-2"
          style={{ marginLeft: `${level * 20}px`}}
        >
          <div className="flex-1 flex items-center min-w-0 pr-4">
            {hasChildren && (
              <button
                onClick={() => toggleNode(node.id)}
                className="mr-2 text-gray-400 hover:text-white flex-shrink-0 w-5 h-5 flex items-center justify-center"
              >
                {isExpanded ? '−' : '+'}
              </button>
            )}
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${node.isSection ? 'font-bold text-purple-300' : 'text-white'} truncate`}>
                {node.description}
              </p>
              {isLeafNode && node.sellPrice && (
                <p className="text-xs text-gray-400 mt-1">
                  £{node.sellPrice.toFixed(2)} per {node.unit}
                </p>
              )}
            </div>
          </div>
          {isLeafNode && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <input
                type="number"
                placeholder="Qty"
                className="w-20 rounded bg-gray-700 px-2 py-1 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                id={`tree-cessm-qty-${node.id}`}
              />
              <button
                onClick={() => {
                  const input = document.getElementById(`tree-cessm-qty-${node.id}`) as HTMLInputElement;
                  const qty = parseFloat(input.value);
                  if (qty > 0 && node.sellPrice) {
                    const item: CESSMItem = {
                      id: node.id,
                      description: node.description,
                      unit: node.unit || '',
                      sellPrice: node.sellPrice,
                      costPrice: node.sellPrice, // fallback
                      libcode: '',
                      type: '10',
                      parentId: node.id,
                      rowIndex: 0
                    };
                    addCESSMItem(item, qty);
                    input.value = '';
                  }
                }}
                className="rounded bg-purple-500 px-3 py-1 text-xs font-semibold text-white hover:bg-purple-600 transition-colors"
              >
                Add
              </button>
            </div>
          )}
        </div>
        {isExpanded && hasChildren && (
          <div>
            {node.children.map(child => renderCessmTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderValescapeTreeNode = (node: TreeNode, level: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children.length > 0;
    const isLeafNode = !node.isSection && node.unit;

    return (
      <div key={node.id}>
        <div
          className="flex items-center justify-between rounded-lg border border-gray-700/50 bg-gray-700/30 p-3 mb-2"
          style={{ marginLeft: `${level * 20}px`}}
        >
          <div className="flex-1 flex items-center min-w-0 pr-4">
            {hasChildren && (
              <button
                onClick={() => toggleNode(node.id)}
                className="mr-2 text-gray-400 hover:text-white flex-shrink-0 w-5 h-5 flex items-center justify-center"
              >
                {isExpanded ? '−' : '+'}
              </button>
            )}
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${node.isSection ? 'font-bold text-green-300' : 'text-white'} truncate`}>
                {node.description}
              </p>
              {node.unit && (
                <p className="text-xs text-gray-400 mt-1">
                  Unit: {node.unit}
                </p>
              )}
            </div>
          </div>
          {isLeafNode && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <input
                type="number"
                placeholder="Qty"
                className="w-20 rounded bg-gray-700 px-2 py-1 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                id={`tree-valescape-qty-${node.id}`}
              />
              <input
                type="number"
                placeholder="Rate £"
                className="w-24 rounded bg-gray-700 px-2 py-1 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                id={`tree-valescape-rate-${node.id}`}
              />
              <button
                onClick={() => {
                  const qtyInput = document.getElementById(`tree-valescape-qty-${node.id}`) as HTMLInputElement;
                  const rateInput = document.getElementById(`tree-valescape-rate-${node.id}`) as HTMLInputElement;
                  const qty = parseFloat(qtyInput.value);
                  const rate = parseFloat(rateInput.value);
                  if (qty > 0 && rate > 0) {
                    addValescapeItem(node.description, node.unit!, qty, rate);
                    qtyInput.value = '';
                    rateInput.value = '';
                  }
                }}
                className="rounded bg-green-500 px-3 py-1 text-xs font-semibold text-white hover:bg-green-600 transition-colors"
              >
                Add
              </button>
            </div>
          )}
        </div>
        {isExpanded && hasChildren && (
          <div>
            {node.children.map(child => renderValescapeTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const handleAssignEstimator = (jobId: string, estimator: string) => {
    setJobs(jobs.map(j => j.id === jobId ? { ...j, estimator, status: "in-progress" as const } : j));
    setShowAssignModal(false);
    setAssignJobId(null);
  };

  const handleSubmitQuote = (jobId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const updatedJobs = jobs.map(job => {
      if (job.id === jobId) {
        return {
          ...job,
          status: "quote-submitted" as const,
          submittedDate: today,
          quoteRef: job.quoteRef || `QT-${jobId.substring(4)}-${today.replace(/-/g, '')}`
        };
      }
      return job;
    });
    
    setJobs(updatedJobs);
    saveEstimateJobsToStorage(updatedJobs);
    
    // Also generate the traditional BoQ PDF
    const job = jobs.find(j => j.id === jobId);
    if (job && boqItems.length > 0) {
      const subtotal = boqItems.reduce((sum, item) => sum + item.total, 0);
      const contingency = (subtotal * profitPercent) / 100;
      
      const quoteData: TraditionalQuoteData = {
        projectName: job.projectName,
        preparedBy: job.estimator || 'Estimator',
        date: today,
        items: boqItems,
        subtotal,
        contingencyPercent: profitPercent,
        contingency,
        total: subtotal + contingency,
        standard: 'SMM7',
      };
      
      generateTraditionalBoQPDF(quoteData).catch((error) => {
        console.error('Error generating PDF:', error);
      });
    }
    
    console.log(`Quote submitted for job ${jobId}`);
  };

  const handleGenerateQuotePDF = async () => {
    if (!workingOnJob) {
      alert('Please select a job to generate a quote PDF');
      return;
    }

    if (boqItems.length === 0) {
      alert('Please add items to the Bill of Quantities before generating a PDF');
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      const subtotal = boqItems.reduce((sum, item) => sum + item.total, 0);
      const contingency = (subtotal * profitPercent) / 100;
      
      const quoteData: TraditionalQuoteData = {
        clientName: workingOnJob.client || 'Client',
        projectName: workingOnJob.projectName,
        estimateNumber: workingOnJob.id,
        preparedBy: workingOnJob.estimator || 'Estimator',
        date: today,
        items: boqItems,
        subtotal,
        contingencyPercent: profitPercent,
        contingency,
        total: subtotal + contingency,
        standard: 'SMM7',
      };
      
      await generateTraditionalBoQPDF(quoteData);
      alert(`Quote PDF generated successfully for ${workingOnJob.projectName}`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please check the console for details.');
    }
  };

  const handleGenerateExcel = () => {
    if (!workingOnJob) {
      alert('Please select a job to generate an Excel file');
      return;
    }

    if (boqItems.length === 0) {
      alert('Please add items to the Bill of Quantities before generating Excel');
      return;
    }

    try {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const todayFormatted = `${year}-${month}-${day}`;

      // Create workbook
      const workbook = XLSX.utils.book_new();

      // Header data
      const headerData = [
        ['BILL OF QUANTITIES'],
        [],
        ['Client:', workingOnJob.client || 'N/A'],
        ['Project:', workingOnJob.projectName],
        ['Estimate Number:', workingOnJob.id],
        ['Estimator:', workingOnJob.estimator || 'N/A'],
        ['Date:', todayFormatted],
        []
      ];

      // Items data with headers
      const itemsHeaders = ['Item No.', 'Description', 'Unit', 'Quantity', 'Rate', 'Amount'];
      const itemsData = boqItems.map((item, index) => [
        index + 1,
        item.description,
        item.unit,
        item.quantity,
        item.rate.toFixed(2),
        item.total.toFixed(2)
      ]);

      // Summary data - use the same calculation as the grand total
      const baseSubtotalExcel = boqItems.reduce((sum, item) => sum + (item.quantity * item.baseRate), 0);
      const overheadsExcel = baseSubtotalExcel * (overheadsPercent / 100);
      const profitExcel = (baseSubtotalExcel + overheadsExcel) * (profitPercent / 100);
      const totalExcel = baseSubtotalExcel + overheadsExcel + profitExcel;

      const summaryData = [
        [],
        ['SUMMARY'],
        ['Base Subtotal:', '', '', '', '', baseSubtotalExcel.toFixed(2)],
        ['Overheads:', '', '', '', '', overheadsExcel.toFixed(2)],
        ['Profit:', '', '', '', '', profitExcel.toFixed(2)],
        ['TOTAL:', '', '', '', '', totalExcel.toFixed(2)]
      ];

      // Combine all data
      const allData = [
        ...headerData,
        itemsHeaders,
        ...itemsData,
        ...summaryData
      ];

      // Create worksheet
      const worksheet = XLSX.utils.aoa_to_sheet(allData);
      
      // Adjust column widths
      worksheet['!cols'] = [
        { wch: 10 },
        { wch: 30 },
        { wch: 10 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 }
      ];

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'BOQ');

      // Generate filename
      const filename = `BOQ-${workingOnJob.id}-${todayFormatted}.xlsx`;

      // Write file
      XLSX.writeFile(workbook, filename);
      alert(`Excel file generated successfully: ${filename}`);
    } catch (error) {
      console.error('Error generating Excel:', error);
      alert('Error generating Excel file. Please check the console for details.');
    }
  };

  const handleMarkWon = (jobId: string, winReason?: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;
    
    const updatedJobs = jobs.map(j => {
      if (j.id === jobId) {
        return {
          ...j,
          status: "won" as const,
          outcome: winReason || "Successful bid"
        };
      }
      return j;
    });
    
    setJobs(updatedJobs);
    saveEstimateJobsToStorage(updatedJobs);
    
    // Sync with client integration system
    syncEstimateToIntegratedProject({
      estimateId: job.id,
      enquiryId: job.enquiryId,
      clientName: job.client,
      projectName: job.projectName,
      value: job.value,
      status: "won",
      submittedDate: job.submittedDate,
      winReason: winReason || "Successful bid",
    });
    
    console.log(`Job ${jobId} marked as won and synced to client tracking`);
  };

  const handleMarkLost = (jobId: string, lostReason?: string, lostToCompetitor?: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;
    
    const updatedJobs = jobs.map(j => {
      if (j.id === jobId) {
        return {
          ...j,
          status: "lost" as const,
          outcome: lostReason || "Unsuccessful bid"
        };
      }
      return j;
    });
    
    setJobs(updatedJobs);
    saveEstimateJobsToStorage(updatedJobs);
    
    // Sync with client integration system
    syncEstimateToIntegratedProject({
      estimateId: job.id,
      enquiryId: job.enquiryId,
      clientName: job.client,
      projectName: job.projectName,
      value: job.value,
      status: "lost",
      submittedDate: job.submittedDate,
      lostReason: lostReason || "Unsuccessful bid",
      lostToCompetitor,
    });
    
    console.log(`Job ${jobId} marked as lost and synced to client tracking`);
  };

  const addBoqItem = () => {
    if (newItem.description && newItem.quantity > 0 && newItem.rate > 0) {
      const markupFactor = 1 + (overheadsPercent / 100) + (profitPercent / 100);
      const total = newItem.quantity * newItem.rate * markupFactor;
      setBoqItems([...boqItems, { 
        id: Date.now().toString(), 
        ...newItem,
        baseRate: newItem.rate,
        rate: newItem.rate * markupFactor,
        total 
      }]);
      setNewItem({ description: "", unit: "m²", quantity: 0, rate: 0 });
    }
  };

  const removeBoqItem = (id: string) => {
    setBoqItems(boqItems.filter(item => item.id !== id));
  };

  const handleBOQUploadClick = () => {
    boqUploadInput?.click();
  };

  const handleBOQFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingBoq(true);
    setBoqUploadError('');

    try {
      const rows = await parseBOQFile(file);
      
      if (rows.length === 0) {
        setBoqUploadError('No valid BOQ items found in file');
        setIsUploadingBoq(false);
        return;
      }

      const newItems: BOQItem[] = rows.map((row, idx) => {
        const markupFactor = 1 + (overheadsPercent / 100) + (profitPercent / 100);
        return {
          id: Date.now().toString() + idx,
          description: row.description,
          unit: row.unit,
          quantity: row.quantity,
          baseRate: row.rate,
          rate: row.rate * markupFactor,
          total: row.quantity * row.rate * markupFactor
        };
      });

      setBoqItems([...boqItems, ...newItems]);
      setBoqUploadError('');
      
      // Reset input
      if (e.target) {
        e.target.value = '';
      }
    } catch (error) {
      setBoqUploadError(
        error instanceof Error ? error.message : 'Failed to parse BOQ file'
      );
      console.error('BOQ upload error:', error);
    } finally {
      setIsUploadingBoq(false);
    }
  };

  const addSMM7Item = (description: string, unit: string, quantity: number, rate: number = 0) => {
    if (quantity > 0) {
      const markupFactor = 1 + (overheadsPercent / 100) + (profitPercent / 100);
      const total = quantity * rate * markupFactor;
      setBoqItems([...boqItems, {
        id: Date.now().toString(),
        description,
        unit,
        quantity,
        baseRate: rate,
        rate: rate * markupFactor,
        total
      }]);
    }
  };

  const addCESSMItem = (item: CESSMItem, quantity: number) => {
    if (quantity > 0) {
      const rate = item.sellPrice > 0 ? item.sellPrice : item.costPrice;
      const markupFactor = 1 + (overheadsPercent / 100) + (profitPercent / 100);
      const total = quantity * rate * markupFactor;
      setBoqItems([...boqItems, {
        id: Date.now().toString(),
        description: item.description,
        unit: item.unit,
        quantity,
        baseRate: rate,
        rate: rate * markupFactor,
        total
      }]);
    }
  };

  const addValescapeItem = (description: string, unit: string, quantity: number, rate: number = 0) => {
    if (quantity > 0) {
      const markupFactor = 1 + (overheadsPercent / 100) + (profitPercent / 100);
      const total = quantity * rate * markupFactor;
      setBoqItems([...boqItems, {
        id: Date.now().toString(),
        description,
        unit,
        quantity,
        baseRate: rate,
        rate: rate * markupFactor,
        total
      }]);
    }
  };

  const addLibraryItem = (description: string, unit: string, rate: number, quantity: number) => {
    if (quantity > 0) {
      const markupFactor = 1 + (overheadsPercent / 100) + (profitPercent / 100);
      const total = quantity * rate * markupFactor;
      setBoqItems([...boqItems, {
        id: Date.now().toString(),
        description,
        unit,
        quantity,
        baseRate: rate,
        rate: rate * markupFactor,
        total
      }]);
    }
  };

  const saveProgress = () => {
    // Calculate progress based on BOQ items (simple logic: more items = more progress)
    const itemCount = boqItems.length;
    const newProgress = Math.min(Math.round((itemCount / 10) * 100), 95); // Cap at 95% until submitted
    console.log(`Saving progress: ${newProgress}%`);
    // In real app: Update the job progress in database
    alert(`Progress saved: ${newProgress}%`);
  };

  const generateAndSubmitQuote = () => {
    if (boqItems.length === 0) {
      alert("Please add items to the BOQ before generating a quote");
      return;
    }
    
    if (!workingOnJob) return;
    
    // Update job status to quote-submitted
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayFormatted = `${year}-${month}-${day}`; // YYYY-MM-DD
    
    const quoteRef = `QT-${workingOnJob.id.substring(4)}-${today.getDate()}${today.getMonth() + 1}${year}`;
    
    const updatedJobs = jobs.map(job => {
      if (job.id === workingOnJob.id) {
        return {
          ...job,
          status: "quote-submitted" as const,
          submittedDate: todayFormatted,
          quoteRef: quoteRef
        };
      }
      return job;
    });
    
    // Save to state and storage
    setJobs(updatedJobs);
    saveEstimateJobsToStorage(updatedJobs);
    
    // Update integrated project to "Submitted" status
    updateProjectFromEstimate({
      estimateId: workingOnJob.id,
      enquiryId: workingOnJob.enquiryId,
      clientName: workingOnJob.client,
      projectName: workingOnJob.projectName,
      value: workingOnJob.value,
      submittedDate: todayFormatted,
    });
    
    alert(`Quote completed successfully! Total: £${grandTotal.toLocaleString('en-GB', { minimumFractionDigits: 2 })}\n\nJob moved to "Quote Submitted" status and client tracking updated.`);
    setWorkingOnJob(null);
  };

  const baseSubtotal = boqItems.reduce((sum, item) => sum + (item.quantity * item.baseRate), 0);
  const subtotal = baseSubtotal;
  const overheads = baseSubtotal * (overheadsPercent / 100);
  const profit = (baseSubtotal + overheads) * (profitPercent / 100);
  const grandTotal = baseSubtotal + overheads + profit;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Estimating Overview</h1>
          <p className="mt-1 text-sm text-gray-400">
            Assign estimators, price jobs, submit quotes, and track outcomes
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {estimatingStats.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col gap-3 rounded-lg border border-gray-700/50 border-l-4 border-l-orange-500 bg-gray-800/80 px-5 py-4"
          >
            <div className="flex items-start justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                {stat.label}
              </p>
              <span className="text-xl">{stat.icon}</span>
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-xs text-gray-400">{stat.change}</p>
          </div>
        ))}
      </section>

      {/* Estimating Workflow Kanban */}
      <section className="grid grid-cols-5 gap-4">
        {/* New Assignments Column */}
        <div className="flex flex-col gap-3">
          <div className="rounded-lg border border-blue-700/50 bg-blue-900/20 px-4 py-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-blue-400">
                New Assignments
              </h3>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/20 text-xs font-bold text-blue-400">
                {jobsByStatus["new-assignment"].length}
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-400">
              Received from BD
            </p>
          </div>

          <div className="space-y-3">
            {jobsByStatus["new-assignment"].map((job) => {
              const enquiries = getEnquiriesFromStorage();
              const linkedEnquiry = enquiries.find((e: Enquiry) => e.id === job.enquiryId);
              return (
              <div
                key={job.id}
                onClick={() => setSelectedJob(job)}
                className="cursor-pointer rounded-lg border border-gray-700/50 bg-gray-800/80 p-4 transition-all hover:border-blue-500/50 hover:bg-gray-700/50"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">
                      {job.client}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {job.projectName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm font-bold text-green-400">
                    {job.value}
                  </span>
                  <span className="rounded-full bg-blue-900/30 px-2 py-1 text-xs font-semibold text-blue-400">
                    {job.id}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Received: {formatDate(job.receivedDate)}
                </p>
                {linkedEnquiry?.returnDate && (
                  <p className="text-xs text-purple-400 mt-1">
                    Return Date: {formatDate(linkedEnquiry.returnDate)}
                  </p>
                )}
                {job.estimator && (
                  <p className="text-xs text-blue-400 mt-1">
                    Assigned to: {job.estimator}
                  </p>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setAssignJobId(job.id);
                    setShowAssignModal(true);
                  }}
                  className="mt-3 w-full rounded bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 transition-colors"
                >
                  {job.estimator ? 'Change Estimator' : 'Assign Estimator'}
                </button>
              </div>
            );
            })}
          </div>
        </div>

        {/* In Progress Column */}
        <div className="flex flex-col gap-3">
          <div className="rounded-lg border border-yellow-700/50 bg-yellow-900/20 px-4 py-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-yellow-400">
                In Progress
              </h3>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-yellow-500/20 text-xs font-bold text-yellow-400">
                {jobsByStatus["in-progress"].length}
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-400">
              Being priced
            </p>
          </div>

          <div className="space-y-3">
            {jobsByStatus["in-progress"].map((job) => {
              const enquiries = getEnquiriesFromStorage();
              const linkedEnquiry = enquiries.find((e: Enquiry) => e.id === job.enquiryId);
              return (
              <div
                key={job.id}
                onClick={() => setSelectedJob(job)}
                className="cursor-pointer rounded-lg border border-gray-700/50 bg-gray-800/80 p-4 transition-all hover:border-yellow-500/50 hover:bg-gray-700/50"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">
                      {job.client}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {job.projectName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm font-bold text-green-400">
                    {job.value}
                  </span>
                  <span className="rounded-full bg-yellow-900/30 px-2 py-1 text-xs font-semibold text-yellow-400">
                    {job.id}
                  </span>
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-gray-400">Progress</p>
                    <p className="text-xs font-semibold text-white">{job.progress}%</p>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-700">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500"
                      style={{ width: `${job.progress}%` }}
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Estimator: {job.estimator}
                </p>
                {linkedEnquiry?.returnDate && (
                  <p className="text-xs text-purple-400 mt-1">
                    Return Date: {formatDate(linkedEnquiry.returnDate)}
                  </p>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setWorkingOnJob(job);
                  }}
                  className="mt-3 w-full rounded bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600 transition-colors"
                >
                  Work on Estimate →
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setAssignJobId(job.id);
                    setShowAssignModal(true);
                  }}
                  className="mt-2 w-full rounded bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 transition-colors"
                >
                  Change Estimator
                </button>
                {job.progress && job.progress >= 90 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setWorkingOnJob(job);
                        // Trigger PDF generation after state updates
                        setTimeout(handleGenerateQuotePDF, 100);
                      }}
                      className="mt-2 w-full rounded bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-600 transition-colors"
                    >
                      Generate Quote PDF
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSubmitQuote(job.id);
                      }}
                      className="mt-2 w-full rounded bg-green-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-600 transition-colors"
                    >
                      Submit Quote
                    </button>
                  </>
                )}
              </div>
            );
            })}
          </div>
        </div>

        {/* Quote Submitted Column */}
        <div className="flex flex-col gap-3">
          <div className="rounded-lg border border-purple-700/50 bg-purple-900/20 px-4 py-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-purple-400">
                Quote Submitted
              </h3>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500/20 text-xs font-bold text-purple-400">
                {jobsByStatus["quote-submitted"].length}
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-400">
              Awaiting client decision
            </p>
          </div>

          <div className="space-y-3">
            {jobsByStatus["quote-submitted"].map((job) => {
              const enquiries = getEnquiriesFromStorage();
              const linkedEnquiry = enquiries.find((e: Enquiry) => e.id === job.enquiryId);
              return (
              <div
                key={job.id}
                onClick={() => setSelectedJob(job)}
                className="cursor-pointer rounded-lg border border-gray-700/50 bg-gray-800/80 p-4 transition-all hover:border-purple-500/50 hover:bg-gray-700/50"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">
                      {job.client}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {job.projectName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm font-bold text-green-400">
                    {job.value}
                  </span>
                  <span className="rounded-full bg-purple-900/30 px-2 py-1 text-xs font-semibold text-purple-400">
                    {job.quoteRef}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Submitted: {formatDate(job.submittedDate)}
                </p>
                {linkedEnquiry?.returnDate && (
                  <p className="text-xs text-purple-400 mt-1">
                    Return Date: {formatDate(linkedEnquiry.returnDate)}
                  </p>
                )}
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedJobForOutcome(job);
                      setShowWonModal(true);
                    }}
                    className="flex-1 rounded bg-green-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-600 transition-colors"
                  >
                    Won
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedJobForOutcome(job);
                      setShowLostModal(true);
                    }}
                    className="flex-1 rounded bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 transition-colors"
                  >
                    Lost
                  </button>
                </div>
              </div>
            );
            })}
          </div>
        </div>

        {/* Won Column */}
        <div className="flex flex-col gap-3">
          <div className="rounded-lg border border-green-700/50 bg-green-900/20 px-4 py-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-green-400">
                Won
              </h3>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500/20 text-xs font-bold text-green-400">
                {jobsByStatus["won"].length}
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-400">
              Moving to Operations
            </p>
          </div>

          <div className="space-y-3">
            {jobsByStatus["won"].map((job) => {
              const enquiries = getEnquiriesFromStorage();
              const linkedEnquiry = enquiries.find((e: Enquiry) => e.id === job.enquiryId);
              return (
              <div
                key={job.id}
                onClick={() => setSelectedJob(job)}
                className="cursor-pointer rounded-lg border border-gray-700/50 bg-gray-800/80 p-4 transition-all hover:border-green-500/50 hover:bg-gray-700/50"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">
                      {job.client}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {job.projectName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm font-bold text-green-400">
                    {job.value}
                  </span>
                  <span className="rounded-full bg-green-900/30 px-2 py-1 text-xs font-semibold text-green-400">
                    Won ✓
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-2 line-clamp-2">
                  {job.outcome}
                </p>
                {linkedEnquiry?.returnDate && (
                  <p className="text-xs text-purple-400 mt-1">
                    Return Date: {formatDate(linkedEnquiry.returnDate)}
                  </p>
                )}
                <button className="mt-3 w-full rounded bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600 transition-colors">
                  Send to Operations →
                </button>
              </div>
            );
            })}
          </div>
        </div>

        {/* Lost Column */}
        <div className="flex flex-col gap-3">
          <div className="rounded-lg border border-red-700/50 bg-red-900/20 px-4 py-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-red-400">
                Lost
              </h3>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500/20 text-xs font-bold text-red-400">
                {jobsByStatus["lost"].length}
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-400">
              Archived
            </p>
          </div>

          <div className="space-y-3">
            {jobsByStatus["lost"].map((job) => (
              <div
                key={job.id}
                onClick={() => setSelectedJob(job)}
                className="cursor-pointer rounded-lg border border-gray-700/50 bg-gray-800/80 p-4 opacity-60 transition-all hover:border-red-500/50 hover:bg-gray-700/50 hover:opacity-100"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">
                      {job.client}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {job.projectName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm font-bold text-gray-400">
                    {job.value}
                  </span>
                  <span className="rounded-full bg-red-900/30 px-2 py-1 text-xs font-semibold text-red-400">
                    Lost
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-2 line-clamp-2">
                  {job.outcome}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Job Detail Modal */}
      {selectedJob && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedJob(null)}
        >
          <div
            className="w-full max-w-4xl rounded-lg border border-gray-700/50 bg-gray-800 p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const enquiries = getEnquiriesFromStorage();
              const linkedEnquiry = enquiries.find((e: Enquiry) => e.id === selectedJob.enquiryId);

              return (
                <>
                  <div className="mb-4 flex items-start justify-between sticky top-0 bg-gray-800 pb-3">
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {selectedJob.client}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {selectedJob.projectName}
                      </p>
                    </div>
                    <button onClick={() => setSelectedJob(null)} className="text-gray-400 hover:text-white text-2xl">✕</button>
                  </div>

                  <div className="mb-4 flex items-center justify-between">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        selectedJob.status === "new-assignment"
                          ? "bg-blue-900/30 text-blue-400"
                          : selectedJob.status === "in-progress"
                          ? "bg-yellow-900/30 text-yellow-400"
                          : selectedJob.status === "quote-submitted"
                          ? "bg-purple-900/30 text-purple-400"
                          : selectedJob.status === "won"
                          ? "bg-green-900/30 text-green-400"
                          : "bg-red-900/30 text-red-400"
                      }`}
                    >
                      {selectedJob.status === "new-assignment"
                        ? "New Assignment"
                        : selectedJob.status === "in-progress"
                        ? "In Progress"
                        : selectedJob.status === "quote-submitted"
                        ? "Quote Submitted"
                        : selectedJob.status === "won"
                        ? "Won"
                        : "Lost"}
                    </span>
                  </div>

                  {/* Estimate Job Information */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-gray-700/30 rounded-lg p-3">
                      <p className="text-xs text-gray-400">Estimate ID</p>
                      <p className="text-sm font-mono text-white mt-1">{selectedJob.id}</p>
                    </div>
                    <div className="bg-gray-700/30 rounded-lg p-3">
                      <p className="text-xs text-gray-400">Project Value</p>
                      <p className="text-sm font-bold text-green-400 mt-1">{selectedJob.value}</p>
                    </div>
                    <div className="bg-gray-700/30 rounded-lg p-3">
                      <p className="text-xs text-gray-400">Received Date</p>
                      <p className="text-sm text-white mt-1">{formatDate(selectedJob.receivedDate)}</p>
                    </div>
                  </div>

                  {/* Project Details from Enquiry */}
                  {linkedEnquiry && (
                    <>
                      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
                        <h4 className="text-xs font-semibold text-blue-400 mb-3">📍 PROJECT DETAILS</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-gray-400">Project Name</p>
                            <p className="text-sm text-white mt-1">{linkedEnquiry.projectName}</p>
                          </div>
                          {linkedEnquiry.projectAddress && (
                            <div>
                              <p className="text-xs text-gray-400">Project Address</p>
                              <p className="text-sm text-white mt-1">{linkedEnquiry.projectAddress}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 mb-4">
                        <h4 className="text-xs font-semibold text-purple-400 mb-3">👤 CONTACT INFORMATION</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-gray-400">Contact Name</p>
                            <p className="text-sm text-white mt-1">{linkedEnquiry.contact}</p>
                          </div>
                          {linkedEnquiry.contactEmail && (
                            <div>
                              <p className="text-xs text-gray-400">Contact Email</p>
                              <p className="text-sm text-white mt-1">{linkedEnquiry.contactEmail}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-xs text-gray-400">Source</p>
                            <p className="text-sm text-white mt-1">{linkedEnquiry.source}</p>
                          </div>
                        </div>
                      </div>

                      {(linkedEnquiry.returnDate || linkedEnquiry.anticipatedAwardDate || linkedEnquiry.anticipatedSosDate) && (
                        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-4">
                          <h4 className="text-xs font-semibold text-green-400 mb-3">📅 TIMELINE</h4>
                          <div className="grid grid-cols-3 gap-3">
                            {linkedEnquiry.returnDate && (
                              <div>
                                <p className="text-xs text-gray-400">Return Date</p>
                                <p className="text-sm text-white mt-1">{formatDate(linkedEnquiry.returnDate)}</p>
                              </div>
                            )}
                            {linkedEnquiry.anticipatedAwardDate && (
                              <div>
                                <p className="text-xs text-gray-400">Anticipated Award Date</p>
                                <p className="text-sm text-white mt-1">{formatDate(linkedEnquiry.anticipatedAwardDate)}</p>
                              </div>
                            )}
                            {linkedEnquiry.anticipatedSosDate && (
                              <div>
                                <p className="text-xs text-gray-400">Anticipated Start of Service</p>
                                <p className="text-sm text-white mt-1">{formatDate(linkedEnquiry.anticipatedSosDate)}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Job Status Information */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {selectedJob.estimator && (
                      <div className="bg-gray-700/30 rounded-lg p-3">
                        <p className="text-xs text-gray-400">Estimator</p>
                        <p className="text-sm text-white mt-1">{selectedJob.estimator}</p>
                      </div>
                    )}
                    {selectedJob.progress !== undefined && (
                      <div className="bg-gray-700/30 rounded-lg p-3">
                        <p className="text-xs text-gray-400">Progress</p>
                        <p className="text-sm text-white mt-1">{selectedJob.progress}%</p>
                      </div>
                    )}
                    {selectedJob.quoteRef && (
                      <div className="bg-gray-700/30 rounded-lg p-3">
                        <p className="text-xs text-gray-400">Quote Reference</p>
                        <p className="text-sm text-white mt-1">{selectedJob.quoteRef}</p>
                      </div>
                    )}
                    {selectedJob.submittedDate && (
                      <div className="bg-gray-700/30 rounded-lg p-3">
                        <p className="text-xs text-gray-400">Submitted Date</p>
                        <p className="text-sm text-white mt-1">{formatDate(selectedJob.submittedDate)}</p>
                      </div>
                    )}
                  </div>

                  {selectedJob.outcome && (
                    <div className="bg-gray-700/30 rounded-lg p-3 mb-4">
                      <p className="text-xs text-gray-400">Outcome</p>
                      <p className="text-sm text-white mt-1">{selectedJob.outcome}</p>
                    </div>
                  )}

                  {selectedJob.notes && (
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4">
                      <p className="text-xs text-blue-400 font-semibold">Notes</p>
                      <p className="text-sm text-white mt-1">{selectedJob.notes}</p>
                    </div>
                  )}

                  {linkedEnquiry?.notes && (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4">
                      <p className="text-xs text-yellow-400 font-semibold">Enquiry Notes</p>
                      <p className="text-sm text-white mt-1">{linkedEnquiry.notes}</p>
                    </div>
                  )}

                  {/* Documents Section */}
                  {linkedEnquiry?.documents && linkedEnquiry.documents.length > 0 && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-4">
                      <h4 className="text-xs font-semibold text-amber-400 mb-3">📎 DOCUMENTS ({linkedEnquiry.documents.length})</h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {linkedEnquiry.documents.map((doc) => (
                          <div key={doc.id} className="flex items-center justify-between bg-gray-700/40 rounded p-2 hover:bg-gray-700/60 transition-colors">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="text-lg">{getFileIcon(doc.fileType)}</span>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium text-gray-200 truncate">{doc.fileName}</p>
                                <p className="text-xs text-gray-500">{formatFileSize(doc.fileSize)}</p>
                              </div>
                            </div>
                            <a
                              href={doc.dataUrl}
                              download={doc.fileName}
                              className="ml-2 px-2 py-1 rounded bg-amber-500/30 border border-amber-500/50 text-amber-300 hover:bg-amber-500/40 transition-colors text-xs font-medium"
                            >
                              Download
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => setSelectedJob(null)}
                      className="flex-1 px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-600 transition-colors"
                    >
                      Close
                    </button>
                    {selectedJob.status === "in-progress" && (
                      <button 
                        onClick={() => {
                          setWorkingOnJob(selectedJob);
                          setSelectedJob(null);
                        }}
                        className="flex-1 rounded bg-orange-500 px-4 py-2 font-medium text-white hover:bg-orange-600 transition-colors"
                      >
                        Work on Estimate →
                      </button>
                    )}
                    {selectedJob.status === "won" && (
                      <button className="flex-1 rounded bg-orange-500 px-4 py-2 font-medium text-white hover:bg-orange-600 transition-colors">
                        Send to Operations →
                      </button>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* BOQ Builder Workspace */}
      {workingOnJob && (
        <div className="fixed inset-0 z-50 bg-gray-900 overflow-y-auto">
          <div className="min-h-screen p-6">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
              <div>
                <h2 className="text-2xl font-bold text-white">{workingOnJob.client}</h2>
                <p className="text-sm text-gray-400">{workingOnJob.projectName}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {workingOnJob.id} • Target Value: {workingOnJob.value}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setWorkingOnJob(null)}
                  className="rounded bg-gray-700 px-4 py-2 text-sm text-white hover:bg-gray-600 transition-colors"
                >
                  ← Back to Overview
                </button>
                <button 
                  onClick={saveProgress}
                  className="rounded bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
                >
                  Save Progress
                </button>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* BOQ Items */}
              <div className="lg:col-span-2 space-y-4">
                <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
                  <h3 className="mb-4 text-lg font-bold text-white">Bill of Quantities</h3>
                  
                  {/* BOQ Actions */}
                  <div className="mb-4 flex gap-2 flex-wrap">
                    <button 
                      onClick={handleBOQUploadClick}
                      disabled={isUploadingBoq}
                      className="rounded bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-600 transition-colors disabled:opacity-50"
                    >
                      {isUploadingBoq ? 'Uploading...' : '📁 Upload BOQ'}
                    </button>
                    <input
                      ref={setBoqUploadInput}
                      type="file"
                      accept=".csv,.tsv,.txt,.xlsx,.xls"
                      onChange={handleBOQFileChange}
                      className="hidden"
                    />
                    <button 
                      onClick={() => setShowSMM7Modal(true)}
                      className="rounded bg-purple-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-600 transition-colors"
                    >
                      📚 Import from Libraries
                    </button>
                  </div>
                  {boqUploadError && (
                    <div className="mb-4 rounded border border-red-500/50 bg-red-500/10 p-3">
                      <p className="text-sm text-red-400">{boqUploadError}</p>
                    </div>
                  )}
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-700/50">
                          <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Description</th>
                          <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 w-20">Unit</th>
                          <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400 w-24">Quantity</th>
                          <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400 w-28">Rate (£)</th>
                          <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400 w-32">Total (£)</th>
                          <th className="pb-3 w-12"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700/50">
                        {boqItems.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-700/30">
                            <td className="py-3 text-sm text-white">{item.description}</td>
                            <td className="py-3 text-sm text-gray-400">{item.unit}</td>
                            <td className="py-3 text-right text-sm text-white">{item.quantity.toLocaleString()}</td>
                            <td className="py-3 text-right text-sm">
                              <button
                                onClick={() => openRateBreakdown(item)}
                                className={`text-white hover:text-blue-400 transition-colors ${
                                  item.components && item.components.length > 0 ? 'underline decoration-dotted' : ''
                                }`}
                                title={item.components && item.components.length > 0 ? 'Click to view/edit rate breakdown' : 'Click to add rate breakdown'}
                              >
                                {item.rate.toFixed(2)}
                              </button>
                            </td>
                            <td className="py-3 text-right text-sm font-semibold text-green-400">
                              {item.total.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 text-right">
                              <button
                                onClick={() => removeBoqItem(item.id)}
                                className="text-red-400 hover:text-red-300 text-xs"
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        ))}
                        
                        {/* Add New Item Row */}
                        <tr className="bg-gray-700/30">
                          <td className="py-3">
                            <input
                              type="text"
                              placeholder="Enter description..."
                              value={newItem.description}
                              onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                              className="w-full rounded bg-gray-700 px-2 py-1 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                          </td>
                          <td className="py-3">
                            <select
                              value={newItem.unit}
                              onChange={(e) => setNewItem({...newItem, unit: e.target.value})}
                              className="w-full rounded bg-gray-700 px-2 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                            >
                              <option>m²</option>
                              <option>m³</option>
                              <option>m</option>
                              <option>tonne</option>
                              <option>nr</option>
                              <option>item</option>
                            </select>
                          </td>
                          <td className="py-3">
                            <input
                              type="number"
                              placeholder="0"
                              value={newItem.quantity || ''}
                              onChange={(e) => setNewItem({...newItem, quantity: parseFloat(e.target.value) || 0})}
                              className="w-full rounded bg-gray-700 px-2 py-1 text-right text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                          </td>
                          <td className="py-3">
                            <input
                              type="number"
                              placeholder="0.00"
                              step="0.01"
                              value={newItem.rate || ''}
                              onChange={(e) => setNewItem({...newItem, rate: parseFloat(e.target.value) || 0})}
                              className="w-full rounded bg-gray-700 px-2 py-1 text-right text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                          </td>
                          <td className="py-3 text-right text-sm font-semibold text-orange-400">
                            {((newItem.quantity || 0) * (newItem.rate || 0)).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={addBoqItem}
                              className="rounded bg-green-500 px-2 py-1 text-xs font-semibold text-white hover:bg-green-600 transition-colors ml-4"
                            >
                              + Add
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Cost Summary */}
              <div className="space-y-4">
                <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
                  <h3 className="mb-4 text-lg font-bold text-white">Cost Summary</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-700/50">
                      <span className="text-sm text-gray-400">Subtotal</span>
                      <span className="text-lg font-semibold text-white">
                        £{subtotal.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400">Overheads</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={overheadsPercent}
                          onChange={(e) => setOverheadsPercent(parseFloat(e.target.value) || 0)}
                          className="w-16 rounded bg-gray-700 px-2 py-1 text-xs text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                        <span className="text-xs text-gray-400">%</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-300">
                        £{overheads.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between pb-3 border-b border-gray-700/50">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400">Profit</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={profitPercent}
                          onChange={(e) => setProfitPercent(parseFloat(e.target.value) || 0)}
                          className="w-16 rounded bg-gray-700 px-2 py-1 text-xs text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                        <span className="text-xs text-gray-400">%</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-300">
                        £{profit.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-base font-bold text-white">Grand Total</span>
                      <span className="text-2xl font-bold text-green-400">
                        £{grandTotal.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
                  <h3 className="mb-4 text-lg font-bold text-white">Progress</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Completion</span>
                        <span className="text-sm font-semibold text-white">{workingOnJob.progress}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-700">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500"
                          style={{ width: `${workingOnJob.progress}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="pt-3 border-t border-gray-700/50">
                      <p className="text-xs text-gray-400 mb-2">Estimator</p>
                      <p className="text-sm font-semibold text-white">{workingOnJob.estimator}</p>
                    </div>
                    
                    <div>
                      <p className="text-xs text-gray-400 mb-2">Notes</p>
                      <textarea
                        className="w-full rounded bg-gray-700 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        rows={3}
                        placeholder="Add notes about this estimate..."
                        defaultValue={workingOnJob.notes}
                      />
                    </div>
                  </div>
                </div>

                {/* Documents from Enquiry */}
                {(() => {
                  const enquiries = getEnquiriesFromStorage();
                  const linkedEnquiry = enquiries.find((e: Enquiry) => e.id === workingOnJob.enquiryId);
                  
                  if (linkedEnquiry?.documents && linkedEnquiry.documents.length > 0) {
                    return (
                      <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
                        <h3 className="mb-4 text-lg font-bold text-white">📎 Documents</h3>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {linkedEnquiry.documents.map((doc) => (
                            <div key={doc.id} className="flex items-center justify-between bg-gray-700/40 rounded p-2 hover:bg-gray-700/60 transition-colors">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className="text-lg">{getFileIcon(doc.fileType)}</span>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-medium text-gray-200 truncate">{doc.fileName}</p>
                                  <p className="text-xs text-gray-500">{formatFileSize(doc.fileSize)}</p>
                                </div>
                              </div>
                              <a
                                href={doc.dataUrl}
                                download={doc.fileName}
                                className="ml-2 px-2 py-1 rounded bg-amber-500/30 border border-amber-500/50 text-amber-300 hover:bg-amber-500/40 transition-colors text-xs font-medium whitespace-nowrap"
                              >
                                Download
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                <div className="space-y-3">
                  <div className="flex gap-3">
                    <button
                      onClick={handleGenerateQuotePDF}
                      className="flex-1 rounded bg-indigo-500 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-600 transition-colors"
                    >
                      📄 Generate PDF
                    </button>
                    <button
                      onClick={handleGenerateExcel}
                      className="flex-1 rounded bg-green-600 px-4 py-3 text-sm font-bold text-white hover:bg-green-700 transition-colors"
                    >
                      📊 Generate Excel
                    </button>
                  </div>
                  <button
                    onClick={generateAndSubmitQuote}
                    className="w-full rounded bg-green-500 px-4 py-3 text-sm font-bold text-white hover:bg-green-600 transition-colors"
                  >
                    ✓ Complete
                  </button>
                </div>
              </div>
            </div>

            {/* SMM7 Import Modal */}
            {showSMM7Modal && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                onClick={() => setShowSMM7Modal(false)}
              >
                <div
                  className="w-full max-w-6xl rounded-lg border border-gray-700/50 bg-gray-800 p-6 max-h-[85vh] flex flex-col"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white">Standard Library</h3>
                      <p className="text-sm text-gray-400">
                        {activeSMM7Tab === 'smm7' ? 'SMM7 Standard Method of Measurement' : 
                         activeSMM7Tab === 'cessm' ? 'CESSM Civil Engineering Standard' : 
                         'Valescape Custom Library'}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowSMM7Modal(false)}
                      className="text-gray-400 hover:text-white text-2xl"
                    >
                      ×
                    </button>
                  </div>

                  {/* Tabs */}
                  <div className="flex gap-2 mb-4 border-b border-gray-700">
                    <button
                      onClick={() => {
                        setActiveSMM7Tab('smm7');
                        setCessmSearch('');
                      }}
                      className={`px-4 py-2 text-sm font-semibold transition-colors ${
                        activeSMM7Tab === 'smm7'
                          ? 'text-blue-400 border-b-2 border-blue-400'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      SMM7 ({countTreeItems(smm7Tree).toLocaleString()})
                    </button>
                    <button
                      onClick={() => {
                        setActiveSMM7Tab('cessm');
                        setSmm7Search('');
                      }}
                      className={`px-4 py-2 text-sm font-semibold transition-colors ${
                        activeSMM7Tab === 'cessm'
                          ? 'text-purple-400 border-b-2 border-purple-400'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      CESSM ({countTreeItems(cessmTree).toLocaleString()})
                    </button>
                    <button
                      onClick={() => {
                        setActiveSMM7Tab('valescape');
                        setSmm7Search('');
                        setCessmSearch('');
                      }}
                      className={`px-4 py-2 text-sm font-semibold transition-colors ${
                        activeSMM7Tab === 'valescape'
                          ? 'text-green-400 border-b-2 border-green-400'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      VALESCAPE ({countTreeItems(valescapeTree).toLocaleString()})
                    </button>
                  </div>

                  {/* Search */}
                  {activeSMM7Tab === 'smm7' && smm7Tree.length > 0 && (
                    <div className="mb-4">
                      <input
                        type="text"
                        placeholder="Search SMM7 items by description or unit..."
                        value={smm7Search}
                        onChange={(e) => setSmm7Search(e.target.value)}
                        className="w-full rounded bg-gray-700 px-4 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-400 mt-2">
                        {smm7Search ? 
                          `Showing ${Array.isArray(filteredSmm7Tree) ? filteredSmm7Tree.length : 0} matching items` : 
                          `${countTreeItems(smm7Tree)} total items in library`
                        }
                      </p>
                    </div>
                  )}

                  {activeSMM7Tab === 'cessm' && cessmTree.length > 0 && (
                    <div className="mb-4">
                      <input
                        type="text"
                        placeholder="Search CESSM items by description or unit..."
                        value={cessmSearch}
                        onChange={(e) => setCessmSearch(e.target.value)}
                        className="w-full rounded bg-gray-700 px-4 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <p className="text-xs text-gray-400 mt-2">
                        {cessmSearch ? 
                          `Showing ${Array.isArray(filteredCessmTree) ? filteredCessmTree.length : 0} matching items` : 
                          `${countTreeItems(cessmTree)} total items in library`
                        }
                      </p>
                    </div>
                  )}

                  {activeSMM7Tab === 'valescape' && valescapeTree.length > 0 && (
                    <div className="mb-4">
                      <input
                        type="text"
                        placeholder="Search Valescape items by description or unit..."
                        value={valescapeSearch}
                        onChange={(e) => setValescapeSearch(e.target.value)}
                        className="w-full rounded bg-gray-700 px-4 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <p className="text-xs text-gray-400 mt-2">
                        {valescapeSearch ? 
                          `Showing ${Array.isArray(filteredValescapeTree) ? filteredValescapeTree.length : 0} matching items` : 
                          `${countTreeItems(valescapeTree)} total items in library`
                        }
                      </p>
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 overflow-y-auto">
                    {activeSMM7Tab === 'smm7' && (
                      <>
                        {smm7Loading ? (
                          <div className="flex items-center justify-center py-12">
                            <div className="text-gray-400">Loading SMM7 data...</div>
                          </div>
                        ) : smm7Tree.length === 0 ? (
                          <div className="flex items-center justify-center py-12">
                            <div className="text-gray-400">No SMM7 data available</div>
                          </div>
                        ) : smm7Search.trim() !== '' && Array.isArray(filteredSmm7Tree) ? (
                          <div className="space-y-2">
                            {filteredSmm7Tree.map((node) => (
                              <div
                                key={node.id}
                                className="flex items-center justify-between rounded-lg border border-gray-700/50 bg-gray-700/30 p-3"
                              >
                                <div className="flex-1 min-w-0 pr-4">
                                  <p className="text-sm font-semibold text-white truncate">
                                    {node.description}
                                  </p>
                                  {node.unit && (
                                    <p className="text-xs text-gray-400 mt-1">
                                      Unit: {node.unit}
                                    </p>
                                  )}
                                  <p className="text-xs text-gray-500 mt-1">
                                    Path: {node.path.join(' → ')}
                                  </p>
                                </div>
                                {node.unit && (
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <input
                                      type="number"
                                      placeholder="Qty"
                                      className="w-20 rounded bg-gray-700 px-2 py-1 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      id={`search-smm7-qty-${node.id}`}
                                    />
                                    <input
                                      type="number"
                                      placeholder="Rate £"
                                      className="w-24 rounded bg-gray-700 px-2 py-1 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      id={`search-smm7-rate-${node.id}`}
                                    />
                                    <button
                                      onClick={() => {
                                        const qtyInput = document.getElementById(`search-smm7-qty-${node.id}`) as HTMLInputElement;
                                        const rateInput = document.getElementById(`search-smm7-rate-${node.id}`) as HTMLInputElement;
                                        const qty = parseFloat(qtyInput.value);
                                        const rate = parseFloat(rateInput.value);
                                        if (qty > 0 && rate > 0) {
                                          addSMM7Item(node.description, node.unit!, qty, rate);
                                          qtyInput.value = '';
                                          rateInput.value = '';
                                        }
                                      }}
                                      className="rounded bg-blue-500 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-600 transition-colors"
                                    >
                                      Add
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {smm7Tree.map(node => renderSMM7TreeNode(node, 0))}
                          </div>
                        )}
                      </>
                    )}

                    {activeSMM7Tab === 'cessm' && (
                      <>
                        {cessmLoading ? (
                          <div className="flex items-center justify-center py-12">
                            <div className="text-gray-400">Loading CESSM data...</div>
                          </div>
                        ) : cessmTree.length === 0 ? (
                          <div className="flex items-center justify-center py-12">
                            <div className="text-gray-400">No CESSM data available</div>
                          </div>
                        ) : cessmSearch.trim() !== '' && Array.isArray(filteredCessmTree) ? (
                          <div className="space-y-2">
                            {filteredCessmTree.map((node) => (
                              <div
                                key={node.id}
                                className="flex items-center justify-between rounded-lg border border-gray-700/50 bg-gray-700/30 p-3"
                              >
                                <div className="flex-1 min-w-0 pr-4">
                                  <p className="text-sm font-semibold text-white truncate">
                                    {node.description}
                                  </p>
                                  {node.sellPrice && node.unit && (
                                    <p className="text-xs text-gray-400 mt-1">
                                      £{node.sellPrice.toFixed(2)} per {node.unit}
                                    </p>
                                  )}
                                  <p className="text-xs text-gray-500 mt-1">
                                    Path: {node.path.join(' → ')}
                                  </p>
                                </div>
                                {node.unit && node.sellPrice && (
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <input
                                      type="number"
                                      placeholder="Qty"
                                      className="w-20 rounded bg-gray-700 px-2 py-1 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                      id={`search-cessm-qty-${node.id}`}
                                    />
                                    <button
                                      onClick={() => {
                                        const input = document.getElementById(`search-cessm-qty-${node.id}`) as HTMLInputElement;
                                        const qty = parseFloat(input.value);
                                        if (qty > 0 && node.sellPrice) {
                                          const item: CESSMItem = {
                                            id: node.id,
                                            description: node.description,
                                            unit: node.unit || '',
                                            sellPrice: node.sellPrice,
                                            costPrice: node.sellPrice,
                                            libcode: '',
                                            type: '10',
                                            parentId: node.id,
                                            rowIndex: 0
                                          };
                                          addCESSMItem(item, qty);
                                          input.value = '';
                                        }
                                      }}
                                      className="rounded bg-purple-500 px-3 py-1 text-xs font-semibold text-white hover:bg-purple-600 transition-colors"
                                    >
                                      Add
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {cessmTree.map(node => renderCessmTreeNode(node, 0))}
                          </div>
                        )}
                      </>
                    )}

                    {activeSMM7Tab === 'valescape' && (
                      <>
                        {valescapeLoading ? (
                          <div className="flex items-center justify-center py-12">
                            <div className="text-gray-400">Loading Valescape data...</div>
                          </div>
                        ) : valescapeTree.length === 0 ? (
                          <div className="flex items-center justify-center py-12">
                            <div className="text-gray-400">No Valescape data available</div>
                          </div>
                        ) : valescapeSearch.trim() !== '' && Array.isArray(filteredValescapeTree) ? (
                          <div className="space-y-2">
                            {filteredValescapeTree.map((node) => (
                              <div
                                key={node.id}
                                className="flex items-center justify-between rounded-lg border border-gray-700/50 bg-gray-700/30 p-3"
                              >
                                <div className="flex-1 min-w-0 pr-4">
                                  <p className="text-sm font-semibold text-white truncate">
                                    {node.description}
                                  </p>
                                  {node.unit && (
                                    <p className="text-xs text-gray-400 mt-1">
                                      Unit: {node.unit}
                                    </p>
                                  )}
                                  <p className="text-xs text-gray-500 mt-1">
                                    Path: {node.path.join(' → ')}
                                  </p>
                                </div>
                                {node.unit && (
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <input
                                      type="number"
                                      placeholder="Qty"
                                      className="w-20 rounded bg-gray-700 px-2 py-1 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                                      id={`search-valescape-qty-${node.id}`}
                                    />
                                    <input
                                      type="number"
                                      placeholder="Rate £"
                                      className="w-24 rounded bg-gray-700 px-2 py-1 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                                      id={`search-valescape-rate-${node.id}`}
                                    />
                                    <button
                                      onClick={() => {
                                        const qtyInput = document.getElementById(`search-valescape-qty-${node.id}`) as HTMLInputElement;
                                        const rateInput = document.getElementById(`search-valescape-rate-${node.id}`) as HTMLInputElement;
                                        const qty = parseFloat(qtyInput.value);
                                        const rate = parseFloat(rateInput.value);
                                        if (qty > 0 && rate > 0) {
                                          addValescapeItem(node.description, node.unit!, qty, rate);
                                          qtyInput.value = '';
                                          rateInput.value = '';
                                        }
                                      }}
                                      className="rounded bg-green-500 px-3 py-1 text-xs font-semibold text-white hover:bg-green-600 transition-colors"
                                    >
                                      Add
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {valescapeTree.map(node => renderValescapeTreeNode(node, 0))}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-700 flex justify-end">
                    <button
                      onClick={() => setShowSMM7Modal(false)}
                      className="rounded bg-gray-700 px-4 py-2 text-white hover:bg-gray-600 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Rate Library Modal */}
            {showRateLibrary && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                onClick={() => setShowRateLibrary(false)}
              >
                <div
                  className="w-full max-w-5xl rounded-lg border border-gray-700/50 bg-gray-800 p-6 max-h-[85vh] flex flex-col"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white">Rate Libraries</h3>
                      <p className="text-sm text-gray-400">
                        {activeLibraryTab === 'labour' ? 'Labour Rates' : activeLibraryTab === 'plant' ? 'Plant & Equipment' : 'Material Rates'}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowRateLibrary(false)}
                      className="text-gray-400 hover:text-white text-2xl"
                    >
                      ×
                    </button>
                  </div>

                  {/* Tabs */}
                  <div className="flex gap-2 mb-4 border-b border-gray-700">
                    <button
                      onClick={() => {
                        setActiveLibraryTab('labour');
                        setPlantSearch('');
                        setMaterialSearch('');
                      }}
                      className={`px-4 py-2 text-sm font-semibold transition-colors ${
                        activeLibraryTab === 'labour'
                          ? 'text-orange-400 border-b-2 border-orange-400'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Labour ({rateLibraries.labour.length})
                    </button>
                    <button
                      onClick={() => {
                        setActiveLibraryTab('plant');
                        setLabourSearch('');
                        setMaterialSearch('');
                      }}
                      className={`px-4 py-2 text-sm font-semibold transition-colors ${
                        activeLibraryTab === 'plant'
                          ? 'text-purple-400 border-b-2 border-purple-400'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Plant ({rateLibraries.plant.length})
                    </button>
                    <button
                      onClick={() => {
                        setActiveLibraryTab('materials');
                        setLabourSearch('');
                        setPlantSearch('');
                      }}
                      className={`px-4 py-2 text-sm font-semibold transition-colors ${
                        activeLibraryTab === 'materials'
                          ? 'text-blue-400 border-b-2 border-blue-400'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Materials ({rateLibraries.materials.length})
                    </button>
                  </div>

                  {/* Search */}
                  {activeLibraryTab === 'labour' && (
                    <div className="mb-4">
                      <input
                        type="text"
                        placeholder="Search labour rates..."
                        value={labourSearch}
                        onChange={(e) => setLabourSearch(e.target.value)}
                        className="w-full rounded bg-gray-700 px-4 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                      <p className="text-xs text-gray-400 mt-2">
                        {labourSearch ? `Showing ${filteredLabourRates.length} of ${rateLibraries.labour.length} items` : `Showing first 100 of ${rateLibraries.labour.length} items`}
                      </p>
                    </div>
                  )}

                  {activeLibraryTab === 'plant' && (
                    <div className="mb-4">
                      <input
                        type="text"
                        placeholder="Search plant & equipment..."
                        value={plantSearch}
                        onChange={(e) => setPlantSearch(e.target.value)}
                        className="w-full rounded bg-gray-700 px-4 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <p className="text-xs text-gray-400 mt-2">
                        {plantSearch ? `Showing ${filteredPlantRates.length} of ${rateLibraries.plant.length} items` : `Showing first 100 of ${rateLibraries.plant.length} items`}
                      </p>
                    </div>
                  )}

                  {activeLibraryTab === 'materials' && (
                    <div className="mb-4">
                      <input
                        type="text"
                        placeholder="Search materials..."
                        value={materialSearch}
                        onChange={(e) => setMaterialSearch(e.target.value)}
                        className="w-full rounded bg-gray-700 px-4 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-400 mt-2">
                        {materialSearch ? `Showing ${filteredMaterialRates.length} of ${rateLibraries.materials.length} items` : `Showing first 100 of ${rateLibraries.materials.length} items`}
                      </p>
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 overflow-y-auto">
                    {activeLibraryTab === 'labour' && (
                      <div className="space-y-2">
                        {filteredLabourRates.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between rounded-lg border border-gray-700/50 bg-gray-700/30 p-3"
                          >
                            <div className="flex-1 min-w-0 pr-4">
                              <p className="text-sm font-semibold text-white truncate">{item.role}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                £{item.rate.toFixed(2)} per {item.unit}
                                {item.code && ` • ${item.code}`}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <input
                                type="number"
                                placeholder="Hours"
                                className="w-20 rounded bg-gray-700 px-2 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                                id={`labour-qty-${idx}`}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const qty = parseFloat((e.target as HTMLInputElement).value);
                                    if (qty > 0) {
                                      addLibraryItem(item.role, item.unit, item.rate, qty);
                                      (e.target as HTMLInputElement).value = '';
                                    }
                                  }
                                }}
                              />
                              <button
                                onClick={() => {
                                  const input = document.getElementById(`labour-qty-${idx}`) as HTMLInputElement;
                                  const qty = parseFloat(input.value);
                                  if (qty > 0) {
                                    addLibraryItem(item.role, item.unit, item.rate, qty);
                                    input.value = '';
                                  }
                                }}
                                className="rounded bg-orange-500 px-3 py-1 text-xs font-semibold text-white hover:bg-orange-600 transition-colors"
                              >
                                Add
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {activeLibraryTab === 'plant' && (
                      <div className="space-y-2">
                        {filteredPlantRates.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between rounded-lg border border-gray-700/50 bg-gray-700/30 p-3"
                          >
                            <div className="flex-1 min-w-0 pr-4">
                              <p className="text-sm font-semibold text-white truncate">{item.item}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                £{item.rate.toFixed(2)} per {item.unit}
                                {item.code && ` • ${item.code}`}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <input
                                type="number"
                                placeholder="Qty"
                                className="w-20 rounded bg-gray-700 px-2 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                id={`plant-qty-${idx}`}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const qty = parseFloat((e.target as HTMLInputElement).value);
                                    if (qty > 0) {
                                      addLibraryItem(item.item, item.unit, item.rate, qty);
                                      (e.target as HTMLInputElement).value = '';
                                    }
                                  }
                                }}
                              />
                              <button
                                onClick={() => {
                                  const input = document.getElementById(`plant-qty-${idx}`) as HTMLInputElement;
                                  const qty = parseFloat(input.value);
                                  if (qty > 0) {
                                    addLibraryItem(item.item, item.unit, item.rate, qty);
                                    input.value = '';
                                  }
                                }}
                                className="rounded bg-purple-500 px-3 py-1 text-xs font-semibold text-white hover:bg-purple-600 transition-colors"
                              >
                                Add
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {activeLibraryTab === 'materials' && (
                      <div className="space-y-2">
                        {filteredMaterialRates.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between rounded-lg border border-gray-700/50 bg-gray-700/30 p-3"
                          >
                            <div className="flex-1 min-w-0 pr-4">
                              <p className="text-sm font-semibold text-white truncate">{item.item}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                £{item.rate.toFixed(2)} per {item.unit}
                                {item.code && ` • ${item.code}`}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <input
                                type="number"
                                placeholder="Qty"
                                className="w-20 rounded bg-gray-700 px-2 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                id={`material-qty-${idx}`}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const qty = parseFloat((e.target as HTMLInputElement).value);
                                    if (qty > 0) {
                                      addLibraryItem(item.item, item.unit, item.rate, qty);
                                      (e.target as HTMLInputElement).value = '';
                                    }
                                  }
                                }}
                              />
                              <button
                                onClick={() => {
                                  const input = document.getElementById(`material-qty-${idx}`) as HTMLInputElement;
                                  const qty = parseFloat(input.value);
                                  if (qty > 0) {
                                    addLibraryItem(item.item, item.unit, item.rate, qty);
                                    input.value = '';
                                  }
                                }}
                                className="rounded bg-blue-500 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-600 transition-colors"
                              >
                                Add
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-700 flex justify-end">
                    <button
                      onClick={() => setShowRateLibrary(false)}
                      className="rounded bg-gray-700 px-4 py-2 text-white hover:bg-gray-600 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Rate Breakdown Modal */}
            {showRateBreakdown && selectedRateItem && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                onClick={() => setShowRateBreakdown(false)}
              >
                <div
                  className="w-full max-w-4xl rounded-lg border border-gray-700/50 bg-gray-800 p-6 max-h-[90vh] flex flex-col"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white">Rate Breakdown Editor</h3>
                      <p className="text-sm text-gray-400 mt-1">{selectedRateItem.description}</p>
                      <div className="flex gap-4 mt-2 text-xs text-gray-500">
                        <span>Unit: {selectedRateItem.unit}</span>
                        <span>Quantity: {selectedRateItem.quantity.toLocaleString()}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowRateBreakdown(false)}
                      className="text-gray-400 hover:text-white text-2xl"
                    >
                      ×
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    {editingComponents.length > 0 ? (
                      <div className="space-y-4">
                        {/* Group components by type */}
                        {['labour', 'plant', 'materials'].map(type => {
                          const components = editingComponents.filter(c => c.type === type);
                          if (components.length === 0) return null;
                          
                          const typeColors = {
                            labour: 'blue',
                            plant: 'yellow',
                            materials: 'green'
                          };
                          const color = typeColors[type as keyof typeof typeColors];
                          
                          return (
                            <div key={type}>
                              <h4 className={`text-sm font-semibold text-${color}-400 mb-2 flex items-center gap-2 capitalize`}>
                                <span className={`w-2 h-2 rounded-full bg-${color}-400`}></span>
                                {type === 'labour' ? 'Labour' : type === 'plant' ? 'Plant & Equipment' : 'Materials'}
                              </h4>
                              <div className="space-y-2">
                                {editingComponents.map((comp, idx) => {
                                  if (comp.type !== type) return null;
                                  return (
                                    <div
                                      key={idx}
                                      className="grid grid-cols-12 gap-2 items-center rounded border border-gray-700/50 bg-gray-700/30 p-3"
                                    >
                                      <div className="col-span-3">
                                        <input
                                          type="text"
                                          value={comp.description}
                                          onChange={(e) => updateComponent(idx, 'description', e.target.value)}
                                          className="w-full rounded bg-gray-700 px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                          placeholder="Description"
                                        />
                                      </div>
                                      <div className="col-span-2">
                                        <div className="flex items-center gap-1">
                                          <input
                                            type="number"
                                            step="any"
                                            value={editingComponentInputs[idx]?.outputPerUnit ?? ''}
                                            onChange={(e) => updateComponentOutputInput(idx, e.target.value)}
                                            className="w-full rounded bg-gray-700 px-2 py-1 text-sm text-white text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            placeholder="Output"
                                          />
                                          <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                            {comp.type === 'materials'
                                              ? `${comp.unit}/${selectedRateItem.unit}`
                                              : `${selectedRateItem.unit}/shift`}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="col-span-2">
                                        <input
                                          type="number"
                                          step="any"
                                          value={comp.quantity}
                                          readOnly
                                          className="w-full rounded bg-gray-700 px-2 py-1 text-sm text-white text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                                          placeholder="Shifts"
                                        />
                                      </div>
                                      <div className="col-span-1">
                                        <input
                                          type="text"
                                          value={comp.unit}
                                          onChange={(e) => updateComponent(idx, 'unit', e.target.value)}
                                          className="w-full rounded bg-gray-700 px-2 py-1 text-xs text-white text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                                          placeholder="Unit"
                                        />
                                      </div>
                                      <div className="col-span-2">
                                        <input
                                          type="number"
                                          step="any"
                                          value={editingComponentInputs[idx]?.unitRate ?? ''}
                                          onChange={(e) => updateComponentUnitRateInput(idx, e.target.value)}
                                          className="w-full rounded bg-gray-700 px-2 py-1 text-sm text-white text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                                          placeholder="Rate"
                                        />
                                      </div>
                                      <div className="col-span-1 text-right">
                                        <span className="text-sm font-semibold text-white">
                                          £{comp.cost.toFixed(2)}
                                        </span>
                                      </div>
                                      <div className="col-span-1 text-right">
                                        <button
                                          onClick={() => removeComponent(idx)}
                                          className="text-red-400 hover:text-red-300 text-xs"
                                          title="Remove component"
                                        >
                                          ✕
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center py-8">
                        <div className="text-center">
                          <p className="text-gray-400 mb-2">No components yet</p>
                          <p className="text-xs text-gray-500">
                            Add components below to build up this rate
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Add Component Section */}
                    {!showAddComponent ? (
                      <button
                        onClick={() => setShowAddComponent(true)}
                        className="mt-4 w-full rounded border-2 border-dashed border-gray-600 py-3 text-sm text-gray-400 hover:border-blue-500 hover:text-blue-400 transition-colors"
                      >
                        + Add Component
                      </button>
                    ) : (
                      <div className="mt-4 rounded border border-blue-500/50 bg-blue-500/10 p-4">
                        <h5 className="text-sm font-semibold text-white mb-3">Add New Component</h5>
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-gray-400 mb-1 block">Type</label>
                              <select
                                value={newComponent.type}
                                onChange={(e) => {
                                  setNewComponent({
                                    ...newComponent,
                                    type: e.target.value as any,
                                    description: '',
                                    componentId: '',
                                    outputPerUnit: 0,
                                    quantity: 0,
                                    unit: '',
                                    unitRate: 0
                                  });
                                  setNewComponentOutputInput('');
                                  setNewComponentUnitRateInput('');
                                }}
                                className="w-full rounded bg-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="labour">Labour</option>
                                <option value="plant">Plant & Equipment</option>
                                <option value="material">Material</option>
                                <option value="overhead">Overhead</option>
                              </select>
                            </div>
                            
                            {/* Library Selector for Labour/Plant/Material */}
                            {newComponent.type === 'labour' && (
                              <div>
                                <label className="text-xs text-gray-400 mb-1 block">Select Labour</label>
                                <select
                                  value={newComponent.componentId}
                                  onChange={(e) => selectLibraryItem('labour', e.target.value)}
                                  className="w-full rounded bg-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="">-- Select labour --</option>
                                  {csvLabourRates.map(labour => (
                                    <option key={labour.id} value={labour.id}>
                                      {labour.trade} - £{labour.hourlyRate}/hr
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                            
                            {newComponent.type === 'plant' && (
                              <div>
                                <label className="text-xs text-gray-400 mb-1 block">Select Plant</label>
                                <select
                                  value={newComponent.componentId}
                                  onChange={(e) => selectLibraryItem('plant', e.target.value)}
                                  className="w-full rounded bg-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="">-- Select plant --</option>
                                  {csvPlantRates.map(plant => (
                                    <option key={plant.id} value={plant.id}>
                                      {plant.name} - £{plant.rate}/{plant.unit}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                            
                            {newComponent.type === 'materials' && (
                              <div>
                                <label className="text-xs text-gray-400 mb-1 block">Select Material</label>
                                <select
                                  value={newComponent.componentId}
                                  onChange={(e) => selectLibraryItem('materials', e.target.value)}
                                  className="w-full rounded bg-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="">-- Select material --</option>
                                  {csvMaterialRates.map(material => (
                                    <option key={material.id} value={material.id}>
                                      {material.description} - £{(material.rate * material.wasteFactor).toFixed(2)}/{material.unit}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                            
                          </div>

                          <div className="grid grid-cols-4 gap-3">
                            <div>
                              <label className="text-xs text-gray-400 mb-1 block">Description</label>
                              <input
                                type="text"
                                value={newComponent.description}
                                onChange={(e) => setNewComponent({...newComponent, description: e.target.value})}
                                className="w-full rounded bg-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Auto-filled"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-400 mb-1 block">
                                {newComponent.type === 'materials'
                                  ? `Quantity per ${selectedRateItem.unit}`
                                  : `Output per shift (${selectedRateItem.unit}/shift)`}
                              </label>
                              <input
                                type="number"
                                step="any"
                                value={newComponentOutputInput}
                                onChange={(e) => {
                                  const rawValue = e.target.value;
                                  const outputPerUnit = parseFloat(rawValue);
                                  const boqQuantity = selectedRateItem?.quantity ?? 0;
                                  setNewComponentOutputInput(rawValue);
                                  setNewComponent({
                                    ...newComponent,
                                    outputPerUnit: Number.isNaN(outputPerUnit) ? 0 : outputPerUnit,
                                    quantity: outputPerUnit > 0 && boqQuantity > 0
                                      ? (newComponent.type === 'materials'
                                        ? outputPerUnit * boqQuantity
                                        : boqQuantity / outputPerUnit)
                                      : newComponent.quantity
                                  });
                                }}
                                className="w-full rounded bg-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="0"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-400 mb-1 block">
                                {newComponent.type === 'materials' ? 'Total Quantity' : 'Shifts Required'}
                              </label>
                              <input
                                type="number"
                                step="any"
                                value={selectedRateItem && (newComponent.outputPerUnit ?? 0) > 0
                                  ? (newComponent.type === 'materials'
                                    ? (newComponent.outputPerUnit ?? 0) * selectedRateItem.quantity
                                    : selectedRateItem.quantity / (newComponent.outputPerUnit ?? 1))
                                  : 0}
                                readOnly
                                className="w-full rounded bg-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="0"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-400 mb-1 block">Unit</label>
                              <input
                                type="text"
                                value={newComponent.unit}
                                onChange={(e) => setNewComponent({...newComponent, unit: e.target.value})}
                                className="w-full rounded bg-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Auto-filled"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-xs text-gray-400 mb-1 block">Unit Rate (£)</label>
                            <input
                              type="number"
                              step="any"
                              value={newComponentUnitRateInput}
                              onChange={(e) => {
                                const rawValue = e.target.value;
                                const parsed = parseFloat(rawValue);
                                setNewComponentUnitRateInput(rawValue);
                                setNewComponent({
                                  ...newComponent,
                                  unitRate: Number.isNaN(parsed) ? 0 : parsed
                                });
                              }}
                              className="w-full rounded bg-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Auto-filled"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={addNewComponent}
                            className="flex-1 rounded bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 transition-colors"
                          >
                            Add Component
                          </button>
                          <button
                            onClick={() => setShowAddComponent(false)}
                            className="rounded bg-gray-700 px-4 py-2 text-sm text-white hover:bg-gray-600 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Total Summary */}
                    <div className="mt-4 pt-4 border-t border-gray-700">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-400">Total Component Cost:</span>
                        <span className="font-semibold text-white">
                          £{editingComponents.reduce((sum, c) => sum + c.cost, 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Calculated Rate per {selectedRateItem.unit}:</span>
                        <span className="font-bold text-green-400">
                          £{(selectedRateItem.quantity > 0 ? editingComponents.reduce((sum, c) => sum + c.cost, 0) / selectedRateItem.quantity : 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-700 flex justify-end gap-2">
                    <button
                      onClick={() => setShowRateBreakdown(false)}
                      className="rounded bg-gray-700 px-4 py-2 text-white hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveRateBreakdown}
                      className="rounded bg-blue-500 px-4 py-2 font-semibold text-white hover:bg-blue-600 transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Assign Estimator Modal */}
      {showAssignModal && assignJobId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-lg border border-gray-700 bg-gray-900 p-6 shadow-lg max-w-md w-full mx-4">
            <h2 className="text-lg font-bold text-white mb-4">Assign Estimator</h2>
            
            {/* Get the job being assigned */}
            {(() => {
              const job = jobs.find(j => j.id === assignJobId);
              return (
                <div className="mb-4">
                  <p className="text-sm text-gray-400">
                    <span className="font-semibold text-white">{job?.client}</span> - {job?.projectName}
                  </p>
                </div>
              );
            })()}

            {/* Estimator buttons grid */}
            <div className="grid grid-cols-1 gap-2 mb-4">
              {ESTIMATORS.map((estimator) => (
                <button
                  key={estimator}
                  onClick={() => handleAssignEstimator(assignJobId, estimator)}
                  className="rounded bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
                >
                  {estimator}
                </button>
              ))}
            </div>

            {/* Cancel button */}
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setAssignJobId(null);
                }}
                className="rounded bg-gray-700 px-4 py-2 text-sm text-white hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mark as Won Modal */}
      {showWonModal && selectedJobForOutcome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-lg border border-gray-700 bg-gray-900 p-6 shadow-lg max-w-lg w-full mx-4">
            <h2 className="text-xl font-bold text-white mb-4">🎉 Mark as Won</h2>
            
            <div className="mb-4 p-3 rounded-lg border border-gray-700 bg-gray-800">
              <p className="text-sm text-gray-400 mb-1">Project</p>
              <p className="font-semibold text-white">{selectedJobForOutcome.projectName}</p>
              <p className="text-sm text-gray-400">{selectedJobForOutcome.client} • {selectedJobForOutcome.value}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Why did we win this project?
              </label>
              <textarea
                value={winReason}
                onChange={(e) => setWinReason(e.target.value)}
                rows={3}
                placeholder="e.g., Competitive pricing, strong relationship, unique solution..."
                className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 mb-4">
              <div className="flex items-start gap-2">
                <svg className="h-5 w-5 text-green-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-green-300">
                  This will update the project status in the Client tracking system and log the win.
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowWonModal(false);
                  setSelectedJobForOutcome(null);
                  setWinReason('');
                }}
                className="rounded bg-gray-700 px-4 py-2 text-sm text-white hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleMarkWon(selectedJobForOutcome.id, winReason || undefined);
                  setShowWonModal(false);
                  setSelectedJobForOutcome(null);
                  setWinReason('');
                }}
                className="rounded bg-green-500 px-4 py-2 text-sm font-semibold text-white hover:bg-green-600 transition-colors"
              >
                Confirm Win
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mark as Lost Modal */}
      {showLostModal && selectedJobForOutcome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-lg border border-gray-700 bg-gray-900 p-6 shadow-lg max-w-lg w-full mx-4">
            <h2 className="text-xl font-bold text-white mb-4">❌ Mark as Lost</h2>
            
            <div className="mb-4 p-3 rounded-lg border border-gray-700 bg-gray-800">
              <p className="text-sm text-gray-400 mb-1">Project</p>
              <p className="font-semibold text-white">{selectedJobForOutcome.projectName}</p>
              <p className="text-sm text-gray-400">{selectedJobForOutcome.client} • {selectedJobForOutcome.value}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Why did we lose this project? *
              </label>
              <textarea
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value)}
                rows={3}
                placeholder="e.g., Price too high, timeline issues, technical requirements..."
                className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Lost to Competitor (if known)
              </label>
              <input
                type="text"
                value={lostToCompetitor}
                onChange={(e) => setLostToCompetitor(e.target.value)}
                placeholder="Competitor name"
                className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 mb-4">
              <div className="flex items-start gap-2">
                <svg className="h-5 w-5 text-red-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-red-300">
                  This will update the project status in the Client tracking system and log the loss.
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowLostModal(false);
                  setSelectedJobForOutcome(null);
                  setLostReason('');
                  setLostToCompetitor('');
                }}
                className="rounded bg-gray-700 px-4 py-2 text-sm text-white hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!lostReason.trim()) {
                    alert('Please provide a reason for losing the project');
                    return;
                  }
                  handleMarkLost(
                    selectedJobForOutcome.id,
                    lostReason,
                    lostToCompetitor || undefined
                  );
                  setShowLostModal(false);
                  setSelectedJobForOutcome(null);
                  setLostReason('');
                  setLostToCompetitor('');
                }}
                className="rounded bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 transition-colors disabled:opacity-50"
                disabled={!lostReason.trim()}
              >
                Confirm Loss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
