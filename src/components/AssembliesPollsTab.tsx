import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, Clock, MapPin, ClipboardList, Trash2, Plus, 
  Users, CheckCircle2, AlertTriangle, Play, Check, BarChart3, Info
} from 'lucide-react';
import { Assembly, Poll, PollOption } from '../types';

interface AssembliesPollsTabProps {
  assemblies: Assembly[];
  polls: Poll[];
  onAddAssembly: (assembly: Omit<Assembly, 'id' | 'createdAt'>) => void;
  onDeleteAssembly: (id: string) => void;
  onAddPoll: (poll: Omit<Poll, 'id' | 'createdAt'>) => void;
  onUpdatePoll: (poll: Poll) => void;
  onDeletePoll: (id: string) => void;
}

export default function AssembliesPollsTab({
  assemblies,
  polls,
  onAddAssembly,
  onDeleteAssembly,
  onAddPoll,
  onUpdatePoll,
  onDeletePoll
}: AssembliesPollsTabProps) {
  const [subTab, setSubTab] = useState<'assemblies' | 'polls'>('assemblies');

  // Inline Confirmation States
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [closeConfirmId, setCloseConfirmId] = useState<string | null>(null);

  // Form error messages (replaces alert in sandboxed environments)
  const [assemblyError, setAssemblyError] = useState<string | null>(null);
  const [pollError, setPollError] = useState<string | null>(null);

  // Assembly Form State
  const [isAssemblyModalOpen, setIsAssemblyModalOpen] = useState(false);
  const [assemblyTitle, setAssemblyTitle] = useState('');
  const [assemblyDate, setAssemblyDate] = useState('');
  const [assemblyTime, setAssemblyTime] = useState('');
  const [assemblyLocation, setAssemblyLocation] = useState('');
  const [assemblyAgenda, setAssemblyAgenda] = useState('');
  const [assemblyType, setAssemblyType] = useState<'Assembleia' | 'Atividade'>('Assembleia');

  // Poll Form State
  const [isPollModalOpen, setIsPollModalOpen] = useState(false);
  const [pollTitle, setPollTitle] = useState('');
  const [pollDate, setPollDate] = useState('');
  const [pollTime, setPollTime] = useState('');
  const [pollLocation, setPollLocation] = useState('');
  const [pollAgenda, setPollAgenda] = useState('');
  const [newOptionText, setNewOptionText] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>([]);

  // Format date helper
  const dateToBRL = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  const handleAddAssemblySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAssemblyError(null);
    if (!assemblyTitle || !assemblyDate || !assemblyTime || !assemblyLocation || !assemblyAgenda) {
      setAssemblyError('Por favor, preencha todos os campos!');
      return;
    }
    onAddAssembly({
      title: assemblyTitle,
      date: assemblyDate,
      time: assemblyTime,
      location: assemblyLocation,
      agenda: assemblyAgenda,
      type: assemblyType
    });
    // Reset state
    setAssemblyTitle('');
    setAssemblyDate('');
    setAssemblyTime('');
    setAssemblyLocation('');
    setAssemblyAgenda('');
    setAssemblyType('Assembleia');
    setAssemblyError(null);
    setIsAssemblyModalOpen(false);
  };

  const handleAddPollOption = () => {
    setPollError(null);
    if (!newOptionText.trim()) return;
    if (pollOptions.includes(newOptionText.trim())) {
      setPollError('Esta opção já foi adicionada!');
      return;
    }
    setPollOptions([...pollOptions, newOptionText.trim()]);
    setNewOptionText('');
  };

  const handleRemovePollOption = (index: number) => {
    setPollOptions(pollOptions.filter((_, i) => i !== index));
  };

  const handleAddPollSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPollError(null);
    if (!pollTitle || !pollDate || !pollTime || !pollLocation || !pollAgenda) {
      setPollError('Por favor, preencha todos os campos fundamentais!');
      return;
    }
    if (pollOptions.length < 2) {
      setPollError('Uma votação precisa ter no mínimo 2 opções cadastradas!');
      return;
    }

    const optionsList: PollOption[] = pollOptions.map((text, idx) => ({
      id: `opt-${Date.now()}-${idx}`,
      text,
      votes: 0
    }));

    onAddPoll({
      title: pollTitle,
      date: pollDate,
      time: pollTime,
      location: pollLocation,
      agenda: pollAgenda,
      options: optionsList,
      status: 'Ativo',
      voters: []
    });

    // Reset state
    setPollTitle('');
    setPollDate('');
    setPollTime('');
    setPollLocation('');
    setPollAgenda('');
    setPollOptions([]);
    setPollError(null);
    setIsPollModalOpen(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Upper Navigation and Quick Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* Tab Selector Buttons */}
        <div className="flex bg-[#111111] border border-white/5 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setSubTab('assemblies')}
            className={`flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              subTab === 'assemblies'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Calendar className="h-4 w-4" />
            Assembleias ({assemblies.length})
          </button>
          <button
            onClick={() => setSubTab('polls')}
            className={`flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              subTab === 'polls'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            Votações ({polls.length})
          </button>
        </div>

        {/* Create Trigger buttons */}
        {subTab === 'assemblies' ? (
          <button
            onClick={() => setIsAssemblyModalOpen(true)}
            className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-900/10 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Registrar Assembleia
          </button>
        ) : (
          <button
            onClick={() => setIsPollModalOpen(true)}
            className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-900/10 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Criar Nova Votação
          </button>
        )}
      </div>

      {/* Assembly Section */}
      {subTab === 'assemblies' && (
        <div className="space-y-4">
          {assemblies.length === 0 ? (
            <div className="text-center py-12 bg-[#111111] rounded-2xl border border-white/5 space-y-3">
              <Calendar className="h-12 w-12 text-gray-600 mx-auto animate-pulse" />
              <div className="space-y-1">
                <h3 className="font-bold text-white text-sm">Nenhuma Assembleia Registrada</h3>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  Agende as próximas assembleias gerais para manter os associados informados sobre datas, horários e pautas do sindicato/associação.
                </p>
              </div>
              <button
                onClick={() => setIsAssemblyModalOpen(true)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/15 text-white rounded-xl text-xs font-semibold cursor-pointer transition-all inline-flex items-center gap-1"
              >
                <Plus className="h-4 w-4" /> Registrar Primeira
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {assemblies.map((assembly) => (
                <div 
                  key={assembly.id} 
                  className="bg-[#111111] p-5 rounded-2xl border border-white/5 shadow-xl hover:border-white/10 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3.5">
                    {/* Header */}
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {assembly.type === 'Atividade' ? (
                            <span className="px-2 py-0.5 rounded-full font-extrabold text-[9px] uppercase bg-purple-500/10 text-purple-400 border border-purple-500/20">
                              Atividade
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full font-extrabold text-[9px] uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              Assembleia
                            </span>
                          )}
                          <h4 className="font-extrabold text-white text-sm leading-snug">{assembly.title}</h4>
                        </div>
                        <span className="text-[10px] text-gray-500 font-bold block uppercase tracking-wider">
                          Criado em: {new Date(assembly.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      {deleteConfirmId === assembly.id ? (
                        <div className="flex items-center gap-1.5 bg-[#161616] border border-white/10 p-1.5 rounded-xl">
                          <button
                            onClick={() => {
                              onDeleteAssembly(assembly.id);
                              setDeleteConfirmId(null);
                            }}
                            className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold rounded-lg transition-all cursor-pointer"
                          >
                            Excluir
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-1 bg-white/5 border border-white/10 text-gray-400 hover:text-white text-[10px] font-bold rounded-lg transition-all cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(assembly.id)}
                          className="p-1.5 hover:bg-red-500/10 text-gray-500 hover:text-red-400 border border-transparent hover:border-red-500/10 rounded-lg transition-all cursor-pointer"
                          title="Excluir Assembleia"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    {/* Details grid */}
                    <div className="grid grid-cols-2 gap-3 p-3 bg-white/5 rounded-xl text-xs text-gray-300 font-medium border border-white/5">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-500 shrink-0" />
                        <span>{dateToBRL(assembly.date)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-500 shrink-0" />
                        <span>{assembly.time}h</span>
                      </div>
                      <div className="flex items-center gap-2 col-span-2 border-t border-white/5 pt-2 mt-1">
                        <MapPin className="h-4 w-4 text-blue-500 shrink-0" />
                        <span className="truncate">{assembly.location}</span>
                      </div>
                    </div>

                    {/* Agenda/Pautas */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                        <ClipboardList className="h-3.5 w-3.5" />
                        Pauta / Assuntos em Discussão
                      </span>
                      <div className="p-3 bg-[#161616] rounded-xl border border-white/5 text-xs text-gray-400 leading-relaxed whitespace-pre-wrap max-h-[150px] overflow-y-auto">
                        {assembly.agenda}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Polls Section */}
      {subTab === 'polls' && (
        <div className="space-y-4">
          {polls.length === 0 ? (
            <div className="text-center py-12 bg-[#111111] rounded-2xl border border-white/5 space-y-3">
              <BarChart3 className="h-12 w-12 text-gray-600 mx-auto animate-pulse" />
              <div className="space-y-1">
                <h3 className="font-bold text-white text-sm">Nenhuma Votação Ativa ou Encerrada</h3>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  Crie votações democráticas para obter opiniões dos associados adimplentes sobre taxas, decisões e pautas da diretoria.
                </p>
              </div>
              <button
                onClick={() => setIsPollModalOpen(true)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/15 text-white rounded-xl text-xs font-semibold cursor-pointer transition-all inline-flex items-center gap-1"
              >
                <Plus className="h-4 w-4" /> Criar Primeira
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {polls.map((poll) => {
                const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);
                const winnerOption = poll.options.find(opt => opt.id === poll.winnerOptionId);

                return (
                  <div 
                    key={poll.id} 
                    className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                      poll.status === 'Ativo'
                        ? 'bg-[#111111] border-white/5 hover:border-white/10'
                        : 'bg-[#111111] border-emerald-500/10 hover:border-emerald-500/20'
                    }`}
                  >
                    <div className="space-y-4">
                      {/* Top status */}
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-white text-sm leading-snug">{poll.title}</h4>
                            <span className={`inline-block px-2 py-0.5 rounded-full font-bold text-[9px] uppercase ${
                              poll.status === 'Ativo' 
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/10' 
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10'
                            }`}>
                              {poll.status}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-500 font-bold block uppercase tracking-wider">
                            Criado em: {new Date(poll.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        {deleteConfirmId === poll.id ? (
                          <div className="flex items-center gap-1.5 bg-[#161616] border border-white/10 p-1.5 rounded-xl">
                            <button
                              onClick={() => {
                                onDeletePoll(poll.id);
                                setDeleteConfirmId(null);
                              }}
                              className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold rounded-lg transition-all cursor-pointer"
                            >
                              Excluir
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-2 py-1 bg-white/5 border border-white/10 text-gray-400 hover:text-white text-[10px] font-bold rounded-lg transition-all cursor-pointer"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(poll.id)}
                            className="p-1.5 hover:bg-red-500/10 text-gray-500 hover:text-red-400 border border-transparent hover:border-red-500/10 rounded-lg transition-all cursor-pointer"
                            title="Excluir Votação"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      {/* Details of setup */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 bg-white/5 rounded-xl text-xs text-gray-300 font-semibold border border-white/5">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-blue-400" />
                          <span>{dateToBRL(poll.date)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4 text-blue-400" />
                          <span>{poll.time}h</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-4 w-4 text-blue-400" />
                          <span className="truncate">{poll.location}</span>
                        </div>
                      </div>

                      {/* Agenda */}
                      <div className="text-xs space-y-1">
                        <span className="font-bold text-gray-500 uppercase text-[9px]">Pauta / Informações</span>
                        <p className="text-gray-400 italic bg-[#151515] p-2.5 rounded-lg border border-white/5">{poll.agenda}</p>
                      </div>

                      {/* Options & Votes progress */}
                      <div className="space-y-2">
                        <span className="font-bold text-gray-400 text-[10px] uppercase flex items-center justify-between">
                          <span>Opções & Resultados</span>
                          <span className="text-blue-400 font-mono font-bold text-xs flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {totalVotes} votos no total
                          </span>
                        </span>

                        <div className="space-y-2">
                          {poll.options.map(option => {
                            const percent = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
                            const isWinner = poll.status === 'Encerrado' && option.id === poll.winnerOptionId;
                            
                            return (
                              <div key={option.id} className="space-y-1.5">
                                <div className="flex justify-between items-center text-xs">
                                  <span className={`font-bold flex items-center gap-1.5 ${isWinner ? 'text-emerald-400' : 'text-gray-300'}`}>
                                    {isWinner && <Check className="h-4 w-4 text-emerald-400" />}
                                    {option.text}
                                  </span>
                                  <span className="font-mono text-gray-400 font-bold">
                                    {option.votes} votos ({percent}%)
                                  </span>
                                </div>
                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                  <div 
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      isWinner 
                                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' 
                                        : 'bg-gradient-to-r from-blue-500 to-blue-600'
                                    }`}
                                    style={{ width: `${percent}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Winner panel */}
                      {poll.status === 'Encerrado' && winnerOption && (
                        <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-center gap-3">
                          <div className="h-8 w-8 bg-emerald-500/10 text-emerald-400 rounded-lg flex items-center justify-center shrink-0 border border-emerald-500/10">
                            <CheckCircle2 className="h-5 w-5" />
                          </div>
                          <div className="text-xs">
                            <span className="text-[10px] text-gray-500 font-bold block uppercase">Opção Vencedora</span>
                            <span className="font-extrabold text-white text-sm">{winnerOption.text}</span>
                          </div>
                        </div>
                      )}

                      {/* Action buttons */}
                      {closeConfirmId === poll.id ? (
                        <div className="space-y-2 p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl animate-fade-in">
                          <p className="text-[11px] text-amber-400 font-semibold leading-tight text-center">
                            Tem certeza de que deseja encerrar esta votação e revelar o vencedor aos associados? Novos votos serão bloqueados.
                          </p>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                // Determine winning option
                                let maxVotes = -1;
                                let winnerId = '';
                                
                                poll.options.forEach(opt => {
                                  if (opt.votes > maxVotes) {
                                    maxVotes = opt.votes;
                                    winnerId = opt.id;
                                  }
                                });

                                const updatedPoll: Poll = {
                                  ...poll,
                                  status: 'Encerrado',
                                  winnerOptionId: winnerId
                                };

                                onUpdatePoll(updatedPoll);
                                setCloseConfirmId(null);
                              }}
                              className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-[11px] rounded-lg transition-all cursor-pointer text-center"
                            >
                              Sim, Encerrar e Revelar
                            </button>
                            <button
                              type="button"
                              onClick={() => setCloseConfirmId(null)}
                              className="flex-1 py-1.5 bg-[#1e1e1e] hover:bg-[#2e2e2e] text-gray-300 font-bold text-[11px] rounded-lg transition-all cursor-pointer text-center border border-white/10"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        poll.status === 'Ativo' && (
                          <button
                            type="button"
                            onClick={() => setCloseConfirmId(poll.id)}
                            className="w-full py-2 bg-amber-500/10 hover:bg-amber-500 hover:text-black border border-amber-500/20 text-amber-400 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm text-center"
                          >
                            Encerrar Votação e Revelar Vencedor
                          </button>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Assembly Register Modal */}
      {isAssemblyModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#111111] max-w-lg w-full rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-[#1a1a1a]/40">
              <h3 className="font-bold text-white text-sm">Registrar Novo Evento / Agenda</h3>
              <button 
                onClick={() => setIsAssemblyModalOpen(false)} 
                className="text-gray-400 hover:text-white transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddAssemblySubmit} className="p-6 space-y-4">
              {assemblyError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl font-semibold animate-shake">
                  {assemblyError}
                </div>
              )}
              
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Tipo do Evento</label>
                <div className="flex gap-4 p-2.5 bg-[#161616] rounded-xl border border-white/5">
                  <label className="flex items-center gap-2 text-xs text-gray-300 font-semibold cursor-pointer">
                    <input
                      type="radio"
                      name="assemblyType"
                      checked={assemblyType === 'Assembleia'}
                      onChange={() => setAssemblyType('Assembleia')}
                      className="accent-blue-500"
                    />
                    Assembleia Geral
                  </label>
                  <label className="flex items-center gap-2 text-xs text-gray-300 font-semibold cursor-pointer">
                    <input
                      type="radio"
                      name="assemblyType"
                      checked={assemblyType === 'Atividade'}
                      onChange={() => setAssemblyType('Atividade')}
                      className="accent-purple-500"
                    />
                    Atividade da Entidade
                  </label>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Título do Evento</label>
                <input
                  type="text"
                  placeholder="Ex: Reunião de Planejamento ou Evento de Integração"
                  value={assemblyTitle}
                  onChange={(e) => setAssemblyTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Data do Evento</label>
                  <input
                    type="date"
                    value={assemblyDate}
                    onChange={(e) => setAssemblyDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Horário (HH:MM)</label>
                  <input
                    type="time"
                    value={assemblyTime}
                    onChange={(e) => setAssemblyTime(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Local do Evento / Plataforma</label>
                <input
                  type="text"
                  placeholder="Ex: Sede Social ou Sala Virtual do Zoom"
                  value={assemblyLocation}
                  onChange={(e) => setAssemblyLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Pautas e Assuntos (Uma por linha)</label>
                <textarea
                  placeholder="Escreva as pautas que serão discutidas..."
                  rows={4}
                  value={assemblyAgenda}
                  onChange={(e) => setAssemblyAgenda(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                  required
                />
              </div>

              <div className="flex gap-3 border-t border-white/5 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsAssemblyModalOpen(false)}
                  className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-bold text-xs rounded-xl cursor-pointer transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-all shadow-md"
                >
                  Registrar Evento
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Poll Register Modal */}
      {isPollModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#111111] max-w-lg w-full rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-[#1a1a1a]/40">
              <h3 className="font-bold text-white text-sm">Criar Nova Votação</h3>
              <button 
                onClick={() => setIsPollModalOpen(false)} 
                className="text-gray-400 hover:text-white transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddPollSubmit} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
              {pollError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl font-semibold animate-shake">
                  {pollError}
                </div>
              )}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Título da Votação</label>
                <input
                  type="text"
                  placeholder="Ex: Reforma da Fachada Social"
                  value={pollTitle}
                  onChange={(e) => setPollTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Data Limite de Voto</label>
                  <input
                    type="date"
                    value={pollDate}
                    onChange={(e) => setPollDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Horário Limite</label>
                  <input
                    type="time"
                    value={pollTime}
                    onChange={(e) => setPollTime(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Local / Plataforma de Validação</label>
                <input
                  type="text"
                  placeholder="Ex: Sede Social Virtual"
                  value={pollLocation}
                  onChange={(e) => setPollLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Contexto / Pauta de Votação</label>
                <textarea
                  placeholder="Contextualize a decisão para os associados adimplentes..."
                  rows={3}
                  value={pollAgenda}
                  onChange={(e) => setPollAgenda(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                  required
                />
              </div>

              {/* Options Builder */}
              <div className="space-y-2 border-t border-white/5 pt-4">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Opções de Voto (Mínimo: 2)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nova opção..."
                    value={newOptionText}
                    onChange={(e) => setNewOptionText(e.target.value)}
                    className="flex-1 px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddPollOption}
                    className="px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer"
                  >
                    Adicionar
                  </button>
                </div>

                {/* Local Options list */}
                {pollOptions.length > 0 ? (
                  <div className="border border-white/5 rounded-xl bg-[#141414] divide-y divide-white/5 overflow-hidden">
                    {pollOptions.map((optText, index) => (
                      <div key={index} className="flex justify-between items-center py-2 px-3 text-xs text-gray-300 font-semibold bg-[#1a1a1a]/40">
                        <span>{index + 1}. {optText}</span>
                        <button
                          type="button"
                          onClick={() => handleRemovePollOption(index)}
                          className="text-red-400 hover:text-red-300 font-bold text-[10px] uppercase cursor-pointer"
                        >
                          Remover
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-white/5 text-center text-xs text-gray-500 rounded-xl italic">
                    Nenhuma opção adicionada ainda.
                  </div>
                )}
              </div>

              <div className="flex gap-3 border-t border-white/5 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsPollModalOpen(false)}
                  className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-bold text-xs rounded-xl cursor-pointer transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-all shadow-md"
                >
                  Lançar Votação
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}
