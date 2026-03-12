"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const { user, hasPermission, getAllUsers, createUser, updateUserPermissions, deleteUser } = useAuth();
  const router = useRouter();
  const canManageUsers = hasPermission("user_management");
  const [users, setUsers] = useState<any[]>([]);
  const [isMigratingUsers, setIsMigratingUsers] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "Project Manager",
    permissions: [] as string[],
    lineManagerId: "",
    department: "",
    jobTitle: "",
  });

  // Available permissions
  const availablePermissions = [
    { id: "user_management", label: "User Management", description: "Create, edit, and delete users" },
    { id: "projects", label: "Projects", description: "View and manage projects" },
    { id: "estimates", label: "Estimates", description: "Create and view estimates" },
    { id: "boq", label: "BOQ Management", description: "Access BOQ tools and templates" },
    { id: "contracts", label: "Contracts", description: "View and manage contracts" },
    { id: "procurement", label: "Procurement", description: "Purchase orders and suppliers" },
    { id: "invoices", label: "Invoices", description: "View and create invoices" },
    { id: "payments", label: "Payments", description: "Process payments" },
    { id: "timesheets", label: "Timesheets", description: "View and approve timesheets" },
    { id: "staff", label: "Staff Management", description: "Manage team members" },
    { id: "leave", label: "Leave Management", description: "Approve leave requests" },
    { id: "payroll", label: "Payroll", description: "Access payroll information" },
    { id: "fleet", label: "Fleet Management", description: "Manage vehicles and equipment" },
    { id: "resources", label: "Resources", description: "Manage materials and plant" },
    { id: "documents", label: "Documents", description: "Access document library" },
    { id: "reports", label: "Reports", description: "View and generate reports" },
    { id: "clients", label: "Client Management", description: "Manage client information" },
    { id: "compliance", label: "Compliance", description: "Health & Safety compliance" },
    { id: "training", label: "Training", description: "Training records and certificates" },
  ];

  const togglePermission = (permissionId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(p => p !== permissionId)
        : [...prev.permissions, permissionId]
    }));
  };

  const selectAllPermissions = () => {
    setFormData(prev => ({
      ...prev,
      permissions: availablePermissions.map(p => p.id)
    }));
  };

  const clearAllPermissions = () => {
    setFormData(prev => ({
      ...prev,
      permissions: []
    }));
  };

  useEffect(() => {
    // Redirect users without user-management permission
    if (user && !canManageUsers) {
      router.push("/");
    }
    
    // Load users
    if (canManageUsers) {
      loadUsers();
    }
  }, [user, canManageUsers, router]);

  const loadUsers = () => {
    const allUsers = getAllUsers();
    setUsers(allUsers);
  };

  const handleAddUser = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      alert("Please fill in all fields");
      return;
    }

    const lineManager = users.find(u => u.id === formData.lineManagerId);
    const success = await createUser({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: formData.role,
      permissions: formData.permissions,
      lineManagerId: formData.lineManagerId || undefined,
      lineManagerName: lineManager?.name || undefined,
      department: formData.department || undefined,
      jobTitle: formData.jobTitle || undefined,
    });

    if (success) {
      setFormData({ name: "", email: "", password: "", role: "Project Manager", permissions: [], lineManagerId: "", department: "", jobTitle: "" });
      setShowAddModal(false);
      loadUsers();
      alert("User created successfully!");
    } else {
      alert("Failed to create user. Email may already exist.");
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;

    const lineManager = users.find(u => u.id === formData.lineManagerId);
    const success = await updateUserPermissions(selectedUser.id, {
      name: formData.name,
      email: formData.email,
      role: formData.role,
      permissions: formData.permissions,
      lineManagerId: formData.lineManagerId || undefined,
      lineManagerName: lineManager?.name || undefined,
      department: formData.department || undefined,
      jobTitle: formData.jobTitle || undefined,
    });

    if (success) {
      setShowEditModal(false);
      setSelectedUser(null);
      loadUsers();
      alert("User updated successfully!");
    } else {
      alert("Failed to update user.");
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    const success = await deleteUser(selectedUser.id);

    if (success) {
      setShowDeleteModal(false);
      setSelectedUser(null);
      loadUsers();
      alert("User deleted successfully!");
    } else {
      alert("Failed to delete user. You cannot delete your own account.");
    }
  };

  const openEditModal = (user: any) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      permissions: user.permissions || [],
      lineManagerId: user.lineManagerId || "",
      department: user.department || "",
      jobTitle: user.jobTitle || "",
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (user: any) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleMigrateLocalUsers = async () => {
    if (typeof window === "undefined") return;

    const confirmed = window.confirm(
      "This will import local browser users into the shared backend. Existing users with the same email will be updated. Continue?"
    );

    if (!confirmed) return;

    try {
      setIsMigratingUsers(true);

      const localUsersRaw = localStorage.getItem("kbm_all_users");
      const localPasswordsRaw = localStorage.getItem("user_passwords");

      const localUsers = localUsersRaw ? JSON.parse(localUsersRaw) : [];
      const localPasswords = localPasswordsRaw ? JSON.parse(localPasswordsRaw) : {};

      if (!Array.isArray(localUsers) || localUsers.length === 0) {
        alert("No local users found to migrate.");
        return;
      }

      const response = await fetch("/api/auth/users/migrate-local", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ users: localUsers, passwords: localPasswords }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Migration failed");
      }

      loadUsers();
      alert(
        `Migration complete. Created: ${result.created}, Updated: ${result.updated}, Skipped: ${result.skipped}`
      );
    } catch (error) {
      console.error("Failed to migrate users:", error);
      alert("Failed to migrate local users. Please try again.");
    } finally {
      setIsMigratingUsers(false);
    }
  };

  if (!user || !canManageUsers) {
    return null; // Will redirect
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-600 mt-1">Manage users, roles, and permissions</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleMigrateLocalUsers}
            disabled={isMigratingUsers}
            className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isMigratingUsers ? "Migrating..." : "Migrate Local Users"}
          </button>
          <button
            onClick={() => {
              setFormData({ name: "", email: "", password: "", role: "Project Manager", permissions: [], lineManagerId: "", department: "", jobTitle: "" });
              setShowAddModal(true);
            }}
            className="rounded bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
          >
            Add New User
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-lg border border-gray-300 bg-white shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-300">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                Line Manager
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                Permissions
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0 rounded-full bg-orange-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-orange-600">
                        {u.name.split(' ').map((n: string) => n[0]).join('')}
                      </span>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{u.name}</div>
                      {u.id === user.id && (
                        <div className="text-xs text-gray-600">(You)</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{u.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                    u.role === "Administrator" 
                      ? "bg-purple-100 text-purple-800"
                      : u.role === "Project Manager"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-green-100 text-green-800"
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {u.lineManagerName ? (
                    <div className="text-sm text-gray-900">{u.lineManagerName}</div>
                  ) : (
                    <span className="text-xs text-gray-400 italic">No manager</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {u.role === "Administrator" ? (
                    <span className="text-xs text-gray-600 italic">Full Access</span>
                  ) : (
                    <span className="text-sm text-gray-900">
                      {u.permissions?.length || 0} / {availablePermissions.length}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => openEditModal(u)}
                    className="text-orange-600 hover:text-orange-900 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => openDeleteModal(u)}
                    disabled={u.id === user.id}
                    className={`${
                      u.id === user.id
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-red-600 hover:text-red-900"
                    }`}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add New User</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                  placeholder="John Smith"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                  placeholder="john@kbm.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                >
                  <option value="Administrator">Administrator</option>
                  <option value="Project Manager">Project Manager</option>
                  <option value="Commercial Manager">Commercial Manager</option>
                  <option value="Site Manager">Site Manager</option>
                  <option value="Quantity Surveyor">Quantity Surveyor</option>
                  <option value="Team Member">Team Member</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                  placeholder="Operations, Finance, Construction, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Job Title
                </label>
                <input
                  type="text"
                  value={formData.jobTitle}
                  onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                  className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                  placeholder="Senior Engineer, Project Coordinator, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Line Manager
                </label>
                <select
                  value={formData.lineManagerId}
                  onChange={(e) => setFormData({ ...formData, lineManagerId: e.target.value })}
                  className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                >
                  <option value="">No Line Manager</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} - {u.role}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-600 mt-1">
                  Select who this user reports to for leave approvals and permissions
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-900">
                    Permissions
                  </label>
                  <div className="space-x-2">
                    <button
                      type="button"
                      onClick={selectAllPermissions}
                      className="text-xs text-orange-600 hover:text-orange-900"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={clearAllPermissions}
                      className="text-xs text-gray-600 hover:text-gray-900"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto border border-gray-300 rounded p-3 bg-gray-50">
                  <div className="space-y-2">
                    {availablePermissions.map((perm) => (
                      <label
                        key={perm.id}
                        className="flex items-start space-x-3 cursor-pointer hover:bg-white p-2 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={formData.permissions.includes(perm.id)}
                          onChange={() => togglePermission(perm.id)}
                          className="mt-1 h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {perm.label}
                          </div>
                          <div className="text-xs text-gray-600">
                            {perm.description}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Administrators have access to all features regardless of permissions
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddUser}
                className="rounded bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
              >
                Add User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Edit User</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full rounded border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-600 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                >
                  <option value="Administrator">Administrator</option>
                  <option value="Project Manager">Project Manager</option>
                  <option value="Commercial Manager">Commercial Manager</option>
                  <option value="Site Manager">Site Manager</option>
                  <option value="Quantity Surveyor">Quantity Surveyor</option>
                  <option value="Team Member">Team Member</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                  placeholder="Operations, Finance, Construction, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Job Title
                </label>
                <input
                  type="text"
                  value={formData.jobTitle}
                  onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                  className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                  placeholder="Senior Engineer, Project Coordinator, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Line Manager
                </label>
                <select
                  value={formData.lineManagerId}
                  onChange={(e) => setFormData({ ...formData, lineManagerId: e.target.value })}
                  className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                >
                  <option value="">No Line Manager</option>
                  {users
                    .filter(u => u.id !== selectedUser?.id) // Don't allow self-reporting
                    .map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} - {u.role}
                      </option>
                    ))}
                </select>
                <p className="text-xs text-gray-600 mt-1">
                  Select who this user reports to for leave approvals and permissions
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-900">
                    Permissions
                  </label>
                  <div className="space-x-2">
                    <button
                      type="button"
                      onClick={selectAllPermissions}
                      className="text-xs text-orange-600 hover:text-orange-900"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={clearAllPermissions}
                      className="text-xs text-gray-600 hover:text-gray-900"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto border border-gray-300 rounded p-3 bg-gray-50">
                  <div className="space-y-2">
                    {availablePermissions.map((perm) => (
                      <label
                        key={perm.id}
                        className="flex items-start space-x-3 cursor-pointer hover:bg-white p-2 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={formData.permissions.includes(perm.id)}
                          onChange={() => togglePermission(perm.id)}
                          className="mt-1 h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {perm.label}
                          </div>
                          <div className="text-xs text-gray-600">
                            {perm.description}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Administrators have access to all features regardless of permissions
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedUser(null);
                }}
                className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEditUser}
                className="rounded bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Delete User</h2>
            
            <p className="text-sm text-gray-900 mb-2">
              Are you sure you want to delete this user?
            </p>
            <p className="text-sm text-gray-600 mb-4">
              <strong>{selectedUser.name}</strong> ({selectedUser.email})
            </p>
            <p className="text-sm text-red-600">
              This action cannot be undone.
            </p>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedUser(null);
                }}
                className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
