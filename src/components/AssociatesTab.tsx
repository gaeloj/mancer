import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Search, Plus, Edit, Trash2, CheckCircle2, XCircle, 
  Mail, Phone, FileText, MapPin, DollarSign, X, Calendar, AlertCircle,
  Eye, Info, Landmark, ShieldAlert, Award, Lock, ShieldCheck, Sparkles,
  Clock, AlertTriangle, Building, MessageSquare, Send, Copy, Check, HeartHandshake
} from 'lucide-react';
import { Associate, EntityConfig } from '../types';
import { maskMoney, parseMaskedMoney, maskDate, dateToISO, dateToBRL, formatBRL, formatDateTimeBRL, calculateMembershipDuration, calculateAssociateContribution, formatMatricula, getNextMatriculaNumber, isMatriculaInUse } from '../utils/formatters';

interface AssociatesTabProps {
  associates: Associate[];
  onAddAssociate: (associate: Omit<Associate, 'id'>) => void;
  onEditAssociate: (associate: Associate) => void;
  onDeleteAssociate: (id: string) => void;
  onRecordPayment: (associate: Associate, amount: number, paymentMethod: string, description?: string, customDate?: string) => void;
  entityConfig?: EntityConfig | null;
}

export default function AssociatesTab({ 
  associates, 
  onAddAssociate, 
  onEditAssociate, 
  onDeleteAssociate,
  onRecordPayment,
  entityConfig
}: AssociatesTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Ativo' | 'Inativo'>('Todos');
  const [deletingAssocId, setDeletingAssocId] = useState<string | null>(null);
  
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

  // WhatsApp Congratulatory Message Space state
  const [isCongratsModalOpen, setIsCongratsModalOpen] = useState(false);
  const [congratsSelectedAssocId, setCongratsSelectedAssocId] = useState<string>('');
  const [congratsPhone, setCongratsPhone] = useState<string>('');
  const [congratsCustomMessage, setCongratsCustomMessage] = useState<string>('');
  const [congratsCopiedSuccess, setCongratsCopiedSuccess] = useState<boolean>(false);
  const [congratsFilterMode, setCongratsFilterMode] = useState<'adimplentes_and_updated' | 'todos_ativos'>('adimplentes_and_updated');

  const generateCongratsText = (assocName: string) => {
    const entityName = entityConfig?.name || 'Associação / Entidade';
    return `🌟 *MENSAGEM DE PARABÉNS E AGRADECIMENTO!* 🌟
🏛️ *${entityName}*

Olá, *${assocName}*! 👋

Passando para parabenizá-lo(a) e agradecer imensamente pelo seu exemplar compromisso e responsabilidade cidadã! 👏✨

Verificamos em nosso sistema que seus *DADOS CADASTRAIS ESTÃO 100% ATUALIZADOS* e suas *CONTRIBUIÇÕES MENSAIS ESTÃO TOTALMENTE EM DIA*! 🟢

Sua dedicação fortalece a nossa associação e possibilita que continuemos crescendo e trazendo novas conquistas para toda a nossa comunidade. É um orgulho ter você conosco!

🎉 *Parabéns por manter tudo em dia e obrigado pela parceria!*

Com carinho e admiração,
*Diretoria & Equipe de ${entityName}*`;
  };

  const handleOpenCongratsModal = (assoc?: Associate) => {
    // Compliant associates: Adimplente & documentStatus !== 'Com Pendência'
    const compliantAssocs = associates.filter(a => 
      (a.financialStatus === 'Adimplente' || !a.financialStatus) && 
      a.documentStatus !== 'Com Pendência' &&
      a.status === 'Ativo'
    );

    const target = assoc || (compliantAssocs.length > 0 ? compliantAssocs[0] : associates[0]);

    if (target) {
      setCongratsSelectedAssocId(target.id);
      setCongratsPhone(target.phone || '');
      setCongratsCustomMessage(generateCongratsText(target.name));
    } else {
      setCongratsSelectedAssocId('');
      setCongratsPhone('');
      setCongratsCustomMessage(generateCongratsText('Associado(a)'));
    }

    setCongratsCopiedSuccess(false);
    setIsCongratsModalOpen(true);
  };

  const handleCongratsRecipientChange = (recipientId: string) => {
    setCongratsSelectedAssocId(recipientId);
    const found = associates.find(a => a.id === recipientId);
    if (found) {
      setCongratsPhone(found.phone || '');
      setCongratsCustomMessage(generateCongratsText(found.name));
    } else {
      setCongratsPhone('');
    }
  };

  const handleExecuteSendCongratsWhatsApp = () => {
    if (!congratsPhone.trim()) {
      alert('Por favor, selecione um associado ou informe o número de telefone WhatsApp com DDD.');
      return;
    }
    const cleanPhone = congratsPhone.replace(/\D/g, '');
    const phoneWithDDD = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
    const url = `https://api.whatsapp.com/send?phone=${phoneWithDDD}&text=${encodeURIComponent(congratsCustomMessage)}`;
    window.open(url, '_blank');
  };

  const handleCopyCongratsMessage = () => {
    navigator.clipboard.writeText(congratsCustomMessage);
    setCongratsCopiedSuccess(true);
    setTimeout(() => setCongratsCopiedSuccess(false), 2500);
  };

  const calculateFinancialStateFromPayments = (
    assoc: Associate,
    updatedPayments: { [monthKey: string]: 'Pago' | 'Não Pago' | 'Pendente' } | undefined
  ) => {
    const payments = updatedPayments || {};
    const unpaidMonths = Object.keys(payments).filter(key => payments[key] === 'Não Pago');
    const fee = assoc.monthlyFee || entityConfig?.monthlyFee || 0;
    const calculatedMonthlyDebt = unpaidMonths.length * fee;

    let finalStatus: Associate['financialStatus'] = assoc.financialStatus;
    let finalDebt = assoc.debtAmount || 0;

    if (unpaidMonths.length > 0) {
      finalStatus = 'Inadimplente';
      finalDebt = calculatedMonthlyDebt;
    } else {
      if (assoc.installmentPlan && assoc.installmentPlan.status !== 'Pago' && assoc.installmentPlan.status !== 'Aprovado') {
        finalStatus = 'Inadimplente';
      } else {
        finalStatus = 'Adimplente';
        finalDebt = 0;
      }
    }

    return {
      financialStatus: finalStatus,
      debtAmount: finalDebt
    };
  };

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
        return { ...inst, status: 'Recusado' as const };
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

  const handleDeleteInstallmentReceipt = (assoc: Associate, installmentNumber: number) => {
    if (!assoc.installmentPlan || !assoc.installmentPlan.installments) return;
    if (!window.confirm("Deseja realmente excluir permanentemente o arquivo de comprovante deste parcelamento?")) return;

    const updatedInstallments = assoc.installmentPlan.installments.map(inst => {
      if (inst.number === installmentNumber) {
        return { 
          ...inst, 
          receiptFile: undefined, 
          receiptFileName: undefined
        };
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
      `Mensalidade de ${receipt.monthName}/2026 - UniOn`,
      `2026-${monthKey}-10`
    );

    const updatedPending = assoc.pendingMonthlyReceipts?.map(r => {
      if (r.monthKey === monthKey) {
        return {
          ...r,
          status: 'Aprovado' as const,
          reviewedAt: new Date().toISOString()
        };
      }
      return r;
    }) || [];

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
    const updatedPending = assoc.pendingMonthlyReceipts?.map(r => {
      if (r.monthKey === monthKey) {
        return {
          ...r,
          status: 'Reprovado' as const,
          reviewedAt: new Date().toISOString()
        };
      }
      return r;
    }) || [];

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
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [fatherNotDeclared, setFatherNotDeclared] = useState(false);
  const [cinOrgaoExpedidor, setCinOrgaoExpedidor] = useState('');
  const [cinDataExpedicao, setCinDataExpedicao] = useState('');
  const [cinUf, setCinUf] = useState('');
  const [photo, setPhoto] = useState('');
  const [gender, setGender] = useState<'Masculino' | 'Feminino' | 'Outro'>('Masculino');
  const [joiningDate, setJoiningDate] = useState('');
  const [financialStatus, setFinancialStatus] = useState<'Adimplente' | 'Inadimplente' | 'Zona de Perigo' | 'Em Atenção'>('Adimplente');
  const [debtAmount, setDebtAmount] = useState<string>(''); // Starts blank
  const [documentStatus, setDocumentStatus] = useState<'OK' | 'Com Pendência'>('OK');
  const [maxInstallmentsAllowed, setMaxInstallmentsAllowed] = useState<number>(12);
  const [certidaoTipo, setCertidaoTipo] = useState<'Nascimento' | 'Casamento' | 'Divórcio' | 'Óbito' | 'Nenhuma'>('Nenhuma');
  const [certidaoModelo, setCertidaoModelo] = useState<'Novo' | 'Antigo'>('Novo');
  const [certidaoNumero, setCertidaoNumero] = useState('');
  const [hasVotingRight, setHasVotingRight] = useState(true);
  const [associationRoleOption, setAssociationRoleOption] = useState<string>('Nenhum');
  const [customRoleTitle, setCustomRoleTitle] = useState<string>('');
  const [matricula, setMatricula] = useState<string>('');
  const [matriculaError, setMatriculaError] = useState<string>('');
 
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
    setMonthlyFee(entityConfig?.monthlyFee ? maskMoney(entityConfig.monthlyFee.toFixed(2)) : '');
    setStatus('Ativo');
    
    // Reset new states
    setDocType('RG');
    setRgNumero('');
    setRgOrgaoExpedidor('');
    setRgDataExpedicao('');
    setRgUf('');
    setCinNumero('');
    setCinOrgaoExpedidor('');
    setCinDataExpedicao('');
    setCinUf('');
    setPhoto('');
    setNis('');
    setCaf('');
    setBirthDate('');
    setFiliation('');
    setFatherName('');
    setMotherName('');
    setFatherNotDeclared(false);
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
    setHasVotingRight(true);
    setAssociationRoleOption('Nenhum');
    setCustomRoleTitle('');
    setMatricula(getNextMatriculaNumber(associates));
    setMatriculaError('');
    
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
    setCinOrgaoExpedidor(assoc.cinOrgaoExpedidor || '');
    setCinDataExpedicao(assoc.cinDataExpedicao ? dateToBRL(assoc.cinDataExpedicao) : '');
    setCinUf(assoc.cinUf || '');
    setPhoto(assoc.photo || '');
    setNis(assoc.nis || '');
    setCaf(assoc.caf || '');
    setBirthDate(assoc.birthDate ? dateToBRL(assoc.birthDate) : '');
    setFiliation(assoc.filiation || '');
    setFatherName(assoc.fatherName || '');
    setMotherName(assoc.motherName || '');
    setFatherNotDeclared(assoc.fatherNotDeclared || false);
    setGender(assoc.gender || 'Masculino');
    setJoiningDate(assoc.joiningDate ? dateToBRL(assoc.joiningDate) : '');
    setFinancialStatus(assoc.financialStatus || 'Adimplente');
    setDebtAmount(assoc.debtAmount ? maskMoney(assoc.debtAmount.toFixed(2)) : '');
    setCertidaoTipo(assoc.certidaoTipo || 'Nenhuma');
    setCertidaoModelo(assoc.certidaoModelo || 'Novo');
    setCertidaoNumero(assoc.certidaoNumero || '');
    setDocumentStatus(assoc.documentStatus || 'OK');
    setMaxInstallmentsAllowed(assoc.maxInstallmentsAllowed || 12);
    setHasVotingRight(assoc.hasVotingRight !== false);

    const standardRoles = ['Presidente', 'Vice-Presidente', 'Secretária(o)', 'Tesoureira(o)', 'Diretor(a) de Costumes e Tradições', 'Conselho Fiscal', 'Nenhum'];
    const currentRole = assoc.associationRole || 'Nenhum';
    if (standardRoles.includes(currentRole)) {
      setAssociationRoleOption(currentRole);
      setCustomRoleTitle('');
    } else {
      setAssociationRoleOption('Outro');
      setCustomRoleTitle(currentRole);
    }
    
    setMatricula(assoc.matricula ? formatMatricula(assoc.matricula) : getNextMatriculaNumber(associates));
    setMatriculaError('');

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
  };

  const handleGenerateCredentials = () => {
    setLoginUsername(Math.floor(1000000 + Math.random() * 9000000).toString());
    setLoginPassword(Math.floor(1000000 + Math.random() * 9000000).toString());
    setLoginStatusVal('Ativo');
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('A foto deve ter no máximo 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !cpf) return;

    const formattedMatricula = formatMatricula(matricula || getNextMatriculaNumber(associates));
    
    if (isMatriculaInUse(formattedMatricula, associates, editingAssociate?.id)) {
      setMatriculaError(`A matrícula ${formattedMatricula} já está em uso por outro associado. Escolha um número disponível.`);
      return;
    }

    const parsedMonthlyFee = parseMaskedMoney(monthlyFee);
    const parsedDebtAmount = financialStatus !== 'Adimplente' ? parseMaskedMoney(debtAmount) : 0;

    const computedFiliation = [
      motherName ? `Mãe: ${motherName}` : '',
      fatherNotDeclared ? 'Pai: Não declarado' : (fatherName ? `Pai: ${fatherName}` : '')
    ].filter(Boolean).join(' / ');

    const finalRole = associationRoleOption === 'Outro' 
      ? customRoleTitle.trim() 
      : (associationRoleOption === 'Nenhum' ? '' : associationRoleOption);

    const extraFields = {
      matricula: formattedMatricula,
      rgNumero: docType === 'RG' ? (rgNumero || undefined) : undefined,
      rgOrgaoExpedidor: docType === 'RG' ? (rgOrgaoExpedidor || undefined) : undefined,
      rgDataExpedicao: docType === 'RG' && rgDataExpedicao ? dateToISO(rgDataExpedicao) : undefined,
      rgUf: docType === 'RG' ? (rgUf || undefined) : undefined,
      cinNumero: docType === 'CIN' ? (cinNumero || undefined) : undefined,
      cinOrgaoExpedidor: docType === 'CIN' ? (cinOrgaoExpedidor || undefined) : undefined,
      cinDataExpedicao: docType === 'CIN' && cinDataExpedicao ? dateToISO(cinDataExpedicao) : undefined,
      cinUf: docType === 'CIN' ? (cinUf || undefined) : undefined,
      photo: photo || undefined,
      nis: nis || undefined,
      birthDate: birthDate ? dateToISO(birthDate) : undefined,
      caf: caf || undefined,
      filiation: computedFiliation || undefined,
      fatherName: fatherName || undefined,
      motherName: motherName || undefined,
      fatherNotDeclared: fatherNotDeclared || false,
      gender,
      joiningDate: joiningDate ? dateToISO(joiningDate) : '',
      financialStatus,
      debtAmount: parsedDebtAmount,
      documentStatus,
      maxInstallmentsAllowed,
      certidaoTipo,
      certidaoModelo: certidaoTipo !== 'Nenhuma' ? certidaoModelo : undefined,
      certidaoNumero: certidaoTipo !== 'Nenhuma' ? certidaoNumero : undefined,
      hasVotingRight,
      associationRole: finalRole || undefined
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

  const downloadAssociateFicha = (assoc: Associate) => {
    const entityName = entityConfig?.name || 'UniOn - Sistema de Gestão';
    const entityCNPJ = entityConfig?.cnpj ? `CNPJ: ${entityConfig.cnpj}` : '';
    const entityLogo = entityConfig?.logo || '';
    const entityAddress = entityConfig?.address || '';
    const entityEmail = entityConfig?.email || '';
    const entityPhone = entityConfig?.phone || '';

    // BirthDate
    const formattedBirthDate = assoc.birthDate ? new Date(assoc.birthDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'Não informado';
    const formattedJoiningDate = assoc.joiningDate ? new Date(assoc.joiningDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'Não informado';
    const formattedFee = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(assoc.monthlyFee);
    const formattedDebt = assoc.debtAmount ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(assoc.debtAmount) : 'R$ 0,00';

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor, permita popups para baixar a ficha do associado.');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Ficha Cadastral - ${assoc.name}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          body {
            font-family: 'Inter', sans-serif;
            color: #111827;
            background-color: #ffffff;
            margin: 0;
            padding: 40px;
            font-size: 11px;
            line-height: 1.5;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none !important; }
          }
          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-b: 2px solid #e5e7eb;
            padding-bottom: 20px;
            margin-bottom: 25px;
          }
          .header-left {
            display: flex;
            align-items: center;
            gap: 15px;
          }
          .logo {
            width: 60px;
            height: 60px;
            object-fit: contain;
            border-radius: 8px;
          }
          .logo-placeholder {
            width: 60px;
            height: 60px;
            background-color: #f3f4f6;
            border: 1px solid #e5e7eb;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            color: #9ca3af;
            border-radius: 8px;
            font-size: 18px;
          }
          .title-area h1 {
            font-size: 16px;
            font-weight: 800;
            margin: 0;
            color: #111827;
            letter-spacing: -0.025em;
          }
          .title-area p {
            font-size: 10px;
            color: #4b5563;
            margin: 2px 0 0 0;
          }
          .ficha-title {
            text-align: center;
            font-size: 14px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 25px;
            color: #1e40af;
          }
          .profile-section {
            display: flex;
            gap: 25px;
            margin-bottom: 25px;
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 20px;
          }
          .avatar-container {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            border: 2px solid #cbd5e1;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #f1f5f9;
            flex-shrink: 0;
          }
          .avatar-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .avatar-placeholder {
            font-size: 24px;
            color: #94a3b8;
            font-weight: bold;
          }
          .profile-details {
            flex-grow: 1;
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }
          .section-title {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #1e3a8a;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 4px;
            margin-top: 25px;
            margin-bottom: 12px;
          }
          .grid-container {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
          }
          .grid-container-2 {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }
          .field {
            display: flex;
            flex-direction: column;
          }
          .label {
            font-size: 9px;
            color: #64748b;
            font-weight: 600;
            text-transform: uppercase;
            margin-bottom: 2px;
          }
          .value {
            font-size: 11px;
            font-weight: 500;
            color: #0f172a;
          }
          .value-mono {
            font-family: monospace;
            font-size: 11px;
            font-weight: 600;
          }
          .signature-area {
            margin-top: 50px;
            display: flex;
            justify-content: space-between;
            gap: 40px;
          }
          .signature-box {
            flex-grow: 1;
            border-top: 1px solid #94a3b8;
            text-align: center;
            padding-top: 8px;
            font-size: 10px;
            color: #475569;
          }
          .footer {
            margin-top: 60px;
            text-align: center;
            font-size: 9px;
            color: #94a3b8;
            border-top: 1px solid #f1f5f9;
            padding-top: 15px;
          }
          .btn-print-floating {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background-color: #2563eb;
            color: white;
            border: none;
            padding: 10px 18px;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
            font-size: 12px;
            transition: background-color 0.2s;
            z-index: 9999;
          }
          .btn-print-floating:hover {
            background-color: #1d4ed8;
          }
        </style>
      </head>
      <body>
        <button class="btn-print-floating no-print" onclick="window.print()">Imprimir / Salvar como PDF</button>

        <div class="header">
          <div class="header-left">
            ${entityLogo ? `<img src="${entityLogo}" class="logo" />` : `<div class="logo-placeholder">${entityConfig?.acronym || 'UO'}</div>`}
            <div class="title-area">
              <h1>${entityName}</h1>
              <p>${entityCNPJ} ${entityAddress ? ' | ' + entityAddress : ''}</p>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 12px; font-weight: bold; color: #1e3a8a;">FICHA DE INSCRIÇÃO</div>
            <div style="font-size: 10px; font-family: monospace; color: #64748b; margin-top: 4px;">Matrícula: ${assoc.matricula || 'Pendente'}</div>
          </div>
        </div>

        <div class="profile-section">
          <div class="avatar-container">
            ${assoc.photo ? `<img src="${assoc.photo}" class="avatar-img" />` : `<div class="avatar-placeholder">?</div>`}
          </div>
          <div class="profile-details">
            <div class="field" style="grid-column: span 2;">
              <span class="label">Nome do Associado</span>
              <span class="value" style="font-size: 13px; font-weight: 700; color: #1e3a8a;">${assoc.name}</span>
            </div>
            <div class="field">
              <span class="label">CPF</span>
              <span class="value value-mono">${assoc.cpf}</span>
            </div>
            <div class="field">
              <span class="label">Data de Nascimento</span>
              <span class="value">${formattedBirthDate}</span>
            </div>
            <div class="field">
              <span class="label">E-mail</span>
              <span class="value">${assoc.email}</span>
            </div>
            <div class="field">
              <span class="label">Telefone</span>
              <span class="value">${assoc.phone || 'Não informado'}</span>
            </div>
          </div>
        </div>

        <div class="section-title">Dados de Filiação e Pessoais</div>
        <div class="grid-container">
          <div class="field">
            <span class="label">Nome da Mãe</span>
            <span class="value">${assoc.motherName || 'Não informado'}</span>
          </div>
          <div class="field">
            <span class="label">Nome do Pai</span>
            <span class="value">${assoc.fatherNotDeclared ? 'Não declarado' : (assoc.fatherName || 'Não informado')}</span>
          </div>
          <div class="field">
            <span class="label">Gênero</span>
            <span class="value">${assoc.gender || 'Não informado'}</span>
          </div>
        </div>

        <div class="section-title">Documentação Oficial</div>
        <div class="grid-container">
          ${assoc.cinNumero ? `
            <div class="field">
              <span class="label">Carteira de Identidade Nacional (CIN)</span>
              <span class="value value-mono">${assoc.cinNumero}</span>
            </div>
            <div class="field">
              <span class="label">Órgão Expedidor (CIN)</span>
              <span class="value">${assoc.cinOrgaoExpedidor || 'Não informado'}</span>
            </div>
            <div class="field">
              <span class="label">Expedição (CIN)</span>
              <span class="value">
                ${assoc.cinDataExpedicao ? new Date(assoc.cinDataExpedicao + 'T00:00:00').toLocaleDateString('pt-BR') : 'Não informado'} 
                ${assoc.cinUf ? ' / ' + assoc.cinUf : ''}
              </span>
            </div>
          ` : `
            <div class="field">
              <span class="label">Número do RG</span>
              <span class="value value-mono">${assoc.rgNumero || 'Não informado'}</span>
            </div>
            <div class="field">
              <span class="label">Órgão Expedidor (RG)</span>
              <span class="value">${assoc.rgOrgaoExpedidor || 'Não informado'}</span>
            </div>
            <div class="field">
              <span class="label">Expedição (RG)</span>
              <span class="value">
                ${assoc.rgDataExpedicao ? new Date(assoc.rgDataExpedicao + 'T00:00:00').toLocaleDateString('pt-BR') : 'Não informado'}
                ${assoc.rgUf ? ' / ' + assoc.rgUf : ''}
              </span>
            </div>
          `}
          <div class="field">
            <span class="label">NIS (Nº Identificação Social)</span>
            <span class="value value-mono">${assoc.nis || 'Não informado'}</span>
          </div>
          <div class="field">
            <span class="label">CAF (Agricultura Familiar)</span>
            <span class="value value-mono">${assoc.caf || 'Não informado'}</span>
          </div>
          <div class="field">
            <span class="label">Direito a Voto</span>
            <span class="value">${assoc.hasVotingRight !== false ? 'Sim' : 'Não'}</span>
          </div>
        </div>

        ${assoc.certidaoTipo && assoc.certidaoTipo !== 'Nenhuma' ? `
          <div class="section-title">Certidão Civil</div>
          <div class="grid-container">
            <div class="field">
              <span class="label">Tipo de Certidão</span>
              <span class="value">Certidão de ${assoc.certidaoTipo}</span>
            </div>
            <div class="field">
              <span class="label">Modelo</span>
              <span class="value">Modelo ${assoc.certidaoModelo}</span>
            </div>
            <div class="field">
              <span class="label">Número / Matrícula</span>
              <span class="value value-mono">${assoc.certidaoNumero || 'Não informado'}</span>
            </div>
          </div>
        ` : ''}

        <div class="section-title">Endereço Residencial</div>
        <div class="field" style="width: 100%;">
          <span class="label">Endereço Completo</span>
          <span class="value">${assoc.address || 'Não informado'}</span>
        </div>

        <div class="section-title">Associação e Informações Financeiras</div>
        <div class="grid-container">
          <div class="field">
            <span class="label">Função / Cargo na Associação</span>
            <span class="value font-bold" style="color: #1e3a8a; background-color: #eff6ff; padding: 2px 6px; border-radius: 4px; display: inline-block;">
              ${assoc.associationRole || 'Nenhum (Apenas Associado)'}
            </span>
          </div>
          <div class="field">
            <span class="label">Data de Admissão</span>
            <span class="value">${formattedJoiningDate} ${assoc.joiningDate ? `(${calculateMembershipDuration(assoc.joiningDate)})` : ''}</span>
          </div>
          <div class="field">
            <span class="label font-bold">Mensalidade Cadastrada</span>
            <span class="value font-bold" style="color: #1d4ed8;">${formattedFee}</span>
          </div>
          <div class="field">
            <span class="label">Situação Cadastral</span>
            <span class="value" style="font-weight: 700; color: ${assoc.status === 'Ativo' ? '#10b981' : '#ef4444'};">${assoc.status}</span>
          </div>
          <div class="field">
            <span class="label">Situação Financeira</span>
            <span class="value" style="font-weight: 700; color: ${
              assoc.financialStatus === 'Inadimplente' ? '#ef4444' : 
              assoc.financialStatus === 'Zona de Perigo' ? '#f97316' : 
              assoc.financialStatus === 'Em Atenção' ? '#eab308' : '#10b981'
            };">
              ${assoc.financialStatus === 'Inadimplente' ? '🔴 ' :
                assoc.financialStatus === 'Zona de Perigo' ? '🟠 ' :
                assoc.financialStatus === 'Em Atenção' ? '🟡 ' : '🟢 '}
              ${assoc.financialStatus || 'Adimplente'}
            </span>
          </div>
          ${assoc.financialStatus !== 'Adimplente' && assoc.debtAmount && assoc.debtAmount > 0 ? `
            <div class="field">
              <span class="label">Valor Pendente de Débito</span>
              <span class="value" style="font-weight: 700; color: #ef4444;">${formattedDebt}</span>
            </div>
          ` : ''}
          <div class="field">
            <span class="label">Situação Documental</span>
            <span class="value" style="font-weight: 700; color: ${assoc.documentStatus === 'Com Pendência' ? '#ef4444' : '#10b981'};">${assoc.documentStatus || 'OK'}</span>
          </div>
        </div>

        <div class="signature-area">
          <div class="signature-box">
            Assinatura do Associado / Responsável
          </div>
          <div class="signature-box">
            Representante Legal - ${entityName}
          </div>
        </div>

        <div class="footer">
          Ficha gerada eletronicamente pelo Sistema de Gestão ${entityName} em ${new Date().toLocaleString('pt-BR')}
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Filter logic
  const filteredAssociates = associates.filter((assoc) => {
    const matchesSearch = 
      assoc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assoc.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (assoc.matricula && assoc.matricula.toLowerCase().includes(searchQuery.toLowerCase())) ||
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
            id="btn-congrats-whatsapp"
            onClick={() => handleOpenCongratsModal()}
            className="flex items-center gap-1.5 py-2 px-3.5 bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/30 text-emerald-300 hover:text-white text-xs font-extrabold rounded-xl shadow-lg transition-all cursor-pointer"
            title="Enviar mensagem de parabéns e agradecimento via WhatsApp para associados em dia"
          >
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <span>🎉 Mensagem de Parabéns (WhatsApp)</span>
          </button>

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

      {/* Summary Stats for Contributions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#111111] p-4 rounded-2xl border border-white/5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/15 shrink-0">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Total Arrecadado (Adimplentes)</span>
            <span className="text-lg font-extrabold text-emerald-400 font-mono block">
              {formatBRL(associates.filter(a => a.financialStatus === 'Adimplente' || !a.financialStatus).reduce((acc, a) => acc + calculateAssociateContribution(a, entityConfig?.monthlyFee || 10).totalContributed, 0))}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-white/5 pt-3 sm:pt-0 sm:pl-4">
          <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/15 shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Quadro de Sócios Adimplentes</span>
            <span className="text-lg font-extrabold text-white block">
              {associates.filter(a => a.financialStatus === 'Adimplente' || !a.financialStatus).length} / {associates.length} sócios
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-white/5 pt-3 sm:pt-0 sm:pl-4">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/15 shrink-0">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Mensalidade Padrão</span>
            <span className="text-lg font-extrabold text-indigo-400 font-mono block">
              R$ 10,00 / mês
            </span>
          </div>
        </div>
      </div>

      {/* Grid of Associates cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <AnimatePresence mode="popLayout">
          {filteredAssociates.map((assoc) => {
            const isPendingAgreement = assoc.installmentPlan && assoc.installmentPlan.status === 'Em Análise';
            const isPendingReceipt = assoc.installmentPlan && assoc.installmentPlan.installments && assoc.installmentPlan.installments.some(inst => inst.status === 'Em Análise');
            const isPendingMonthly = assoc.pendingMonthlyReceipts && assoc.pendingMonthlyReceipts.some(r => !r.status || r.status === 'Em Análise');
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
                {/* Delete Warning Overlay */}
                {deletingAssocId === assoc.id && (
                  <div className="absolute inset-0 bg-[#0d0d0d]/95 backdrop-blur-xs flex flex-col justify-center items-center p-5 text-center z-20 rounded-2xl border border-red-500/30">
                    <AlertTriangle className="h-9 w-9 text-red-500 mb-2 animate-bounce" />
                    <h4 className="text-sm font-extrabold text-white">Deseja realmente excluir?</h4>
                    <p className="text-[11px] text-gray-400 mt-1 mb-4 leading-normal max-w-[220px]">
                      Esta ação removerá o cadastro de <strong>{assoc.name}</strong> e todos os seus comprovantes/dados permanentemente do sistema.
                    </p>
                    <div className="flex gap-2 w-full max-w-[200px]">
                      <button
                        onClick={() => {
                          onDeleteAssociate(assoc.id);
                          setDeletingAssocId(null);
                        }}
                        className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all"
                      >
                        Sim, Excluir
                      </button>
                      <button
                        onClick={() => setDeletingAssocId(null)}
                        className="flex-1 py-2 bg-white/10 hover:bg-white/15 text-gray-300 text-xs font-semibold rounded-xl cursor-pointer transition-all"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
                {/* Card Header */}
                <div>
                  <div className="flex justify-between items-start gap-3 mb-1.5">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {assoc.photo ? (
                        <div className="w-12 h-12 rounded-full border border-blue-500/30 overflow-hidden shrink-0">
                          <img src={assoc.photo} alt={assoc.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-[#161616] border border-white/10 flex items-center justify-center shrink-0">
                          <Users className="h-5 w-5 text-gray-500 opacity-40" />
                        </div>
                      )}
                      <div className="space-y-1 min-w-0 flex-1">
                        <h4 className="font-bold text-white text-base leading-snug line-clamp-1 font-sans">{assoc.name}</h4>
                        {assoc.matricula && (
                          <p className="text-xs text-blue-400 font-mono font-semibold">
                            Matrícula: {assoc.matricula}
                          </p>
                        )}
                        {assoc.associationRole && assoc.associationRole !== 'Nenhum' && (
                          <div className="pt-0.5">
                            <span className="inline-flex items-center gap-1 bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold text-[10px] px-2 py-0.5 rounded-md">
                              <Award className="h-3 w-3 text-amber-400 shrink-0" />
                              {assoc.associationRole}
                            </span>
                          </div>
                        )}
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
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        assoc.status === 'Ativo' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                      }`}>
                        {assoc.status}
                      </span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                        assoc.financialStatus === 'Inadimplente' ? 'bg-red-500/15 text-red-300 border-red-500/20' :
                        assoc.financialStatus === 'Zona de Perigo' ? 'bg-orange-500/15 text-orange-300 border-orange-500/20' :
                        assoc.financialStatus === 'Em Atenção' ? 'bg-yellow-500/15 text-yellow-300 border-yellow-500/20' :
                        'bg-emerald-500/10 text-emerald-400 border-emerald-500/10'
                      }`}>
                        {assoc.financialStatus === 'Inadimplente' ? '🔴 Inadimplente' :
                         assoc.financialStatus === 'Zona de Perigo' ? '🟠 P. Perigo' :
                         assoc.financialStatus === 'Em Atenção' ? '🟡 Atenção' : '🟢 Adimplente'}
                      </span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        assoc.hasVotingRight !== false ? 'bg-blue-500/10 text-blue-400 border border-blue-500/10' : 'bg-gray-500/10 text-gray-400'
                      }`}>
                        {assoc.hasVotingRight !== false ? '🗳️ Com Voto' : '❌ Sem Voto'}
                      </span>
                    </div>
                  </div>
                
                {assoc.financialStatus !== 'Adimplente' && assoc.debtAmount !== undefined && assoc.debtAmount > 0 && (
                  <div className={`mb-3 px-2.5 py-1.5 border rounded-lg text-[10px] font-bold flex items-center gap-1.5 ${
                    assoc.financialStatus === 'Inadimplente' ? 'bg-red-500/5 border-red-500/10 text-red-400' :
                    assoc.financialStatus === 'Zona de Perigo' ? 'bg-orange-500/5 border-orange-500/10 text-orange-400' :
                    'bg-yellow-500/5 border-yellow-500/10 text-yellow-400'
                  }`}>
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
                {(() => {
                  const contrib = calculateAssociateContribution(assoc, entityConfig?.monthlyFee || 10);
                  return (
                    <div className="bg-[#1a1a1a]/80 p-3 rounded-xl border border-white/5 space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] text-gray-400 font-medium">Mensalidade:</span>
                        <span className="text-xs font-bold text-blue-400 font-mono">
                          {formatBRL(contrib.monthlyFee)}/mês
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-white/5">
                        <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                          Contribuído ({contrib.monthsElapsed} mes{contrib.monthsElapsed === 1 ? '' : 'es'}):
                        </span>
                        <span className={`text-xs font-extrabold font-mono ${contrib.isAdimplente ? 'text-emerald-400' : 'text-red-400/80'}`}>
                          {contrib.isAdimplente ? formatBRL(contrib.totalContributed) : 'Pendente (Inadimplente)'}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                <div className="flex gap-1.5 justify-end flex-wrap">
                  {/* WhatsApp Congrats Button */}
                  <button
                    onClick={() => handleOpenCongratsModal(assoc)}
                    className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                    title="Enviar Mensagem de Parabéns e Agradecimento via WhatsApp"
                  >
                    <MessageSquare className="h-3.5 w-3.5 text-emerald-400" />
                    Parabenizar
                  </button>

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
                  {/* Delete button */}
                  <button
                    onClick={() => setDeletingAssocId(assoc.id)}
                    className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                    title="Excluir Cadastro"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Excluir
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
                    {/* Photo Upload Zone */}
                    <div className="sm:col-span-3 flex flex-col sm:flex-row items-center gap-4 bg-[#1a1a1a]/40 p-4 rounded-2xl border border-white/5">
                      <div className="relative w-20 h-20 rounded-full bg-[#111] border-2 border-dashed border-white/20 flex items-center justify-center overflow-hidden shrink-0 group hover:border-blue-500/50 transition-colors">
                        {photo ? (
                          <>
                            <img src={photo} alt="Foto do Associado" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setPhoto('')}
                              className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center text-red-400 text-[10px] font-bold transition-opacity cursor-pointer"
                            >
                              Remover
                            </button>
                          </>
                        ) : (
                          <div className="text-center p-2 text-gray-500 group-hover:text-gray-400 transition-colors">
                            <Users className="h-6 w-6 mx-auto mb-0.5 opacity-40" />
                            <span className="text-[9px] block font-semibold leading-tight">Sem Foto</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 text-center sm:text-left">
                        <label className="block text-xs font-semibold text-gray-300 mb-0.5">
                          Foto do Associado
                        </label>
                        <p className="text-[10px] text-gray-500 mb-1.5">Arquivos de imagem de até 2MB</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          className="hidden"
                          id="upload-photo-input"
                        />
                        <label
                          htmlFor="upload-photo-input"
                          className="inline-flex items-center gap-1.5 py-1 px-2.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 text-[11px] font-semibold rounded-lg border border-blue-500/20 transition-all cursor-pointer"
                        >
                          Selecionar Foto
                        </label>
                      </div>
                    </div>

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
                        Nome da Mãe
                      </label>
                      <input
                        type="text"
                        value={motherName}
                        onChange={(e) => setMotherName(e.target.value)}
                        placeholder="Nome completo da mãe"
                        className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-gray-400 mb-1">
                        Nome do Pai
                      </label>
                      <input
                        type="text"
                        disabled={fatherNotDeclared}
                        value={fatherNotDeclared ? 'Não declarado' : fatherName}
                        onChange={(e) => setFatherName(e.target.value)}
                        placeholder={fatherNotDeclared ? 'Não declarado' : 'Nome completo do pai'}
                        className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                      />
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          id="father-not-declared-checkbox"
                          checked={fatherNotDeclared}
                          onChange={(e) => {
                            setFatherNotDeclared(e.target.checked);
                            if (e.target.checked) {
                              setFatherName('');
                            }
                          }}
                          className="h-3.5 w-3.5 rounded border-white/10 bg-[#1a1a1a] text-blue-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                        />
                        <label htmlFor="father-not-declared-checkbox" className="text-[11px] text-gray-400 select-none cursor-pointer">
                          Pai não declarado
                        </label>
                      </div>
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
                      <>
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
                        <div>
                          <label className="block text-xs font-semibold text-gray-400 mb-1">
                            Órgão Expedidor (CIN) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={cinOrgaoExpedidor}
                            onChange={(e) => setCinOrgaoExpedidor(e.target.value)}
                            placeholder="Ex: SSP"
                            className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-400 mb-1">
                            Data de Expedição (CIN) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={cinDataExpedicao}
                            onChange={(e) => setCinDataExpedicao(maskDate(e.target.value))}
                            placeholder="DD/MM/AAAA"
                            className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-400 mb-1">
                            UF Expedidora (CIN) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={cinUf}
                            onChange={(e) => setCinUf(e.target.value)}
                            placeholder="Ex: SP"
                            maxLength={2}
                            className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </>
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

                  {/* Função na Associação */}
                  <div className="p-3.5 bg-gradient-to-r from-blue-950/40 to-indigo-950/40 border border-blue-500/25 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Award className="h-4 w-4 text-blue-400 shrink-0" />
                        Exerce alguma função dentro da associação?
                      </label>
                      <span className="text-[10px] text-blue-400/80 font-medium">Ex: Presidente, Tesoureiro, etc.</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <select
                          value={associationRoleOption}
                          onChange={(e) => setAssociationRoleOption(e.target.value)}
                          className="w-full px-3 py-2 bg-[#1a1a1a] border border-blue-500/30 rounded-xl text-sm text-white font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="Nenhum">Nenhum (Apenas Associado)</option>
                          <option value="Presidente">Presidente</option>
                          <option value="Vice-Presidente">Vice-Presidente</option>
                          <option value="Secretária(o)">Secretária(o)</option>
                          <option value="Tesoureira(o)">Tesoureira(o)</option>
                          <option value="Diretor(a) de Costumes e Tradições">Diretor(a) de Costumes e Tradições</option>
                          <option value="Conselho Fiscal">Conselho Fiscal</option>
                          <option value="Outro">Outra Função / Cargo Especial</option>
                        </select>
                      </div>

                      {associationRoleOption === 'Outro' && (
                        <div>
                          <input
                            type="text"
                            required
                            value={customRoleTitle}
                            onChange={(e) => setCustomRoleTitle(e.target.value)}
                            placeholder="Digite o nome da função/cargo..."
                            className="w-full px-3 py-2 bg-[#1a1a1a] border border-blue-500/40 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-gray-400">
                          Número de Matrícula (00001 - 99999) *
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setMatricula(getNextMatriculaNumber(associates));
                            setMatriculaError('');
                          }}
                          className="text-[10px] text-blue-400 hover:text-blue-300 font-semibold underline"
                        >
                          Sugerir Próxima
                        </button>
                      </div>
                      <input
                        type="text"
                        required
                        value={matricula}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 5);
                          setMatricula(val);
                          setMatriculaError('');
                        }}
                        onBlur={() => {
                          if (matricula) {
                            setMatricula(formatMatricula(matricula));
                          }
                        }}
                        placeholder="00001"
                        className={`w-full px-3 py-2 bg-[#1a1a1a] border ${
                          matriculaError ? 'border-red-500/80 focus:ring-red-500' : 'border-white/10 focus:ring-blue-500'
                        } rounded-xl text-sm font-mono text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:border-blue-500`}
                      />
                      {matriculaError && (
                        <p className="text-[11px] text-red-400 mt-1 font-medium">
                          {matriculaError}
                        </p>
                      )}
                    </div>

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
                        Taxa Mensalidade Padrão Mês (R$)
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

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-gray-400 mb-1">
                        Situação Financeira
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 bg-[#1a1a1a] p-1 rounded-xl border border-white/10 gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setFinancialStatus('Adimplente');
                            setDebtAmount('');
                          }}
                          className={`text-center py-1.5 text-xs font-semibold rounded-lg transition-all ${
                            financialStatus === 'Adimplente' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          🟢 Adimplente
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFinancialStatus('Em Atenção');
                          }}
                          className={`text-center py-1.5 text-xs font-semibold rounded-lg transition-all ${
                            financialStatus === 'Em Atenção' ? 'bg-yellow-500 text-black shadow-md' : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          🟡 Atenção
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFinancialStatus('Zona de Perigo');
                          }}
                          className={`text-center py-1.5 text-xs font-semibold rounded-lg transition-all ${
                            financialStatus === 'Zona de Perigo' ? 'bg-orange-500 text-white shadow-md' : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          🟠 Perigo
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFinancialStatus('Inadimplente');
                          }}
                          className={`text-center py-1.5 text-xs font-semibold rounded-lg transition-all ${
                            financialStatus === 'Inadimplente' ? 'bg-red-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          🔴 Inadimplente
                        </button>
                      </div>
                    </div>

                    {financialStatus !== 'Adimplente' && (
                      <div className="sm:col-span-2 lg:col-span-1">
                        <label className={`block text-xs font-semibold mb-1 flex items-center gap-1 ${
                          financialStatus === 'Inadimplente' ? 'text-red-400' :
                          financialStatus === 'Zona de Perigo' ? 'text-orange-400' : 'text-yellow-400'
                        }`}>
                          <AlertCircle className="h-3.5 w-3.5" />
                          Valor da Dívida (R$)
                        </label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={debtAmount}
                          onChange={(e) => setDebtAmount(maskMoney(e.target.value))}
                          placeholder="0,00"
                          className={`w-full px-3 py-2 bg-[#1a1a1a] border rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 ${
                            financialStatus === 'Inadimplente' ? 'border-red-500/30 focus:ring-red-500' :
                            financialStatus === 'Zona de Perigo' ? 'border-orange-500/30 focus:ring-orange-500' : 'border-yellow-500/30 focus:ring-yellow-500'
                          }`}
                        />
                      </div>
                    )}

                    <div className="sm:col-span-2 flex items-center gap-2 pt-2">
                      <input
                        type="checkbox"
                        id="hasVotingRight"
                        checked={hasVotingRight}
                        onChange={(e) => setHasVotingRight(e.target.checked)}
                        className="h-4 w-4 rounded-md border-white/10 bg-[#1a1a1a] text-blue-500 focus:ring-blue-500 accent-blue-500 cursor-pointer"
                      />
                      <label htmlFor="hasVotingRight" className="text-xs font-semibold text-gray-300 cursor-pointer select-none">
                        Possui Direito a Voto nas Eleições / Votações
                      </label>
                    </div>
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
              <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between bg-[#161616]">
                {editingAssociate ? (
                  <button
                    type="button"
                    onClick={() => {
                      const assocId = editingAssociate.id;
                      setIsFormModalOpen(false);
                      setDeletingAssocId(assocId);
                    }}
                    className="px-3.5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Excluir Cadastral</span>
                  </button>
                ) : <div />}
                <div className="flex items-center gap-3">
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
                  <option value="Dinheiro em espécie">Dinheiro em espécie</option>
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
                  onClick={() => downloadAssociateFicha(selectedAssociate)}
                  className="px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-xl text-xs font-semibold flex items-center gap-1 border border-blue-500/20 transition-all cursor-pointer"
                >
                  Baixar Ficha
                </button>
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
                <div className="flex items-center gap-3">
                  {selectedAssociate.photo ? (
                    <div className="w-14 h-14 rounded-full border border-blue-500/30 overflow-hidden shrink-0">
                      <img src={selectedAssociate.photo} alt="Foto" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-[#161616] border border-white/10 flex items-center justify-center shrink-0">
                      <Users className="h-6 w-6 text-gray-500 opacity-40" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-extrabold text-white">{selectedAssociate.name}</h2>
                    <p className="text-xs text-gray-400 mt-0.5">E-mail de cadastro: {selectedAssociate.email}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    selectedAssociate.status === 'Ativo' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                  }`}>
                    {selectedAssociate.status}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                    selectedAssociate.financialStatus === 'Inadimplente' ? 'bg-red-500/15 text-red-300 border-red-500/20' :
                    selectedAssociate.financialStatus === 'Zona de Perigo' ? 'bg-orange-500/15 text-orange-300 border-orange-500/20' :
                    selectedAssociate.financialStatus === 'Em Atenção' ? 'bg-yellow-500/15 text-yellow-300 border-yellow-500/20' :
                    'bg-emerald-500/10 text-emerald-400 border-emerald-500/10'
                  }`}>
                    {selectedAssociate.financialStatus === 'Inadimplente' ? '🔴 Inadimplente' :
                     selectedAssociate.financialStatus === 'Zona de Perigo' ? '🟠 Perigo' :
                     selectedAssociate.financialStatus === 'Em Atenção' ? '🟡 Atenção' : '🟢 Adimplente'}
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
                      <span className="text-gray-500 block text-[10px]">Nome da Mãe</span>
                      <span className="font-semibold text-white">{selectedAssociate.motherName || 'Não informado'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[10px]">Nome do Pai</span>
                      <span className="font-semibold text-white">
                        {selectedAssociate.fatherNotDeclared ? 'Não declarado' : (selectedAssociate.fatherName || 'Não informado')}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[10px]">Filiação Completa</span>
                      <span className="font-semibold text-white">{selectedAssociate.filiation || 'Não informado'}</span>
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
                    <div className="p-2.5 rounded-lg border bg-blue-950/30 border-blue-500/20 flex items-center justify-between gap-2">
                      <div>
                        <span className="text-gray-400 font-medium block">Função / Cargo na Associação</span>
                        <span className="font-extrabold text-blue-300 text-xs mt-0.5 flex items-center gap-1">
                          <Award className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                          {selectedAssociate.associationRole || 'Nenhum (Apenas Associado)'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-gray-500 block">Data de Filiação</span>
                        <span className="font-semibold text-white">
                          {selectedAssociate.joiningDate ? new Date(selectedAssociate.joiningDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'Não informado'}
                        </span>
                        {selectedAssociate.joiningDate && (
                          <span className="text-[10px] text-indigo-400 font-medium block mt-0.5">
                            Tempo: {calculateMembershipDuration(selectedAssociate.joiningDate)}
                          </span>
                        )}
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
                          selectedAssociate.financialStatus === 'Inadimplente' ? 'text-red-400' :
                          selectedAssociate.financialStatus === 'Zona de Perigo' ? 'text-orange-400' :
                          selectedAssociate.financialStatus === 'Em Atenção' ? 'text-yellow-400' :
                          'text-emerald-400'
                        }`}>
                          {selectedAssociate.financialStatus === 'Inadimplente' ? '🔴 ' :
                           selectedAssociate.financialStatus === 'Zona de Perigo' ? '🟠 ' :
                           selectedAssociate.financialStatus === 'Em Atenção' ? '🟡 ' : '🟢 '}
                          {selectedAssociate.financialStatus || 'Adimplente'}
                        </span>
                      </div>
                      {selectedAssociate.financialStatus !== 'Adimplente' && selectedAssociate.debtAmount !== undefined && selectedAssociate.debtAmount > 0 && (
                        <div className="text-right">
                          <span className="text-gray-500 block">Valor Pendente</span>
                          <span className={`font-extrabold font-mono ${
                            selectedAssociate.financialStatus === 'Inadimplente' ? 'text-red-400' :
                            selectedAssociate.financialStatus === 'Zona de Perigo' ? 'text-orange-400' : 'text-yellow-400'
                          }`}>
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedAssociate.debtAmount || 0)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Calculated Total Contribution Box */}
                    {(() => {
                      const contrib = calculateAssociateContribution(selectedAssociate, entityConfig?.monthlyFee || 10);
                      return (
                        <div className="p-3 rounded-xl border bg-blue-950/20 border-blue-500/20 space-y-1 mt-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-300 font-semibold">Total Contribuído Acumulado:</span>
                            <span className={`font-mono font-extrabold text-sm ${contrib.isAdimplente ? 'text-emerald-400' : 'text-gray-400'}`}>
                              {contrib.isAdimplente ? formatBRL(contrib.totalContributed) : 'Pendente (Inadimplente)'}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400 leading-tight">
                            {contrib.isAdimplente 
                              ? `Cálculo automático: R$ ${contrib.monthlyFee.toFixed(2)}/mês a partir da filiação (${contrib.monthsElapsed} mes${contrib.monthsElapsed === 1 ? '' : 'es'}).`
                              : `Sócio com situação pendente (${selectedAssociate.financialStatus || 'Inadimplente'}). Regularize para contabilizar as contribuições.`
                            }
                          </p>
                        </div>
                      );
                    })()}

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

                    <div className="p-2.5 rounded-lg border flex items-center justify-between gap-2 mt-1 bg-white/5 border-white/5">
                      <div>
                        <span className="text-gray-400 font-medium">Direito a Voto</span>
                        <span className={`block font-bold text-xs uppercase mt-0.5 ${
                          selectedAssociate.hasVotingRight !== false ? 'text-blue-400' : 'text-gray-400'
                        }`}>
                          {selectedAssociate.hasVotingRight !== false ? '🗳️ Possui Direito a Voto (Sim)' : '❌ Sem Direito a Voto (Não)'}
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
                      <span className="text-gray-500 block">Matrícula (5 dígitos)</span>
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

                                {/* Se tiver comprovante já analisado ou recusado, mantê-lo guardado e permitir exclusão */}
                                {(inst.status === 'Pago' || inst.status === 'Recusado') && inst.receiptFile && (
                                  <div className="p-2 bg-white/[0.01] border border-white/5 rounded-xl flex justify-between items-center gap-2">
                                    <div className="text-[11px] truncate">
                                      <span className="text-gray-400 block font-bold text-[9px] uppercase tracking-wider">Comprovante Guardado ({inst.status})</span>
                                      <span className="text-gray-500 font-mono block truncate max-w-[200px]">{inst.receiptFileName || 'comprovante.png'}</span>
                                    </div>
                                    <div className="flex gap-1.5 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => setPreviewingReceipt({
                                          fileName: inst.receiptFileName || 'comprovante.png',
                                          fileData: inst.receiptFile || '',
                                          associate: selectedAssociate,
                                          installmentNumber: inst.number
                                        })}
                                        className="py-1 px-2.5 bg-white/5 hover:bg-white/10 text-white rounded text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                                      >
                                        <Eye className="h-3 w-3" />
                                        Ver
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteInstallmentReceipt(selectedAssociate, inst.number)}
                                        className="py-1 px-2.5 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 rounded text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                                        title="Excluir Comprovante Permanentemente"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                        Excluir
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

                  {(() => {
                    const pendingReceiptsOnly = selectedAssociate.pendingMonthlyReceipts?.filter(r => !r.status || r.status === 'Em Análise') || [];
                    if (pendingReceiptsOnly.length === 0) {
                      return (
                        <div className="p-3 bg-white/5 rounded-xl text-xs text-gray-400 text-center">
                          Nenhum comprovante de mensalidade aguardando validação para este associado.
                        </div>
                      );
                    }
                    return (
                      <div className="space-y-3">
                        {pendingReceiptsOnly.map((receipt) => (
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
                    );
                  })()}
                </div>

                {/* 9. Histórico de Comprovantes de Mensalidade Analisados */}
                <div className="bg-[#161616] p-4.5 rounded-xl border border-white/5 space-y-4 md:col-span-2">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    Histórico de Comprovantes de Mensalidades Analisados
                  </h4>

                  {(() => {
                    const analyzedReceipts = selectedAssociate.pendingMonthlyReceipts?.filter(r => r.status === 'Aprovado' || r.status === 'Reprovado') || [];
                    if (analyzedReceipts.length === 0) {
                      return (
                        <div className="p-3 bg-white/[0.02] rounded-xl text-xs text-gray-500 text-center">
                          Nenhum comprovante analisado anteriormente para este associado.
                        </div>
                      );
                    }
                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {analyzedReceipts.map((receipt) => (
                          <div key={receipt.monthKey} className="p-3 bg-[#111111] border border-white/5 rounded-xl space-y-2 flex flex-col justify-between">
                            <div className="space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-white block">Mês: {receipt.monthName}</span>
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                                  receipt.status === 'Aprovado' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                  'bg-red-500/15 text-red-400 border border-red-500/20'
                                }`}>
                                  {receipt.status}
                                </span>
                              </div>
                              <span className="text-[10px] text-gray-400 block font-mono">
                                Valor: {formatBRL(receipt.amount)} • Via: {receipt.paymentMethod}
                              </span>
                              {receipt.reviewedAt && (
                                <span className="text-[9px] text-gray-500 block">
                                  Analisado em: {new Date(receipt.reviewedAt).toLocaleString('pt-BR')}
                                </span>
                              )}
                            </div>
                            <div className="flex gap-2 pt-2 border-t border-white/5">
                              <button
                                type="button"
                                onClick={() => setPreviewingReceipt({
                                  fileName: receipt.receiptFileName || 'comprovante.png',
                                  fileData: receipt.receiptFile || '',
                                  associate: selectedAssociate,
                                  monthName: receipt.monthName,
                                  monthKey: receipt.monthKey
                                })}
                                className="flex-1 py-1 px-2 bg-white/5 hover:bg-white/10 text-white rounded text-[10px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer"
                              >
                                <Eye className="h-3 w-3" />
                                Ver
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`Deseja realmente excluir permanentemente este comprovante de ${receipt.monthName}?`)) {
                                    const updatedPending = selectedAssociate.pendingMonthlyReceipts?.filter(r => r.monthKey !== receipt.monthKey) || [];
                                    const updated = {
                                      ...selectedAssociate,
                                      pendingMonthlyReceipts: updatedPending
                                    };
                                    onEditAssociate(updated);
                                    setSelectedAssociate(updated);
                                  }
                                }}
                                className="flex-1 py-1 px-2 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 rounded text-[10px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer"
                              >
                                <Trash2 className="h-3 w-3" />
                                Excluir
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                {/* 10. Livro de Registro de Mensalidades (Exercício 2026) */}
                <div className="bg-[#161616] p-4.5 rounded-xl border border-white/5 space-y-4 md:col-span-2">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-2">
                    <Calendar className="h-4 w-4 text-emerald-500" />
                    Livro de Registro de Mensalidades (Exercício 2026)
                  </h4>
                  <p className="text-[11px] text-gray-400">
                    Verifique os pagamentos no livro físico/bancário e registre o status oficial para cada mês. Esta informação será refletida diretamente no portal do associado.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { name: 'Janeiro', key: '01' },
                      { name: 'Fevereiro', key: '02' },
                      { name: 'Março', key: '03' },
                      { name: 'Abril', key: '04' },
                      { name: 'Maio', key: '05' },
                      { name: 'Junho', key: '06' },
                      { name: 'Julho', key: '07' },
                      { name: 'Agosto', key: '08' },
                      { name: 'Setembro', key: '09' },
                      { name: 'Outubro', key: '10' },
                      { name: 'Novembro', key: '11' },
                      { name: 'Dezembro', key: '12' },
                    ].map((month) => {
                      const currentStatus = selectedAssociate.monthlyPayments2026?.[month.key] || 'Pendente';
                      
                      // Also find if they uploaded a receipt for this month
                      const uploadedReceipt = selectedAssociate.pendingMonthlyReceipts?.find(r => r.monthKey === month.key);

                      return (
                        <div key={month.key} className="p-3 bg-[#111111] rounded-xl border border-white/5 flex flex-col justify-between space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-white">{month.name}/2026</span>
                            <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${
                              currentStatus === 'Pago' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                              currentStatus === 'Não Pago' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                              'bg-gray-500/10 text-gray-400 border-white/5'
                            }`}>
                              {currentStatus}
                            </span>
                          </div>

                          {uploadedReceipt && (
                            <div className="text-[10px] text-gray-400 bg-white/5 p-1.5 rounded flex justify-between items-center">
                              <span className="truncate text-[10px]">Comprovante via {uploadedReceipt.paymentMethod}</span>
                              <button
                                type="button"
                                onClick={() => setPreviewingReceipt({
                                  fileName: uploadedReceipt.receiptFileName || 'comprovante.png',
                                  fileData: uploadedReceipt.receiptFile || '',
                                  associate: selectedAssociate,
                                  monthName: uploadedReceipt.monthName,
                                  monthKey: uploadedReceipt.monthKey
                                })}
                                className="text-blue-400 hover:underline text-[10px] shrink-0 ml-1 cursor-pointer"
                              >
                                Ver
                              </button>
                            </div>
                          )}

                          <div className="flex gap-1.5 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                const updatedPayments = {
                                  ...(selectedAssociate.monthlyPayments2026 || {}),
                                  [month.key]: 'Pago' as const
                                };
                                const stateUpdates = calculateFinancialStateFromPayments(selectedAssociate, updatedPayments);
                                const updated: Associate = {
                                  ...selectedAssociate,
                                  monthlyPayments2026: updatedPayments,
                                  ...stateUpdates
                                };
                                onEditAssociate(updated);
                                setSelectedAssociate(updated);
                              }}
                              className={`flex-1 py-1 px-1.5 text-[10px] font-bold rounded transition-all cursor-pointer text-center ${
                                currentStatus === 'Pago' 
                                  ? 'bg-emerald-600 text-white' 
                                  : 'bg-[#1a1a1a] text-gray-400 hover:bg-emerald-500/20 hover:text-emerald-400 border border-white/5'
                              }`}
                            >
                              Pago
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const updatedPayments = {
                                  ...(selectedAssociate.monthlyPayments2026 || {}),
                                  [month.key]: 'Não Pago' as const
                                };
                                const stateUpdates = calculateFinancialStateFromPayments(selectedAssociate, updatedPayments);
                                const updated: Associate = {
                                  ...selectedAssociate,
                                  monthlyPayments2026: updatedPayments,
                                  ...stateUpdates
                                };
                                onEditAssociate(updated);
                                setSelectedAssociate(updated);
                              }}
                              className={`flex-1 py-1 px-1.5 text-[10px] font-bold rounded transition-all cursor-pointer text-center ${
                                currentStatus === 'Não Pago' 
                                  ? 'bg-red-600 text-white' 
                                  : 'bg-[#1a1a1a] text-gray-400 hover:bg-red-500/20 hover:text-red-400 border border-white/5'
                              }`}
                            >
                              Não Pago
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const updatedPayments = {
                                  ...(selectedAssociate.monthlyPayments2026 || {})
                                };
                                delete updatedPayments[month.key];
                                const hasKeys = Object.keys(updatedPayments).length > 0;
                                const stateUpdates = calculateFinancialStateFromPayments(selectedAssociate, hasKeys ? updatedPayments : undefined);
                                const updated: Associate = {
                                  ...selectedAssociate,
                                  monthlyPayments2026: hasKeys ? updatedPayments : undefined,
                                  ...stateUpdates
                                };
                                onEditAssociate(updated);
                                setSelectedAssociate(updated);
                              }}
                              className="py-1 px-1.5 text-[10px] font-bold rounded transition-all cursor-pointer text-center bg-[#1a1a1a] text-gray-500 hover:text-white border border-white/5"
                              title="Limpar status"
                            >
                              Limpar
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
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

      {/* Dialog: Delete Associate Confirmation Modal */}
      {deletingAssocId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="bg-[#111111] rounded-2xl border border-white/10 max-w-md w-full p-6 space-y-4 text-gray-200"
          >
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="h-6 w-6 shrink-0" />
              <h3 className="font-bold text-base text-white">Confirmar Exclusão de Associado</h3>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Tem certeza que deseja excluir permanentemente o cadastro de <strong className="text-white">{associates.find(a => a.id === deletingAssocId)?.name || 'este associado'}</strong>?
              Esta ação removerá todos os dados e acessos e não poderá ser desfeita.
            </p>
            <div className="flex justify-end gap-3 pt-2 border-t border-white/5">
              <button
                type="button"
                onClick={() => setDeletingAssocId(null)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteAssociate(deletingAssocId);
                  setDeletingAssocId(null);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-900/30 cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Excluir Definitivamente</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Dialog: Space for Sending WhatsApp Congratulatory Message */}
      {isCongratsModalOpen && (
        <div id="congrats-whatsapp-modal" className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#111111] rounded-2xl shadow-2xl border border-white/10 max-w-lg w-full overflow-hidden text-gray-200"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-[#1a1a1a]/60">
              <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-sm">
                <Sparkles className="h-5 w-5 text-emerald-400" />
                <span>🎉 Transmitir Parabéns e Agradecimento via WhatsApp</span>
              </div>
              <button 
                type="button"
                onClick={() => setIsCongratsModalOpen(false)} 
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Info Banner */}
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3.5 text-xs text-emerald-300 flex items-start gap-2.5">
                <HeartHandshake className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold text-white text-xs mb-0.5">Espaço de Reconhecimento e Parceria</strong>
                  Envie uma mensagem especial de agradecimento para os associados que mantêm seus <strong>dados cadastrais atualizados</strong> e suas <strong>contribuições/mensalidades em dia</strong>!
                </div>
              </div>

              {/* Filter mode options */}
              <div className="flex bg-[#1a1a1a] p-1 rounded-xl border border-white/5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setCongratsFilterMode('adimplentes_and_updated')}
                  className={`flex-1 py-1.5 px-2 rounded-lg transition-all text-center cursor-pointer ${
                    congratsFilterMode === 'adimplentes_and_updated'
                      ? 'bg-emerald-600 text-white shadow-md font-bold'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  🟢 Em Dia ({associates.filter(a => (a.financialStatus === 'Adimplente' || !a.financialStatus) && a.documentStatus !== 'Com Pendência' && a.status === 'Ativo').length})
                </button>
                <button
                  type="button"
                  onClick={() => setCongratsFilterMode('todos_ativos')}
                  className={`flex-1 py-1.5 px-2 rounded-lg transition-all text-center cursor-pointer ${
                    congratsFilterMode === 'todos_ativos'
                      ? 'bg-blue-600 text-white shadow-md font-bold'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  👥 Todos Ativos ({associates.filter(a => a.status === 'Ativo').length})
                </button>
              </div>

              {/* Recipient Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Selecionar Associado Destinatário
                </label>
                <select
                  value={congratsSelectedAssocId}
                  onChange={(e) => handleCongratsRecipientChange(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {associates
                    .filter(a => {
                      if (congratsFilterMode === 'adimplentes_and_updated') {
                        return (a.financialStatus === 'Adimplente' || !a.financialStatus) && a.documentStatus !== 'Com Pendência' && a.status === 'Ativo';
                      }
                      return a.status === 'Ativo';
                    })
                    .map((assoc) => (
                      <option key={assoc.id} value={assoc.id}>
                        {assoc.name} - Matrícula: {assoc.matricula || 'N/A'} {assoc.phone ? `(${assoc.phone})` : '(Sem Telefone)'}
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
                    value={congratsPhone}
                    onChange={(e) => setCongratsPhone(e.target.value)}
                    placeholder="Ex: 87999998888"
                    className="w-full pl-9 pr-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Custom Message Editor */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Mensagem de Parabéns (Personalizável)
                  </label>
                  <button
                    type="button"
                    onClick={handleCopyCongratsMessage}
                    className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    {congratsCopiedSuccess ? (
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
                  value={congratsCustomMessage}
                  onChange={(e) => setCongratsCustomMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-xs font-mono text-emerald-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none leading-relaxed"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setIsCongratsModalOpen(false)}
                  className="px-4 py-2 border border-white/10 rounded-xl text-xs font-semibold text-gray-400 hover:bg-white/5 hover:text-white cursor-pointer"
                >
                  Fechar
                </button>

                <button
                  type="button"
                  onClick={handleExecuteSendCongratsWhatsApp}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-900/20 cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="h-4 w-4" />
                  Enviar via WhatsApp
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
