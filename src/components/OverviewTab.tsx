import React from 'react';
import { motion } from 'motion/react';
import { Users, TrendingUp, TrendingDown, DollarSign, Bell, Calendar, UserCheck, ArrowUpRight, ArrowDownRight, Wallet, ShieldAlert } from 'lucide-react';
import { Associate, Transaction, Announcement } from '../types';
import { calculateAssociateContribution } from '../utils/formatters';

interface OverviewTabProps {
  associates: Associate[];
  transactions: Transaction[];
  announcements: Announcement[];
  onNavigateToTab: (tab: string) => void;
}

export default function OverviewTab({ associates, transactions, announcements, onNavigateToTab }: OverviewTabProps) {
  // State for filtering by financial status
  const [selectedStatus, setSelectedStatus] = React.useState<string | null>(null);
  const [selectedVoting, setSelectedVoting] = React.useState<'Com Voto' | 'Sem Voto' | null>(null);

  // Stats calculations
  const totalAssociates = associates.length;
  const activeAssociates = associates.filter(a => a.status === 'Ativo').length;
  const activePercent = totalAssociates > 0 ? Math.round((activeAssociates / totalAssociates) * 100) : 0;

  // Financial status calculations
  const totalWithStatus = associates.length;
  const countAdimplente = associates.filter(a => a.financialStatus === 'Adimplente' || !a.financialStatus).length;
  const countAtencao = associates.filter(a => a.financialStatus === 'Em Atenção').length;
  const countPerigo = associates.filter(a => a.financialStatus === 'Zona de Perigo').length;
  const countInadimplente = associates.filter(a => a.financialStatus === 'Inadimplente').length;

  const pctAdimplenteNum = totalWithStatus > 0 ? (countAdimplente / totalWithStatus) * 100 : 0;
  const pctAtencaoNum = totalWithStatus > 0 ? (countAtencao / totalWithStatus) * 100 : 0;
  const pctPerigoNum = totalWithStatus > 0 ? (countPerigo / totalWithStatus) * 100 : 0;
  const pctInadimplenteNum = totalWithStatus > 0 ? (countInadimplente / totalWithStatus) * 100 : 0;

  const pctAdimplente = pctAdimplenteNum.toFixed(1);
  const pctAtencao = pctAtencaoNum.toFixed(1);
  const pctPerigo = pctPerigoNum.toFixed(1);
  const pctInadimplente = pctInadimplenteNum.toFixed(1);

  const matchingAssociates = associates.filter(a => {
    if (selectedStatus === 'Adimplente') return a.financialStatus === 'Adimplente' || !a.financialStatus;
    return a.financialStatus === selectedStatus;
  });

  // Voting rights calculations
  const totalAssociatesForVoting = associates.length;
  const countWithVote = associates.filter(a => a.hasVotingRight !== false).length;
  const countWithoutVote = associates.filter(a => a.hasVotingRight === false).length;

  const pctWithVoteNum = totalAssociatesForVoting > 0 ? (countWithVote / totalAssociatesForVoting) * 100 : 0;
  const pctWithoutVoteNum = totalAssociatesForVoting > 0 ? (countWithoutVote / totalAssociatesForVoting) * 100 : 0;

  const pctWithVote = pctWithVoteNum.toFixed(1);
  const pctWithoutVote = pctWithoutVoteNum.toFixed(1);

  const matchingVotingAssociates = associates.filter(a => {
    if (selectedVoting === 'Com Voto') return a.hasVotingRight !== false;
    if (selectedVoting === 'Sem Voto') return a.hasVotingRight === false;
    return false;
  });

  const totalInflow = transactions
    .filter(t => t.type === 'Entrada')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalOutflow = transactions
    .filter(t => t.type === 'Saída')
    .reduce((acc, t) => acc + t.amount, 0);

  const netBalance = totalInflow - totalOutflow;

  const totalDebts = associates
    .filter(a => a.financialStatus !== 'Adimplente')
    .reduce((acc, a) => acc + (a.debtAmount || 0), 0);

  // Total contributed by adimplente associates calculated at R$ 10/month from joining date
  const totalContributedAdimplentes = associates
    .filter(a => a.financialStatus === 'Adimplente' || !a.financialStatus)
    .reduce((acc, a) => acc + calculateAssociateContribution(a, 10).totalContributed, 0);

  // Format currency
  const formatBRL = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // Recent transactions
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4);

  // Recent associates
  const recentAssociates = [...associates]
    .sort((a, b) => new Date(b.joiningDate).getTime() - new Date(a.joiningDate).getTime())
    .slice(0, 4);
  return (
    <div className="space-y-6 text-gray-200">
      {/* Upper Grid - Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
        {/* Total Associates Card */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-[#111111] p-5 rounded-2xl border border-white/5 shadow-xl flex items-start justify-between"
        >
          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
              Total de Associados
            </span>
            <span className="text-3xl font-bold text-white block">
              {totalAssociates}
            </span>
            <span className="text-xs text-gray-400 flex items-center gap-1 mt-1">
              <UserCheck className="h-3.5 w-3.5 text-blue-400" />
              <strong>{activePercent}%</strong> ativos ({activeAssociates} membros)
            </span>
          </div>
          <div className="h-12 w-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400">
            <Users className="h-6 w-6" />
          </div>
        </motion.div>

        {/* Contribuição Acumulada Adimplentes Card */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-[#111111] p-5 rounded-2xl border border-blue-500/20 shadow-xl flex items-start justify-between relative overflow-hidden"
        >
          <div className="space-y-1">
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider block">
              Contribuição (Adimplentes)
            </span>
            <span className="text-2xl sm:text-3xl font-bold text-emerald-400 block font-mono">
              {formatBRL(totalContributedAdimplentes)}
            </span>
            <span className="text-[11px] text-gray-400 block mt-1 leading-tight">
              R$ 10,00/mês desde a filiação ({countAdimplente} sócios)
            </span>
          </div>
          <div className="h-12 w-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 shrink-0">
            <DollarSign className="h-6 w-6" />
          </div>
        </motion.div>

        {/* Total Inflow Card */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-[#111111] p-5 rounded-2xl border border-white/5 shadow-xl flex items-start justify-between"
        >
          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
              Total de Entradas
            </span>
            <span className="text-3xl font-bold text-emerald-400 block">
              {formatBRL(totalInflow)}
            </span>
            <span className="text-xs text-gray-400 flex items-center gap-1 mt-1">
              <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" />
              Arrecadações e doações
            </span>
          </div>
          <div className="h-12 w-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400">
            <TrendingUp className="h-6 w-6" />
          </div>
        </motion.div>

        {/* Total Outflow Card */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-[#111111] p-5 rounded-2xl border border-white/5 shadow-xl flex items-start justify-between"
        >
          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
              Total de Saídas
            </span>
            <span className="text-3xl font-bold text-rose-400 block">
              {formatBRL(totalOutflow)}
            </span>
            <span className="text-xs text-gray-400 flex items-center gap-1 mt-1">
              <ArrowDownRight className="h-3.5 w-3.5 text-rose-400" />
              Custos e despesas
            </span>
          </div>
          <div className="h-12 w-12 bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-400">
            <TrendingDown className="h-6 w-6" />
          </div>
        </motion.div>

        {/* Balance Card */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-[#111111] p-5 rounded-2xl border border-white/5 shadow-xl flex items-start justify-between"
        >
          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
              Saldo Líquido Caixa
            </span>
            <span className={`text-3xl font-bold block ${netBalance >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
              {formatBRL(netBalance)}
            </span>
            <span className="text-xs text-gray-400 flex items-center gap-1 mt-1">
              <Wallet className="h-3.5 w-3.5 text-blue-400" />
              Recurso disponível
            </span>
          </div>
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${netBalance >= 0 ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-400'}`}>
            <DollarSign className="h-6 w-6" />
          </div>
        </motion.div>

        {/* Total Debts Card */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-[#111111] p-5 rounded-2xl border border-white/5 shadow-xl flex items-start justify-between"
        >
          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
              Dívidas Pendentes
            </span>
            <span className="text-3xl font-bold text-amber-500 block">
              {formatBRL(totalDebts)}
            </span>
            <span className="text-xs text-gray-400 flex items-center gap-1 mt-1">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
              Inadimplentes ativos
            </span>
          </div>
          <div className="h-12 w-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500">
            <ShieldAlert className="h-6 w-6" />
          </div>
        </motion.div>
      </div>

      {/* Midsection: Cash Flow, Financial Status & Voting Rights Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Card 1: Fluxo de Caixa Geral */}
        <div className="bg-[#111111] p-6 rounded-2xl border border-white/5 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Wallet className="h-4 w-4 text-blue-400" />
              Fluxo de Caixa Geral (Proporção)
            </h3>
            {totalInflow + totalOutflow > 0 ? (
              <div className="space-y-4">
                <div className="flex h-5 w-full rounded-lg overflow-hidden bg-[#1a1a1a]">
                  <div 
                    style={{ width: `${(totalInflow / (totalInflow + totalOutflow)) * 100}%` }}
                    className="bg-emerald-500 transition-all duration-500"
                    title={`Entradas: ${Math.round((totalInflow / (totalInflow + totalOutflow)) * 100)}%`}
                  />
                  <div 
                    style={{ width: `${(totalOutflow / (totalInflow + totalOutflow)) * 100}%` }}
                    className="bg-rose-500 transition-all duration-500"
                    title={`Saídas: ${Math.round((totalOutflow / (totalInflow + totalOutflow)) * 100)}%`}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs font-medium text-gray-400">
                  <div className="p-3 bg-[#161616] rounded-xl border border-white/5 flex flex-col">
                    <span className="text-gray-500 text-[10px] uppercase font-bold flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-emerald-500"></span> Entradas
                    </span>
                    <span className="text-base font-bold text-emerald-400 mt-1">{formatBRL(totalInflow)}</span>
                    <span className="text-gray-400 text-[10px] mt-0.5">{Math.round((totalInflow / (totalInflow + totalOutflow)) * 100)}% do volume</span>
                  </div>
                  <div className="p-3 bg-[#161616] rounded-xl border border-white/5 flex flex-col">
                    <span className="text-gray-500 text-[10px] uppercase font-bold flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-rose-500"></span> Saídas
                    </span>
                    <span className="text-base font-bold text-rose-400 mt-1">{formatBRL(totalOutflow)}</span>
                    <span className="text-gray-400 text-[10px] mt-0.5">{Math.round((totalOutflow / (totalInflow + totalOutflow)) * 100)}% do volume</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">Nenhuma transação financeira registrada para gerar proporcionalidade.</div>
            )}
          </div>
        </div>

        {/* Card 2: Distribuição de Situação Financeira dos Associados */}
        <div className="bg-[#111111] p-6 rounded-2xl border border-white/5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-amber-500" />
                Situação Financeira dos Associados
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-white/5 px-2 py-0.5 rounded-md">
                Total: {totalWithStatus} {totalWithStatus === 1 ? 'membro' : 'membros'}
              </span>
            </div>

            {totalWithStatus > 0 ? (
              <div className="space-y-4">
                {/* Stacked Progress Bar */}
                <div className="flex h-5 w-full rounded-lg overflow-hidden bg-[#1a1a1a]">
                  {countAdimplente > 0 && (
                    <div 
                      style={{ width: `${pctAdimplenteNum}%` }}
                      className="bg-emerald-500 transition-all duration-500"
                      title={`Adimplente: ${pctAdimplente}%`}
                    />
                  )}
                  {countAtencao > 0 && (
                    <div 
                      style={{ width: `${pctAtencaoNum}%` }}
                      className="bg-yellow-500 transition-all duration-500"
                      title={`Em Atenção: ${pctAtencao}%`}
                    />
                  )}
                  {countPerigo > 0 && (
                    <div 
                      style={{ width: `${pctPerigoNum}%` }}
                      className="bg-orange-500 transition-all duration-500"
                      title={`Zona de Perigo: ${pctPerigo}%`}
                    />
                  )}
                  {countInadimplente > 0 && (
                    <div 
                      style={{ width: `${pctInadimplenteNum}%` }}
                      className="bg-rose-500 transition-all duration-500"
                      title={`Inadimplente: ${pctInadimplente}%`}
                    />
                  )}
                </div>

                {/* 4 Interactive Cards */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Card 1: Adimplente */}
                  <button
                    onClick={() => {
                      setSelectedStatus(selectedStatus === 'Adimplente' ? null : 'Adimplente');
                      setSelectedVoting(null);
                    }}
                    className={`p-2 rounded-xl border text-left transition-all relative cursor-pointer ${
                      selectedStatus === 'Adimplente' 
                        ? 'bg-emerald-500/10 border-emerald-500/50 ring-1 ring-emerald-500/30' 
                        : 'bg-[#161616] border-white/5 hover:border-emerald-500/30'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase text-emerald-400 block mb-1">🟢 Adimplente</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-base font-extrabold text-white leading-none">{countAdimplente}</span>
                      <span className="text-[9px] font-medium text-gray-400">({pctAdimplente}%)</span>
                    </div>
                  </button>

                  {/* Card 2: Em Atenção */}
                  <button
                    onClick={() => {
                      setSelectedStatus(selectedStatus === 'Em Atenção' ? null : 'Em Atenção');
                      setSelectedVoting(null);
                    }}
                    className={`p-2 rounded-xl border text-left transition-all relative cursor-pointer ${
                      selectedStatus === 'Em Atenção' 
                        ? 'bg-yellow-500/10 border-yellow-500/50 ring-1 ring-yellow-500/30' 
                        : 'bg-[#161616] border-white/5 hover:border-yellow-500/30'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase text-yellow-500 block mb-1">🟡 Atenção</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-base font-extrabold text-white leading-none">{countAtencao}</span>
                      <span className="text-[9px] font-medium text-gray-400">({pctAtencao}%)</span>
                    </div>
                  </button>

                  {/* Card 3: Zona de Perigo */}
                  <button
                    onClick={() => {
                      setSelectedStatus(selectedStatus === 'Zona de Perigo' ? null : 'Zona de Perigo');
                      setSelectedVoting(null);
                    }}
                    className={`p-2 rounded-xl border text-left transition-all relative cursor-pointer ${
                      selectedStatus === 'Zona de Perigo' 
                        ? 'bg-orange-500/10 border-orange-500/50 ring-1 ring-orange-500/30' 
                        : 'bg-[#161616] border-white/5 hover:border-orange-500/30'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase text-orange-400 block mb-1">🟠 Perigo</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-base font-extrabold text-white leading-none">{countPerigo}</span>
                      <span className="text-[9px] font-medium text-gray-400">({pctPerigo}%)</span>
                    </div>
                  </button>

                  {/* Card 4: Inadimplente */}
                  <button
                    onClick={() => {
                      setSelectedStatus(selectedStatus === 'Inadimplente' ? null : 'Inadimplente');
                      setSelectedVoting(null);
                    }}
                    className={`p-2 rounded-xl border text-left transition-all relative cursor-pointer ${
                      selectedStatus === 'Inadimplente' 
                        ? 'bg-rose-500/10 border-rose-500/50 ring-1 ring-rose-500/30' 
                        : 'bg-[#161616] border-white/5 hover:border-rose-500/30'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase text-rose-400 block mb-1">🔴 Inadimplente</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-base font-extrabold text-white leading-none">{countInadimplente}</span>
                      <span className="text-[9px] font-medium text-gray-400">({pctInadimplente}%)</span>
                    </div>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">Nenhum associado cadastrado para gerar estatísticas.</div>
            )}
          </div>
        </div>

        {/* Card 3: Direito a Voto dos Associados (New Requested Chart/Feature) */}
        <div className="bg-[#111111] p-6 rounded-2xl border border-white/5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-blue-400" />
                Direito a Voto dos Associados
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-white/5 px-2 py-0.5 rounded-md">
                Total: {totalAssociatesForVoting} {totalAssociatesForVoting === 1 ? 'membro' : 'membros'}
              </span>
            </div>

            {totalAssociatesForVoting > 0 ? (
              <div className="space-y-4">
                {/* Proportion bar */}
                <div className="flex h-5 w-full rounded-lg overflow-hidden bg-[#1a1a1a]">
                  {countWithVote > 0 && (
                    <div 
                      style={{ width: `${pctWithVoteNum}%` }}
                      className="bg-blue-500 transition-all duration-500"
                      title={`Com Direito a Voto: ${pctWithVote}%`}
                    />
                  )}
                  {countWithoutVote > 0 && (
                    <div 
                      style={{ width: `${pctWithoutVoteNum}%` }}
                      className="bg-gray-600 transition-all duration-500"
                      title={`Sem Direito a Voto: ${pctWithoutVote}%`}
                    />
                  )}
                </div>

                {/* 2 Interactive Cards */}
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Card 1: Com Voto */}
                  <button
                    onClick={() => {
                      setSelectedVoting(selectedVoting === 'Com Voto' ? null : 'Com Voto');
                      setSelectedStatus(null);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all relative cursor-pointer ${
                      selectedVoting === 'Com Voto' 
                        ? 'bg-blue-500/10 border-blue-500/50 ring-1 ring-blue-500/30' 
                        : 'bg-[#161616] border-white/5 hover:border-blue-500/30'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase text-blue-400 block mb-1">🗳️ Com Direito</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl font-extrabold text-white leading-none">{countWithVote}</span>
                      <span className="text-[10px] font-medium text-gray-400">({pctWithVote}%)</span>
                    </div>
                  </button>

                  {/* Card 2: Sem Voto */}
                  <button
                    onClick={() => {
                      setSelectedVoting(selectedVoting === 'Sem Voto' ? null : 'Sem Voto');
                      setSelectedStatus(null);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all relative cursor-pointer ${
                      selectedVoting === 'Sem Voto' 
                        ? 'bg-rose-500/10 border-rose-500/50 ring-1 ring-rose-500/30' 
                        : 'bg-[#161616] border-white/5 hover:border-gray-500/30'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase text-gray-400 block mb-1">❌ Sem Direito</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl font-extrabold text-white leading-none">{countWithoutVote}</span>
                      <span className="text-[10px] font-medium text-gray-400">({pctWithoutVote}%)</span>
                    </div>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">Nenhum associado cadastrado para gerar estatísticas de voto.</div>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Selected Status Details Dropdown/Drawer inside the Dashboard */}
      {selectedStatus && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#111111] p-5 rounded-2xl border border-white/10 shadow-xl space-y-3"
        >
          <div className="flex justify-between items-center pb-2 border-b border-white/5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <span>Membros Filtrados:</span>
              <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                selectedStatus === 'Adimplente' ? 'bg-emerald-500/10 text-emerald-400' :
                selectedStatus === 'Em Atenção' ? 'bg-yellow-500/10 text-yellow-400' :
                selectedStatus === 'Zona de Perigo' ? 'bg-orange-500/10 text-orange-400' :
                'bg-rose-500/10 text-rose-400'
              }`}>
                {selectedStatus === 'Adimplente' ? '🟢 ' :
                 selectedStatus === 'Em Atenção' ? '🟡 ' :
                 selectedStatus === 'Zona de Perigo' ? '🟠 ' : '🔴 '}
                {selectedStatus} ({matchingAssociates.length})
              </span>
            </h4>
            <button 
              onClick={() => setSelectedStatus(null)}
              className="text-xs text-gray-500 hover:text-white cursor-pointer transition-all"
            >
              Fechar Detalhes
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
            {matchingAssociates.length > 0 ? (
              matchingAssociates.map((assoc) => (
                <div key={assoc.id} className="p-3 bg-[#161616] rounded-xl border border-white/5 flex items-center justify-between">
                  <div className="space-y-0.5 min-w-0 pr-2">
                    <p className="text-xs font-bold text-white truncate leading-snug">{assoc.name}</p>
                    <p className="text-[10px] text-gray-500 truncate leading-none">{assoc.email}</p>
                    {assoc.debtAmount !== undefined && assoc.debtAmount > 0 ? (
                      <p className="text-[10px] text-red-400 font-semibold font-mono mt-0.5">Dívida: {formatBRL(assoc.debtAmount)}</p>
                    ) : null}
                  </div>
                  <button
                    onClick={() => onNavigateToTab('associates')}
                    className="text-[10px] font-bold text-blue-400 hover:text-blue-300 px-2.5 py-1.5 bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/10 rounded-lg shrink-0 cursor-pointer"
                  >
                    Ver Cadastro
                  </button>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500 py-4 text-center md:col-span-2 xl:col-span-3">Nenhum associado encontrado nesta situação.</p>
            )}
          </div>
        </motion.div>
      )}

      {/* Interactive Selected Voting Right Details Dropdown/Drawer inside the Dashboard */}
      {selectedVoting && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#111111] p-5 rounded-2xl border border-white/10 shadow-xl space-y-3"
        >
          <div className="flex justify-between items-center pb-2 border-b border-white/5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <span>Membros Filtrados por Direito a Voto:</span>
              <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                selectedVoting === 'Com Voto' ? 'bg-blue-500/10 text-blue-400' : 'bg-gray-500/10 text-gray-400 border border-white/5'
              }`}>
                {selectedVoting === 'Com Voto' ? '🗳️ Com Direito a Voto' : '❌ Sem Direito a Voto'} ({matchingVotingAssociates.length})
              </span>
            </h4>
            <button 
              onClick={() => setSelectedVoting(null)}
              className="text-xs text-gray-500 hover:text-white cursor-pointer transition-all"
            >
              Fechar Detalhes
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
            {matchingVotingAssociates.length > 0 ? (
              matchingVotingAssociates.map((assoc) => (
                <div key={assoc.id} className="p-3 bg-[#161616] rounded-xl border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                    {assoc.photo ? (
                      <div className="w-8 h-8 rounded-full border border-blue-500/30 overflow-hidden shrink-0">
                        <img src={assoc.photo} alt={assoc.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                        <Users className="h-4.5 w-4.5 text-gray-500 opacity-40" />
                      </div>
                    )}
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate leading-snug">{assoc.name}</p>
                      <p className="text-[10px] text-gray-500 truncate leading-none">{assoc.email}</p>
                      <p className="text-[10px] text-blue-400 font-semibold font-mono mt-0.5">{assoc.matricula ? `Matrícula: ${assoc.matricula}` : 'Sem matrícula'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigateToTab('associates')}
                    className="text-[10px] font-bold text-blue-400 hover:text-blue-300 px-2.5 py-1.5 bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/10 rounded-lg shrink-0 cursor-pointer"
                  >
                    Ver Cadastro
                  </button>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500 py-4 text-center md:col-span-2 xl:col-span-3">Nenhum associado encontrado nesta situação.</p>
            )}
          </div>
        </motion.div>
      )}

      {/* Bento Layout Lower Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Col 1: Recent Members */}
        <div className="bg-[#111111] p-5 rounded-2xl border border-white/5 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-1.5 font-sans">
              <Users className="h-4.5 w-4.5 text-blue-500" />
              Novos Associados
            </h3>
            <button 
              onClick={() => onNavigateToTab('associates')}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
            >
              Ver todos
            </button>
          </div>
          <div className="divide-y divide-white/5">
            {recentAssociates.length > 0 ? (
              recentAssociates.map((assoc) => (
                <div key={assoc.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-white leading-tight">{assoc.name}</p>
                    <p className="text-[11px] text-gray-500">{assoc.email}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    assoc.status === 'Ativo' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-gray-400'
                  }`}>
                    {assoc.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500 py-4 text-center">Nenhum associado cadastrado.</p>
            )}
          </div>
        </div>

        {/* Col 2: Recent Transactions */}
        <div className="bg-[#111111] p-5 rounded-2xl border border-white/5 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-1.5 font-sans">
              <DollarSign className="h-4.5 w-4.5 text-blue-500" />
              Últimas Movimentações
            </h3>
            <button 
              onClick={() => onNavigateToTab('finance')}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
            >
              Ver financeiro
            </button>
          </div>
          <div className="divide-y divide-white/5">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((trans) => (
                <div key={trans.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                  <div className="space-y-0.5 max-w-[65%]">
                    <p className="text-xs font-semibold text-white truncate leading-tight">{trans.description}</p>
                    <p className="text-[10px] text-gray-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(trans.date).toLocaleDateString('pt-BR')} • {trans.category}
                    </p>
                  </div>
                  <span className={`text-xs font-bold ${
                    trans.type === 'Entrada' ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {trans.type === 'Entrada' ? '+' : '-'} {formatBRL(trans.amount)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500 py-4 text-center">Nenhuma transação financeira lançada.</p>
            )}
          </div>
        </div>

        {/* Col 3: Latest Announcements */}
        <div className="bg-[#111111] p-5 rounded-2xl border border-white/5 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-1.5 font-sans">
              <Bell className="h-4.5 w-4.5 text-blue-500" />
              Comunicados Ativos
            </h3>
            <button 
              onClick={() => onNavigateToTab('announcements')}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
            >
              Gerenciar
            </button>
          </div>
          <div className="space-y-3">
            {announcements.length > 0 ? (
              announcements.slice(0, 2).map((ann) => (
                <div key={ann.id} className="p-3 bg-[#1a1a1a] border border-white/5 rounded-xl space-y-1.5">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="text-xs font-bold text-white leading-tight truncate">{ann.title}</h4>
                    <span className="text-[9px] text-gray-500 shrink-0 font-medium">
                      {new Date(ann.date).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">
                    {ann.content}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500 py-4 text-center">Nenhum comunicado cadastrado.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
