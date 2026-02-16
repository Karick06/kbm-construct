"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions?: string[];
  lineManagerId?: string;
  lineManagerName?: string;
  department?: string;
  jobTitle?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  isLoading: boolean;
  isAdmin: () => boolean;
  hasPermission: (permission: string) => boolean;
  getAllUsers: () => User[];
  createUser: (userData: Omit<User, 'id'> & { password: string }) => boolean;
  updateUserPermissions: (userId: string, updates: Partial<User>) => boolean;
  deleteUser: (userId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo users - replace with real API authentication
const DEMO_USERS = [
  { id: "1", name: "Admin User", email: "admin@kbm.com", password: "admin123", role: "Administrator" },
  { id: "2", name: "John Smith", email: "john@kbm.com", password: "password", role: "Project Manager" },
  { id: "3", name: "Sarah Jones", email: "sarah@kbm.com", password: "password", role: "Commercial Manager" },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    
    // Check if user has custom password saved
    if (typeof window !== "undefined") {
      const storedPasswords = localStorage.getItem("user_passwords");
      if (storedPasswords) {
        try {
          const passwords = JSON.parse(storedPasswords);
          if (passwords[email]) {
            // User has changed their password
            if (passwords[email] === password) {
              const foundUser = DEMO_USERS.find((u) => u.email === email);
              if (foundUser) {
                console.log("Login successful with custom password for:", email);
                const { password: _, ...userWithoutPassword } = foundUser;
                setUser(userWithoutPassword);
                localStorage.setItem("kbm_user", JSON.stringify(userWithoutPassword));
                return true;
              }
            }
            console.log("Custom password check failed");
            return false;
          }
        } catch (error) {
          console.error("Failed to parse passwords:", error);
        }
      }
    }
    
    // Check default password
    // Simulate API call
    console.log("Attempting login with:", email);
    const foundUser = DEMO_USERS.find(
      (u) => u.email === email && u.password === password
    );

    if (foundUser) {
      console.log("Login successful for:", email);
      const { password: _, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      if (typeof window !== "undefined") {
        localStorage.setItem("kbm_user", JSON.stringify(userWithoutPassword));
      }
      return true;
    }

    console.log("Login failed - invalid credentials");
    return false;
  };

  const logout = () => {
    setUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("kbm_user");
    }
  };

  const updateUser = (updates: Partial<User>) => {
    if (user && typeof window !== "undefined") {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem("kbm_user", JSON.stringify(updatedUser));
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
    const savedPassword = passwords[user.email];
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
    passwords[user.email] = newPassword;
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

  const createUser = (userData: Omit<User, 'id'> & { password: string }): boolean => {
    if (!isAdmin() || typeof window === "undefined") return false;
    
    try {
      const users = getAllUsers();
      
      // Check if email already exists
      if (users.some(u => u.email === userData.email)) {
        console.error("User with this email already exists");
        return false;
      }
      
      // Create new user
      const newUser: User = {
        id: Date.now().toString(),
        name: userData.name,
        email: userData.email,
        role: userData.role,
      };
      
      users.push(newUser);
      localStorage.setItem("kbm_all_users", JSON.stringify(users));
      
      // Store password
      const passwords = JSON.parse(localStorage.getItem("user_passwords") || "{}");
      passwords[userData.email] = userData.password;
      localStorage.setItem("user_passwords", JSON.stringify(passwords));
      
      console.log("User created successfully:", newUser.email);
      return true;
    } catch (error) {
      console.error("Failed to create user:", error);
      return false;
    }
  };

  const updateUserPermissions = (userId: string, updates: Partial<User>): boolean => {
    if (!isAdmin() || typeof window === "undefined") return false;
    
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

  const deleteUser = (userId: string): boolean => {
    if (!isAdmin() || typeof window === "undefined") return false;
    
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
