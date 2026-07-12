import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building, Users, DollarSign, Bell, LogOut, 
  Menu, X, Sparkles, LayoutDashboard, Calendar, UserCheck
} from 'lucide-react';
import { Associate, Transaction, Announcement, ReportCopy, Assembly, Poll } from '../types';

import OverviewTab from './OverviewTab';
import AssociatesTab from './AssociatesTab';
import ClientsTab from './ClientsTab';
import FinanceTab from './FinanceTab';
import AnnouncementsTab from './AnnouncementsTab';
import AssembliesPollsTab from './AssembliesPollsTab';

interface AdminDashboardProps {
  associates: Associate[];
  clients: Associate[];
  transactions: Transaction[];
  announcements: Announcement[];
  reports: ReportCopy[];
  assemblies: Assembly[];
  polls: Poll[];
  onAddAssociate: (associate: Omit<Associate, 'id'>) => void;
  onEditAssociate: (associate: Associate) => void;
  onDeleteAssociate: (id: string) => void;
  onAddClient: (client: Omit<Associate, 'id'>) => void;
  onEditClient: (client: Associate) => void;
  onDeleteClient: (id: string) => void;
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  onDeleteTransaction: (id: string) => void;
  onAddAnnouncement: (announcement: Omit<Announcement, 'id'>) => void;
  onDeleteAnnouncement: (id: string) => void;
  onAddReport: (report: ReportCopy) => void;
  onDeleteReport: (id: string) => void;
  onRecordPayment: (associate: Associate, amount: number, paymentMethod: string, description?: string) => void;
  onAddAssembly: (assembly: Omit<Assembly, 'id' | 'createdAt'>) => void;
  onDeleteAssembly: (id: string) => void;
  onAddPoll: (poll: Omit<Poll, 'id' | 'createdAt'>) => void;
  onUpdatePoll: (poll: Poll) => void;
  onDeletePoll: (id: string) => void;
  onLogout: () => void;
}

