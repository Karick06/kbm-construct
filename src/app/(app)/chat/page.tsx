"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/lib/notifications-context";
import { useFloatingChat } from "@/lib/floating-chat-context";

const DEFAULT_CHANNELS = [
  { id: "general", icon: "#", label: "General Chat", color: "text-blue-400", isChannel: true },
  { id: "vehicle", icon: "👥", label: "Vehicle Chat", color: "text-green-400", isChannel: true },
  { id: "internal", icon: "🔒", label: "Internal Chat", color: "text-purple-400", isChannel: true },
  { id: "announcements", icon: "📢", label: "Announcements", color: "text-yellow-400", isChannel: true },
];

type Message = {
  id: string;
  text: string;
  userId: string;
  userName: string;
  avatar: string;
  timestamp: string;
  createdAt?: string; // ISO date string for grouping
  edited?: boolean;
  editedAt?: string;
  reactions?: { [emoji: string]: string[] }; // emoji -> array of user IDs
  readBy?: string[]; // array of user IDs who have read the message
};

type Chat = {
  id: string;
  icon: string;
  label: string;
  color: string;
  isChannel: boolean;
  isDM?: boolean;
  participants?: string[]; // User IDs
  createdBy?: string;
  createdAt?: string;
  archived?: boolean;
};

type ChatState = {
  [key: string]: Message[];
};

type ChannelMembers = {
  [key: string]: string[]; // chatId -> array of user IDs
};

const STORAGE_KEYS = {
  MESSAGES: 'kbm_chat_messages',
  CUSTOM_CHATS: 'kbm_custom_chats',
  ARCHIVED_CHATS: 'kbm_archived_chats',
  CHANNEL_MEMBERS: 'kbm_channel_members',
  DM_CHATS: 'kbm_dm_chats',
};

