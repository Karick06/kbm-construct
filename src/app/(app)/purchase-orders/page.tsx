"use client";

import { useState, useEffect } from "react";

type RequisitionStatus = "draft" | "pending" | "approved" | "rejected" | "ordered";
type OrderStatus = "draft" | "pending_approval" | "approved" | "sent" | "acknowledged" | "partial" | "delivered" | "cancelled" | "rejected";

interface ApprovalLimit {
  level: string;
  maxAmount: number;
  approver: string;
}

const APPROVAL_LIMITS: ApprovalLimit[] = [
  { level: "Project Manager", maxAmount: 5000, approver: "Project Manager" },
  { level: "Commercial Manager", maxAmount: 25000, approver: "Commercial Manager" },
  { level: "Director", maxAmount: 100000, approver: "Director" },
  { level: "Board", maxAmount: Infinity, approver: "Board" },
];

interface Requisition {
  id: string;
  date: string;
  requestedBy: string;
  projectId: string;
  projectName: string;
  items: RequisitionItem[];
  status: RequisitionStatus;
  approver?: string;
  notes?: string;
}

interface RequisitionItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  category: string;
}

interface PurchaseOrder {
  id: string;
  requisitionId?: string;
  date: string;
  supplier: string;
  projectId: string;
  projectName: string;
  items: POItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: OrderStatus;
  approvalLevel?: string;
  approvedBy?: string;
  deliveryDate?: string;
  deliveryAddress: string;
  notes?: string;
}

interface POItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

interface Notification {
  id: string;
  type: "po_approval";
  poId: string;
  poNumber: string;
  amount: number;
  approver: string;
  approvalLevel: string;
  projectName: string;
  supplier: string;
  date: string;
  read: boolean;
}

interface Supplier {
  name: string;
  contact: string;
  rating: string;
  leadTime: string;
}

interface Project {
  id: string;
  name: string;
  client?: string;
  status?: string;
}

const SAMPLE_SUPPLIERS: Supplier[] = [
  { name: "BuildTech Supplies", contact: "01234 567890", rating: "4.8/5", leadTime: "2-3 days" },
  { name: "Steel & Metal Co", contact: "01234 567891", rating: "4.6/5", leadTime: "5-7 days" },
  { name: "Cement Direct", contact: "01234 567892", rating: "4.9/5", leadTime: "1-2 days" },
  { name: "Marco Equipment", contact: "01234 567893", rating: "4.7/5", leadTime: "3-5 days" },
];

