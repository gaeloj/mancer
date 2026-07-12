import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Search, Plus, Edit, Trash2, CheckCircle2, XCircle, 
  Mail, Phone, FileText, MapPin, DollarSign, X, Calendar, AlertCircle,
  Eye, Info, Landmark, ShieldAlert, Award, Lock, ShieldCheck, Sparkles
} from 'lucide-react';
import { Associate } from '../types';
import { maskMoney, parseMaskedMoney, maskDate, dateToISO, dateToBRL, formatBRL } from '../utils/formatters';

interface AssociatesTabProps {
  associates: Associate[];
  onAddAssociate: (associate: Omit<Associate, 'id'>) => void;
  onEditAssociate: (associate: Associate) => void;
  onDeleteAssociate: (id: string) => void;
  onRecordPayment: (associate: Associate, amount: number, paymentMethod: string, description?: string) => void;
}

export default function AssociatesTab({ 
  associates, 
  onAddAssociate, 
  onEditAssociate, 
  onDeleteAssociate,
  onRecordPayment
}: AssociatesTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Ativo' | 'Inativo'>('Todos');
  
  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingAssociate, setEditingAssociate] = useState<Associate | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [payingAssociate, setPayingAssociate] = useState<Associate | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedAssociate, setSelectedAssociate] = useState<Associate | null>(null);
  
  // Login management states
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginAssociate, setLoginAssociate] = useState<Associate | null>(null);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginStatusVal, setLoginStatusVal] = useState<'Ativo' | 'Bloqueado' | 'Congelado'>('Ativo');
  
  // State for receipt preview modal
  const [previewingReceipt, setPreviewingReceipt] = useState<{ 
    fileName: string; 
    fileData: string; 
    associate: Associate; 
    installmentNumber?: number; 
    monthName?: string;
    monthKey?: string;
  } | null>(null);

  // Installment plan approval/rejection handlers
  const handleApprovePlan = (assoc: Associate) => {
    if (!assoc.installmentPlan) return;
    const updated: Associate = {
      ...assoc,
      financialStatus: 'Adimplente', // Considered regular once plan is active/approved
      installmentPlan: {
        ...assoc.installmentPlan,
        status: 'Aprovado'
      }
    };
    onEditAssociate(updated);
    setSelectedAssociate(updated);
  };

  const handleRejectPlan = (assoc: Associate) => {
    if (!assoc.installmentPlan) return;
    const updated: Associate = {
      ...assoc,
      financialStatus: 'Inadimplente',
      installmentPlan: {
        ...assoc.installmentPlan,
        status: 'Reprovado'
      }
    };
    onEditAssociate(updated);
    setSelectedAssociate(updated);
  };

  const handleApproveInstallmentPayment = (assoc: Associate, installmentNumber: number) => {
    if (!assoc.installmentPlan || !assoc.installmentPlan.installments) return;
    
    const updatedInstallments = assoc.installmentPlan.installments.map(inst => {
      if (inst.number === installmentNumber) {
        return { ...inst, status: 'Pago' as const, paymentDate: new Date().toISOString() };
      }
      return inst;
    });

    const allPaid = updatedInstallments.every(inst => inst.status === 'Pago');
    const planStatus = allPaid ? ('Pago' as const) : assoc.installmentPlan.status;
    const financialStatus = allPaid ? ('Adimplente' as const) : assoc.financialStatus;
    const debtAmount = allPaid ? 0 : assoc.debtAmount;

    const updated: Associate = {
      ...assoc,
      financialStatus,
      debtAmount,
      installmentPlan: {
        ...assoc.installmentPlan,
        status: planStatus,
        installments: updatedInstallments
      }
    };

    const targetInst = assoc.installmentPlan.installments.find(i => i.number === installmentNumber);
    if (targetInst) {
      onRecordPayment(assoc, targetInst.value, assoc.installmentPlan.paymentMethod, `Acordo Parcela ${installmentNumber}/${assoc.installmentPlan.installmentsCount}`);
    }
    
    onEditAssociate(updated);
    setSelectedAssociate(updated);
    
    // Close preview if it's open
    if (previewingReceipt && previewingReceipt.installmentNumber === installmentNumber) {
      setPreviewingReceipt(null);
    }
  };

  const handleRejectInstallmentPayment = (assoc: Associate, installmentNumber: number) => {
    if (!assoc.installmentPlan || !assoc.installmentPlan.installments) return;

    const updatedInstallments = assoc.installmentPlan.installments.map(inst => {
      if (inst.number === installmentNumber) {
        return { ...inst, status: 'Recusado' as const, receiptFile: undefined, receiptFileName: undefined };
      }
      return inst;
    });

    const updated: Associate = {
      ...assoc,
      installmentPlan: {
        ...assoc.installmentPlan,
        installments: updatedInstallments
      }
    };

    onEditAssociate(updated);
    setSelectedAssociate(updated);
    
    // Close preview if it's open
    if (previewingReceipt && previewingReceipt.installmentNumber === installmentNumber) {
      setPreviewingReceipt(null);
    }
  };

  const handleApproveMonthlyPayment = (assoc: Associate, monthKey: string) => {
    const receipt = assoc.pendingMonthlyReceipts?.find(r => r.monthKey === monthKey);
    if (!receipt) return;

    onRecordPayment(
      assoc,
      receipt.amount,
      receipt.paymentMethod,
      `Mensalidade de ${receipt.monthName}/2026 - Portal do Associado`
    );

    const updatedPending = assoc.pendingMonthlyReceipts?.filter(r => r.monthKey !== monthKey) || [];
    const updated: Associate = {
      ...assoc,
      pendingMonthlyReceipts: updatedPending
    };

    onEditAssociate(updated);
    setSelectedAssociate(updated);

    // Close preview if it's open
    if (previewingReceipt && previewingReceipt.monthKey === monthKey) {
      setPreviewingReceipt(null);
    }
  };

  const handleRejectMonthlyPayment = (assoc: Associate, monthKey: string) => {
    const updatedPending = assoc.pendingMonthlyReceipts?.filter(r => r.monthKey !== monthKey) || [];
    const updated: Associate = {
      ...assoc,
      pendingMonthlyReceipts: updatedPending
    };

    onEditAssociate(updated);
    setSelectedAssociate(updated);

    // Close preview if it's open
    if (previewingReceipt && previewingReceipt.monthKey === monthKey) {
      setPreviewingReceipt(null);
    }
  };
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [monthlyFee, setMonthlyFee] = useState<string>(''); // Starts blank
  const [status, setStatus] = useState<'Ativo' | 'Inativo'>('Ativo');
  
  // New Form Fields requested by user
  const [docType, setDocType] = useState<'RG' | 'CIN'>('RG');
  const [rgNumero, setRgNumero] = useState('');
  const [rgOrgaoExpedidor, setRgOrgaoExpedidor] = useState('');
  const [rgDataExpedicao, setRgDataExpedicao] = useState('');
  const [rgUf, setRgUf] = useState('');
  const [cinNumero, setCinNumero] = useState('');
  const [nis, setNis] = useState('');
  const [caf, setCaf] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [filiation, setFiliation] = useState('');
  const [gender, setGender] = useState<'Masculino' | 'Feminino' | 'Outro'>('Masculino');
  const [joiningDate, setJoiningDate] = useState('');
  const [financialStatus, setFinancialStatus] = useState<'Adimplente' | 'Inadimplente'>('Adimplente');
  const [debtAmount, setDebtAmount] = useState<string>(''); // Starts blank
  const [documentStatus, setDocumentStatus] = useState<'OK' | 'Com Pendência'>('OK');
  const [maxInstallmentsAllowed, setMaxInstallmentsAllowed] = useState<number>(12);
  const [certidaoTipo, setCertidaoTipo] = useState<'Nascimento' | 'Casamento' | 'Divórcio' | 'Óbito' | 'Nenhuma'>('Nenhuma');
  const [certidaoModelo, setCertidaoModelo] = useState<'Novo' | 'Antigo'>('Novo');
  const [certidaoNumero, setCertidaoNumero] = useState('');
 
  // Payment Form fields
  const [paymentAmount, setPaymentAmount] = useState<string>(''); // Starts blank
  const [paymentMethod, setPaymentMethod] = useState('Pix');
  const [paymentDescription, setPaymentDescription] = useState('');

  // Open modal for adding
  const handleOpenAddModal = () => {
    setEditingAssociate(null);
    setName('');
    setEmail('');
    setCpf('');
    setPhone('');
    setAddress('');
    setMonthlyFee(''); // Starts blank
    setStatus('Ativo');
    
    // Reset new states
    setDocType('RG');
    setRgNumero('');
    setRgOrgaoExpedidor('');
    setRgDataExpedicao('');
    setRgUf('');
    setCinNumero('');
    setNis('');
    setCaf('');
    setBirthDate('');
    setFiliation('');
    setGender('Masculino');
    
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    setJoiningDate(`${day}/${month}/${year}`);
    
    setFinancialStatus('Adimplente');
    setDebtAmount(''); // Starts blank
    setCertidaoTipo('Nenhuma');
    setCertidaoModelo('Novo');
    setCertidaoNumero('');
    setDocumentStatus('OK');
    setMaxInstallmentsAllowed(12);
    
    setIsFormModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEditModal = (assoc: Associate) => {
    setEditingAssociate(assoc);
    setName(assoc.name);
    setEmail(assoc.email);
    setCpf(assoc.cpf);
    setPhone(assoc.phone);
    setAddress(assoc.address);
    setMonthlyFee(assoc.monthlyFee ? maskMoney(assoc.monthlyFee.toFixed(2)) : '');
    setStatus(assoc.status);
    
    // Load new states
    setDocType(assoc.cinNumero ? 'CIN' : 'RG');
    setRgNumero(assoc.rgNumero || '');
    setRgOrgaoExpedidor(assoc.rgOrgaoExpedidor || '');
    setRgDataExpedicao(assoc.rgDataExpedicao ? dateToBRL(assoc.rgDataExpedicao) : '');
    setRgUf(assoc.rgUf || '');
    setCinNumero(assoc.cinNumero || '');
    setNis(assoc.nis || '');
    setCaf(assoc.caf || '');
    setBirthDate(assoc.birthDate ? dateToBRL(assoc.birthDate) : '');
    setFiliation(assoc.filiation || '');
    setGender(assoc.gender || 'Masculino');
    setJoiningDate(assoc.joiningDate ? dateToBRL(assoc.joiningDate) : '');
    setFinancialStatus(assoc.financialStatus || 'Adimplente');
    setDebtAmount(assoc.debtAmount ? maskMoney(assoc.debtAmount.toFixed(2)) : '');
    setCertidaoTipo(assoc.certidaoTipo || 'Nenhuma');
    setCertidaoModelo(assoc.certidaoModelo || 'Novo');
    setCertidaoNumero(assoc.certidaoNumero || '');
    setDocumentStatus(assoc.documentStatus || 'OK');
    setMaxInstallmentsAllowed(assoc.maxInstallmentsAllowed || 12);
    
    setIsFormModalOpen(true);
  };

  // Open modal for fast payment recording
  const handleOpenPaymentModal = (assoc: Associate) => {
    setPayingAssociate(assoc);
    setPaymentAmount(''); // Starts blank for typing
    setPaymentMethod('Pix');
    setPaymentDescription(`Mensalidade - ${assoc.name}`);
    setIsPaymentModalOpen(true);
  };

  const handleOpenDetailsModal = (assoc: Associate) => {
    setSelectedAssociate(assoc);
    setIsDetailsModalOpen(true);
  };

  // Login management actions
  const handleOpenLoginModal = (assoc: Associate) => {
    setLoginAssociate(assoc);
    setLoginUsername(assoc.username || '');
    setLoginPassword(assoc.password || '');
    setLoginStatusVal(assoc.loginStatus || 'Ativo');
    setIsLoginModalOpen(true);
  };

  const handleSaveLogin = () => {
    if (!loginAssociate) return;
    const updated: Associate = {
      ...loginAssociate,
      username: loginUsername,
      password: loginPassword,
      loginStatus: loginStatusVal
    };
    onEditAssociate(updated);
    setIsLoginModalOpen(false);
    setLoginAssociate(null);
  };

  const handleBlockLogin = () => {
    if (!loginAssociate) return;
    const updated: Associate = {
      ...loginAssociate,
      loginStatus: 'Bloqueado'
    };
    onEditAssociate(updated);
    setLoginStatusVal('Bloqueado');
    setLoginAssociate(updated);
  };

  const handleFreezeLogin = () => {
    if (!loginAssociate) return;
    const updated: Associate = {
      ...loginAssociate,
      loginStatus: 'Congelado'
    };
    onEditAssociate(updated);
    setLoginStatusVal('Congelado');
    setLoginAssociate(updated);
  };

  const handleActivateLogin = () => {
    if (!loginAssociate) return;
    const updated: Associate = {
      ...loginAssociate,
      loginStatus: 'Ativo'
    };
    onEditAssociate(updated);
    setLoginStatusVal('Ativo');
    setLoginAssociate(updated);
  };

  const handleDeleteLogin = () => {
    if (!loginAssociate) return;
    if (window.confirm("Deseja realmente excluir as credenciais de login deste associado? Ele não conseguirá mais logar até que novas credenciais sejam geradas.")) {
      const updated: Associate = {
        ...loginAssociate,
        username: '',
        password: '',
        loginStatus: 'Bloqueado'
      };
      onEditAssociate(updated);
      setLoginUsername('');
      setLoginPassword('');
      setLoginStatusVal('Bloqueado');
      setLoginAssociate(updated);
    }
  };

  const handleGenerateCredentials = () => {
    setLoginUsername(Math.floor(1000000 + Math.random() * 9000000).toString());
    setLoginPassword(Math.floor(1000000 + Math.random() * 9000000).toString());
    setLoginStatusVal('Ativo');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !cpf) return;

    const parsedMonthlyFee = parseMaskedMoney(monthlyFee);
    const parsedDebtAmount = financialStatus === 'Inadimplente' ? parseMaskedMoney(debtAmount) : 0;

    const extraFields = {
      rgNumero: docType === 'RG' ? (rgNumero || undefined) : undefined,
      rgOrgaoExpedidor: docType === 'RG' ? (rgOrgaoExpedidor || undefined) : undefined,
      rgDataExpedicao: docType === 'RG' && rgDataExpedicao ? dateToISO(rgDataExpedicao) : undefined,
      rgUf: docType === 'RG' ? (rgUf || undefined) : undefined,
      cinNumero: docType === 'CIN' ? (cinNumero || undefined) : undefined,
      nis: nis || undefined,
      birthDate: birthDate ? dateToISO(birthDate) : undefined,
      caf: caf || undefined,
      filiation: filiation || undefined,
      gender,
      joiningDate: joiningDate ? dateToISO(joiningDate) : '',
      financialStatus,
      debtAmount: parsedDebtAmount,
      documentStatus,
      maxInstallmentsAllowed,
      certidaoTipo,
      certidaoModelo: certidaoTipo !== 'Nenhuma' ? certidaoModelo : undefined,
      certidaoNumero: certidaoTipo !== 'Nenhuma' ? certidaoNumero : undefined
    };

    if (editingAssociate) {
      onEditAssociate({
        ...editingAssociate,
        name,
        email,
        cpf,
        phone,
        address,
        monthlyFee: parsedMonthlyFee,
        status,
        ...extraFields
      });
    } else {
      onAddAssociate({
        name,
        email,
        cpf,
        phone,
        address,
        monthlyFee: parsedMonthlyFee,
        status,
        ...extraFields
      });
    }
    setIsFormModalOpen(false);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingAssociate) return;
    const parsedPaymentAmount = parseMaskedMoney(paymentAmount);
    if (parsedPaymentAmount <= 0) {
      alert('Por favor, insira um valor de pagamento válido.');
      return;
    }
    onRecordPayment(payingAssociate, parsedPaymentAmount, paymentMethod, paymentDescription);
    setIsPaymentModalOpen(false);
  };

  // Filter logic
  const filteredAssociates = associates.filter((assoc) => {
    const matchesSearch = 
      assoc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assoc.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assoc.cpf.includes(searchQuery);
    
    const matchesStatus = statusFilter === 'Todos' || assoc.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 text-gray-200">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-[#111111] p-4 rounded-2xl border border-white/5 shadow-xl">
        {/* Search */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
            <Search className="h-4 w-4" />
          </div>
          <input
            id="search-associates"
            type="text"
            placeholder="Buscar cliente ou associado por nome, e-mail ou CPF..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-9 pr-4 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Filter controls & Add button */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-[#1a1a1a] p-1 rounded-xl border border-white/5">
            {(['Todos', 'Ativo', 'Inativo'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  statusFilter === filter
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <button
            id="btn-add-associate"
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-900/20 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Cadastrar Cliente / Associado
          </button>
        </div>
      </div>

      {/* Grid of Associates cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <AnimatePresence mode="popLayout">
          {filteredAssociates.map((assoc) => {
            const isPendingAgreement = assoc.installmentPlan && assoc.installmentPlan.status === 'Em Análise';
            const isPendingReceipt = assoc.installmentPlan && assoc.installmentPlan.installments && assoc.installmentPlan.installments.some(inst => inst.status === 'Em Análise');
            const isPendingMonthly = assoc.pendingMonthlyReceipts && assoc.pendingMonthlyReceipts.length > 0;
            const isPendingAny = isPendingAgreement || isPendingReceipt || isPendingMonthly;

            return (
              <motion.div
                key={assoc.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`bg-[#111111] rounded-2xl border p-5 shadow-xl space-y-4 relative flex flex-col justify-between transition-all duration-300 ${
                  isPendingAny 
                    ? 'border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.06)] ring-1 ring-amber-500/20' 
                    : assoc.status === 'Ativo' 
                      ? 'border-blue-500/15' 
                      : 'border-white/5'
                }`}
              >
                {/* Card Header */}
                <div>
                  <div className="flex justify-between items-start gap-2 mb-1.5">
                    <div className="space-y-1 min-w-0 flex-1">
                      <h4 className="font-bold text-white text-base leading-snug line-clamp-1 font-sans">{assoc.name}</h4>
                      {isPendingAny && (
                        <span className="inline-flex items-center gap-1 bg-amber-500/15 border border-amber-500/20 text-amber-400 font-extrabold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping shrink-0" />
                          {isPendingAgreement 
                            ? 'Acordo p/ Análise' 
                            : isPendingMonthly 
                              ? 'Mensalidade p/ Análise' 
                              : 'Comprovante p/ Análise'}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        assoc.status === 'Ativo' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                      }`}>
                        {assoc.status}
                      </span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        assoc.financialStatus === 'Inadimplente' ? 'bg-red-500/15 text-red-300 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {assoc.financialStatus === 'Inadimplente' ? 'Inadimplente' : 'Adimplente'}
                      </span>
                    </div>
                  </div>
                
                {assoc.financialStatus === 'Inadimplente' && (
                  <div className="mb-3 px-2.5 py-1.5 bg-red-500/5 border border-red-500/10 rounded-lg text-[10px] text-red-400 font-bold flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>Dívida ativa: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(assoc.debtAmount || 0)}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Mail className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                    <span className="truncate">{assoc.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Phone className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                    <span>{assoc.phone || 'Sem telefone'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <FileText className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                    <span>CPF: {assoc.cpf}</span>
                  </div>
                  {assoc.nis && (
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <FileText className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                      <span>NIS: {assoc.nis}</span>
                    </div>
                  )}
                  <div className="flex items-start gap-2 text-xs text-gray-400 pt-1.5 border-t border-white/5 mt-1.5">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-500 mt-0.5" />
                    <span className="line-clamp-2 leading-relaxed text-gray-400">{assoc.address || 'Nenhum endereço cadastrado'}</span>
                  </div>
                </div>
              </div>

              {/* Monthly payment & Actions */}
              <div className="pt-3 border-t border-white/5 mt-2 space-y-3">
                <div className="flex justify-between items-center bg-[#1a1a1a]/60 p-2.5 rounded-xl border border-white/5">
                  <div className="text-[11px] text-gray-500 font-medium">Contribuição Mensal</div>
                  <div className="text-sm font-bold text-white">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(assoc.monthlyFee)}
                  </div>
                </div>

                <div className="flex gap-1.5 justify-end flex-wrap">
                  {/* View Details Button */}
                  <button
                    onClick={() => handleOpenDetailsModal(assoc)}
                    className="p-2 bg-[#1a1a1a] hover:bg-white/5 border border-white/10 text-blue-400 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                    title="Ver Ficha Cadastral Completa"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Ficha
                  </button>

                  {/* Record Payment Button */}
                  {assoc.status === 'Ativo' && (
                    <button
                      onClick={() => handleOpenPaymentModal(assoc)}
                      className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                      title="Registrar recebimento de mensalidade"
                    >
                      <DollarSign className="h-3.5 w-3.5" />
                      Mensalidade
                    </button>
                  )}
                  {/* Edit button */}
                  <button
                    onClick={() => handleOpenEditModal(assoc)}
                    className="p-2 bg-[#1a1a1a] hover:bg-white/5 border border-white/10 text-gray-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    Editar
                  </button>
                  {/* Login management button */}
                  <button
                    onClick={() => handleOpenLoginModal(assoc)}
                    className="p-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                    title="Gerenciar Credenciais de Login"
                  >
                    <Lock className="h-3.5 w-3.5" />
                    Login
                  </button>

                </div>
              </div>
            </motion.div>
          );
        })}
        </AnimatePresence>

        {filteredAssociates.length === 0 && (
          <div className="col-span-full py-16 text-center bg-[#111111] border border-white/5 rounded-2xl">
            <Users className="h-12 w-12 text-gray-600 mx-auto mb-2" />
            <h4 className="font-semibold text-white text-sm">Nenhum associado encontrado</h4>
            <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">Não encontramos nenhum registro correspondente aos filtros aplicados.</p>
          </div>
        )}
      </div>

      {/* Dialog: Add/Edit Associate Form */}
      {isFormModalOpen && (
        <div id="assoc-modal" className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#111111] rounded-2xl shadow-2xl border border-white/10 max-w-3xl w-full overflow-hidden text-gray-200 my-8"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-[#1a1a1a]/40">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                <h3 className="font-bold text-white text-base">
                  {editingAssociate ? 'Editar Cadastro de Cliente / Associado' : 'Cadastrar Novo Cliente / Associado'}
                </h3>
              </div>
              <button type="button" onClick={() => setIsFormModalOpen(false)} className="text-gray-400 hover:text-white cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleFormSubmit}>
              {/* Scrollable Container */}
              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                
                {/* 1. DADOS PESSOAIS */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider pb-1.5 border-b border-white/5 flex items-center gap-1.5">
                    <Info className="h-4 w-4 shrink-0 text-blue-500" />
                    1. Dados Pessoais
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-gray-400 mb-1">
                        Nome Completo <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: João da Silva Santos"
                        className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">
                        Data de Nascimento
                      </label>
                      <input
                        type="text"
                        value={birthDate}
                        onChange={(e) => setBirthDate(maskDate(e.target.value))}
                        placeholder="DD/MM/AAAA"
                        className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">
                        Sexo
                      </label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value as 'Masculino' | 'Feminino' | 'Outro')}
                        className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="Masculino">Masculino</option>
                        <option value="Feminino">Feminino</option>
                        <option value="Outro">Outro</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-gray-400 mb-1">
                        Filiação (Pai / Mãe / Responsáveis)
                      </label>
                      <input
                        type="text"
                        value={filiation}
                        onChange={(e) => setFiliation(e.target.value)}
                        placeholder="Ex: Maria da Silva e José Santos"
                        className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">
                        Telefone de Contato
                      </label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Ex: (11) 99999-9999"
                        className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-gray-400 mb-1">
                        E-mail de Cadastro <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="joao@exemplo.com"
                        className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. DOCUMENTOS DE IDENTIFICAÇÃO */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider pb-1.5 border-b border-white/5 flex items-center gap-1.5">
                    <FileText className="h-4 w-4 shrink-0 text-blue-500" />
                    2. Documentos de Identificação
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">
                        CPF <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={cpf}
                        onChange={(e) => setCpf(e.target.value)}
                        placeholder="Ex: 000.000.000-00"
                        className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">
                        Documento Principal (RG ou CIN)
                      </label>
                      <div className="flex bg-[#1a1a1a] p-1 rounded-xl border border-white/10">
                        <button
                          type="button"
                          onClick={() => setDocType('RG')}
                          className={`flex-1 text-center py-1 text-xs font-semibold rounded-lg transition-all ${
                            docType === 'RG' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          RG
                        </button>
                        <button
                          type="button"
                          onClick={() => setDocType('CIN')}
                          className={`flex-1 text-center py-1 text-xs font-semibold rounded-lg transition-all ${
                            docType === 'CIN' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          CIN
                        </button>
                      </div>
                    </div>

                    {docType === 'RG' ? (
                      <>
                        <div>
                          <label className="block text-xs font-semibold text-gray-400 mb-1">
                            Número do RG
                          </label>
                          <input
                            type="text"
                            value={rgNumero}
                            onChange={(e) => setRgNumero(e.target.value)}
                            placeholder="Ex: 12.345.678-9"
                            className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-400 mb-1">
                            Órgão Expedidor
                          </label>
                          <input
                            type="text"
                            value={rgOrgaoExpedidor}
                            onChange={(e) => setRgOrgaoExpedidor(e.target.value)}
                            placeholder="Ex: SSP"
                            className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-400 mb-1">
                            Data de Expedição
                          </label>
                          <input
                            type="text"
                            value={rgDataExpedicao}
                            onChange={(e) => setRgDataExpedicao(maskDate(e.target.value))}
                            placeholder="DD/MM/AAAA"
                            className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-400 mb-1">
                            UF Expedidora
                          </label>
                          <input
                            type="text"
                            value={rgUf}
                            onChange={(e) => setRgUf(e.target.value)}
                            placeholder="Ex: SP"
                            maxLength={2}
                            className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none"
                          />
                        </div>
                      </>
                    ) : (
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1">
                          Número da CIN
                        </label>
                        <input
                          type="text"
                          value={cinNumero}
                          onChange={(e) => setCinNumero(e.target.value)}
                          placeholder="Carteira de Identidade Nacional"
                          className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">
                        Número do NIS
                      </label>
                      <input
                        type="text"
                        value={nis}
                        onChange={(e) => setNis(e.target.value)}
                        placeholder="Número de Identificação Social"
                        className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">
                        CAF (Agricultura Familiar)
                      </label>
                      <input
                        type="text"
                        value={caf}
                        onChange={(e) => setCaf(e.target.value)}
                        placeholder="Ex: CAF/UF/00000"
                        className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. CERTIDÃO DE REGISTRO CIVIL */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider pb-1.5 border-b border-white/5 flex items-center gap-1.5">
                    <Award className="h-4 w-4 shrink-0 text-blue-500" />
                    3. Certidão de Registro Civil
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">
                        Tipo de Certidão
                      </label>
                      <select
                        value={certidaoTipo}
                        onChange={(e) => setCertidaoTipo(e.target.value as any)}
                        className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="Nenhuma">Nenhuma / Não Informar</option>
                        <option value="Nascimento">Certidão de Nascimento</option>
                        <option value="Casamento">Certidão de Casamento</option>
                        <option value="Divórcio">Certidão de Divórcio</option>
                        <option value="Óbito">Certidão de Óbito</option>
                      </select>
                    </div>

                    {certidaoTipo !== 'Nenhuma' && (
                      <>
                        <div>
                          <label className="block text-xs font-semibold text-gray-400 mb-1">
                            Modelo da Certidão
                          </label>
                          <div className="flex bg-[#1a1a1a] p-1 rounded-xl border border-white/10">
                            <button
                              type="button"
                              onClick={() => setCertidaoModelo('Novo')}
                              className={`flex-1 text-center py-1 text-xs font-semibold rounded-lg transition-all ${
                                certidaoModelo === 'Novo' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
                              }`}
                            >
                              Modelo Novo
                            </button>
                            <button
                              type="button"
                              onClick={() => setCertidaoModelo('Antigo')}
                              className={`flex-1 text-center py-1 text-xs font-semibold rounded-lg transition-all ${
                                certidaoModelo === 'Antigo' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
                              }`}
                            >
                              Modelo Antigo
                            </button>
                          </div>
                        </div>

                        <div className="sm:col-span-2 lg:col-span-1">
                          <label className="block text-xs font-semibold text-gray-400 mb-1">
                            {certidaoModelo === 'Novo' ? 'Número da Matrícula (Novo Modelo)' : 'Dados da Certidão (Livro, Termo, Folha)'}
                          </label>
                          <input
                            type="text"
                            value={certidaoNumero}
                            onChange={(e) => setCertidaoNumero(e.target.value)}
                            placeholder={certidaoModelo === 'Novo' ? "Ex: 123456.78.90..." : "Ex: Livro A-12, Termo 450, Folha 23"}
                            className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* 4. ASSOCIAÇÃO E SITUAÇÃO FINANCEIRA */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider pb-1.5 border-b border-white/5 flex items-center gap-1.5">
                    <Landmark className="h-4 w-4 shrink-0 text-blue-500" />
                    4. Vínculo e Situação Financeira
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">
                        Data de Filiação
                      </label>
                      <input
                        type="text"
                        value={joiningDate}
                        onChange={(e) => setJoiningDate(maskDate(e.target.value))}
                        placeholder="DD/MM/AAAA"
                        className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">
                        Taxa Mensalidade (R$)
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={monthlyFee}
                        onChange={(e) => setMonthlyFee(maskMoney(e.target.value))}
                        placeholder="0,00"
                        className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">
                        Status do Cadastro
                      </label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as 'Ativo' | 'Inativo')}
                        className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="Ativo">Ativo</option>
                        <option value="Inativo">Inativo</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">
                        Situação Documental
                      </label>
                      <select
                        value={documentStatus}
                        onChange={(e) => setDocumentStatus(e.target.value as 'OK' | 'Com Pendência')}
                        className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="OK">OK</option>
                        <option value="Com Pendência">Com Pendência</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">
                        Limite Máx. de Parcelas
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="48"
                        value={maxInstallmentsAllowed}
                        onChange={(e) => setMaxInstallmentsAllowed(Number(e.target.value) || 12)}
                        className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="12"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">
                        Adimplência
                      </label>
                      <div className="flex bg-[#1a1a1a] p-1 rounded-xl border border-white/10">
                        <button
                          type="button"
                          onClick={() => {
                            setFinancialStatus('Adimplente');
                            setDebtAmount(0);
                          }}
                          className={`flex-1 text-center py-1 text-xs font-semibold rounded-lg transition-all ${
                            financialStatus === 'Adimplente' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          Adimplente
                        </button>
                        <button
                          type="button"
                          onClick={() => setFinancialStatus('Inadimplente')}
                          className={`flex-1 text-center py-1 text-xs font-semibold rounded-lg transition-all ${
                            financialStatus === 'Inadimplente' ? 'bg-red-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          Inadimplente
                        </button>
                      </div>
                    </div>

                    {financialStatus === 'Inadimplente' && (
                      <div className="sm:col-span-2 lg:col-span-1">
                        <label className="block text-xs font-semibold text-red-400 mb-1 flex items-center gap-1">
                          <AlertCircle className="h-3.5 w-3.5" />
                          Valor da Dívida (R$)
                        </label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={debtAmount}
                          onChange={(e) => setDebtAmount(maskMoney(e.target.value))}
                          placeholder="0,00"
                          className="w-full px-3 py-2 bg-[#1a1a1a] border border-red-500/30 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* 5. ENDEREÇO */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider pb-1.5 border-b border-white/5 flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 shrink-0 text-blue-500" />
                    5. Localização
                  </h4>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">
                      Endereço Completo
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Rua, número, bairro, cidade - UF"
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

              </div>

              {/* Buttons */}
              <div className="px-6 py-4 border-t border-white/5 flex justify-end gap-3 bg-[#161616]">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 border border-white/10 rounded-xl text-sm font-semibold text-gray-400 hover:bg-white/5 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-900/20 cursor-pointer"
                >
                  {editingAssociate ? 'Salvar Alterações' : 'Cadastrar Associado'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Dialog: Quick Payment Recording */}
      {isPaymentModalOpen && payingAssociate && (
        <div id="payment-modal" className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#111111] rounded-2xl shadow-2xl border border-white/10 max-w-md w-full overflow-hidden text-gray-200"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-[#1a1a1a]/40">
              <h3 className="font-bold text-white text-base">
                Registrar Pagamento de Mensalidade
              </h3>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-gray-400 hover:text-white cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4">
              <div className="p-3 bg-[#1a1a1a] rounded-xl border border-white/5 text-xs text-gray-300">
                <span className="font-semibold block text-white mb-0.5">Associado / Cliente:</span>
                {payingAssociate.name} ({payingAssociate.email})
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Descrição do Lançamento <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={paymentDescription}
                  onChange={(e) => setPaymentDescription(e.target.value)}
                  placeholder="Ex: Mensalidade - Julho"
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Valor Pago (R$)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(maskMoney(e.target.value))}
                  placeholder="0,00"
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Forma de Pagamento
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Pix">Pix</option>
                  <option value="Boleto">Boleto Bancário</option>
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                  <option value="Cartão de Débito">Cartão de Débito</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Transferência">Transferência Bancária</option>
                </select>
              </div>

              <div className="p-3.5 bg-emerald-500/5 border border-emerald-500/10 text-xs text-emerald-400 rounded-xl flex items-start gap-2">
                <AlertCircle className="h-4.5 w-4.5 text-emerald-400 shrink-0 mt-0.5" />
                <p className="leading-normal">Isso registrará automaticamente uma <strong>Entrada</strong> de valor na aba de Finanças associada a este membro.</p>
              </div>

              {/* Buttons */}
              <div className="pt-4 border-t border-white/5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 border border-white/10 rounded-xl text-sm font-semibold text-gray-400 hover:bg-white/5 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-900/20 cursor-pointer"
                >
                  Confirmar Recebimento
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Dialog: Comprehensive Associate Details Modal (Ficha Cadastral) */}
      {isDetailsModalOpen && selectedAssociate && (
        <div id="details-modal" className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#111111] rounded-2xl shadow-2xl border border-white/10 max-w-3xl w-full overflow-hidden text-gray-200 my-8"
          >
            {/* Header / Actions */}
            <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-[#1a1a1a]/40">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                <h3 className="font-bold text-white text-base">Ficha Cadastral do Associado</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-semibold flex items-center gap-1 border border-white/10 transition-all cursor-pointer"
                >
                  Imprimir Ficha
                </button>
                <button 
                  onClick={() => {
                    setIsDetailsModalOpen(false);
                    setSelectedAssociate(null);
                  }} 
                  className="text-gray-400 hover:text-white p-1 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Printable Content Container */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar printable-section">
              {/* Header Badge */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-[#1a1a1a]/40 rounded-2xl border border-white/5 gap-3">
                <div>
                  <h2 className="text-xl font-extrabold text-white">{selectedAssociate.name}</h2>
                  <p className="text-xs text-gray-400 mt-1">E-mail de cadastro: {selectedAssociate.email}</p>
                </div>
                <div className="flex gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    selectedAssociate.status === 'Ativo' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                  }`}>
                    {selectedAssociate.status}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    selectedAssociate.financialStatus === 'Inadimplente' ? 'bg-red-500/15 text-red-300' : 'bg-emerald-500/10 text-emerald-400'
                  }`}>
                    {selectedAssociate.financialStatus === 'Inadimplente' ? 'Inadimplente' : 'Adimplente'}
                  </span>
                </div>
              </div>

              {/* Grid content */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 1. Dados Pessoais */}
                <div className="bg-[#161616] p-4.5 rounded-xl border border-white/5 space-y-3">
                  <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-2">
                    <Info className="h-4 w-4 text-blue-500" />
                    Dados Pessoais
                  </h4>
                  <div className="space-y-2.5 text-xs">
                    <div>
                      <span className="text-gray-500 block">Filiação</span>
                      <span className="font-semibold text-white text-sm">{selectedAssociate.filiation || 'Não informado'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-gray-500 block">Data de Nascimento</span>
                        <span className="font-semibold text-white">
                          {selectedAssociate.birthDate ? new Date(selectedAssociate.birthDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'Não informado'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Sexo / Gênero</span>
                        <span className="font-semibold text-white">{selectedAssociate.gender || 'Não informado'}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Telefone de Contato</span>
                      <span className="font-semibold text-white">{selectedAssociate.phone || 'Não informado'}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Documentos */}
                <div className="bg-[#161616] p-4.5 rounded-xl border border-white/5 space-y-3">
                  <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    Documentação Oficial
                  </h4>
                  <div className="space-y-2.5 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-gray-500 block">CPF</span>
                        <span className="font-semibold text-white font-mono text-sm">{selectedAssociate.cpf}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">NIS</span>
                        <span className="font-semibold text-white font-mono">{selectedAssociate.nis || 'Não informado'}</span>
                      </div>
                    </div>
                    {selectedAssociate.cinNumero ? (
                      <div>
                        <span className="text-gray-500 block">Carteira de Identidade Nacional (CIN)</span>
                        <span className="font-semibold text-white font-mono text-sm">{selectedAssociate.cinNumero}</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-gray-500 block">Número do RG</span>
                          <span className="font-semibold text-white font-mono">{selectedAssociate.rgNumero || 'Não informado'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block">Expedição (RG)</span>
                          <span className="font-semibold text-white text-[11px]">
                            {selectedAssociate.rgOrgaoExpedidor ? `${selectedAssociate.rgOrgaoExpedidor}/${selectedAssociate.rgUf || 'UF'}` : ''}
                            {selectedAssociate.rgDataExpedicao ? ` em ${new Date(selectedAssociate.rgDataExpedicao + 'T00:00:00').toLocaleDateString('pt-BR')}` : ''}
                            {(!selectedAssociate.rgOrgaoExpedidor && !selectedAssociate.rgDataExpedicao) && 'Não informado'}
                          </span>
                        </div>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-500 block">CAF (Cadastro da Agricultura Familiar)</span>
                      <span className="font-semibold text-white font-mono">{selectedAssociate.caf || 'Não informado'}</span>
                    </div>
                  </div>
                </div>

                {/* 3. Certidões Civis */}
                <div className="bg-[#161616] p-4.5 rounded-xl border border-white/5 space-y-3">
                  <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-2">
                    <Award className="h-4 w-4 text-blue-500" />
                    Registro Civil
                  </h4>
                  <div className="space-y-2.5 text-xs">
                    <div>
                      <span className="text-gray-500 block">Certidão Vinculada</span>
                      <span className="font-semibold text-white">
                        {selectedAssociate.certidaoTipo && selectedAssociate.certidaoTipo !== 'Nenhuma' 
                          ? `Certidão de ${selectedAssociate.certidaoTipo}` 
                          : 'Nenhuma certidão anexada ao cadastro'}
                      </span>
                    </div>
                    {selectedAssociate.certidaoTipo && selectedAssociate.certidaoTipo !== 'Nenhuma' && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-gray-500 block">Modelo do Documento</span>
                          <span className="font-semibold text-white">Modelo {selectedAssociate.certidaoModelo}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block">Matrícula / Termo</span>
                          <span className="font-semibold text-white font-mono truncate block" title={selectedAssociate.certidaoNumero}>
                            {selectedAssociate.certidaoNumero || 'Não informado'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. Situação Financeira */}
                <div className="bg-[#161616] p-4.5 rounded-xl border border-white/5 space-y-3">
                  <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-2">
                    <Landmark className="h-4 w-4 text-blue-500" />
                    Associação & Financeiro
                  </h4>
                  <div className="space-y-2.5 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-gray-500 block">Data de Filiação</span>
                        <span className="font-semibold text-white">
                          {selectedAssociate.joiningDate ? new Date(selectedAssociate.joiningDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'Não informado'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Mensalidade Cadastrada</span>
                        <span className="font-bold text-white text-sm text-blue-400">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedAssociate.monthlyFee)}
                        </span>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg border flex items-center justify-between gap-2 mt-1 bg-white/5 border-white/5">
                      <div>
                        <span className="text-gray-400 font-medium">Situação Financeira</span>
                        <span className={`block font-bold text-xs uppercase mt-0.5 ${
                          selectedAssociate.financialStatus === 'Inadimplente' ? 'text-red-400' : 'text-emerald-400'
                        }`}>
                          {selectedAssociate.financialStatus || 'Adimplente'}
                        </span>
                      </div>
                      {selectedAssociate.financialStatus === 'Inadimplente' && (
                        <div className="text-right">
                          <span className="text-gray-500 block">Valor Pendente</span>
                          <span className="font-extrabold text-red-400 font-mono">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedAssociate.debtAmount || 0)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-2.5 rounded-lg border flex items-center justify-between gap-2 mt-1 bg-white/5 border-white/5">
                      <div>
                        <span className="text-gray-400 font-medium">Situação Documental</span>
                        <span className={`block font-bold text-xs uppercase mt-0.5 ${
                          selectedAssociate.documentStatus === 'Com Pendência' ? 'text-red-400' : 'text-emerald-400'
                        }`}>
                          {selectedAssociate.documentStatus || 'OK'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5. Endereço Completo */}
                <div className="bg-[#161616] p-4.5 rounded-xl border border-white/5 space-y-3 md:col-span-2">
                  <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-2">
                    <MapPin className="h-4 w-4 text-blue-500" />
                    Endereço de Residência
                  </h4>
                  <div className="text-xs">
                    <span className="text-gray-500 block mb-0.5">Endereço Completo</span>
                    <p className="font-semibold text-white text-sm leading-relaxed">{selectedAssociate.address || 'Nenhum endereço informado'}</p>
                  </div>
                </div>

                {/* 6. Credenciais & Login de Acesso */}
                <div className="bg-[#161616] p-4.5 rounded-xl border border-white/5 space-y-3 md:col-span-2">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-2">
                    <Lock className="h-4 w-4 text-indigo-500" />
                    Credenciais & Login de Acesso
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-gray-500 block">Matrícula (6 dígitos)</span>
                      <span className="font-bold text-blue-400 text-sm font-mono">{selectedAssociate.matricula || 'Não gerada'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Usuário de Login</span>
                      <span className="font-bold text-indigo-400 text-sm font-mono">{selectedAssociate.username || 'Não definido'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Senha de Acesso</span>
                      <span className="font-bold text-emerald-400 text-sm font-mono">{selectedAssociate.password || 'Não definida'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Status do Login</span>
                      <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase mt-1 ${
                        selectedAssociate.loginStatus === 'Bloqueado' ? 'bg-red-500/15 text-red-400 border border-red-500/20' :
                        selectedAssociate.loginStatus === 'Congelado' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' :
                        'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {selectedAssociate.loginStatus || 'Ativo'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 7. Gerenciamento de Parcelamento / Acordo */}
                <div className="bg-[#161616] p-4.5 rounded-xl border border-white/5 space-y-4 md:col-span-2">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-2">
                    <DollarSign className="h-4 w-4 text-amber-500" />
                    Gerenciamento de Acordo de Parcelamento
                  </h4>

                  {!selectedAssociate.installmentPlan ? (
                    <div className="p-3 bg-white/5 rounded-xl text-xs text-gray-400 text-center">
                      Este associado não possui nenhuma solicitação ou plano de parcelamento cadastrado.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Resumo do Acordo */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-white/5 rounded-xl text-xs">
                        <div>
                          <span className="text-gray-500 block">Total do Acordo</span>
                          <span className="font-extrabold text-white text-sm font-mono">
                            {formatBRL(selectedAssociate.installmentPlan.totalAmount)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 block">Plano</span>
                          <span className="font-bold text-white text-sm">
                            {selectedAssociate.installmentPlan.installmentsCount}x de {formatBRL(selectedAssociate.installmentPlan.installmentValue)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 block">Status do Acordo</span>
                          <span className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] uppercase mt-0.5 ${
                            selectedAssociate.installmentPlan.status === 'Em Análise' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                            selectedAssociate.installmentPlan.status === 'Aprovado' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            selectedAssociate.installmentPlan.status === 'Reprovado' ? 'bg-red-500/15 text-red-400 border border-red-500/20' :
                            'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}>
                            {selectedAssociate.installmentPlan.status}
                          </span>
                        </div>
                      </div>

                      {/* Controle do Plano (Se for Em Análise) */}
                      {selectedAssociate.installmentPlan.status === 'Em Análise' && (
                        <div className="p-3 bg-amber-500/5 border border-amber-500/15 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          <div className="space-y-0.5">
                            <span className="font-bold text-amber-400 flex items-center gap-1">
                              <AlertCircle className="h-4 w-4" />
                              Plano em Análise (Aguardando Decisão do Gestor)
                            </span>
                            <p className="text-gray-400 text-[11px]">
                              O associado solicitou este parcelamento. Você pode aprovar para ativar o plano ou recusar.
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleRejectPlan(selectedAssociate)}
                              className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 rounded-lg font-semibold transition-all cursor-pointer animate-pulse"
                            >
                              Recusar Plano
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApprovePlan(selectedAssociate)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition-all shadow-md cursor-pointer"
                            >
                              Aprovar Plano
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Tabela de Parcelas e Datas de Pagamento */}
                      <div className="space-y-2">
                        <span className="block text-xs font-bold text-gray-400">Parcelas e Controle de Comprovantes</span>
                        <div className="border border-white/5 rounded-xl bg-[#141414] divide-y divide-white/5 overflow-hidden">
                          {!selectedAssociate.installmentPlan.installments || selectedAssociate.installmentPlan.installments.length === 0 ? (
                            <div className="p-3 text-center text-xs text-gray-500">
                              Sem parcelas individuais registradas.
                            </div>
                          ) : (
                            selectedAssociate.installmentPlan.installments.map((inst) => (
                              <div key={inst.number} className="p-3 space-y-3">
                                <div className="flex justify-between items-center text-xs">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-gray-300">Parcela {inst.number}/{selectedAssociate.installmentPlan?.installmentsCount}</span>
                                    <span className="text-[10px] text-gray-500 font-medium">
                                      Vencimento: {inst.dueDate ? dateToBRL(inst.dueDate) : 'Não definida'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-white font-mono mr-2">{formatBRL(inst.value)}</span>
                                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                                      inst.status === 'Pago' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                      inst.status === 'Em Análise' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                      inst.status === 'Recusado' ? 'bg-red-500/15 text-red-400 border border-red-500/20' :
                                      'bg-white/5 text-gray-400'
                                    }`}>
                                      {inst.status}
                                    </span>
                                  </div>
                                </div>

                                {/* Se tiver comprovante pendente de visualização */}
                                {inst.status === 'Em Análise' && inst.receiptFile && (
                                  <div className="p-2.5 bg-amber-500/5 border border-amber-500/10 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                    <div className="text-xs">
                                      <span className="text-amber-400 font-bold block">Comprovante de Pagamento Enviado</span>
                                      <span className="text-[10px] text-gray-400 block truncate max-w-xs">{inst.receiptFileName || 'comprovante.png'}</span>
                                    </div>
                                    <div className="flex gap-2 w-full sm:w-auto">
                                      <button
                                        type="button"
                                        onClick={() => setPreviewingReceipt({
                                          fileName: inst.receiptFileName || 'comprovante.png',
                                          fileData: inst.receiptFile || '',
                                          associate: selectedAssociate,
                                          installmentNumber: inst.number
                                        })}
                                        className="flex-1 sm:flex-none px-2.5 py-1.5 bg-white/10 hover:bg-white/15 text-white rounded-lg font-semibold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer"
                                      >
                                        <Eye className="h-3.5 w-3.5" />
                                        Ver Comprovante
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleRejectInstallmentPayment(selectedAssociate, inst.number)}
                                        className="flex-1 sm:flex-none px-2.5 py-1.5 bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white rounded-lg font-semibold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer"
                                      >
                                        Recusar
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleApproveInstallmentPayment(selectedAssociate, inst.number)}
                                        className="flex-1 sm:flex-none px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer shadow-md"
                                      >
                                        Confirmar Recebimento
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 8. Validação de Comprovantes de Mensalidade */}
                <div className="bg-[#161616] p-4.5 rounded-xl border border-white/5 space-y-4 md:col-span-2">
                  <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-2">
                    <DollarSign className="h-4 w-4 text-blue-500" />
                    Validação de Comprovantes de Mensalidade
                  </h4>

                  {!selectedAssociate.pendingMonthlyReceipts || selectedAssociate.pendingMonthlyReceipts.length === 0 ? (
                    <div className="p-3 bg-white/5 rounded-xl text-xs text-gray-400 text-center">
                      Nenhum comprovante de mensalidade aguardando validação para este associado.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedAssociate.pendingMonthlyReceipts.map((receipt) => (
                        <div key={receipt.monthKey} className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-3">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                            <div className="space-y-0.5">
                              <span className="text-xs font-bold text-white block">Mensalidade de {receipt.monthName}/2026</span>
                              <span className="text-[10px] text-gray-400 block font-mono">
                                Valor: {formatBRL(receipt.amount)} • Via: {receipt.paymentMethod}
                              </span>
                              <span className="text-[9px] text-gray-500 block">
                                Enviado em: {new Date(receipt.dateSubmitted).toLocaleString('pt-BR')}
                              </span>
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                              <button
                                type="button"
                                onClick={() => setPreviewingReceipt({
                                  fileName: receipt.receiptFileName || 'comprovante.png',
                                  fileData: receipt.receiptFile || '',
                                  associate: selectedAssociate,
                                  monthName: receipt.monthName,
                                  monthKey: receipt.monthKey
                                })}
                                className="flex-1 sm:flex-none px-2.5 py-1.5 bg-white/10 hover:bg-white/15 text-white rounded-lg font-semibold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                Ver Comprovante
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRejectMonthlyPayment(selectedAssociate, receipt.monthKey)}
                                className="flex-1 sm:flex-none px-2.5 py-1.5 bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white rounded-lg font-semibold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer"
                              >
                                Recusar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleApproveMonthlyPayment(selectedAssociate, receipt.monthKey)}
                                className="flex-1 sm:flex-none px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer shadow-md"
                              >
                                Confirmar Recebimento
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/5 flex justify-end bg-[#161616]">
              <button
                type="button"
                onClick={() => {
                  setIsDetailsModalOpen(false);
                  setSelectedAssociate(null);
                }}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-900/20 cursor-pointer"
              >
                Fechar Ficha
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Dialog: Manage Login Modal */}
      {isLoginModalOpen && loginAssociate && (
        <div id="login-mgmt-modal" className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#111111] rounded-2xl shadow-2xl border border-white/10 max-w-md w-full overflow-hidden text-gray-200 animate-fade-in"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-[#1a1a1a]/40">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-indigo-500" />
                <h3 className="font-bold text-white text-base">Gerenciar Login de Acesso</h3>
              </div>
              <button 
                onClick={() => {
                  setIsLoginModalOpen(false);
                  setLoginAssociate(null);
                }} 
                className="text-gray-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="p-3 bg-[#1a1a1a] rounded-xl border border-white/5 text-xs text-gray-300">
                <span className="font-semibold block text-white mb-0.5">Associado / Cliente:</span>
                {loginAssociate.name} ({loginAssociate.email})
                <div className="mt-2 text-[11px] text-gray-400 flex items-center gap-2">
                  <span>Matrícula: <strong>{loginAssociate.matricula}</strong></span>
                  <span>•</span>
                  <span>Status atual: 
                    <strong className={`ml-1 ${
                      loginStatusVal === 'Bloqueado' ? 'text-red-400' :
                      loginStatusVal === 'Congelado' ? 'text-amber-400' :
                      'text-emerald-400'
                    }`}>
                      {loginStatusVal}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Status Actions */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Ações Rápidas de Status de Login
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={handleActivateLogin}
                    disabled={loginStatusVal === 'Ativo'}
                    className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      loginStatusVal === 'Ativo'
                        ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400 font-extrabold'
                        : 'bg-white/5 border-white/5 hover:bg-white/10 text-gray-400'
                    }`}
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Ativar
                  </button>

                  <button
                    type="button"
                    onClick={handleBlockLogin}
                    disabled={loginStatusVal === 'Bloqueado'}
                    className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      loginStatusVal === 'Bloqueado'
                        ? 'bg-red-500/10 border-red-500/25 text-red-400 font-extrabold'
                        : 'bg-white/5 border-white/5 hover:bg-white/10 text-gray-400'
                    }`}
                  >
                    <XCircle className="h-4 w-4" />
                    Bloquear
                  </button>

                  <button
                    type="button"
                    onClick={handleFreezeLogin}
                    disabled={loginStatusVal === 'Congelado'}
                    className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      loginStatusVal === 'Congelado'
                        ? 'bg-amber-500/10 border-amber-500/25 text-amber-400 font-extrabold'
                        : 'bg-white/5 border-white/5 hover:bg-white/10 text-gray-400'
                    }`}
                  >
                    <ShieldAlert className="h-4 w-4" />
                    Congelar
                  </button>
                </div>
              </div>

              {/* Edit Credentials */}
              <div className="pt-4 border-t border-white/5 space-y-3">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Editar Credenciais do Usuário
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateCredentials}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="h-3 w-3" />
                    Gerar Aleatórios
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-gray-500 font-semibold mb-1 uppercase tracking-wider font-sans">Usuário (7 dígitos)</label>
                    <input
                      type="text"
                      maxLength={15}
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 font-semibold mb-1 uppercase tracking-wider font-sans">Senha (7 dígitos)</label>
                    <input
                      type="text"
                      maxLength={15}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={handleDeleteLogin}
                    className="text-[11px] text-red-400 hover:text-red-300 font-bold underline cursor-pointer"
                  >
                    Excluir Credenciais de Login
                  </button>
                  <span className="text-[9px] text-gray-500 uppercase font-semibold font-mono">Cód: {loginAssociate.id}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/5 flex justify-end gap-3 bg-[#161616]">
              <button
                type="button"
                onClick={() => {
                  setIsLoginModalOpen(false);
                  setLoginAssociate(null);
                }}
                className="px-4 py-2 border border-white/10 rounded-xl text-xs font-semibold text-gray-400 hover:bg-white/5 hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveLogin}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-900/20 cursor-pointer"
              >
                Salvar Configurações
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Dialog: Receipt Preview Modal */}
      {previewingReceipt && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#111111] rounded-2xl shadow-2xl border border-white/10 max-w-lg w-full overflow-hidden text-gray-200"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-[#1a1a1a]/40">
              <div>
                <h3 className="font-bold text-white text-sm">Visualização de Comprovante</h3>
                <p className="text-[10px] text-gray-400">
                  {previewingReceipt.associate.name} — {previewingReceipt.monthKey ? `Mensalidade de ${previewingReceipt.monthName}` : `Parcela ${previewingReceipt.installmentNumber}`}
                </p>
              </div>
              <button 
                onClick={() => setPreviewingReceipt(null)} 
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Receipt Content */}
            <div className="p-6 flex flex-col items-center justify-center bg-[#141414]">
              {previewingReceipt.fileData.startsWith('data:') ? (
                <img 
                  src={previewingReceipt.fileData} 
                  alt="Comprovante de pagamento" 
                  className="max-h-[300px] w-auto object-contain rounded-xl shadow-lg border border-white/10"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="p-8 w-full border border-dashed border-white/10 rounded-2xl bg-white/5 flex flex-col items-center justify-center text-center space-y-3">
                  <FileText className="h-12 w-12 text-blue-400 animate-pulse" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-white">{previewingReceipt.fileName}</p>
                    <p className="text-[10px] text-gray-400">Clique para validar o arquivo carregado</p>
                  </div>
                </div>
              )}
              
              <div className="w-full mt-4 p-3 bg-white/5 rounded-xl text-xs space-y-1">
                {previewingReceipt.monthKey ? (
                  (() => {
                    const receipt = previewingReceipt.associate.pendingMonthlyReceipts?.find(r => r.monthKey === previewingReceipt.monthKey);
                    return (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Meio de Pagamento:</span>
                          <span className="font-bold text-white">{receipt?.paymentMethod || 'Pix'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Valor da Mensalidade:</span>
                          <span className="font-mono font-extrabold text-amber-400">
                            {formatBRL(receipt?.amount || previewingReceipt.associate.monthlyFee)}
                          </span>
                        </div>
                      </>
                    );
                  })()
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Meio de Pagamento:</span>
                      <span className="font-bold text-white">{previewingReceipt.associate.installmentPlan?.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Valor da Parcela:</span>
                      <span className="font-mono font-extrabold text-amber-400">
                        {formatBRL(previewingReceipt.associate.installmentPlan?.installmentValue || 0)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Footer with instant approval/rejection actions */}
            <div className="px-6 py-4 border-t border-white/5 flex gap-3 bg-[#161616]">
              <button
                type="button"
                onClick={() => {
                  if (previewingReceipt.monthKey) {
                    handleRejectMonthlyPayment(previewingReceipt.associate, previewingReceipt.monthKey);
                  } else {
                    handleRejectInstallmentPayment(previewingReceipt.associate, previewingReceipt.installmentNumber!);
                  }
                }}
                className="flex-1 py-2.5 px-3 bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                Recusar Comprovante
              </button>
              <button
                type="button"
                onClick={() => {
                  if (previewingReceipt.monthKey) {
                    handleApproveMonthlyPayment(previewingReceipt.associate, previewingReceipt.monthKey);
                  } else {
                    handleApproveInstallmentPayment(previewingReceipt.associate, previewingReceipt.installmentNumber!);
                  }
                }}
                className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
              >
                Confirmar Recebimento
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