export default function AdminDashboard({
  associates,
  clients,
  transactions,
  announcements,
  reports,
  assemblies,
  polls,
  onAddAssociate,
  onEditAssociate,
  onDeleteAssociate,
  onAddClient,
  onEditClient,
  onDeleteClient,
  onAddTransaction,
  onDeleteTransaction,
  onAddAnnouncement,
  onDeleteAnnouncement,
  onAddReport,
  onDeleteReport,
  onRecordPayment,
  onAddAssembly,
  onDeleteAssembly,
  onAddPoll,
  onUpdatePoll,
  onDeletePoll,
  onLogout
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Use props directly since they are separated at state/database levels
  const associatesList = associates;
  const clientsList = clients;

  const totalPendingActions = associatesList.filter(assoc => {
    const hasPendingAgreement = assoc.installmentPlan && assoc.installmentPlan.status === 'Em Análise';
    const hasPendingReceipt = assoc.installmentPlan && assoc.installmentPlan.installments && assoc.installmentPlan.installments.some(inst => inst.status === 'Em Análise');
    const hasPendingMonthlyReceipt = assoc.pendingMonthlyReceipts && assoc.pendingMonthlyReceipts.length > 0;
    return hasPendingAgreement || hasPendingReceipt || hasPendingMonthlyReceipt;
  }).length;

  // Menu items list
  const menuItems = [
    { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'associates', label: 'Associados', icon: Users, badge: associatesList.length },
    { id: 'clients', label: 'Clientes', icon: UserCheck, badge: clientsList.length },
    { id: 'finance', label: 'Livro Caixa', icon: DollarSign },
    { id: 'announcements', label: 'Comunicados', icon: Bell, badge: announcements.length },
    { id: 'assemblies_polls', label: 'Assembleias & Votações', icon: Calendar, badge: assemblies.length + polls.filter(p => p.status === 'Ativo').length }
  ];

  const handleNavigateToTab = (tabId: string) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <OverviewTab
            associates={associates}
            transactions={transactions}
            announcements={announcements}
            onNavigateToTab={handleNavigateToTab}
          />
        );
      case 'associates':
        return (
          <AssociatesTab
            associates={associatesList}
            onAddAssociate={onAddAssociate}
            onEditAssociate={onEditAssociate}
            onDeleteAssociate={onDeleteAssociate}
            onRecordPayment={onRecordPayment}
          />
        );
      case 'clients':
        return (
          <ClientsTab
            clients={clientsList}
            onAddClient={onAddClient}
            onEditClient={onEditClient}
            onDeleteClient={onDeleteClient}
          />
        );
      case 'finance':
        return (
          <FinanceTab
            transactions={transactions}
            associates={associatesList}
            reports={reports}
            onAddTransaction={onAddTransaction}
            onDeleteTransaction={onDeleteTransaction}
            onAddReport={onAddReport}
            onDeleteReport={onDeleteReport}
          />
        );
      case 'announcements':
        return (
          <AnnouncementsTab
            announcements={announcements}
            onAddAnnouncement={onAddAnnouncement}
            onDeleteAnnouncement={onDeleteAnnouncement}
          />
        );
      case 'assemblies_polls':
        return (
          <AssembliesPollsTab
            assemblies={assemblies}
            polls={polls}
            onAddAssembly={onAddAssembly}
            onDeleteAssembly={onDeleteAssembly}
            onAddPoll={onAddPoll}
            onUpdatePoll={onUpdatePoll}
            onDeletePoll={onDeletePoll}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col md:flex-row text-gray-200">
      
      {/* Mobile Top Header */}
      <div className="md:hidden bg-[#111111] border-b border-white/5 px-4 py-3 flex justify-between items-center sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-gradient-to-tr from-blue-600 to-blue-700 rounded-lg flex items-center justify-center text-white">
            <Building className="h-4.5 w-4.5" />
          </div>
          <span className="font-extrabold text-white text-sm tracking-tight">GestaAssoc</span>
          <span className="text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded font-bold uppercase">Admin</span>
        </div>
        
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-1.5 hover:bg-white/5 border border-white/10 rounded-lg text-gray-300 relative"
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          {!isMobileMenuOpen && totalPendingActions > 0 && (
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
          )}
        </button>
      </div>

      {/* Sidebar - Desktop and Mobile drawer overlay */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-[#111111] border-r border-white/5 flex flex-col justify-between
        transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-screen
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:flex'}
      `}>
        {/* Upper Sidebar */}
        <div className="space-y-6">
          {/* Logo Brand block */}
          <div className="h-16 border-b border-white/5 flex items-center gap-3 px-6 shrink-0 bg-[#1a1a1a]/40">
            <div className="h-9 w-9 bg-gradient-to-tr from-blue-600 to-blue-700 rounded-xl flex items-center justify-center text-white shadow shadow-blue-900/20">
              <Building className="h-5 w-5" />
            </div>
            <div>
              <span className="font-extrabold text-white text-base tracking-tight block">GestaAssoc</span>
              <span className="text-[9px] text-blue-500 font-bold uppercase tracking-wider block">Gestão Administrativa</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="px-3.5 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const isAssociatesTab = item.id === 'associates';
              const hasAlert = isAssociatesTab && totalPendingActions > 0;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigateToTab(item.id)}
                  className={`w-full flex items-center justify-between py-2.5 px-3.5 text-xs font-semibold rounded-xl transition-all duration-200 relative ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative shrink-0">
                      <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                      {hasAlert && (
                        <span className="absolute -top-1 -right-1 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                      )}
                    </div>
                    <span className="truncate flex items-center gap-1.5">
                      {item.label}
                      {hasAlert && (
                        <span className="bg-red-500/20 border border-red-500/30 text-red-400 text-[8px] font-extrabold uppercase px-1 rounded-sm animate-pulse shrink-0">
                          Pendente
                        </span>
                      )}
                    </span>
                  </div>
                  {item.badge !== undefined && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 shrink-0 ${
                      isActive ? 'bg-white/20 text-white' : 'bg-white/5 text-gray-400 border border-white/5'
                    }`}>
                      {item.badge}
                      {hasAlert && (
                        <span className="h-1.5 w-1.5 bg-red-500 rounded-full inline-block animate-pulse shrink-0"></span>
                      )}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Lower Sidebar Actions */}
        <div className="p-4 border-t border-white/5 space-y-3 shrink-0">
          <div className="bg-[#1a1a1a] border border-white/5 p-3 rounded-xl">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Status do Servidor</p>
            <div className="flex items-center gap-1.5 text-xs text-gray-300 font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
              <span>Online (LocalDB)</span>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="w-full py-2 px-3 border border-white/10 hover:bg-white/5 text-gray-400 hover:text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Efetuar Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar on desktop */}
        <header className="hidden md:flex h-16 bg-[#111111] border-b border-white/5 px-8 items-center justify-between shrink-0 sticky top-0 z-30">
          <div>
            <h2 className="font-extrabold text-white text-base uppercase tracking-wider font-sans">
              {menuItems.find(item => item.id === activeTab)?.label}
            </h2>
          </div>

          <div className="flex items-center gap-5">
            {/* Live Clock / Calendar */}
            <div className="text-right text-xs">
              <span className="text-gray-500 block font-medium">Data Local</span>
              <span className="font-semibold text-gray-300 block">
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
          </div>
        </header>

        {/* Main Content Box */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {renderActiveTab()}
        </main>
      </div>

      {/* Mobile Drawer Overlay Background */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs md:hidden"
        ></div>
      )}
    </div>
  );
}
