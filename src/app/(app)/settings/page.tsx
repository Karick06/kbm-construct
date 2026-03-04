"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import { useAuth } from "@/lib/auth-context";

export default function SettingsPage() {
  const { user, updateUser, changePassword } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  // Profile settings
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [phone, setPhone] = useState("");
  const [jobTitle, setJobTitle] = useState("");

  // Password settings
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(true);
  const [projectUpdates, setProjectUpdates] = useState(true);
  const [invoiceAlerts, setInvoiceAlerts] = useState(true);

  // Appearance preferences
  const [language, setLanguage] = useState("en");
  const [timezone, setTimezone] = useState("Europe/London");
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setAvatarUrl(user.avatarUrl || "");
      // Load other settings from localStorage
      const savedSettings = localStorage.getItem("user_settings");
      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings);
          setPhone(settings.phone || "");
          setJobTitle(settings.jobTitle || user.role);
          setEmailNotifications(settings.emailNotifications ?? true);
          setPushNotifications(settings.pushNotifications ?? true);
          setWeeklyReports(settings.weeklyReports ?? true);
          setProjectUpdates(settings.projectUpdates ?? true);
          setInvoiceAlerts(settings.invoiceAlerts ?? true);
          setLanguage(settings.language || "en");
          setTimezone(settings.timezone || "Europe/London");
          setDateFormat(settings.dateFormat || "DD/MM/YYYY");
        } catch (error) {
          console.error("Failed to load settings:", error);
        }
      } else {
        setJobTitle(user.role);
      }
    }
  }, [user]);

  const handleSaveProfile = () => {
    setIsSaving(true);
    
    // Update user profile fields in auth context if changed
    if (user && (name !== user.name || avatarUrl !== (user.avatarUrl || ""))) {
      updateUser({ name, avatarUrl });
    }
    
    const settings = {
      phone,
      jobTitle,
      emailNotifications,
      pushNotifications,
      weeklyReports,
      projectUpdates,
      invoiceAlerts,
      language,
      timezone,
      dateFormat,
    };
    localStorage.setItem("user_settings", JSON.stringify(settings));
    
    setTimeout(() => {
      setIsSaving(false);
      setSaveMessage("Settings saved successfully!");
      setTimeout(() => setSaveMessage(""), 3000);
    }, 500);
  };

  const handleAvatarUpload = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setSaveMessage("Please choose an image file.");
      setTimeout(() => setSaveMessage(""), 3000);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setSaveMessage("Passwords do not match!");
      setTimeout(() => setSaveMessage(""), 3000);
      return;
    }
    if (newPassword.length < 6) {
      setSaveMessage("Password must be at least 6 characters!");
      setTimeout(() => setSaveMessage(""), 3000);
      return;
    }
    
    setIsSaving(true);
    const success = await changePassword(currentPassword, newPassword);
    
    if (success) {
      setIsSaving(false);
      setSaveMessage("Password changed successfully! Please use your new password next time you log in.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setSaveMessage(""), 5000);
    } else {
      setIsSaving(false);
      setSaveMessage("Current password is incorrect!");
      setTimeout(() => setSaveMessage(""), 3000);
    }
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: "👤" },
    { id: "security", label: "Security", icon: "🔒" },
    { id: "notifications", label: "Notifications", icon: "🔔" },
    { id: "preferences", label: "Preferences", icon: "⚙️" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="User Settings"
        subtitle="Manage your account and preferences"
        actions={
          <button 
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="h-11 rounded-full bg-[var(--accent)] px-5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        }
      />

      {saveMessage && (
        <div className={`rounded-lg border p-3 text-sm ${
          saveMessage.includes("success") 
            ? "border-green-500/30 bg-green-900/20 text-green-400" 
            : "border-red-500/30 bg-red-900/20 text-red-400"
        }`}>
          {saveMessage}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-[var(--line)]">
        <nav className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition border-b-2 ${
                activeTab === tab.id
                  ? "border-[var(--accent)] text-[var(--accent)]"
                  : "border-transparent text-[var(--body-muted)] hover:text-[var(--body-ink)]"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <section className="space-y-6">
          <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Personal Information</h2>

            <div className="mb-6 flex items-center gap-4">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={name || "User avatar"}
                  className="h-16 w-16 rounded-full object-cover border border-gray-700"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-lg">
                  {(name || "U")
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </div>
              )}
              <div className="flex items-center gap-2">
                <label className="cursor-pointer rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white hover:border-orange-500">
                  Upload Avatar
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleAvatarUpload(e.target.files?.[0] || null)}
                  />
                </label>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={() => setAvatarUrl("")}
                    className="rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-300 hover:text-white"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full rounded border border-gray-700 bg-gray-950/50 px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+44 7XXX XXXXXX"
                  className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Job Title
                </label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Security Tab */}
      {activeTab === "security" && (
        <section className="space-y-6">
          <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Change Password</h2>
            
            <div className="max-w-md space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <button
                onClick={handleChangePassword}
                disabled={!currentPassword || !newPassword || !confirmPassword || isSaving}
                className="rounded bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? "Changing..." : "Change Password"}
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
            <h2 className="text-lg font-semibold text-white mb-2">Active Sessions</h2>
            <p className="text-sm text-gray-400 mb-4">Manage your active sessions and devices</p>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded border border-gray-700/50 bg-gray-900/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">💻</div>
                  <div>
                    <p className="text-sm font-medium text-white">Current Device</p>
                    <p className="text-xs text-gray-500">Active now</p>
                  </div>
                </div>
                <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-400 border border-green-500/30">
                  Active
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Notifications Tab */}
      {activeTab === "notifications" && (
        <section className="space-y-6">
          <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Notification Preferences</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-700/50">
                <div>
                  <p className="text-sm font-medium text-white">Email Notifications</p>
                  <p className="text-xs text-gray-400">Receive notifications via email</p>
                </div>
                <button
                  onClick={() => setEmailNotifications(!emailNotifications)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                    emailNotifications ? "bg-orange-500" : "bg-gray-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      emailNotifications ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-700/50">
                <div>
                  <p className="text-sm font-medium text-white">Push Notifications</p>
                  <p className="text-xs text-gray-400">Receive browser push notifications</p>
                </div>
                <button
                  onClick={() => setPushNotifications(!pushNotifications)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                    pushNotifications ? "bg-orange-500" : "bg-gray-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      pushNotifications ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-700/50">
                <div>
                  <p className="text-sm font-medium text-white">Weekly Reports</p>
                  <p className="text-xs text-gray-400">Receive weekly summary reports</p>
                </div>
                <button
                  onClick={() => setWeeklyReports(!weeklyReports)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                    weeklyReports ? "bg-orange-500" : "bg-gray-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      weeklyReports ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-700/50">
                <div>
                  <p className="text-sm font-medium text-white">Project Updates</p>
                  <p className="text-xs text-gray-400">Get notified about project changes</p>
                </div>
                <button
                  onClick={() => setProjectUpdates(!projectUpdates)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                    projectUpdates ? "bg-orange-500" : "bg-gray-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      projectUpdates ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-white">Invoice Alerts</p>
                  <p className="text-xs text-gray-400">Get notified about invoice status changes</p>
                </div>
                <button
                  onClick={() => setInvoiceAlerts(!invoiceAlerts)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                    invoiceAlerts ? "bg-orange-500" : "bg-gray-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      invoiceAlerts ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Preferences Tab */}
      {activeTab === "preferences" && (
        <section className="space-y-6">
          <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Regional Settings</h2>
            
            <div className="grid gap-4 md:grid-cols-2 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                >
                  <option value="en">English (UK)</option>
                  <option value="en-us">English (US)</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Timezone
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                >
                  <option value="Europe/London">London (GMT)</option>
                  <option value="Europe/Paris">Paris (CET)</option>
                  <option value="America/New_York">New York (EST)</option>
                  <option value="America/Los_Angeles">Los Angeles (PST)</option>
                  <option value="Asia/Tokyo">Tokyo (JST)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Date Format
                </label>
                <select
                  value={dateFormat}
                  onChange={(e) => setDateFormat(e.target.value)}
                  className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY (16/02/2026)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY (02/16/2026)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (2026-02-16)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-red-500/30 bg-red-900/20 p-6">
            <h2 className="text-lg font-semibold text-red-400 mb-2">Danger Zone</h2>
            <p className="text-sm text-red-400/80 mb-4">Irreversible actions for your account</p>
            
            <button className="rounded border border-red-500/50 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20">
              Delete Account
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
