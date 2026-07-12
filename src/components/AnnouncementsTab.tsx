import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Plus, Trash2, X, Calendar, Eye, Users, ShieldAlert } from 'lucide-react';
import { Announcement } from '../types';

interface AnnouncementsTabProps {
  announcements: Announcement[];
  onAddAnnouncement: (announcement: Omit<Announcement, 'id'>) => void;
  onDeleteAnnouncement: (id: string) => void;
}

export default function AnnouncementsTab({ 
  announcements, 
  onAddAnnouncement, 
  onDeleteAnnouncement 
}: AnnouncementsTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetGroup, setTargetGroup] = useState<'Todos' | 'Somente Ativos'>('Todos');

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

                <button
                  onClick={() => {
                    if (window.confirm(`Tem certeza de que deseja remover o comunicado "${ann.title}"?`)) {
                      onDeleteAnnouncement(ann.id);
                    }
                  }}
                  className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg font-semibold flex items-center gap-1 transition-all cursor-pointer"
                  title="Excluir comunicado"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Excluir
                </button>
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
    </div>
  );
}
