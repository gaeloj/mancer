import React from 'react';
import { motion } from 'motion/react';
import { Users, TrendingUp, TrendingDown, DollarSign, Bell, Calendar, UserCheck, ArrowUpRight, ArrowDownRight, Wallet, ShieldAlert } from 'lucide-react';
import { Associate, Transaction, Announcement } from '../types';

interface OverviewTabProps {
  associates: Associate[];
  transactions: Transaction[];
  announcements: Announcement[];
  onNavigateToTab: (tab: string) => void;
}

export default function OverviewTab({ associates, transactions, announcements, onNavigateToTab }: OverviewTabProps) {
  // Stats calculations
  const totalAssociates = associates.length;
  const activeAssociates = associates.filter(a => a.status === 'Ativo').length;
  const activePercent = totalAssociates > 0 ? Math.round((activeAssociates / totalAssociates) * 100) : 0;

  const totalInflow = transactions
    .filter(t => t.type === 'Entrada')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalOutflow = transactions
    .filter(t => t.type === 'Saída')
    .reduce((acc, t) => acc + t.amount, 0);

  const netBalance = totalInflow - totalOutflow;

  const totalDebts = associates
    .filter(a => a.financialStatus === 'Inadimplente')
    .reduce((acc, a) => acc + (a.debtAmount || 0), 0);

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
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

      {/* Visual Indicator of Capital Health */}
      <div className="bg-[#111111] p-6 rounded-2xl border border-white/5 shadow-xl">
        <h3 className="text-sm font-semibold text-white mb-4">Fluxo de Caixa Geral (Proporção)</h3>
        {totalInflow + totalOutflow > 0 ? (
          <div>
            <div className="flex h-5 w-full rounded-lg overflow-hidden bg-[#1a1a1a] mb-2">
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
            <div className="flex justify-between text-xs font-medium text-gray-400">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500"></span>Entradas ({Math.round((totalInflow / (totalInflow + totalOutflow)) * 100)}%)</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-500"></span>Saídas ({Math.round((totalOutflow / (totalInflow + totalOutflow)) * 100)}%)</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500 text-sm">Nenhuma transação financeira registrada para gerar proporcionalidade.</div>
        )}
      </div>

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
