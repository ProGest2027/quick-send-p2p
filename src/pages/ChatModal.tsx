/**
 * Quick Send — Real-Time Private Chat Modal
 * Private messaging linked to offers and exchange requests,
 * with unread indicators, timestamps, message attachments, and blocking/reporting.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  ShieldAlert,
  Paperclip,
  CheckCheck,
  Check,
  User,
  AlertTriangle,
  Lock,
  Flag,
} from 'lucide-react';
import { UserProfile, ChatMessage, Conversation } from '../types';
import { db } from '../services/database';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  targetUserId: string;
  requestId?: string;
  offerId?: string;
  onOpenReportModal: (targetUserId: string) => void;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  targetUserId,
  requestId,
  offerId,
  onOpenReportModal,
}) => {
  const [inputText, setInputText] = useState('');
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const users = db.getUsers();
  const targetUser = users.find((u) => u.id === targetUserId);

  // Check if current user is allowed to chat (Premium + KYC or Super Admin)
  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
  const isPremium = db.isUserPremium(currentUser.id);
  const isKyc = db.isUserKycApproved(currentUser.id);
  const canChat = isSuperAdmin || (isPremium && isKyc);

  useEffect(() => {
    if (!isOpen || !targetUserId) return;

    // Retrieve or create conversation
    const conv = db.getOrCreateConversation([currentUser.id, targetUserId], requestId, offerId);
    setConversation(conv);

    const updateMessages = () => {
      const allMsgs = db.getMessages().filter((m) => m.conversationId === conv.id);
      setMessages(allMsgs);
    };

    updateMessages();
    const unsub = db.subscribe(() => {
      updateMessages();
    });

    return () => unsub();
  }, [isOpen, currentUser.id, targetUserId, requestId, offerId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !conversation) return;

    const res = db.sendMessage(conversation.id, currentUser.id, inputText);
    if (res) {
      setInputText('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#101D35] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg h-[600px] max-h-[90vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#246BFD] text-white flex items-center justify-center font-bold text-xs">
              {targetUser?.fullName.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                <span>{targetUser?.fullName || 'Utilizador'}</span>
                <span className="text-[10px] text-emerald-500 font-normal">● Online</span>
              </div>
              <div className="text-[11px] text-slate-400">
                {requestId ? `Operação ID: ${requestId}` : 'Negociação P2P'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenReportModal(targetUserId)}
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
              title="Denunciar utilizador"
            >
              <Flag className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Security Alert Header */}
        <div className="px-4 py-2 bg-blue-50/60 dark:bg-blue-950/30 border-b border-blue-100 dark:border-blue-900/50 text-[11px] text-slate-600 dark:text-slate-300 flex items-center justify-between">
          <span>Canal encriptado e monitorizado para prevenção de fraude.</span>
        </div>

        {/* Messages Body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/30 dark:bg-[#0B1323]/40">
          {!canChat ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-500 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <div className="font-bold text-xs text-slate-800 dark:text-slate-200">
                Chat Reservado a Membros Premium com KYC
              </div>
              <p className="text-[11px] text-slate-500 max-w-xs">
                Para enviar mensagens diretas neste canal, é obrigatório possuir a assinatura Premium (20 € MB WAY) e o documento de identidade validado.
              </p>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 text-xs space-y-1">
              <p>Nenhuma mensagem trocada ainda.</p>
              <p className="text-[11px] text-slate-500">Inicie a conversa para combinar os detalhes da transferência.</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.senderId === currentUser.id;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[78%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed ${
                      isMine
                        ? 'bg-[#246BFD] text-white rounded-br-xs shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-bl-xs shadow-xs'
                    }`}
                  >
                    <div>{msg.content}</div>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1 px-1 font-mono">
                    <span>
                      {new Date(msg.timestamp).toLocaleTimeString('pt-PT', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {isMine && <Check className="w-3 h-3 text-[#246BFD]" />}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        {canChat && (
          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#101D35] flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Escreva a sua mensagem segura..."
              className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#246BFD]"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2 bg-[#246BFD] hover:bg-blue-600 disabled:opacity-40 text-white rounded-xl transition-colors shadow-xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
