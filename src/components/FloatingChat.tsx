"use client";

import { useState, useEffect, useRef } from 'react';
import { useFloatingChat } from '@/lib/floating-chat-context';
import { useAuth } from '@/lib/auth-context';

interface Message {
  id: string;
  text: string;
  userId: string;
  userName: string;
  avatar: string;
  timestamp: string;
  createdAt?: string;
  edited?: boolean;
  editedAt?: string;
  reactions?: Record<string, string[]>;
  readBy?: string[];
}

interface Chat {
  id: string;
  label: string;
  icon: string;
  color: string;
  isChannel: boolean;
  isDM?: boolean;
  archived?: boolean;
  participants?: string[];
  createdAt?: string;
}

const DEFAULT_CHANNELS = [
  { id: "general", icon: "#", label: "General Chat", color: "text-blue-400", isChannel: true },
  { id: "vehicle", icon: "👥", label: "Vehicle Chat", color: "text-green-400", isChannel: true },
  { id: "internal", icon: "🔒", label: "Internal Chat", color: "text-purple-400", isChannel: true },
  { id: "announcements", icon: "📢", label: "Announcements", color: "text-yellow-400", isChannel: true },
];

export default function FloatingChat() {
  const { isOpen, closeChat, openChat, playNotificationSound } = useFloatingChat();
  const { user, getAllUsers } = useAuth();
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [allMessages, setAllMessages] = useState<{ [key: string]: Message[] }>({});
  const [customChats, setCustomChats] = useState<Chat[]>([]);
  const [dmChats, setDmChats] = useState<Chat[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showNewDMModal, setShowNewDMModal] = useState(false);
  const [dmSearchQuery, setDmSearchQuery] = useState('');
  const [previousMessageCount, setPreviousMessageCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat data from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadData = () => {
      const storedMessages = localStorage.getItem('kbm_chat_messages');
      const storedCustomChats = localStorage.getItem('kbm_custom_chats');
      const storedDMChats = localStorage.getItem('kbm_dm_chats');

      if (storedMessages) {
        try {
          setAllMessages(JSON.parse(storedMessages));
        } catch (error) {
          console.error('Failed to parse messages:', error);
        }
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

      // Set initial selected chat
      setSelectedChat("general");
    };

    loadData();

    // Listen for storage changes
    const handleStorageChange = () => {
      loadData();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Subscribe to localStorage changes from same window
  useEffect(() => {
    if (typeof window === 'undefined' || !isOpen) return;

    const interval = setInterval(() => {
      const storedMessages = localStorage.getItem('kbm_chat_messages');
      if (storedMessages) {
        try {
          const parsed = JSON.parse(storedMessages);
          setAllMessages(parsed);
        } catch (error) {
          console.error('Failed to parse messages:', error);
        }
      }
    }, 1000); // Sync every 1 second

    return () => clearInterval(interval);
  }, [isOpen]);

  // Monitor for new messages from others and auto-open + play sound
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleMessageUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail) {
        setAllMessages(customEvent.detail);
      }
    };

    // Listen for custom sync event
    window.addEventListener('chat-message-update', handleMessageUpdate);

    const interval = setInterval(() => {
      const storedMessages = localStorage.getItem('kbm_chat_messages');
      if (storedMessages) {
        try {
          const parsed = JSON.parse(storedMessages);
          const totalMessages = Object.values(parsed).reduce((sum: number, msgs: any) => sum + msgs.length, 0);

          // Check if there are new messages from someone else
          if (totalMessages > previousMessageCount) {
            // Find if any new message is from another user
            let hasNewMessageFromOther = false;
            for (const chatId in parsed) {
              const messages = parsed[chatId];
              const oldMessages = allMessages[chatId] || [];
              if (messages.length > oldMessages.length) {
                const newMsg = messages[messages.length - 1];
                if (newMsg.userId !== user?.id) {
                  hasNewMessageFromOther = true;
                  break;
                }
              }
            }

            if (hasNewMessageFromOther) {
              playNotificationSound();
              openChat();
            }
          }

          setPreviousMessageCount(totalMessages);
          setAllMessages(parsed);
        } catch (error) {
          console.error('Failed to parse messages:', error);
        }
      }
    }, 500); // Check every 500ms

    return () => {
      window.removeEventListener('chat-message-update', handleMessageUpdate);
      clearInterval(interval);
    };
  }, [previousMessageCount, allMessages, user, openChat, playNotificationSound]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages, selectedChat]);

  // Refresh DM chats when modal opens
  useEffect(() => {
    if (showNewDMModal) {
      setDmSearchQuery('');
      const storedDMChats = localStorage.getItem('kbm_dm_chats');
      if (storedDMChats) {
        try {
          setDmChats(JSON.parse(storedDMChats));
        } catch (error) {
          console.error('Failed to parse DM chats:', error);
        }
      }
    }
  }, [showNewDMModal]);

  const getAllChats = (): Chat[] => {
    const channels = DEFAULT_CHANNELS.map(ch => ({ ...ch }));
    return [...channels, ...customChats, ...dmChats];
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedChat || !user) return;

    const message: Message = {
      id: `msg-${Date.now()}`,
      text: newMessage,
      userId: user.id,
      userName: user.name || 'You',
      avatar: user.name?.split(' ').map(n => n[0]).join('') || 'U',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString(),
      readBy: [user.id],
    };

    const updated = { ...allMessages };
    if (!updated[selectedChat]) {
      updated[selectedChat] = [];
    }
    updated[selectedChat].push(message);

    setAllMessages(updated);
    localStorage.setItem('kbm_chat_messages', JSON.stringify(updated));
    setNewMessage('');

    // Trigger custom event for real-time sync
    window.dispatchEvent(new CustomEvent('chat-message-update', { detail: updated }));
  };

  const getUnreadCount = (chatId: string) => {
    const messages = allMessages[chatId] || [];
    return messages.filter(
      msg => msg.userId !== user?.id && !msg.readBy?.includes(user?.id || '')
    ).length;
  };

  const handleStartDM = (targetUserId: string) => {
    if (!user) return;

    const dmId = [user.id, targetUserId].sort().join('-');
    const targetUser = getAllUsers().find(u => u.id === targetUserId);

    if (!targetUser) return;
    const targetInitials = targetUser.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

    // Check if DM already exists
    const existingDM = dmChats.find(dm => dm.id === dmId);

    if (!existingDM) {
      // Create new DM chat
      const newDM: Chat = {
        id: dmId,
        label: targetUser.name || 'User',
        icon: targetInitials,
        color: 'text-blue-400',
        isDM: true,
        isChannel: false,
        participants: [user.id, targetUserId],
        createdAt: new Date().toISOString(),
      };

      const updatedDMChats = [...dmChats, newDM];
      setDmChats(updatedDMChats);
      localStorage.setItem('kbm_dm_chats', JSON.stringify(updatedDMChats));

      // Initialize messages for this DM if not exists
      if (!allMessages[dmId]) {
        const updated = { ...allMessages, [dmId]: [] };
        setAllMessages(updated);
        localStorage.setItem('kbm_chat_messages', JSON.stringify(updated));
      }
    }

    setSelectedChat(dmId);
    setShowNewDMModal(false);
  };

  const currentChatMessages = allMessages[selectedChat || ''] || [];

  const allChats = getAllChats();

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 h-96 bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl shadow-slate-950 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3 flex items-center justify-between">
        <h3 className="font-bold text-white">💬 Quick Chat</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewDMModal(true)}
            className="text-white hover:text-orange-100 transition-colors text-sm font-medium"
            title="Start new DM"
          >
            ➕
          </button>
          <button
            onClick={closeChat}
            className="text-white hover:text-orange-100 transition-colors text-lg"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Chat Selection */}
      {allChats.length > 0 && (
        <div className="px-3 py-2 border-b border-slate-700/50 bg-slate-800/30">
          <select
            value={selectedChat || ''}
            onChange={(e) => setSelectedChat(e.target.value)}
            className="w-full bg-slate-800 border border-slate-600/50 text-slate-100 text-sm rounded-lg px-2 py-1 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all duration-200"
          >
            <option value="">Select a chat...</option>
            {allChats.map(chat => {
              const unread = getUnreadCount(chat.id);
              return (
                <option key={chat.id} value={chat.id}>
                  {chat.label} {unread > 0 ? `(${unread})` : ''}
                </option>
              );
            })}
          </select>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
        {currentChatMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-500 text-sm">
            <p>No messages yet in {selectedChat}</p>
          </div>
        ) : (
          <>
            {currentChatMessages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2 ${message.userId === user?.id ? 'flex-row-reverse' : ''}`}
              >
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-xs font-bold text-white">
                  {message.avatar}
                </div>
                <div className={`flex-1 ${message.userId === user?.id ? 'text-right' : ''}`}>
                  <p className="text-xs text-slate-400">{message.userName}</p>
                  <p className={`${
                    message.userId === user?.id
                      ? 'bg-orange-500/30 text-orange-100'
                      : 'bg-slate-800 text-slate-100'
                  } rounded-lg px-3 py-1.5 text-sm max-w-xs break-words inline-block`}>
                    {message.text}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-700/50 bg-slate-800/30 px-3 py-2 flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Type message..."
          className="flex-1 bg-white border border-slate-300 text-slate-900 text-sm rounded-lg px-3 py-2 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all duration-200 placeholder-slate-500"
        />
        <button
          onClick={handleSendMessage}
          className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-lg font-medium text-sm transition-colors duration-200"
        >
          Send
        </button>
      </div>

      {/* New DM Modal */}
      {showNewDMModal && (
        <div className="fixed inset-0 bg-black/70 rounded-2xl flex items-center justify-center z-[60]">
          <div className="bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl w-full max-w-sm h-96 flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 border-b border-slate-700 flex items-center justify-between rounded-t-2xl">
              <h3 className="font-bold text-white text-lg">Start Direct Message</h3>
              <button
                onClick={() => {
                  setShowNewDMModal(false);
                  setDmSearchQuery('');
                }}
                className="text-white hover:text-orange-100 transition-colors text-xl"
              >
                ✕
              </button>
            </div>

            {/* Search Input */}
            <div className="px-6 py-4 border-b border-slate-700/50 bg-slate-800/30">
              <input
                type="text"
                value={dmSearchQuery}
                onChange={(e) => setDmSearchQuery(e.target.value)}
                placeholder="Search people..."
                autoFocus
                className="w-full bg-slate-800 border border-slate-600/50 text-slate-100 text-sm rounded-lg px-4 py-2 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all duration-200 placeholder-slate-500"
              />
            </div>

            {/* User List */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 space-y-2">
                {getAllUsers()
                .filter(u => u.name?.toLowerCase().includes(dmSearchQuery.toLowerCase()))
                .map(u => {
                    const isMe = u.id === user?.id;
                    const initials = u.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
                    return (
                      <button
                      key={u.id}
                      onClick={() => {
                        handleStartDM(u.id);
                        setDmSearchQuery('');
                      }}
                      className="w-full text-left px-4 py-3 rounded-lg bg-slate-800/40 hover:bg-slate-700 transition-all duration-150 border border-slate-700/30 hover:border-orange-500/50"
                    >
                      <div className="flex items-center gap-3">
                        {u.avatarUrl ? (
                          <img
                            src={u.avatarUrl}
                            alt={u.name}
                            className="h-8 w-8 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                            {initials}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-100 truncate">{u.name} {isMe ? '(You)' : ''}</p>
                          <p className="text-xs text-slate-400 truncate">{isMe ? '📝 Reminders & Notes' : u.email}</p>
                        </div>
                      </div>
                      </button>
                      );
                    })}
              </div>

              {getAllUsers().filter(u => u.name?.toLowerCase().includes(dmSearchQuery.toLowerCase())).length === 0 && (
                <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                  <p>No users found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
