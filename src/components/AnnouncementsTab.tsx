import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Plus, Trash2, X, Calendar, Eye, Users, ShieldAlert, Edit, MessageSquare, Send, Copy, Check, Phone, Mail } from 'lucide-react';
import { Announcement, Associate, EntityConfig } from '../types';
import { dateToBRL } from '../utils/formatters';

interface AnnouncementsTabProps {
  announcements: Announcement[];
  associates?: Associate[];
  clients?: Associate[];
  entityConfig?: EntityConfig | null;
  onAddAnnouncement: (announcement: Omit<Announcement, 'id'>) => void;
  onEditAnnouncement: (announcement: Announcement) => void;
  onDeleteAnnouncement: (id: string) => void;
}

export default function AnnouncementsTab({ 
  announcements, 
  associates = [],
  clients = [],
  entityConfig,
  onAddAnnouncement, 
  onEditAnnouncement,
  onDeleteAnnouncement 
}: AnnouncementsTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null);
  
  // WhatsApp Send State
  const [selectedAnnForSend, setSelectedAnnForSend] = useState<Announcement | null>(null);
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>('');
  const [sendPhone, setSendPhone] = useState<string>('');
  const [sendCustomMessage, setSendCustomMessage] = useState<string>('');
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetGroup, setTargetGroup] = useState<'Todos' | 'Somente Ativos'>('Todos');

  const allRecipients = [...associates, ...clients];

  const handleOpenSendModal = (ann: Announcement) => {
    setSelectedAnnForSend(ann);
    setSelectedRecipientId('');
    setSendPhone('');
    setCopiedSuccess(false);

    const entityName = entityConfig?.name || 'Associação / Entidade';
    const dateFormatted = ann.date ? dateToBRL(ann.date) : new Date().toLocaleDateString('pt-BR');

    const msg = `📢 *COMUNICADO OFICIAL*
🏛️ *${entityName}*

📌 *Título:* ${ann.title}
📅 *Data:* ${dateFormatted}
👥 *Público-Alvo:* ${ann.targetGroup || 'Todos os Associados'}

📝 *Conteúdo / Aviso:*
${ann.content}

Para mais informações, acesse o portal ou entre em contato com nossa secretaria.

Atenciosamente,
*${entityName}*`;

    setSendCustomMessage(msg);
  };

  const handleRecipientChange = (recipientId: string) => {
    setSelectedRecipientId(recipientId);
    if (!recipientId) {
      setSendPhone('');
      return;
    }
    const found = allRecipients.find(r => r.id === recipientId);
    if (found && found.phone) {
      setSendPhone(found.phone);
    }
  };

  const handleExecuteSendWhatsApp = () => {
    if (!sendPhone.trim()) {
      alert('Por favor, selecione um destinatário ou informe um número de telefone com DDD.');
      return;
    }
    const cleanPhone = sendPhone.replace(/\D/g, '');
    const phoneWithDDD = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
    const url = `https://api.whatsapp.com/send?phone=${phoneWithDDD}&text=${encodeURIComponent(sendCustomMessage)}`;
    window.open(url, '_blank');
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(sendCustomMessage);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    onAddAnnouncement({
      title,
      content,
      targetGroup,
      date: new Date().toISOString().split('T')[0]
    });

    setIsModalOpen(false);
    setTitle('');
    setContent('');
    setTargetGroup('Todos');
  };

  return (
    <div className="space-y-6 text-gray-200">
      {/* Tab description */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#111111] p-5 rounded-2xl border border-white/5 shadow-xl">
        <div className="space-y-1">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-500" />
            Comunicados & Mural de Avisos
          </h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            Publique informações cruciais, datas de assembleias ou recados para visualização dos associados em suas respectivas áreas exclusivas.
          </p>
        </div>
        <button
          id="btn-add-announcement"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-900/20 transition-all cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" />
          Novo Comunicado
        </button>
      </div>

      {/* Announcements List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <AnimatePresence mode="popLayout">
          {announcements.map((ann) => (
            <motion.div
              key={ann.id}
              layout
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-[#111111] rounded-2xl border border-white/5 shadow-xl p-5 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-4">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    ann.targetGroup === 'Todos' ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-400'
                  }`}>
                    <Users className="h-3 w-3" />
                    Público: {ann.targetGroup}
                  </span>
                  
                  <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(ann.date).toLocaleDateString('pt-BR')}
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-white text-base leading-snug font-sans">{ann.title}</h4>
                  <p className="text-xs text-gray-400 leading-relaxed whitespace-pre-wrap">{ann.content}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-white/5 flex justify-between items-center text-xs">
                <span className="text-gray-500 font-medium flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5 text-gray-600" />
                  Visível no portal
                </span>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenSendModal(ann)}
                    className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg font-semibold flex items-center gap-1 transition-all cursor-pointer"
                    title="Transmitir / Enviar via WhatsApp"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    WhatsApp
                  </button>

                  <button
                    onClick={() => setEditingAnnouncement(ann)}
                    className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg font-semibold flex items-center gap-1 transition-all cursor-pointer"
                    title="Editar comunicado"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    Editar
                  </button>

                  <button
                    onClick={() => setAnnouncementToDelete(ann)}
                    className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg font-semibold flex items-center gap-1 transition-all cursor-pointer"
                    title="Excluir comunicado"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Excluir
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {announcements.length === 0 && (
          <div className="col-span-full py-16 text-center bg-[#111111] border border-white/5 rounded-2xl">
            <ShieldAlert className="h-12 w-12 text-gray-600 mx-auto mb-2" />
            <h4 className="font-semibold text-white text-sm">Nenhum comunicado cadastrado</h4>
            <p className="text-xs text-gray-500 mt-1">Crie comunicados para manter os associados bem informados.</p>
          </div>
        )}
      </div>

      {/* Dialog: Add Announcement Form */}
      {isModalOpen && (
        <div id="announcement-modal" className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#111111] rounded-2xl shadow-2xl border border-white/10 max-w-md w-full overflow-hidden text-gray-200"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-[#1a1a1a]/40">
              <h3 className="font-bold text-white text-base">
                Criar Novo Comunicado
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Título do Comunicado <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Assembleia Geral Extraordinária"
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Conteúdo do Comunicado <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Escreva as informações detalhadas aqui..."
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Destinatários (Público-Alvo)
                </label>
                <select
                  value={targetGroup}
                  onChange={(e) => setTargetGroup(e.target.value as 'Todos' | 'Somente Ativos')}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Todos" className="bg-[#111111]">Todos os Associados (Ativos e Inativos)</option>
                  <option value="Somente Ativos" className="bg-[#111111]">Somente Associados Ativos</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="pt-4 border-t border-white/5 flex justify-end gap-3.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-white/10 rounded-xl text-sm font-semibold text-gray-400 hover:bg-white/5 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-900/20 cursor-pointer"
                >
                  Publicar Comunicado
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Dialog: Edit Announcement Form */}
      {editingAnnouncement && (
        <div id="edit-announcement-modal" className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#111111] rounded-2xl shadow-2xl border border-white/10 max-w-md w-full overflow-hidden text-gray-200"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-[#1a1a1a]/40">
              <h3 className="font-bold text-white text-base">
                Editar Comunicado
              </h3>
              <button onClick={() => setEditingAnnouncement(null)} className="text-gray-400 hover:text-white cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!editingAnnouncement.title || !editingAnnouncement.content) return;
              onEditAnnouncement(editingAnnouncement);
              setEditingAnnouncement(null);
            }} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Título do Comunicado <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editingAnnouncement.title}
                  onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, title: e.target.value })}
                  placeholder="Ex: Assembleia Geral Extraordinária"
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Conteúdo do Comunicado <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={editingAnnouncement.content}
                  onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, content: e.target.value })}
                  placeholder="Escreva as informações detalhadas aqui..."
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Destinatários (Público-Alvo)
                </label>
                <select
                  value={editingAnnouncement.targetGroup}
                  onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, targetGroup: e.target.value as 'Todos' | 'Somente Ativos' })}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Todos" className="bg-[#111111]">Todos os Associados (Ativos e Inativos)</option>
                  <option value="Somente Ativos" className="bg-[#111111]">Somente Associados Ativos</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Data do Comunicado <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={editingAnnouncement.date}
                  onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, date: e.target.value })}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Buttons */}
              <div className="pt-4 border-t border-white/5 flex justify-end gap-3.5">
                <button
                  type="button"
                  onClick={() => setEditingAnnouncement(null)}
                  className="px-4 py-2 border border-white/10 rounded-xl text-sm font-semibold text-gray-400 hover:bg-white/5 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-900/20 cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Dialog: Confirm Delete Announcement */}
      {announcementToDelete && (
        <div id="delete-announcement-modal" className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#111111] rounded-2xl shadow-2xl border border-white/10 max-w-sm w-full overflow-hidden text-gray-200"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-[#1a1a1a]/40">
              <h3 className="font-bold text-white text-base">
                Confirmar Exclusão
              </h3>
              <button onClick={() => setAnnouncementToDelete(null)} className="text-gray-400 hover:text-white cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-300">
                Tem certeza de que deseja remover o comunicado <span className="font-semibold text-white">"{announcementToDelete.title}"</span>? Esta ação não pode ser desfeita.
              </p>

              {/* Buttons */}
              <div className="pt-4 border-t border-white/5 flex justify-end gap-3.5">
                <button
                  type="button"
                  onClick={() => setAnnouncementToDelete(null)}
                  className="px-4 py-2 border border-white/10 rounded-xl text-sm font-semibold text-gray-400 hover:bg-white/5 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteAnnouncement(announcementToDelete.id);
                    setAnnouncementToDelete(null);
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-red-900/20 cursor-pointer"
                >
                  Confirmar Exclusão
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Dialog: Transmit Announcement via WhatsApp */}
      {selectedAnnForSend && (
        <div id="send-announcement-whatsapp-modal" className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#111111] rounded-2xl shadow-2xl border border-white/10 max-w-lg w-full overflow-hidden text-gray-200"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-[#1a1a1a]/40">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <MessageSquare className="h-5 w-5" />
                Transmitir Comunicado via WhatsApp
              </div>
              <button onClick={() => setSelectedAnnForSend(null)} className="text-gray-400 hover:text-white cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Recipient Selection */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Selecionar Destinatário (Associado / Cliente)
                </label>
                <select
                  value={selectedRecipientId}
                  onChange={(e) => handleRecipientChange(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">-- Digitar número avulso ou selecionar abaixo --</option>
                  {allRecipients.map((rec) => (
                    <option key={rec.id} value={rec.id}>
                      {rec.name} {rec.phone ? `(${rec.phone})` : '(Sem Telefone)'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Phone Input */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Telefone WhatsApp (com DDD) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <input
                    type="text"
                    value={sendPhone}
                    onChange={(e) => setSendPhone(e.target.value)}
                    placeholder="Ex: 87999998888"
                    className="w-full pl-9 pr-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Custom Message Preview / Editor */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Mensagem do Comunicado (Personalizável)
                  </label>
                  <button
                    type="button"
                    onClick={handleCopyMessage}
                    className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    {copiedSuccess ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        Copiar Texto
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  rows={9}
                  value={sendCustomMessage}
                  onChange={(e) => setSendCustomMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-xs font-mono text-emerald-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none leading-relaxed"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedAnnForSend(null)}
                  className="px-4 py-2 border border-white/10 rounded-xl text-xs font-semibold text-gray-400 hover:bg-white/5 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleExecuteSendWhatsApp}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-900/20 cursor-pointer flex items-center gap-1.5"
                  >
                    <Send className="h-4 w-4" />
                    Enviar via WhatsApp
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
