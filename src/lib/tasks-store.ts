export type TaskItem = {
  id: string;
  title: string;
  description: string;
  project: string;
  assignee: string;
  priority: "Low" | "Medium" | "High" | "Urgent";
  dueDate: string;
  status: "backlog" | "in-progress" | "done";
  tags: string[];
  source?: "manual" | "email";
  sourceMessageId?: string;
  sourceRecordType?: string;
  sourceRecordId?: string;
};

const STORAGE_KEY = "kbm_tasks_v1";

export const defaultTaskSeed: TaskItem[] = [
  { id: "TSK-001", title: "Site Survey - North District", description: "Complete initial site survey and soil testing", project: "North District Complex", assignee: "James Mitchell", priority: "High", dueDate: "2026-02-20", status: "backlog", tags: ["Survey", "Site Prep"], source: "manual" },
  { id: "TSK-002", title: "Health & Safety Plan", description: "Develop comprehensive H&S plan for Shopping District", project: "Shopping District", assignee: "Sarah Chen", priority: "High", dueDate: "2026-02-22", status: "backlog", tags: ["H&S", "Planning"], source: "manual" },
  { id: "TSK-003", title: "Material Quote - Thames", description: "Request quotes for structural materials", project: "Thames Retail Park", assignee: "Tom Wilson", priority: "Medium", dueDate: "2026-02-25", status: "backlog", tags: ["Procurement", "Materials"], source: "manual" },
  { id: "TSK-004", title: "Subcontractor Meeting", description: "Coordinate M&E subcontractors for Premier project", project: "Premier Mixed Use", assignee: "Emma Davis", priority: "Medium", dueDate: "2026-02-28", status: "backlog", tags: ["Coordination", "Subcontractors"], source: "manual" },
  { id: "TSK-005", title: "Traffic Management Plan", description: "Submit TMP to local council", project: "Central Warehouse", assignee: "David Brown", priority: "Low", dueDate: "2026-03-01", status: "backlog", tags: ["Planning", "Logistics"], source: "manual" },
  { id: "TSK-013", title: "Foundation Works Inspection", description: "Inspect foundation works at Thames Retail Park", project: "Thames Retail Park", assignee: "James Mitchell", priority: "Urgent", dueDate: "2026-02-16", status: "in-progress", tags: ["Inspection", "Quality"], source: "manual" },
  { id: "TSK-014", title: "Concrete Pour Schedule", description: "Coordinate concrete pours for Central Warehouse", project: "Central Warehouse", assignee: "Tom Wilson", priority: "High", dueDate: "2026-02-17", status: "in-progress", tags: ["Scheduling", "Materials"], source: "manual" },
  { id: "TSK-020", title: "Method Statement Approval", description: "Approve method statement for steelwork erection", project: "Office Complex Tower B", assignee: "James Mitchell", priority: "High", dueDate: "2026-02-14", status: "done", tags: ["Method Statement", "Approval"], source: "manual" },
  { id: "TSK-021", title: "Supplier Payment Run", description: "Process weekly supplier payments", project: "General", assignee: "Karen White", priority: "Medium", dueDate: "2026-02-13", status: "done", tags: ["Finance", "Payments"], source: "manual" }
];

function safeParse(value: string | null): TaskItem[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as TaskItem[]) : [];
  } catch {
    return [];
  }
}

export function getTasksFromStorage(): TaskItem[] {
  if (typeof window === "undefined") return defaultTaskSeed;
  const current = safeParse(window.localStorage.getItem(STORAGE_KEY));
  if (current.length > 0) return current;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultTaskSeed));
  return defaultTaskSeed;
}

export function saveTasksToStorage(tasks: TaskItem[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

export function createTaskFromEmail(input: Omit<TaskItem, "id" | "status"> & { status?: TaskItem["status"] }): TaskItem {
  const tasks = getTasksFromStorage();
  const task: TaskItem = {
    ...input,
    id: `TSK-${String(tasks.length + 1).padStart(3, "0")}`,
    status: input.status || "backlog",
    source: input.source || "email",
  };
  const next = [task, ...tasks];
  saveTasksToStorage(next);
  return task;
}