export default function PurchaseOrdersPage() {
  const [activeTab, setActiveTab] = useState<"requisitions" | "orders">("requisitions");
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showReqModal, setShowReqModal] = useState(false);
  const [showPOModal, setShowPOModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedReq, setSelectedReq] = useState<Requisition | null>(null);
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>("all");
  const [isClient, setIsClient] = useState(false);

  // Load data from localStorage
  useEffect(() => {
    setIsClient(true);
    const storedReqs = localStorage.getItem("procurement_requisitions");
    const storedOrders = localStorage.getItem("procurement_orders");
    const storedNotifications = localStorage.getItem("procurement_notifications");
    if (storedReqs) setRequisitions(JSON.parse(storedReqs));
    if (storedOrders) setOrders(JSON.parse(storedOrders));
    if (storedNotifications) setNotifications(JSON.parse(storedNotifications));
    
    // Load projects - combine all project statuses into one list
    const projectsByStatus = {
      mobilizing: [
        { id: "PRJ-2024-051", name: "Commercial Office Refurbishment", client: "Greenwich Properties" },
        { id: "PRJ-2024-052", name: "Residential Housing Development", client: "Fortis Developments" },
      ],
      planned: [
        { id: "PRJ-2606", name: "North District Complex", client: "Bellway" },
        { id: "PRJ-2607", name: "Shopping District", client: "Hammerson" },
      ],
      active: [
        { id: "PRJ-2501", name: "Thames Retail Park", client: "Westfield" },
        { id: "PRJ-2502", name: "Premier Mixed Use", client: "Berkeley Group" },
        { id: "PRJ-2503", name: "Central Warehouse", client: "DHL" },
        { id: "PRJ-2504", name: "Tech Campus Phase 1", client: "Google" },
      ],
      review: [
        { id: "PRJ-2505", name: "Riverside Park", client: "Barratt" },
        { id: "PRJ-2506", name: "Office Complex Tower B", client: "Canary Wharf" },
      ],
    };
    
    const allProjects: Project[] = [
      ...projectsByStatus.mobilizing.map(p => ({ ...p, status: "mobilizing" })),
      ...projectsByStatus.planned.map(p => ({ ...p, status: "planned" })),
      ...projectsByStatus.active.map(p => ({ ...p, status: "active" })),
      ...projectsByStatus.review.map(p => ({ ...p, status: "review" })),
    ];
    
    setProjects(allProjects);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (isClient) {
      localStorage.setItem("procurement_requisitions", JSON.stringify(requisitions));
    }
  }, [requisitions, isClient]);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem("procurement_orders", JSON.stringify(orders));
    }
  }, [orders, isClient]);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem("procurement_notifications", JSON.stringify(notifications));
    }
  }, [notifications, isClient]);

  const handleCreateRequisition = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const items: RequisitionItem[] = [];
    const itemCount = Math.floor((Array.from(formData.keys()).filter(k => k.startsWith("item_desc_")).length));
    
    for (let i = 0; i < itemCount; i++) {
      const desc = formData.get(`item_desc_${i}`) as string;
      const qty = parseFloat(formData.get(`item_qty_${i}`) as string);
      const unit = formData.get(`item_unit_${i}`) as string;
      const category = formData.get(`item_category_${i}`) as string;
      
      if (desc && qty && unit && category) {
        items.push({
          id: `item-${Date.now()}-${i}`,
          description: desc,
          quantity: qty,
          unit,
          category,
        });
      }
    }
    const projectId = formData.get("projectId") as string;
    const project = projects.find(p => p.id === projectId);
    
    const newReq: Requisition = {
      id: `REQ-${1000 + requisitions.length + 1}`,
      date: new Date().toISOString().split("T")[0],
      requestedBy: formData.get("requestedBy") as string,
      projectId,
      projectName: project?.name || "",
      items,
      status: "draft",
      notes: formData.get("notes") as string,
    };

    setRequisitions([newReq, ...requisitions]);
    setShowReqModal(false);
  };

  const handleApproveReq = (reqId: string) => {
    setRequisitions(requisitions.map(req =>
      req.id === reqId ? { ...req, status: "approved" as RequisitionStatus, approver: "John Smith" } : req
    ));
  };

  const handleRejectReq = (reqId: string) => {
    setRequisitions(requisitions.map(req =>
      req.id === reqId ? { ...req, status: "rejected" as RequisitionStatus, approver: "John Smith" } : req
    ));
  };

  const handleConvertToPO = (req: Requisition) => {
    setSelectedReq(req);
    setShowPOModal(true);
  };

  const handleCreatePO = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const items: POItem[] = selectedReq ? selectedReq.items.map((item, i) => {
      const unitPrice = parseFloat(formData.get(`item_price_${i}`) as string) || 0;
      return {
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice,
        total: item.quantity * unitPrice,
      };
    }) : [];

    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.2; // 20% VAT
    const total = subtotal + tax;

    const projectId = selectedReq?.projectId || (formData.get("projectId") as string);
    const project = projects.find(p => p.id === projectId);
    
    const approvalLevel = getApprovalLevel(total);
    const requiredApprover = getRequiredApprover(total);
    
    const newPO: PurchaseOrder = {
      id: `PO-${3000 + orders.length + 1}`,
      requisitionId: selectedReq?.id,
      date: new Date().toISOString().split("T")[0],
      supplier: formData.get("supplier") as string,
      projectId,
      projectName: project?.name || "",
      items,
      subtotal,
      tax,
      total,
      status: total <= 5000 ? "approved" : "pending_approval",
      approvalLevel,
      approvedBy: total <= 5000 ? "Auto-approved" : undefined,
      deliveryDate: formData.get("deliveryDate") as string,
      deliveryAddress: formData.get("deliveryAddress") as string,
      notes: formData.get("notes") as string,
    };

    setOrders([newPO, ...orders]);
    
    // Create notification if approval required
    if (newPO.status === "pending_approval") {
      const notification: Notification = {
        id: `notif-${Date.now()}`,
        type: "po_approval",
        poId: newPO.id,
        poNumber: newPO.id,
        amount: newPO.total,
        approver: requiredApprover,
        approvalLevel,
        projectName: newPO.projectName,
        supplier: newPO.supplier,
        date: new Date().toISOString(),
        read: false,
      };
      setNotifications([notification, ...notifications]);
      
      // Show confirmation message
      console.log(`✅ Notification sent to ${requiredApprover} for PO ${newPO.id}`);
    }
    
    if (selectedReq) {
      setRequisitions(requisitions.map(req =>
        req.id === selectedReq.id ? { ...req, status: "ordered" as RequisitionStatus } : req
      ));
    }
    
    setShowPOModal(false);
    setSelectedReq(null);
    setActiveTab("orders");
  };

  const handleSendPO = (poId: string) => {
    setOrders(orders.map(po =>
      po.id === poId ? { ...po, status: "sent" as OrderStatus } : po
    ));
  };

  const handleApprovePO = (poId: string, approver: string) => {
    setOrders(orders.map(po =>
      po.id === poId ? { ...po, status: "approved" as OrderStatus, approvedBy: approver } : po
    ));
    
    // Mark notification as read
    setNotifications(notifications.map(notif =>
      notif.poId === poId ? { ...notif, read: true } : notif
    ));
  };

  const handleRejectPO = (poId: string) => {
    setOrders(orders.map(po =>
      po.id === poId ? { ...po, status: "rejected" as OrderStatus } : po
    ));
    
    // Mark notification as read
    setNotifications(notifications.map(notif =>
      notif.poId === poId ? { ...notif, read: true } : notif
    ));
  };

  const getStatusColor = (status: RequisitionStatus | OrderStatus) => {
    const colors: Record<string, string> = {
      draft: "bg-gray-600 text-gray-200",
      pending: "bg-yellow-600 text-yellow-100",
      pending_approval: "bg-yellow-600 text-yellow-100",
      approved: "bg-green-600 text-green-100",
      rejected: "bg-red-600 text-red-100",
      ordered: "bg-blue-600 text-blue-100",
      sent: "bg-blue-600 text-blue-100",
      acknowledged: "bg-indigo-600 text-indigo-100",
      partial: "bg-orange-600 text-orange-100",
      delivered: "bg-green-600 text-green-100",
      cancelled: "bg-red-600 text-red-100",
    };
    return colors[status] || "bg-gray-600 text-gray-200";
  };

  const getRequiredApprover = (amount: number): string => {
    for (const limit of APPROVAL_LIMITS) {
      if (amount <= limit.maxAmount) {
        return limit.approver;
      }
    }
    return APPROVAL_LIMITS[APPROVAL_LIMITS.length - 1].approver;
  };

  const getApprovalLevel = (amount: number): string => {
    for (const limit of APPROVAL_LIMITS) {
      if (amount <= limit.maxAmount) {
        return limit.level;
      }
    }
    return APPROVAL_LIMITS[APPROVAL_LIMITS.length - 1].level;
  };

  if (!isClient) return null;

  // Filter requisitions and orders by project
  const filteredRequisitions = selectedProjectFilter === "all" 
    ? requisitions 
    : requisitions.filter(req => req.projectId === selectedProjectFilter);
  
  const filteredOrders = selectedProjectFilter === "all"
    ? orders
    : orders.filter(order => order.projectId === selectedProjectFilter);

  const pendingApprovalsCount = filteredOrders.filter(po => po.status === "pending_approval").length;
  const unreadNotifications = notifications.filter(n => !n.read);
  const unreadCount = unreadNotifications.length;

  const handleNotificationClick = (notification: Notification) => {
    setActiveTab("orders");
    setShowNotifications(false);
    // Mark as read
    setNotifications(notifications.map(n =>
      n.id === notification.id ? { ...n, read: true } : n
    ));
    // Scroll to PO (in a real app, you'd scroll to the element)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Procurement Buying System</h1>
          <p className="mt-1 text-sm text-gray-400">Manage requisitions and purchase orders</p>
        </div>
        <div className="flex gap-3">
          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white hover:bg-gray-600"
            >
              <span className="text-xl">🔔</span>
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>
            
            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 top-12 z-50 w-96 rounded-lg border border-gray-700 bg-gray-800 shadow-xl">
                <div className="border-b border-gray-700 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-white">Approval Notifications</h3>
                    <span className="text-xs text-gray-400">{unreadCount} unread</span>
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                      <p className="text-3xl mb-2">🔕</p>
                      <p className="text-sm">No notifications</p>
                    </div>
                  ) : (
                    notifications.slice(0, 10).map((notif) => (
                      <button
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`w-full border-b border-gray-700 p-4 text-left transition-colors hover:bg-gray-700/50 ${
                          !notif.read ? "bg-blue-900/20" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-white">
                              PO {notif.poNumber} Requires Approval
                            </p>
                            <p className="mt-1 text-xs text-gray-400">
                              {notif.projectName} • {notif.supplier}
                            </p>
                            <div className="mt-2 flex items-center gap-4 text-xs">
                              <span className="font-semibold text-orange-400">
                                £{notif.amount.toLocaleString()}
                              </span>
                              <span className="rounded bg-yellow-900/30 px-2 py-0.5 text-yellow-400">
                                {notif.approvalLevel}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                              {new Date(notif.date).toLocaleDateString()} at{" "}
                              {new Date(notif.date).toLocaleTimeString()}
                            </p>
                          </div>
                          {!notif.read && (
                            <div className="h-2 w-2 rounded-full bg-blue-500" />
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="border-t border-gray-700 p-2">
                    <button
                      onClick={() => {
                        setNotifications(notifications.map(n => ({ ...n, read: true })));
                      }}
                      className="w-full rounded py-2 text-xs text-gray-400 hover:bg-gray-700/50 hover:text-white"
                    >
                      Mark all as read
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <select
            value={selectedProjectFilter}
            onChange={(e) => setSelectedProjectFilter(e.target.value)}
            className="rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white"
          >
            <option value="all">All Projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.id} - {project.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => activeTab === "requisitions" ? setShowReqModal(true) : setShowPOModal(true)}
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
          >
            + {activeTab === "requisitions" ? "New Requisition" : "New Purchase Order"}
          </button>
        </div>
      </div>

      {/* Approval Limits Info */}
      <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-white">PO Approval Limits</h3>
            <div className="mt-2 flex flex-wrap gap-4">
              {APPROVAL_LIMITS.map((limit, index) => {
                const pendingForApprover = filteredOrders.filter(
                  po => po.status === "pending_approval" && getRequiredApprover(po.total) === limit.approver
                ).length;
                
                return (
                  <div key={limit.level} className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">
                      {index === 0 ? "Up to" : index === APPROVAL_LIMITS.length - 1 ? "Over" : "Up to"} £{limit.maxAmount === Infinity ? "100k" : (limit.maxAmount / 1000).toFixed(0) + "k"}:
                    </span>
                    <span className="rounded-full bg-orange-500/20 px-2 py-1 text-xs font-semibold text-orange-400 flex items-center gap-1">
                      {limit.approver}
                      {pendingForApprover > 0 && (
                        <span className="rounded-full bg-yellow-500 px-1.5 py-0.5 text-xs font-bold text-black">
                          {pendingForApprover}
                        </span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Auto-Approved</p>
            <p className="text-xl font-bold text-green-400">≤ £5k</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-700">
        <button
          onClick={() => setActiveTab("requisitions")}
          className={`px-4 py-2 text-sm font-semibold transition-colors ${
            activeTab === "requisitions"
              ? "border-b-2 border-orange-500 text-orange-500"
              : "text-gray-400 hover:text-gray-300"
          }`}
        >
          Purchase Requisitions ({filteredRequisitions.length})
        </button>
        <button
          onClick={() => setActiveTab("orders")}
          className={`px-4 py-2 text-sm font-semibold transition-colors ${
            activeTab === "orders"
              ? "border-b-2 border-orange-500 text-orange-500"
              : "text-gray-400 hover:text-gray-300"
          }`}
        >
          <span className="flex items-center gap-2">
            Purchase Orders ({filteredOrders.length})
            {pendingApprovalsCount > 0 && (
              <span className="rounded-full bg-yellow-600 px-2 py-0.5 text-xs font-bold text-white">
                {pendingApprovalsCount} Pending
              </span>
            )}
          </span>
        </button>
      </div>

      {/* Requisitions Tab */}
      {activeTab === "requisitions" && (
        <div className="space-y-4">
          {filteredRequisitions.length === 0 ? (
            <div className="rounded-lg border border-gray-700 bg-gray-800 p-12 text-center">
              <p className="text-5xl mb-4">📝</p>
              <p className="text-gray-400">No purchase requisitions yet</p>
              <button
                onClick={() => setShowReqModal(true)}
                className="mt-4 text-sm text-orange-500 hover:text-orange-400"
              >
                Create your first requisition →
              </button>
            </div>
          ) : (
            filteredRequisitions.map((req) => (
              <div key={req.id} className="rounded-lg border border-gray-700 bg-gray-800 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-white">{req.id}</h3>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(req.status)}`}>
                        {req.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                      <div>
                        <p className="text-gray-400">Date</p>
                        <p className="font-medium text-white">{req.date}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Requested By</p>
                        <p className="font-medium text-white">{req.requestedBy}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Project</p>
                        <p className="font-medium text-white">{req.projectId}</p>
                        <p className="text-xs text-gray-500">{req.projectName}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Items</p>
                        <p className="font-bold text-white">{req.items.length}</p>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <p className="text-xs font-semibold uppercase text-gray-400">Items ({req.items.length})</p>
                      <div className="mt-2 space-y-2">
                        {req.items.map((item) => (
                          <div key={item.id} className="flex justify-between rounded bg-gray-700/50 px-3 py-2 text-sm">
                            <span className="text-gray-300">
                              {item.quantity} {item.unit} - {item.description}
                            </span>
                            <span className="text-xs text-gray-400">
                              {item.category}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {req.notes && (
                      <div className="mt-3 rounded bg-gray-700/30 p-3">
                        <p className="text-xs font-semibold uppercase text-gray-400">Notes</p>
                        <p className="mt-1 text-sm text-gray-300">{req.notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="ml-4 flex flex-col gap-2">
                    {req.status === "draft" && (
                      <button
                        onClick={() => handleApproveReq(req.id)}
                        className="rounded bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700"
                      >
                        Approve
                      </button>
                    )}
                    {req.status === "draft" && (
                      <button
                        onClick={() => handleRejectReq(req.id)}
                        className="rounded bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700"
                      >
                        Reject
                      </button>
                    )}
                    {req.status === "approved" && (
                      <button
                        onClick={() => handleConvertToPO(req)}
                        className="rounded bg-orange-500 px-3 py-1 text-xs font-semibold text-white hover:bg-orange-600"
                      >
                        Create PO
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Purchase Orders Tab */}
      {activeTab === "orders" && (
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="rounded-lg border border-gray-700 bg-gray-800 p-12 text-center">
              <p className="text-5xl mb-4">📦</p>
              <p className="text-gray-400">No purchase orders yet</p>
              <button
                onClick={() => setShowPOModal(true)}
                className="mt-4 text-sm text-orange-500 hover:text-orange-400"
              >
                Create your first purchase order →
              </button>
            </div>
          ) : (
            filteredOrders.map((po) => (
              <div key={po.id} className="rounded-lg border border-gray-700 bg-gray-800 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-white">{po.id}</h3>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(po.status)}`}>
                        {po.status.replace(/_/g, " ").toUpperCase()}
                      </span>
                      {po.requisitionId && (
                        <span className="text-xs text-gray-400">← {po.requisitionId}</span>
                      )}
                    </div>
                    
                    <div className="mt-2 grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                      <div>
                        <p className="text-gray-400">Date</p>
                        <p className="font-medium text-white">{po.date}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Supplier</p>
                        <p className="font-medium text-white">{po.supplier}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Project</p>
                        <p className="font-medium text-white">{po.projectId}</p>
                        <p className="text-xs text-gray-500">{po.projectName}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Total</p>
                        <p className="font-bold text-white">£{po.total.toLocaleString()}</p>
                      </div>
                    </div>

                    {po.status === "pending_approval" && (
                      <div className="mt-3 rounded bg-yellow-900/20 border border-yellow-700/50 p-3">
                        <p className="text-sm font-semibold text-yellow-400">
                          ⚠️ Pending Approval: {po.approvalLevel}
                        </p>
                        <p className="text-xs text-gray-400">
                          Requires approval from {getRequiredApprover(po.total)}
                        </p>
                      </div>
                    )}

                    {po.approvedBy && (
                      <div className="mt-3 rounded bg-green-900/20 border border-green-700/50 p-3">
                        <p className="text-sm font-semibold text-green-400">
                          ✓ Approved by: {po.approvedBy}
                        </p>
                        <p className="text-xs text-gray-400">
                          Approval Level: {po.approvalLevel}
                        </p>
                      </div>
                    )}

                    <div className="mt-4">
                      <p className="text-xs font-semibold uppercase text-gray-400">Items ({po.items.length})</p>
                      <div className="mt-2 space-y-2">
                        {po.items.map((item) => (
                          <div key={item.id} className="flex justify-between rounded bg-gray-700/50 px-3 py-2 text-sm">
                            <span className="text-gray-300">
                              {item.quantity} {item.unit} - {item.description} @ £{item.unitPrice}/{item.unit}
                            </span>
                            <span className="font-semibold text-white">£{item.total.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-3 flex justify-end gap-8 border-t border-gray-700 pt-3 text-sm">
                      <div>
                        <span className="text-gray-400">Subtotal: </span>
                        <span className="font-semibold text-white">£{po.subtotal.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">VAT (20%): </span>
                        <span className="font-semibold text-white">£{po.tax.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Total: </span>
                        <span className="font-bold text-white">£{po.total.toLocaleString()}</span>
                      </div>
                    </div>

                    {po.deliveryDate && (
                      <div className="mt-3 rounded bg-blue-900/20 p-3 text-sm">
                        <p className="text-blue-400">
                          📅 Delivery Date: <span className="font-semibold">{po.deliveryDate}</span>
                        </p>
                        <p className="text-gray-300">📍 {po.deliveryAddress}</p>
                      </div>
                    )}
                  </div>

                  <div className="ml-4 flex flex-col gap-2">
                    {po.status === "pending_approval" && (
                      <>
                        <button
                          onClick={() => handleApprovePO(po.id, getRequiredApprover(po.total))}
                          className="rounded bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectPO(po.id)}
                          className="rounded bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {(po.status === "approved" || po.status === "draft") && (
                      <button
                        onClick={() => handleSendPO(po.id)}
                        className="rounded bg-orange-500 px-3 py-1 text-xs font-semibold text-white hover:bg-orange-600"
                      >
                        Send to Supplier
                      </button>
                    )}
                    <button className="rounded bg-gray-600 px-3 py-1 text-xs font-semibold text-white hover:bg-gray-700">
                      Print PDF
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create Requisition Modal */}
      {showReqModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-gray-700 bg-gray-800 p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">New Purchase Requisition</h2>
              <button onClick={() => setShowReqModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            
            <form onSubmit={handleCreateRequisition} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-300">Requested By</label>
                  <input
                    type="text"
                    name="requestedBy"
                    required
                    className="mt-1 w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300">Project *</label>
                  <select
                    name="projectId"
                    required
                    className="mt-1 w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
                  >
                    <option value="">Select a project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.id} - {project.name} ({project.client})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-300">Items</label>
                  <button
                    type="button"
                    onClick={(e) => {
                      const container = e.currentTarget.parentElement?.nextElementSibling;
                      if (container) {
                        const itemCount = container.children.length;
                        const newItem = document.createElement("div");
                        newItem.className = "grid gap-2 rounded bg-gray-700/50 p-3 md:grid-cols-4";
                        newItem.innerHTML = `
                          <input type="text" name="item_desc_${itemCount}" placeholder="Description" required class="rounded border border-gray-600 bg-gray-700 px-2 py-1 text-sm text-white md:col-span-2" />
                          <input type="number" name="item_qty_${itemCount}" placeholder="Qty" required step="0.01" class="rounded border border-gray-600 bg-gray-700 px-2 py-1 text-sm text-white" />
                          <input type="text" name="item_unit_${itemCount}" placeholder="Unit" required class="rounded border border-gray-600 bg-gray-700 px-2 py-1 text-sm text-white" />
                          <select name="item_category_${itemCount}" required class="rounded border border-gray-600 bg-gray-700 px-2 py-1 text-sm text-white md:col-span-4">
                            <option value="">Select Category</option>
                            <option value="Materials">Materials</option>
                            <option value="Equipment">Equipment</option>
                            <option value="Labour">Labour</option>
                            <option value="Services">Services</option>
                            <option value="Other">Other</option>
                          </select>
                        `;
                        container.appendChild(newItem);
                      }
                    }}
                    className="text-sm text-orange-500 hover:text-orange-400"
                  >
                    + Add Item
                  </button>
                </div>
                
                <div id="items-container" className="space-y-2">
                  <div className="grid gap-2 rounded bg-gray-700/50 p-3 md:grid-cols-4">
                    <input type="text" name="item_desc_0" placeholder="Description" required className="rounded border border-gray-600 bg-gray-700 px-2 py-1 text-sm text-white md:col-span-2" />
                    <input type="number" name="item_qty_0" placeholder="Qty" required step="0.01" className="rounded border border-gray-600 bg-gray-700 px-2 py-1 text-sm text-white" />
                    <input type="text" name="item_unit_0" placeholder="Unit" required className="rounded border border-gray-600 bg-gray-700 px-2 py-1 text-sm text-white" />
                    <select name="item_category_0" required className="rounded border border-gray-600 bg-gray-700 px-2 py-1 text-sm text-white md:col-span-4">
                      <option value="">Select Category</option>
                      <option value="Materials">Materials</option>
                      <option value="Equipment">Equipment</option>
                      <option value="Labour">Labour</option>
                      <option value="Services">Services</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300">Notes (optional)</label>
                <textarea
                  name="notes"
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
                  placeholder="Any additional notes or requirements"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowReqModal(false)}
                  className="rounded-lg bg-gray-600 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
                >
                  Create Requisition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Purchase Order Modal */}
      {showPOModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-gray-700 bg-gray-800 p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                {selectedReq ? `Create PO from ${selectedReq.id}` : "New Purchase Order"}
              </h2>
              <button onClick={() => { setShowPOModal(false); setSelectedReq(null); }} className="text-gray-400 hover:text-white">✕</button>
            </div>
            
            <form onSubmit={handleCreatePO} className="space-y-4">
              {!selectedReq && (
                <div>
                  <label className="block text-sm font-medium text-gray-300">Project *</label>
                  <select
                    name="projectId"
                    required
                    className="mt-1 w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
                  >
                    <option value="">Select a project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.id} - {project.name} ({project.client})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300">Supplier</label>
                <select
                  name="supplier"
                  required
                  className="mt-1 w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
                >
                  <option value="">Select supplier</option>
                  {SAMPLE_SUPPLIERS.map((sup) => (
                    <option key={sup.name} value={sup.name}>
                      {sup.name} - {sup.rating} - {sup.leadTime}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-300">Delivery Date</label>
                  <input
                    type="date"
                    name="deliveryDate"
                    className="mt-1 w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300">Delivery Address</label>
                  <input
                    type="text"
                    name="deliveryAddress"
                    required
                    className="mt-1 w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
                    placeholder="Site address"
                  />
                </div>
              </div>

              {selectedReq && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">Items & Unit Prices</label>
                  {selectedReq.items.map((item, i) => (
                    <div key={item.id} className="grid gap-2 rounded bg-gray-700/50 p-3 md:grid-cols-3">
                      <div className="md:col-span-2">
                        <p className="text-sm text-white">{item.description}</p>
                        <p className="text-xs text-gray-400">
                          {item.quantity} {item.unit} - {item.category}
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400">Unit Price *</label>
                        <input
                          type="number"
                          name={`item_price_${i}`}
                          placeholder="0.00"
                          required
                          step="0.01"
                          className="mt-1 w-full rounded border border-gray-600 bg-gray-700 px-2 py-1 text-sm text-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300">Notes (optional)</label>
                <textarea
                  name="notes"
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
                  placeholder="Delivery instructions, payment terms, etc."
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setShowPOModal(false); setSelectedReq(null); }}
                  className="rounded-lg bg-gray-600 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
                >
                  Create Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
