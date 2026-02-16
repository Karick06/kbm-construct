"use client";

import { useState } from "react";

const channels = [
  { id: "general", icon: "#", label: "General Chat", color: "text-blue-400" },
  { id: "vehicle", icon: "👥", label: "Vehicle Chat", color: "text-green-400" },
  { id: "internal", icon: "🔒", label: "Internal Chat", color: "text-purple-400" },
  { id: "announcements", icon: "📢", label: "Announcements", color: "text-yellow-400" },
];

const userChats = [
  { id: "test", icon: "🔒", label: "Test", color: "text-purple-400" },
];

type Message = {
  id: string;
  text: string;
  user: string;
  avatar: string;
  timestamp: string;
};

type ChatState = {
  [key: string]: Message[];
};

export default function ChatPage() {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [chats, setChats] = useState<ChatState>({
    general: [
      { id: "1", text: "Welcome to General Chat!", user: "Mark Pargin", avatar: "MP", timestamp: "10:30 AM" },
    ],
    vehicle: [],
    internal: [],
    announcements: [],
    test: [],
  });

  const handleSendMessage = () => {
    if (!input.trim() || !selectedChat) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: input,
      user: "You",
      avatar: "MP",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setChats((prev) => ({
      ...prev,
      [selectedChat]: [...(prev[selectedChat] || []), newMessage],
    }));

    setInput("");
  };

  const currentMessages = selectedChat ? chats[selectedChat] || [] : [];

  return (
    <div className="flex h-screen flex-col gap-8 overflow-hidden">
      <div>
        <h1 className="text-3xl font-bold text-white">Chat</h1>
        <p className="mt-2 text-gray-300">Team communication hub</p>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden rounded-lg border border-gray-700 bg-gray-800">
        {/* Left Sidebar - Messages List */}
        <div className="w-80 flex-shrink-0 border-r border-gray-700 bg-gray-850 flex flex-col">
          {/* Header */}
          <div className="border-b border-gray-700 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Messages</h2>
              <button className="rounded-full border border-gray-600 px-3 py-1 text-sm font-medium text-white hover:bg-gray-700">
                + New
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search chats..."
                className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 text-sm text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Channels List */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Standard Channels */}
            <div className="mb-8">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">
                4 Standard Channels
              </p>
              <div className="space-y-2">
                {channels.map((channel) => (
                  <button
                    key={channel.id}
                    onClick={() => setSelectedChat(channel.id)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                      selectedChat === channel.id
                        ? "bg-orange-500 text-white"
                        : "text-gray-300 hover:bg-gray-700"
                    }`}
                  >
                    <span className={selectedChat === channel.id ? "text-white" : channel.color}>
                      {channel.icon}
                    </span>
                    <span>{channel.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* User-Created Chats */}
            <div className="mb-8">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">
                User-Created Chats
              </p>
              <div className="space-y-2">
                {userChats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => setSelectedChat(chat.id)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                      selectedChat === chat.id
                        ? "bg-orange-500 text-white"
                        : "text-gray-300 hover:bg-gray-700"
                    }`}
                  >
                    <span className={selectedChat === chat.id ? "text-white" : chat.color}>
                      {chat.icon}
                    </span>
                    <span>{chat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Archived */}
            <div>
              <button className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200">
                <span>▶</span>
                <span>Archived</span>
              </button>
            </div>
          </div>

          {/* User Profile */}
          <div className="border-t border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-white font-bold">
                MP
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-white">Mark Pargin</p>
                <p className="text-xs text-gray-400">Click to add a photo</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Content - Message Area */}
        {selectedChat ? (
          <div className="flex-1 flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {currentMessages.length === 0 ? (
                <div className="flex h-full items-center justify-center text-center">
                  <div>
                    <div className="mb-4 text-5xl">💬</div>
                    <p className="text-gray-400">No messages yet. Start the conversation!</p>
                  </div>
                </div>
              ) : (
                currentMessages.map((message) => (
                  <div key={message.id} className="flex gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
                      {message.avatar}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2">
                        <p className="text-sm font-semibold text-white">{message.user}</p>
                        <p className="text-xs text-gray-500">{message.timestamp}</p>
                      </div>
                      <p className="mt-1 rounded-lg bg-gray-700 px-3 py-2 text-sm text-gray-100">
                        {message.text}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-700 p-6">
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  className="flex-1 rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-white placeholder-gray-400 focus:border-orange-500 focus:outline-none"
                />
                <button
                  onClick={handleSendMessage}
                  className="rounded-lg bg-orange-500 px-6 py-2 font-medium text-white hover:bg-orange-600"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="text-center">
              <div className="mb-4 text-5xl">💬</div>
              <h3 className="mb-2 text-lg font-semibold text-white">
                Select a chat to start messaging
              </h3>
              <p className="text-gray-400">
                Choose from organisation channels or project chats
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
