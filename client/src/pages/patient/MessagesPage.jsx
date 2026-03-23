import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { messageService } from '../../services/messageService';
import { appointmentService } from '../../services/appointmentService';
import { useAuth } from '../../auth/AuthContext';

function MessagesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedDoctorName, setSelectedDoctorName] = useState('');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDoctorList, setShowDoctorList] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadConversations();
    loadDoctors();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      loadMessages();
      const interval = setInterval(loadMessages, 3000); // Poll every 3 seconds
      return () => clearInterval(interval);
    }
  }, [selectedUserId]);

  const loadConversations = async () => {
    try {
      const data = await messageService.getConversations();
      setConversations(data.conversations || []);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  const loadDoctors = async () => {
    try {
      const data = await appointmentService.getDoctors();
      setDoctors(data.doctors || []);
    } catch (err) {
      console.error('Failed to load doctors:', err);
    }
  };

  const handleSelectDoctor = (doctor) => {
    setSelectedUserId(doctor.user_id);
    setSelectedDoctorName(doctor.name);
    setShowDoctorList(false);
    // Check if conversation already exists
    const existingConv = conversations.find((c) => c.other_user_id === doctor.user_id);
    if (!existingConv) {
      // Add to conversations list temporarily
      setConversations((prev) => [
        ...prev,
        {
          other_user_id: doctor.user_id,
          other_user_name: doctor.name,
          other_user_role: 'doctor',
          last_message: t('messages.startConversation'),
        },
      ]);
    }
  };

  const loadMessages = async () => {
    if (!selectedUserId) return;
    try {
      const data = await messageService.getConversationWithUser(selectedUserId);
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUserId) return;

    setLoading(true);
    try {
      await messageService.sendMessage(selectedUserId, newMessage);
      setNewMessage('');
      await loadMessages();
      await loadConversations();
      // Update the conversation in the list with the new message
      setConversations((prev) =>
        prev.map((conv) =>
          conv.other_user_id === selectedUserId
            ? { ...conv, last_message: newMessage }
            : conv
        )
      );
    } catch (err) {
      toast.error(err.response?.data?.message || t('messages.failedToSend'));
    } finally {
      setLoading(false);
    }
  };

  const selectedConversation = conversations.find((c) => c.other_user_id === selectedUserId);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex h-[calc(100vh-64px)] bg-sky-50 dark:bg-slate-900">
      {/* Conversations List */}
      <div className="w-1/3 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="border-b border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold dark:text-slate-100">{t('common.messages')}</h2>
            <button
              onClick={() => setShowDoctorList(!showDoctorList)}
              className="rounded-md bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-700"
            >
              + {t('messages.newMessage')}
            </button>
          </div>
        </div>
        {showDoctorList && (
          <div className="border-b border-slate-200 dark:border-slate-700 bg-sky-50 dark:bg-slate-700 p-4">
            <p className="mb-2 text-xs font-semibold text-slate-600 dark:text-slate-300">{t('messages.selectDoctor')}</p>
            <div className="max-h-48 space-y-1 overflow-y-auto">
              {doctors.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">{t('messages.noDoctors')}</p>
              ) : (
                doctors.map((doctor) => {
                  const hasConversation = conversations.some((c) => c.other_user_id === doctor.user_id);
                  return (
                    <button
                      key={doctor.id}
                      onClick={() => handleSelectDoctor(doctor)}
                      className={`w-full rounded-md border p-2 text-left text-xs transition-colors ${
                        hasConversation
                          ? 'border-sky-200 bg-white hover:bg-sky-50'
                          : 'border-sky-300 bg-sky-50 hover:bg-sky-100'
                      }`}
                    >
                      <p className="font-semibold text-slate-900">Dr. {doctor.name}</p>
                      {doctor.specialization && (
                        <p className="text-slate-600">{doctor.specialization}</p>
                      )}
                      {hasConversation && (
                        <p className="mt-1 text-slate-500 dark:text-slate-400">{t('messages.existingConversation')}</p>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
        <div className="overflow-y-auto">
          {conversations.length === 0 ? (
            <p className="p-4 text-sm text-slate-500 dark:text-slate-400">{t('messages.noConversations')}</p>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.other_user_id}
                onClick={() => {
                  setSelectedUserId(conv.other_user_id);
                  setSelectedDoctorName(conv.other_user_name);
                }}
                className={`w-full border-b border-slate-100 dark:border-slate-700 p-4 text-left hover:bg-sky-50 dark:hover:bg-slate-700 ${
                  selectedUserId === conv.other_user_id ? 'bg-sky-50 dark:bg-sky-900/30' : ''
                }`}
              >
                <p className="font-semibold dark:text-slate-100">{conv.other_user_name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{conv.other_user_role}</p>
                <p className="mt-1 truncate text-sm text-slate-600 dark:text-slate-300">{conv.last_message}</p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex flex-1 flex-col">
        {selectedUserId ? (
          <>
            <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
              <p className="font-semibold dark:text-slate-100">
                {selectedConversation?.other_user_name || selectedDoctorName || t('messages.unknown')}
              </p>
              {selectedConversation?.other_user_role && (
                <p className="text-xs text-slate-500 dark:text-slate-400">{selectedConversation.other_user_role}</p>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <p className="text-slate-500 dark:text-slate-400">{t('messages.noMessagesYet')}</p>
                </div>
              ) : (
                <>
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs rounded-lg px-4 py-2 ${
                          msg.sender_id === user.id
                            ? 'bg-sky-600 text-white'
                            : 'bg-white border border-slate-200 text-slate-900'
                        }`}
                      >
                        <p className="text-sm">{msg.message}</p>
                        <p className={`mt-1 text-xs ${msg.sender_id === user.id ? 'text-sky-100' : 'text-slate-500'}`}>
                          {new Date(msg.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>
            <form onSubmit={handleSend} className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={t('messages.typeMessage')}
                  className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  disabled={loading || !newMessage.trim()}
                  className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
                >
                  {t('messages.send')}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-slate-500 dark:text-slate-400">{t('messages.selectConversation')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MessagesPage;