export default function ChatPage() {
  const { user, getAllUsers } = useAuth();
  const { addNotification } = useNotifications();
  const { openChat, playNotificationSound } = useFloatingChat();
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [chats, setChats] = useState<ChatState>({});
  const [customChats, setCustomChats] = useState<Chat[]>([]);
  const [dmChats, setDmChats] = useState<Chat[]>([]);
  const [channelMembers, setChannelMembers] = useState<ChannelMembers>({});
  const [archivedChats, setArchivedChats] = useState<string[]>([]);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showNewDMModal, setShowNewDMModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [newChatName, setNewChatName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<{ [chatId: string]: string[] }>({});
  const [isTyping, setIsTyping] = useState(false);

  const commonEmojis = ['👍', '❤️', '😊', '😂', '🎉', '👏', '🔥', '✅'];

  // Load persisted data on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedMessages = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      const storedCustomChats = localStorage.getItem(STORAGE_KEYS.CUSTOM_CHATS);
      const storedDMChats = localStorage.getItem(STORAGE_KEYS.DM_CHATS);
      const storedChannelMembers = localStorage.getItem(STORAGE_KEYS.CHANNEL_MEMBERS);
      const storedArchivedChats = localStorage.getItem(STORAGE_KEYS.ARCHIVED_CHATS);

      if (storedMessages) {
        try {
          setChats(JSON.parse(storedMessages));
        } catch (error) {
          console.error('Failed to parse stored messages:', error);
        }
      } else {
        // Initialize with welcome message
        const initialMessages = {
          general: [
            { 
              id: "1", 
              text: "Welcome to KBM Chat! This is a persistent team communication hub.", 
              userId: "system",
              userName: "System", 
              avatar: "SY", 
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            },
          ],
        };
        setChats(initialMessages);
        localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(initialMessages));
      }

      if (storedCustomChats) {
        try {
          setCustomChats(JSON.parse(storedCustomChats));
        } catch (error) {
          console.error('Failed to parse custom chats:', error);
        }
      }

      if (storedDMChats) {
        try {
          setDmChats(JSON.parse(storedDMChats));
        } catch (error) {
          console.error('Failed to parse DM chats:', error);
        }
      }

      if (storedChannelMembers) {
        try {
          setChannelMembers(JSON.parse(storedChannelMembers));
        } catch (error) {
          console.error('Failed to parse channel members:', error);
        }
      } else {
        // Initialize all users in default channels
        if (user && getAllUsers) {
          const users = getAllUsers();
          if (users.length > 0) {
            const initialMembers: ChannelMembers = {};
            DEFAULT_CHANNELS.forEach(channel => {
              initialMembers[channel.id] = users.map(u => u.id);
            });
            setChannelMembers(initialMembers);
            localStorage.setItem(STORAGE_KEYS.CHANNEL_MEMBERS, JSON.stringify(initialMembers));
          }
        }
      }

      if (storedArchivedChats) {
        try {
          setArchivedChats(JSON.parse(storedArchivedChats));
        } catch (error) {
          console.error('Failed to parse archived chats:', error);
        }
      }
    }
  }, [user, getAllUsers]);

  // Sync messages from other components (like floating chat)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncMessages = () => {
      const storedMessages = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      if (storedMessages) {
        try {
          const parsed = JSON.parse(storedMessages);
          setChats(parsed);
        } catch (error) {
          console.error('Failed to sync messages:', error);
        }
      }
    };

    // Listen for custom sync event from floating chat
    window.addEventListener('chat-message-update', syncMessages);

    // Also poll periodically for changes
    const interval = setInterval(syncMessages, 500);

    return () => {
      window.removeEventListener('chat-message-update', syncMessages);
      clearInterval(interval);
    };
  }, []);

  // Persist messages to localStorage
  const persistMessages = useCallback((newChats: ChatState) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(newChats));
    }
  }, []);

  // Persist custom chats to localStorage
  const persistCustomChats = useCallback((chats: Chat[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.CUSTOM_CHATS, JSON.stringify(chats));
    }
  }, []);

  // Persist DM chats to localStorage
  const persistDMChats = useCallback((chats: Chat[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.DM_CHATS, JSON.stringify(chats));
    }
  }, []);

  // Persist channel members to localStorage
  const persistChannelMembers = useCallback((members: ChannelMembers) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.CHANNEL_MEMBERS, JSON.stringify(members));
    }
  }, []);

  // Persist archived chats to localStorage
  const persistArchivedChats = useCallback((archived: string[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.ARCHIVED_CHATS, JSON.stringify(archived));
    }
  }, []);

  // Send message
  const handleSendMessage = () => {
    if (!input.trim() || !selectedChat || !user) return;

    const userInitials = user.name.split(' ').map(n => n[0]).join('').toUpperCase();
    const now = new Date();

    const newMessage: Message = {
      id: Date.now().toString(),
      text: input.trim(),
      userId: user.id,
      userName: user.name,
      avatar: userInitials,
      timestamp: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      createdAt: now.toISOString(),
      readBy: [user.id], // Mark as read by sender
    };

    const updatedChats = {
      ...chats,
      [selectedChat]: [...(chats[selectedChat] || []), newMessage],
    };

    setChats(updatedChats);
    persistMessages(updatedChats);
    setInput("");
    setIsTyping(false);

    // Notify other components of message update
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('chat-message-update', { detail: updatedChats }));
    }

    // Send notifications to other chat members
    const currentChat = ([...DEFAULT_CHANNELS, ...customChats, ...dmChats] as Chat[]).find(c => c.id === selectedChat);
    if (currentChat) {
      // Determine who should receive notifications
      let recipientIds: string[] = [];
      
      if (currentChat.isDM) {
        // For DMs, notify the other participant
        recipientIds = currentChat.participants?.filter(id => id !== user.id) || [];
      } else {
        // For channels, notify all members except sender
        const members = channelMembers[selectedChat] || [];
        recipientIds = members.filter(id => id !== user.id);
      }

      // Create notification for each recipient (simulated - in real app would be backend)
      if (recipientIds.length > 0) {
        const notificationMessage = input.trim().length > 50 
          ? input.trim().substring(0, 50) + '...'
          : input.trim();
        
        addNotification({
          title: `New message in ${currentChat.label}`,
          message: `${user.name}: ${notificationMessage}`,
          type: 'info',
          actionUrl: '/chat',
        });
      }
    }
  };

  // Edit message
  const handleEditMessage = (messageId: string, newText: string) => {
    if (!selectedChat || !newText.trim()) return;

    const updatedChats = {
      ...chats,
      [selectedChat]: (chats[selectedChat] || []).map(msg =>
        msg.id === messageId
          ? {
              ...msg,
              text: newText.trim(),
              edited: true,
              editedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            }
          : msg
      ),
    };

    setChats(updatedChats);
    persistMessages(updatedChats);
    setEditingMessageId(null);
    setEditingText("");
  };

  // Delete message
  const handleDeleteMessage = (messageId: string) => {
    if (!selectedChat) return;
    if (!confirm('Delete this message?')) return;

    const updatedChats = {
      ...chats,
      [selectedChat]: (chats[selectedChat] || []).filter(msg => msg.id !== messageId),
    };

    setChats(updatedChats);
    persistMessages(updatedChats);
  };

  // Add reaction
  const handleAddReaction = (messageId: string, emoji: string) => {
    if (!selectedChat || !user) return;

    // Find the message to check if we're adding or removing a reaction
    const message = chats[selectedChat]?.find(m => m.id === messageId);
    const isAddingReaction = message && !(message.reactions?.[emoji]?.includes(user.id));

    const updatedChats = {
      ...chats,
      [selectedChat]: (chats[selectedChat] || []).map(msg => {
        if (msg.id === messageId) {
          const reactions = msg.reactions || {};
          const userIds = reactions[emoji] || [];
          
          // Toggle reaction - remove if already reacted, add if not
          const newUserIds = userIds.includes(user.id)
            ? userIds.filter(id => id !== user.id)
            : [...userIds, user.id];

          // Remove emoji key if no users left
          if (newUserIds.length === 0) {
            const { [emoji]: removed, ...remaining } = reactions;
            return { ...msg, reactions: remaining };
          }

          return {
            ...msg,
            reactions: { ...reactions, [emoji]: newUserIds },
          };
        }
        return msg;
      }),
    };

    setChats(updatedChats);
    persistMessages(updatedChats);
    setShowReactionPicker(null);

    // Send notification to message author if someone else reacted
    if (message && isAddingReaction && message.userId !== user.id) {
      const currentChat = [...DEFAULT_CHANNELS, ...customChats, ...dmChats].find(c => c.id === selectedChat);
      if (currentChat) {
        addNotification({
          title: 'Reaction to your message',
          message: `${user.name} reacted ${emoji} to your message in ${currentChat.label}`,
          type: 'info',
          actionUrl: '/chat',
        });
      }
    }
  };

  // Mark message as read
  const handleMarkAsRead = useCallback((messageId: string) => {
    if (!selectedChat || !user) return;

    const message = chats[selectedChat]?.find(m => m.id === messageId);
    if (!message || message.readBy?.includes(user.id)) return;

    const updatedChats = {
      ...chats,
      [selectedChat]: (chats[selectedChat] || []).map(msg =>
        msg.id === messageId
          ? { ...msg, readBy: [...(msg.readBy || []), user.id] }
          : msg
      ),
    };

    setChats(updatedChats);
    persistMessages(updatedChats);
  }, [selectedChat, user, chats, persistMessages]);

  // Handle typing indicator
  useEffect(() => {
    if (input && !isTyping) {
      setIsTyping(true);
    } else if (!input && isTyping) {
      setIsTyping(false);
    }
  }, [input, isTyping]);

  // Mark all messages as read when viewing a chat
  useEffect(() => {
    if (selectedChat && user) {
      const messages = chats[selectedChat] || [];
      const unreadMessages = messages.filter(msg => 
        msg.userId !== user.id && !msg.readBy?.includes(user.id)
      );

      if (unreadMessages.length > 0) {
        const updatedChats = {
          ...chats,
          [selectedChat]: messages.map(msg =>
            msg.readBy?.includes(user.id)
              ? msg
              : { ...msg, readBy: [...(msg.readBy || []), user.id] }
          ),
        };
        setChats(updatedChats);
        persistMessages(updatedChats);
      }
    }
  }, [selectedChat, user]);

  // Close reaction picker on click outside
  useEffect(() => {
    if (!showReactionPicker) return;

    const handleClickOutside = () => {
      setShowReactionPicker(null);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showReactionPicker]);

  // Create new chat
  const handleCreateChat = () => {
    if (!newChatName.trim() || !user) return;

    const chatId = `custom_${Date.now()}`;
    const newChat: Chat = {
      id: chatId,
      icon: "💬",
      label: newChatName.trim(),
      color: "text-cyan-400",
      isChannel: false,
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      participants: selectedUsers.length > 0 ? [user.id, ...selectedUsers] : [user.id],
    };

    const updatedCustomChats = [...customChats, newChat];
    setCustomChats(updatedCustomChats);
    persistCustomChats(updatedCustomChats);
    
    // Initialize channel members if participants selected
    if (selectedUsers.length > 0) {
      const updatedMembers = {
        ...channelMembers,
        [chatId]: [user.id, ...selectedUsers],
      };
      setChannelMembers(updatedMembers);
      persistChannelMembers(updatedMembers);
    }
    
    setChats({ ...chats, [chatId]: [] });
    setNewChatName("");
    setSelectedUsers([]);
    setShowNewChatModal(false);
    setSelectedChat(chatId);
  };

  // Create new DM
  const handleCreateDM = () => {
    if (selectedUsers.length !== 1 || !user) return;

    const otherUserId = selectedUsers[0];
    const otherUser = allUsers.find(u => u.id === otherUserId);
    if (!otherUser) return;

    const isSelf = otherUserId === user.id;
    const selfInitials = user.name.split(' ').map(n => n[0]).join('').toUpperCase();
    const otherInitials = otherUser.name.split(' ').map(n => n[0]).join('').toUpperCase();

    // Check if DM already exists
    const existingDM = dmChats.find(dm => {
      if (isSelf) {
        // For self-DMs, check if participants contain only the user
        return dm.participants?.length === 1 && dm.participants?.[0] === user.id;
      } else {
        // For other DMs, check if both participants match
        return dm.participants?.includes(user.id) && dm.participants?.includes(otherUserId);
      }
    });

    if (existingDM) {
      setSelectedChat(existingDM.id);
      setShowNewDMModal(false);
      setSelectedUsers([]);
      return;
    }

    const dmId = isSelf ? `dm_self_${user.id}` : `dm_${Date.now()}`;
    
    const newDM: Chat = {
      id: dmId,
      icon: isSelf ? selfInitials : otherInitials,
      label: isSelf ? "Reminders & Notes" : otherUser.name,
      color: isSelf ? "text-amber-400" : "text-blue-400",
      isChannel: false,
      isDM: true,
      participants: isSelf ? [user.id] : [user.id, otherUserId],
      createdAt: new Date().toISOString(),
    };

    const updatedDMChats = [...dmChats, newDM];
    setDmChats(updatedDMChats);
    persistDMChats(updatedDMChats);
    setChats({ ...chats, [dmId]: [] });
    setSelectedUsers([]);
    setShowNewDMModal(false);
    setSelectedChat(dmId);

    // Notify the other user about the new DM (only if not self-DM)
    if (!isSelf) {
      addNotification({
        title: 'New Direct Message',
        message: `${user.name} started a conversation with you`,
        type: 'info',
        actionUrl: '/chat',
      });
    }
  };

  // Add member to channel
  const handleAddMember = (chatId: string, userId: string) => {
    const currentMembers = channelMembers[chatId] || [];
    if (currentMembers.includes(userId)) return;

    const updatedMembers = {
      ...channelMembers,
      [chatId]: [...currentMembers, userId],
    };
    setChannelMembers(updatedMembers);
    persistChannelMembers(updatedMembers);

    // Notify the added user
    const chat = [...DEFAULT_CHANNELS, ...customChats].find(c => c.id === chatId);
    if (chat && user) {
      addNotification({
        title: 'Added to Channel',
        message: `${user.name} added you to ${chat.label}`,
        type: 'info',
        actionUrl: '/chat',
      });
    }
  };

  // Remove member from channel
  const handleRemoveMember = (chatId: string, userId: string) => {
    const currentMembers = channelMembers[chatId] || [];
    const updatedMembers = {
      ...channelMembers,
      [chatId]: currentMembers.filter(id => id !== userId),
    };
    setChannelMembers(updatedMembers);
    persistChannelMembers(updatedMembers);
  };

  // Toggle user selection
  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Archive/unarchive chat
  const toggleArchiveChat = (chatId: string) => {
    const updatedArchived = archivedChats.includes(chatId)
      ? archivedChats.filter(id => id !== chatId)
      : [...archivedChats, chatId];
    
    setArchivedChats(updatedArchived);
    persistArchivedChats(updatedArchived);
    
    if (archivedChats.includes(chatId)) {
      // Unarchiving - switch to it
      setSelectedChat(chatId);
    } else {
      // Archiving - deselect if currently selected
      if (selectedChat === chatId) {
        setSelectedChat(null);
      }
    }
  };

  // Delete custom chat
  const deleteCustomChat = (chatId: string) => {
    if (!confirm('Are you sure you want to delete this chat? All messages will be lost.')) return;
    
    const updatedCustomChats = customChats.filter(chat => chat.id !== chatId);
    setCustomChats(updatedCustomChats);
    persistCustomChats(updatedCustomChats);
    
    const updatedChats = { ...chats };
    delete updatedChats[chatId];
    setChats(updatedChats);
    persistMessages(updatedChats);
    
    if (selectedChat === chatId) {
      setSelectedChat(null);
    }
  };

  // Helper: Get unread message count for a chat
  const getUnreadCount = (chatId: string): number => {
    if (!user) return 0;
    const messages = chats[chatId] || [];
    return messages.filter(msg => 
      msg.userId !== user.id && !msg.readBy?.includes(user.id)
    ).length;
  };

  // Helper: Find first unread message ID in current chat
  const getFirstUnreadMessageId = (): string | null => {
    if (!selectedChat || !user) return null;
    const messages = chats[selectedChat] || [];
    const firstUnread = messages.find(msg => 
      msg.userId !== user.id && !msg.readBy?.includes(user.id)
    );
    return firstUnread?.id || null;
  };

  const getDMAvatar = (dm: Chat): { initials: string; avatarUrl?: string } => {
    if (!user) return { initials: dm.icon };
    const otherParticipantId = dm.participants?.find(id => id !== user.id) || user.id;
    const person = allUsers.find(u => u.id === otherParticipantId);
    if (person?.name) {
      return {
        initials: person.name.split(' ').map(n => n[0]).join('').toUpperCase(),
        avatarUrl: person.avatarUrl,
      };
    }
    return { initials: dm.icon };
  };

  // Get all users (computed once per render, not in useEffect dependency)
  const allUsers = getAllUsers?.() || [];

  // Get all available chats
  const allChats: Chat[] = [...DEFAULT_CHANNELS, ...customChats, ...dmChats];
  const activeChats = allChats.filter(chat => !archivedChats.includes(chat.id));
  const archived = allChats.filter(chat => archivedChats.includes(chat.id));

  // Separate DMs from channels
  const activeDMs = activeChats.filter(chat => chat.isDM);
  const activeChannels = DEFAULT_CHANNELS.filter(chat => !archivedChats.includes(chat.id));
  const activeCustomChats = customChats.filter(chat => !archivedChats.includes(chat.id) && !chat.isDM);

  // Filter chats by search
  const filteredActiveChats = activeChats.filter(chat =>
    chat.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentMessages = selectedChat ? chats[selectedChat] || [] : [];
  
  // Filter messages by search when in a chat
  const filteredMessages = searchQuery && selectedChat
    ? currentMessages.filter(msg => 
        msg.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.userName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : currentMessages;

  // Helper to format date for grouping
  const getDateLabel = (message: Message): string => {
    // For messages without createdAt (old messages), use Today as default
    if (!message.createdAt) return 'Today';
    
    const msgDate = new Date(message.createdAt);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const msgDateStr = msgDate.toDateString();
    const todayStr = today.toDateString();
    const yesterdayStr = yesterday.toDateString();
    
    if (msgDateStr === todayStr) return 'Today';
    if (msgDateStr === yesterdayStr) return 'Yesterday';
    return msgDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  // Group messages by date
  const groupMessagesByDate = (messages: Message[]): { date: string; messages: Message[] }[] => {
    const groups: { [key: string]: Message[] } = {};
    
    messages.forEach(msg => {
      const dateLabel = getDateLabel(msg);
      if (!groups[dateLabel]) {
        groups[dateLabel] = [];
      }
      groups[dateLabel].push(msg);
    });
    
    return Object.entries(groups).map(([date, msgs]) => ({ date, messages: msgs }));
  };

  const messageGroups = groupMessagesByDate(filteredMessages);

  return (
    <div className="flex h-screen flex-col gap-6 overflow-hidden">
      <div className="flex flex-1 gap-0 overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900/50 backdrop-blur-sm shadow-2xl">
        {/* Left Sidebar - Messages List */}
        <div className="w-80 flex-shrink-0 border-r border-slate-700/50 bg-slate-900/80 backdrop-blur-md flex flex-col">
          {/* Header */}
          <div className="border-b border-slate-700/50 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white tracking-tight">Messages</h2>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowNewDMModal(true)}
                  className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-all duration-200"
                  title="New Direct Message"
                >
                  💬 DM
                </button>
                <button 
                  onClick={() => setShowNewChatModal(true)}
                  className="rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 px-3 py-1.5 text-xs font-medium text-white hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-lg shadow-orange-500/30"
                  title="Create New Channel"
                >
                  + New
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search chats and messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-600/50 bg-slate-800/50 px-4 py-2.5 text-sm text-white placeholder-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition-all duration-200"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors duration-150"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Channels List */}
          <div className="flex-1 overflow-y-auto px-3 py-4">
            {/* Standard Channels */}
            <div className="mb-6">
              <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Channels
              </p>
              <div className="space-y-2">
                {activeChannels.map((channel) => {
                  const memberCount = channelMembers[channel.id]?.length || 0;
                  const unreadCount = getUnreadCount(channel.id);
                  return (
                  <div key={channel.id} className="group relative">
                    <button
                      onClick={() => setSelectedChat(channel.id)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                        selectedChat === channel.id
                          ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30"
                          : "text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      <span className={selectedChat === channel.id ? "text-white" : channel.color}>
                        {channel.icon}
                      </span>
                      <span className="flex-1 text-left">{channel.label}</span>
                      {unreadCount > 0 && (
                        <span className="text-xs bg-orange-500 px-2 py-0.5 rounded-full font-bold text-white shadow-lg shadow-orange-500/50" title={`${unreadCount} unread messages`}>
                          {unreadCount}
                        </span>
                      )}
                    </button>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 flex gap-0.5 transition-opacity duration-200">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedChat(channel.id);
                          setShowMembersModal(true);
                        }}
                        className="text-slate-400 hover:text-white text-xs px-1.5 py-1 rounded-lg hover:bg-slate-700/50 transition-colors duration-200"
                        title="Manage members"
                      >
                        ⚙️
                      </button>
                      <button
                        onClick={() => toggleArchiveChat(channel.id)}
                        className="text-slate-400 hover:text-white text-xs px-1.5 py-1 rounded-lg hover:bg-slate-700/50 transition-colors duration-200"
                        title="Archive"
                      >
                        📦
                      </button>
                    </div>
                  </div>
                );})}
              </div>
            </div>

            {/* Direct Messages */}
            {activeDMs.length > 0 && (
              <div className="mb-6">
                <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Direct Messages ({activeDMs.length})
                </p>
                <div className="space-y-2">
                  {activeDMs.map((dm) => {
                    const unreadCount = getUnreadCount(dm.id);
                    const dmAvatar = getDMAvatar(dm);
                    return (
                    <div key={dm.id} className="group relative">
                      <button
                        onClick={() => setSelectedChat(dm.id)}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                          selectedChat === dm.id
                            ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30"
                            : "text-slate-300 hover:bg-slate-800"
                        }`}
                      >
                        {dmAvatar.avatarUrl ? (
                          <img
                            src={dmAvatar.avatarUrl}
                            alt={dm.label}
                            className="h-7 w-7 flex-shrink-0 rounded-full object-cover shadow-sm"
                          />
                        ) : (
                          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-orange-600 text-[10px] font-bold text-white shadow-sm">
                            {dmAvatar.initials}
                          </div>
                        )}
                        <span className="flex-1 text-left">{dm.label}</span>
                        {unreadCount > 0 && (
                          <span className="text-xs bg-orange-500 px-2 py-0.5 rounded-full font-bold text-white shadow-lg shadow-orange-500/50" title={`${unreadCount} unread messages`}>
                            {unreadCount}
                          </span>
                        )}
                      </button>
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 flex gap-0.5 transition-opacity duration-200">
                        <button
                          onClick={() => toggleArchiveChat(dm.id)}
                          className="text-slate-400 hover:text-white text-xs px-1.5 py-1 rounded-lg hover:bg-slate-700/50 transition-colors duration-200"
                          title="Archive"
                        >
                          📦
                        </button>
                      </div>
                    </div>
                  );})}
                </div>
              </div>
            )}

            {/* User-Created Chats */}
            {activeCustomChats.length > 0 && (
              <div className="mb-6">
                <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Custom Channels ({activeCustomChats.length})
                </p>
                <div className="space-y-2">
                  {activeCustomChats.map((chat) => {
                    const memberCount = channelMembers[chat.id]?.length || 0;
                    const unreadCount = getUnreadCount(chat.id);
                    return (
                    <div key={chat.id} className="group relative">
                      <button
                        onClick={() => setSelectedChat(chat.id)}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                          selectedChat === chat.id
                            ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30"
                            : "text-slate-300 hover:bg-slate-800"
                        }`}
                      >
                        <span className={selectedChat === chat.id ? "text-white" : chat.color}>
                          {chat.icon}
                        </span>
                        <span className="flex-1 text-left">{chat.label}</span>
                        {unreadCount > 0 && (
                          <span className="text-xs bg-orange-500 px-2 py-0.5 rounded-full font-bold text-white shadow-lg shadow-orange-500/50" title={`${unreadCount} unread messages`}>
                            {unreadCount}
                          </span>
                        )}
                      </button>
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 flex gap-0.5 transition-opacity duration-200">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedChat(chat.id);
                            setShowMembersModal(true);
                          }}
                          className="text-slate-400 hover:text-white text-xs px-1.5 py-1 rounded-lg hover:bg-slate-700/50 transition-colors duration-200"
                          title="Manage members"
                        >
                          ⚙️
                        </button>
                        <button
                          onClick={() => toggleArchiveChat(chat.id)}
                          className="text-slate-400 hover:text-white text-xs px-1.5 py-1 rounded-lg hover:bg-slate-700/50 transition-colors duration-200"
                          title="Archive"
                        >
                          📦
                        </button>
                        <button
                          onClick={() => deleteCustomChat(chat.id)}
                          className="text-red-400 hover:text-red-300 text-xs px-1"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );})}
                </div>
              </div>
            )}

            {/* Archived */}
            {archived.length > 0 && (
              <div>
                <button 
                  onClick={() => setShowArchived(!showArchived)}
                  className="mb-2 px-2 flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-400 transition-colors duration-200"
                >
                  <span>Archived ({archived.length})</span>
                  <span className="text-sm">{showArchived ? '▼' : '▶'}</span>
                </button>
                {showArchived && (
                  <div className="space-y-2">
                    {archived.map((chat) => (
                      <div key={chat.id} className="group relative">
                        <button
                          onClick={() => setSelectedChat(chat.id)}
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                            selectedChat === chat.id
                              ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30"
                              : "text-slate-500 hover:bg-slate-800 hover:text-slate-300"
                          }`}
                        >
                          <span>{chat.icon}</span>
                          <span className="flex-1 text-left">{chat.label}</span>
                        </button>
                        <button
                          onClick={() => toggleArchiveChat(chat.id)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-white text-xs px-1.5 py-1 rounded-lg hover:bg-slate-700/50 transition-all duration-200"
                          title="Unarchive"
                        >
                          📤
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="border-t border-slate-700/50 p-4 bg-slate-900/50">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-orange-600 text-white font-bold shadow-md">
                {user ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : '??'}
              </div>
              <div className="text-left flex-1">
                <p className="text-sm font-semibold text-white">{user?.name || 'Not logged in'}</p>
                <p className="text-xs text-slate-400">{user?.role || 'Guest'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Content - Message Area */}
        {selectedChat ? (
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="border-b border-slate-700/50 p-5 flex items-center justify-between bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg">
                  {allChats.find(c => c.id === selectedChat)?.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white tracking-tight">
                    {allChats.find(c => c.id === selectedChat)?.label}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {filteredMessages.length} message{filteredMessages.length !== 1 ? 's' : ''}
                    {searchQuery && ` (filtered)`}
                  </p>
                </div>
              </div>
              {!DEFAULT_CHANNELS.find(c => c.id === selectedChat) && (
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleArchiveChat(selectedChat)}
                    className="text-sm text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-slate-600/50 hover:bg-slate-800 transition-all duration-200"
                    title={archivedChats.includes(selectedChat) ? "Unarchive" : "Archive"}
                  >
                    {archivedChats.includes(selectedChat) ? '📤 Unarchive' : '📦 Archive'}
                  </button>
                  <button
                    onClick={() => deleteCustomChat(selectedChat)}
                    className="text-sm text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg border border-red-600/50 hover:bg-red-900/30 transition-all duration-200"
                  >
                    🗑️ Delete
                  </button>
                </div>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {filteredMessages.length === 0 ? (
                <div className="flex h-full items-center justify-center text-center">
                  <div>
                    <div className="mb-4 text-5xl">💬</div>
                    <p className="text-slate-400">
                      {searchQuery ? 'No messages match your search.' : 'No messages yet. Start the conversation!'}
                    </p>
                  </div>
                </div>
              ) : (
                messageGroups.map((group, groupIndex) => (
                  <div key={groupIndex}>
                    {/* Date Separator */}
                    <div className="flex items-center gap-4 my-6">
                      <div className="flex-1 border-t border-slate-700/50"></div>
                      <p className="text-xs font-semibold text-slate-400 px-3 py-1 bg-slate-800/50 rounded-full">
                        {group.date}
                      </p>
                      <div className="flex-1 border-t border-slate-700/50"></div>
                    </div>
                    
                    {/* Messages for this date */}
                    <div className="space-y-4">
                      {group.messages.map((message, index) => {
                        const firstUnreadId = getFirstUnreadMessageId();
                        const isFirstUnread = firstUnreadId === message.id;
                        
                        return (
                        <div key={message.id}>
                          {/* New Messages Divider */}
                          {isFirstUnread && (
                            <div className="flex items-center gap-3 my-4 -mx-2">
                              <div className="flex-1 border-t-2 border-orange-500"></div>
                              <span className="text-xs font-bold text-orange-500 px-3 py-1 bg-orange-500/10 rounded-full border border-orange-500/30">
                                New Messages
                              </span>
                              <div className="flex-1 border-t-2 border-orange-500"></div>
                            </div>
                          )}
                          
                          <div className="group flex gap-3 hover:bg-slate-800/30 -mx-2 px-3 py-2 rounded-xl transition-colors duration-150">
                          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-orange-600 text-xs font-bold text-white shadow-md">
                            {message.avatar}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2">
                              <p className="text-sm font-semibold text-white">{message.userName}</p>
                              <p className="text-xs text-slate-500">{message.timestamp}</p>
                              {message.userId === user?.id && (
                                <span className="text-xs text-slate-500">(you)</span>
                              )}
                              {message.edited && (
                                <span className="text-xs text-slate-500 italic" title={`Edited at ${message.editedAt}`}>
                                  (edited)
                                </span>
                              )}
                            </div>
                      
                      {/* Message Content or Edit Input */}
                      {editingMessageId === message.id ? (
                        <div className="mt-1 space-y-2">
                          <input
                            type="text"
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleEditMessage(message.id, editingText);
                              } else if (e.key === 'Escape') {
                                setEditingMessageId(null);
                                setEditingText('');
                              }
                            }}
                            className="w-full rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition-all duration-200"
                            autoFocus
                          />
                          <div className="flex gap-2 text-xs">
                            <button
                              onClick={() => handleEditMessage(message.id, editingText)}
                              className="text-orange-400 hover:text-orange-300"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setEditingMessageId(null);
                                setEditingText('');
                              }}
                              className="text-slate-400 hover:text-slate-300 transition-colors duration-150"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-1 relative">
                          <p className="rounded-2xl bg-slate-800/60 px-4 py-2.5 text-sm text-slate-100 break-words">
                            {message.text}
                          </p>
                          
                          {/* Hover Actions */}
                          {user && (
                            <div className="absolute -top-3 right-2 hidden group-hover:flex items-center gap-0.5 bg-slate-800 border border-slate-600/50 rounded-xl shadow-xl px-1 py-0.5 backdrop-blur-sm">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowReactionPicker(showReactionPicker === message.id ? null : message.id);
                                }}
                                className="text-sm hover:bg-slate-700 px-2 py-1 rounded-lg transition-colors duration-150"
                                title="Add reaction"
                              >
                                😊
                              </button>
                              {message.userId === user.id && (
                                <>
                                  <button
                                    onClick={() => {
                                      setEditingMessageId(message.id);
                                      setEditingText(message.text);
                                    }}
                                    className="text-xs text-slate-300 hover:bg-slate-700 px-2 py-1 rounded-lg transition-colors duration-150"
                                    title="Edit message"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    onClick={() => handleDeleteMessage(message.id)}
                                    className="text-xs text-red-400 hover:bg-slate-700 px-2 py-1 rounded-lg transition-colors duration-150"
                                    title="Delete message"
                                  >
                                    🗑️
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                          
                          {/* Reaction Picker */}
                          {showReactionPicker === message.id && (
                            <div 
                              className="absolute top-full right-0 mt-2 bg-slate-800 border border-slate-600/50 rounded-xl shadow-2xl p-2 flex gap-1 z-10 backdrop-blur-md"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {commonEmojis.map(emoji => (
                                <button
                                  key={emoji}
                                  onClick={() => handleAddReaction(message.id, emoji)}
                                  className="text-lg hover:bg-slate-700 px-2 py-1.5 rounded-lg transition-all duration-150 hover:scale-110"
                                  title={`React with ${emoji}`}
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Reactions Display */}
                      {message.reactions && Object.keys(message.reactions).length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {Object.entries(message.reactions).map(([emoji, userIds]) => {
                            if (userIds.length === 0) return null;
                            const reacterNames = userIds
                              .map(id => allUsers.find(u => u.id === id)?.name || 'Unknown')
                              .join(', ');
                            const hasReacted = user && userIds.includes(user.id);
                            
                            return (
                              <button
                                key={emoji}
                                onClick={() => handleAddReaction(message.id, emoji)}
                                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs border transition-all duration-200 ${
                                  hasReacted
                                    ? 'bg-orange-500/20 border-orange-500 text-orange-300 shadow-md shadow-orange-500/20'
                                    : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500'
                                }`}
                                title={reacterNames}
                              >
                                <span>{emoji}</span>
                                <span className="font-medium">{userIds.length}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                      
                      {/* Read Receipts */}
                      {message.readBy && message.readBy.length > 1 && (
                        <div className="mt-1 text-xs text-slate-500" title={`Read by ${message.readBy.length} people`}>
                          <span>✓✓ Read by {message.readBy.length}</span>
                        </div>
                      )}
                    </div>
                  </div>
                        </div>
                      );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input Area */}
            <div className="border-t border-slate-700/50 bg-slate-900/50">
              {/* Typing Indicator */}
              {typingUsers[selectedChat]?.length > 0 && (
                <div className="px-6 pt-3 pb-1">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                    <span>
                      {typingUsers[selectedChat].slice(0, 3).join(', ')} 
                      {typingUsers[selectedChat].length === 1 ? ' is' : ' are'} typing...
                    </span>
                  </div>
                </div>
              )}
              
              <div className="p-6">
                {user ? (
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Type a message..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                      className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition-all duration-200 shadow-sm"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!input.trim()}
                      className="rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-3 font-medium text-white hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-orange-500/30 disabled:shadow-none"
                    >
                      Send
                    </button>
                  </div>
                ) : (
                  <div className="text-center text-slate-400">
                    Please log in to send messages
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="text-center">
              <div className="mb-4 text-5xl">💬</div>
              <h3 className="mb-2 text-lg font-semibold text-white tracking-tight">
                Select a chat to start messaging
              </h3>
              <p className="text-slate-400">
                Choose from organisation channels or create your own custom chats
              </p>
              {searchQuery && (
                <p className="mt-2 text-sm text-slate-500">
                  Showing results for: "{searchQuery}"
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* New Channel Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => {
          setShowNewChatModal(false);
          setNewChatName('');
          setSelectedUsers([]);
        }}>
          <div className="bg-slate-800 rounded-2xl p-6 w-96 max-h-[80vh] overflow-y-auto border border-slate-700/50 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white mb-4 tracking-tight">Create New Channel</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Channel Name
                </label>
                <input
                  type="text"
                  value={newChatName}
                  onChange={(e) => setNewChatName(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && selectedUsers.length === 0 && handleCreateChat()}
                  placeholder="e.g., Project Alpha Team"
                  className="w-full rounded-xl border border-slate-600/50 bg-slate-900/50 px-4 py-2.5 text-white placeholder-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition-all duration-200"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Add Members (Optional)
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto bg-slate-900/50 rounded-xl p-2 border border-slate-700/30">
                  {allUsers.filter(u => u.id !== user?.id).map((u) => (
                    <label key={u.id} className="flex items-center gap-3 p-2 hover:bg-slate-700/50 rounded-lg cursor-pointer transition-colors duration-150">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(u.id)}
                        onChange={() => toggleUserSelection(u.id)}
                        className="rounded border-slate-600"
                      />
                      <div className="flex-1">
                        <div className="text-sm text-white">{u.name}</div>
                        <div className="text-xs text-slate-400">{u.role}</div>
                      </div>
                    </label>
                  ))}
                </div>
                {selectedUsers.length > 0 && (
                  <p className="text-xs text-slate-400 mt-2">{selectedUsers.length} member(s) selected</p>
                )}
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowNewChatModal(false);
                    setNewChatName('');
                    setSelectedUsers([]);
                  }}
                  className="px-4 py-2 text-slate-300 hover:text-white transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateChat}
                  disabled={!newChatName.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-orange-500/30"
                >
                  Create Channel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New DM Modal */}
      {showNewDMModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => {
          setShowNewDMModal(false);
          setSelectedUsers([]);
        }}>
          <div className="bg-slate-800 rounded-2xl p-6 w-96 max-h-[80vh] overflow-y-auto border border-slate-700/50 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white mb-4 tracking-tight">New Direct Message</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Select User
                </label>
                <div className="space-y-2 max-h-96 overflow-y-auto bg-slate-900/50 rounded-xl p-2 border border-slate-700/30">
                  {allUsers.map((u) => {
                    const isMe = u.id === user?.id;
                    const initials = u.name.split(' ').map(n => n[0]).join('').toUpperCase();
                    return (
                    <button
                      key={u.id}
                      onClick={() => {
                        setSelectedUsers([u.id]);
                        setTimeout(() => handleCreateDM(), 100);
                      }}
                      className="w-full flex items-center gap-3 p-3 hover:bg-slate-700/50 rounded-lg text-left transition-all duration-150"
                    >
                      {u.avatarUrl ? (
                        <img
                          src={u.avatarUrl}
                          alt={u.name}
                          className="h-10 w-10 rounded-full object-cover shadow-md"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-orange-600 text-white font-bold shadow-md">
                          {initials}
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="text-sm text-white font-medium">{u.name} {isMe ? '(You)' : ''}</div>
                        <div className="text-xs text-slate-400">{isMe ? '📝 Reminders & Notes' : u.role}</div>
                      </div>
                    </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowNewDMModal(false);
                    setSelectedUsers([]);
                  }}
                  className="px-4 py-2 text-slate-300 hover:text-white transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Members Management Modal */}
      {showMembersModal && selectedChat && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowMembersModal(false)}>
          <div className="bg-slate-800 rounded-2xl p-6 w-96 max-h-[80vh] overflow-y-auto border border-slate-700/50 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white mb-4 tracking-tight">
              Manage Members - {allChats.find(c => c.id === selectedChat)?.label}
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-300 mb-3 font-medium">Current Members ({(channelMembers[selectedChat] || []).length})</p>
                <div className="space-y-2 max-h-48 overflow-y-auto bg-slate-900/50 rounded-xl p-2 border border-slate-700/30">
                  {allUsers.filter(u => (channelMembers[selectedChat] || []).includes(u.id)).map((u) => (
                    <div key={u.id} className="flex items-center gap-3 p-2 hover:bg-slate-700/50 rounded-lg transition-colors duration-150">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-orange-600 text-white font-bold text-xs shadow-sm">
                        {u.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-white">{u.name}</div>
                        <div className="text-xs text-slate-400">{u.role}</div>
                      </div>
                      {u.id !== user?.id && (
                        <button
                          onClick={() => handleRemoveMember(selectedChat, u.id)}
                          className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded-lg hover:bg-red-900/20 transition-colors duration-150"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm text-slate-300 mb-3 font-medium">Add Members</p>
                <div className="space-y-2 max-h-48 overflow-y-auto bg-slate-900/50 rounded-xl p-2 border border-slate-700/30">
                  {allUsers.filter(u => !(channelMembers[selectedChat] || []).includes(u.id)).map((u) => (
                    <button
                      key={u.id}
                      onClick={() => handleAddMember(selectedChat, u.id)}
                      className="w-full flex items-center gap-3 p-2 hover:bg-slate-700/50 rounded-lg text-left transition-colors duration-150"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-600 text-white font-bold text-xs">
                        {u.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-white">{u.name}</div>
                        <div className="text-xs text-slate-400">{u.role}</div>
                      </div>
                      <span className="text-green-400 text-xs">+ Add</span>
                    </button>
                  ))}
                  {allUsers.filter(u => !(channelMembers[selectedChat] || []).includes(u.id)).length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-4">All users are members</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 justify-end border-t border-slate-700/50 pt-4">
                <button
                  onClick={() => setShowMembersModal(false)}
                  className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-lg shadow-orange-500/30"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
