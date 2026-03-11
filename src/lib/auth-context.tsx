"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  permissions?: string[];
  lineManagerId?: string;
  lineManagerName?: string;
  department?: string;
  jobTitle?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithMicrosoft: () => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  isLoading: boolean;
  isAdmin: () => boolean;
  hasPermission: (permission: string) => boolean;
  getAllUsers: () => User[];
  createUser: (userData: Omit<User, 'id'> & { password: string }) => Promise<boolean>;
  updateUserPermissions: (userId: string, updates: Partial<User>) => Promise<boolean>;
  deleteUser: (userId: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo users - replace with real API authentication
const DEMO_USERS = [
  { id: "1", name: "Admin User", email: "admin@kbm.com", password: "admin123", role: "Administrator" },
  { id: "2", name: "John Smith", email: "john@kbm.com", password: "password", role: "Project Manager" },
  { id: "3", name: "Sarah Jones", email: "sarah@kbm.com", password: "password", role: "Commercial Manager" },
];

const normalizeEmail = (email: string) => email.trim().toLowerCase();
const REMOTE_AUTH_ENABLED = process.env.NEXT_PUBLIC_AUTH_MODE === "supabase";
const MICROSOFT_AUTH_ENABLED = process.env.NEXT_PUBLIC_AUTH_MODE === "microsoft";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const syncUsersFromServer = async () => {
    if (!REMOTE_AUTH_ENABLED || typeof window === "undefined") return;

    try {
      const response = await fetch("/api/auth/users", { cache: "no-store" });
      if (!response.ok) return;
      const users = (await response.json()) as User[];
      localStorage.setItem("kbm_all_users", JSON.stringify(users));
    } catch (error) {
      console.warn("Remote user sync skipped:", error);
    }
  };

  useEffect(() => {
    // Check for existing session on mount (client-side only)
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("kbm_user");
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error("Failed to parse stored user:", error);
          localStorage.removeItem("kbm_user");
        }
      } else if (MICROSOFT_AUTH_ENABLED) {
        // Check for Microsoft session via cookies
        const userEmail = document.cookie
          .split("; ")
          .find((row) => row.startsWith("user_email="))
          ?.split("=")[1];
        const userName = document.cookie
          .split("; ")
          .find((row) => row.startsWith("user_name="))
          ?.split("=")[1];

        if (userEmail && userName) {
          // Validate session with server
          fetch("/api/auth/microsoft/me")
            .then((res) => res.json())
            .then((data) => {
              if (data.id) {
                setUser(data);
                localStorage.setItem("kbm_user", JSON.stringify(data));
              }
            })
            .catch((error) => {
              console.error("Failed to validate Microsoft session:", error);
            });
        }
      }
    }
    void syncUsersFromServer();
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    if (typeof window === "undefined") return false;

    const normalizedEmail = normalizeEmail(email);

    if (REMOTE_AUTH_ENABLED) {
      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: normalizedEmail, password }),
        });

        if (response.ok) {
          const remoteUser = (await response.json()) as User;
          setUser(remoteUser);
          localStorage.setItem("kbm_user", JSON.stringify(remoteUser));
          await syncUsersFromServer();
          return true;
        }

        if (response.status === 401) {
          return false;
        }
      } catch (error) {
        console.warn("Remote login unavailable, using local fallback:", error);
      }
    }

    let passwords: Record<string, string> = {};
    const storedPasswords = localStorage.getItem("user_passwords");
    if (storedPasswords) {
      try {
        passwords = JSON.parse(storedPasswords);
      } catch (error) {
        console.error("Failed to parse passwords:", error);
      }
    }

    const allUsers = getAllUsers();
    const foundStoredUser = allUsers.find((u) => normalizeEmail(u.email) === normalizedEmail);

    if (foundStoredUser) {
      const savedPassword = passwords[normalizedEmail] ?? passwords[foundStoredUser.email];
      if (savedPassword && savedPassword === password) {
        console.log("Login successful for stored user:", normalizedEmail);
        setUser(foundStoredUser);
        localStorage.setItem("kbm_user", JSON.stringify(foundStoredUser));
        return true;
      }

      const demoUserMatch = DEMO_USERS.find(
        (u) => normalizeEmail(u.email) === normalizedEmail && u.password === password,
      );
      if (demoUserMatch) {
        const { password: _, ...userWithoutPassword } = demoUserMatch;
        setUser(userWithoutPassword);
        localStorage.setItem("kbm_user", JSON.stringify(userWithoutPassword));
        return true;
      }

      console.log("Login failed - invalid credentials for existing user");
      return false;
    }

    console.log("Login failed - user not found");
    return false;
  };

  const loginWithMicrosoft = async (): Promise<void> => {
    if (typeof window === "undefined") return;

    try {
      const response = await fetch("/api/auth/microsoft/login");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to initiate Microsoft login");
      }

      if (data.authUrl) {
        // Redirect to Microsoft login
        window.location.href = data.authUrl;
        return;
      }

      throw new Error("No Microsoft authorization URL returned");
    } catch (error) {
      console.error("Microsoft login failed:", error);
      throw new Error("Failed to initiate Microsoft login");
    }
  };

  const logout = async () => {
    setUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("kbm_user");

      // Clear Microsoft session if enabled
      if (MICROSOFT_AUTH_ENABLED) {
        try {
          await fetch("/api/auth/microsoft/logout", { method: "POST" });
        } catch (error) {
          console.error("Failed to clear Microsoft session:", error);
        }
      }
    }
  };

  const updateUser = (updates: Partial<User>) => {
    if (user && typeof window !== "undefined") {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem("kbm_user", JSON.stringify(updatedUser));

      try {
        const users = getAllUsers();
        const index = users.findIndex((u) => u.id === user.id);
        if (index !== -1) {
          users[index] = { ...users[index], ...updates };
          localStorage.setItem("kbm_all_users", JSON.stringify(users));
        }
      } catch (error) {
        console.error("Failed to sync updated user profile:", error);
      }
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    if (!user || typeof window === "undefined") return false;

    // Get stored password
    const storedPasswords = localStorage.getItem("user_passwords");
    let passwords: Record<string, string> = {};
    
    if (storedPasswords) {
      try {
        passwords = JSON.parse(storedPasswords);
      } catch (error) {
        console.error("Failed to parse passwords:", error);
      }
    }

    // Check current password
    const normalizedEmail = normalizeEmail(user.email);
    const savedPassword = passwords[normalizedEmail] ?? passwords[user.email];
    if (savedPassword && savedPassword !== currentPassword) {
      console.log("Current password is incorrect");
      return false;
    }

    // If no saved password, check against demo users
    if (!savedPassword) {
      const demoUser = DEMO_USERS.find(u => u.email === user.email);
      if (demoUser && demoUser.password !== currentPassword) {
        console.log("Current password is incorrect");
        return false;
      }
    }

    // Save new password
    passwords[normalizedEmail] = newPassword;
    localStorage.setItem("user_passwords", JSON.stringify(passwords));
    console.log("Password changed successfully");
    return true;
  };

  // Admin functions
  const isAdmin = (): boolean => {
    return user?.role === "Administrator";
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    // Admins have all permissions
    if (user.role === "Administrator") return true;
    // Check if user has specific permission
    return user.permissions?.includes(permission) || false;
  };

  const getAllUsers = (): User[] => {
    if (typeof window === "undefined") return [];
    
    const storedUsers = localStorage.getItem("kbm_all_users");
    if (storedUsers) {
      try {
        return JSON.parse(storedUsers);
      } catch (error) {
        console.error("Failed to parse users:", error);
      }
    }
    
    // Initialize with demo users if not stored
    const users = DEMO_USERS.map(({ password, ...user }) => user);
    localStorage.setItem("kbm_all_users", JSON.stringify(users));
    return users;
  };

  const createUser = async (userData: Omit<User, 'id'> & { password: string }): Promise<boolean> => {
    if (!isAdmin() || typeof window === "undefined") return false;

    if (REMOTE_AUTH_ENABLED) {
      try {
        const response = await fetch("/api/auth/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userData),
        });

        if (!response.ok) {
          return false;
        }

        await syncUsersFromServer();
        return true;
      } catch (error) {
        console.warn("Remote create user unavailable, using local fallback:", error);
      }
    }
    
    try {
      const users = getAllUsers();
      const normalizedEmail = normalizeEmail(userData.email);
      
      // Check if email already exists
      if (users.some(u => normalizeEmail(u.email) === normalizedEmail)) {
        console.error("User with this email already exists");
        return false;
      }
      
      // Create new user
      const newUser: User = {
        id: Date.now().toString(),
        name: userData.name,
        email: normalizedEmail,
        role: userData.role,
      };
      
      users.push(newUser);
      localStorage.setItem("kbm_all_users", JSON.stringify(users));
      
      // Store password
      const passwords = JSON.parse(localStorage.getItem("user_passwords") || "{}");
      passwords[normalizedEmail] = userData.password;
      localStorage.setItem("user_passwords", JSON.stringify(passwords));
      
      console.log("User created successfully:", newUser.email);
      return true;
    } catch (error) {
      console.error("Failed to create user:", error);
      return false;
    }
  };

  const updateUserPermissions = async (userId: string, updates: Partial<User>): Promise<boolean> => {
    if (!isAdmin() || typeof window === "undefined") return false;

    if (REMOTE_AUTH_ENABLED) {
      try {
        const response = await fetch("/api/auth/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: userId, ...updates }),
        });

        if (!response.ok) {
          return false;
        }

        const updatedRemoteUser = (await response.json()) as User;
        await syncUsersFromServer();

        if (user?.id === userId) {
          setUser(updatedRemoteUser);
          localStorage.setItem("kbm_user", JSON.stringify(updatedRemoteUser));
        }

        return true;
      } catch (error) {
        console.warn("Remote update user unavailable, using local fallback:", error);
      }
    }
    
    try {
      const users = getAllUsers();
      const userIndex = users.findIndex(u => u.id === userId);
      
      if (userIndex === -1) {
        console.error("User not found");
        return false;
      }
      
      users[userIndex] = { ...users[userIndex], ...updates };
      localStorage.setItem("kbm_all_users", JSON.stringify(users));
      
      // If updating current user, update session
      if (user?.id === userId) {
        setUser({ ...user, ...updates });
        localStorage.setItem("kbm_user", JSON.stringify({ ...user, ...updates }));
      }
      
      console.log("User updated successfully");
      return true;
    } catch (error) {
      console.error("Failed to update user:", error);
      return false;
    }
  };

  const deleteUser = async (userId: string): Promise<boolean> => {
    if (!isAdmin() || typeof window === "undefined") return false;

    if (REMOTE_AUTH_ENABLED) {
      try {
        if (user?.id === userId) {
          console.error("Cannot delete your own account");
          return false;
        }

        const response = await fetch("/api/auth/users", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: userId }),
        });

        if (!response.ok) {
          return false;
        }

        await syncUsersFromServer();
        return true;
      } catch (error) {
        console.warn("Remote delete user unavailable, using local fallback:", error);
      }
    }
    
    try {
      const users = getAllUsers();
      const filteredUsers = users.filter(u => u.id !== userId);
      
      if (filteredUsers.length === users.length) {
        console.error("User not found");
        return false;
      }
      
      // Don't allow deleting yourself
      if (user?.id === userId) {
        console.error("Cannot delete your own account");
        return false;
      }
      
      localStorage.setItem("kbm_all_users", JSON.stringify(filteredUsers));
      console.log("User deleted successfully");
      return true;
    } catch (error) {
      console.error("Failed to delete user:", error);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login,
      loginWithMicrosoft, 
      logout, 
      updateUser, 
      changePassword, 
      isLoading,
      isAdmin,
      hasPermission,
      getAllUsers,
      createUser,
      updateUserPermissions,
      deleteUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
