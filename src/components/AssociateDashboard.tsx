import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Mail, Phone, MapPin, FileText, Calendar, DollarSign, LogOut, 
  Bell, CheckCircle2, XCircle, Award, Edit, Save, Download, Printer, ArrowLeft, ArrowUpRight, Upload,
  ShieldCheck, ShieldAlert, AlertTriangle, Calculator, ClipboardList, Lock, Unlock, Check, BarChart3, Clock,
  Search, RefreshCw
} from 'lucide-react';
import { Associate, Transaction, Announcement, Assembly, Poll, EntityConfig, AttestationRecord } from '../types';
import { dateToBRL, formatDateTimeBRL, calculateMembershipDuration, calculateAssociateContribution, maskMoney, parseMaskedMoney, formatBRL } from '../utils/formatters';

interface AssociateDashboardProps {
  associate: Associate;
  transactions: Transaction[];
  announcements: Announcement[];
  assemblies: Assembly[];
  polls: Poll[];
  entityConfig?: EntityConfig | null;
  onLogout: () => void;
  onUpdateContactInfo: (id: string, phone: string, address: string, email: string) => void;
  onUpdateAssociate?: (associate: Associate) => void;
  onUpdatePoll?: (poll: Poll) => void;
  onRecordPayment?: (associate: Associate, amount: number, paymentMethod: string, description?: string) => void;
}

export default function AssociateDashboard({ 
  associate, 
  transactions, 
  announcements, 
  assemblies = [],
  polls = [],
  entityConfig,
  onLogout,
  onUpdateContactInfo,
  onUpdateAssociate,
  onUpdatePoll,
  onRecordPayment
}: AssociateDashboardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [phone, setPhone] = useState(associate.phone);
  const [address, setAddress] = useState(associate.address);
  const [email, setEmail] = useState(associate.email);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Monthly Fee Payment simulation state
  const [payMonthKey, setPayMonthKey] = useState<string | null>(null);
  const [payMonthAmount, setPayMonthAmount] = useState<string>('');
  const [payMonthMethod, setPayMonthMethod] = useState<string>('Pix');
  const [payMonthSuccess, setPayMonthSuccess] = useState(false);
  const [payMonthReceiptFile, setPayMonthReceiptFile] = useState<string | null>(null);
  const [payMonthReceiptFileName, setPayMonthReceiptFileName] = useState<string>('');
  const [payMonthReceiptError, setPayMonthReceiptError] = useState<string>('');
  const [installmentErrors, setInstallmentErrors] = useState<{ [key: number]: string }>({});

  // Attestation Authenticity Verification State
  const [verifyCodeInput, setVerifyCodeInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedResult, setVerifiedResult] = useState<{
    status: 'valid' | 'invalid' | 'not_found';
    code: string;
    title?: string;
    personName?: string;
    documentNumberPerson?: string;
    date?: string;
    type?: string;
    issuingEntity?: string;
    amount?: number;
    details?: string;
  } | null>(null);

  const handleVerifyCode = (codeToTest?: string) => {
    const rawInput = (codeToTest !== undefined ? codeToTest : verifyCodeInput).trim();
    if (!rawInput) {
      alert('Por favor, digite um código de autenticidade ou número do documento.');
      return;
    }

    setIsVerifying(true);
    setVerifiedResult(null);

    setTimeout(() => {
      setIsVerifying(false);

      const upperInput = rawInput.toUpperCase().trim();
      const cleanInput = upperInput.replace(/[^A-Z0-9]/g, '');

      // 1. Fetch saved attestations history from localStorage
      let savedHistory: AttestationRecord[] = [];
      try {
        const stored = localStorage.getItem('attestations_history');
        if (stored) {
          savedHistory = JSON.parse(stored);
        }
      } catch (e) {
        console.error("Erro ao ler histórico de atestados:", e);
      }

      // If history is empty, seed initial official attestation for associate with a 7-character code
      const sample7CharAuthCode = '7K9X2P4';
      if (savedHistory.length === 0) {
        const initialRecord: AttestationRecord = {
          id: 'attest-default-001',
          type: 'filiacao',
          documentNumber: `ATEST-FIL-${new Date().getFullYear()}/001`,
          authCode: sample7CharAuthCode,
          title: 'Atestado de Filiação Associativa',
          personName: associate.name,
          documentNumberPerson: associate.cpf,
          date: new Date().toLocaleDateString('pt-BR'),
          description: `Matrícula: ${associate.matricula || '00001'} - Declaração Oficial de Filiação e Quitação Estatutária`,
          createdAt: new Date().toISOString()
        };
        savedHistory = [initialRecord];
        try {
          localStorage.setItem('attestations_history', JSON.stringify(savedHistory));
        } catch {}
      }

      // 2. Strict matching against saved history records (by 7-char authCode or documentNumber)
      const matchedRecord = savedHistory.find(rec => {
        const recAuthCodeClean = (rec.authCode || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
        const recDocClean = (rec.documentNumber || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

        return recAuthCodeClean === cleanInput ||
               recDocClean === cleanInput;
      });

      if (matchedRecord) {
        const authCode = matchedRecord.authCode || '7K9X2P4';
        setVerifiedResult({
          status: 'valid',
          code: authCode,
          title: matchedRecord.title || 'Atestado de Autenticidade Registrado',
          personName: matchedRecord.personName,
          documentNumberPerson: matchedRecord.documentNumberPerson || 'CPF Registrado',
          date: matchedRecord.date,
          type: matchedRecord.type === 'filiacao' ? 'Atestado de Filiação Associativa' :
                matchedRecord.type === 'recebimento' ? 'Atestado de Recebimento de Valores' :
                matchedRecord.type === 'saida' ? 'Atestado de Saída de Caixa' : 'Atestado de Prestação de Serviços',
          issuingEntity: entityConfig?.name || 'Associação dos Pescadores e Moradores',
          amount: matchedRecord.amount,
          details: matchedRecord.description || 'Documento eletrônico autenticado e registrado no histórico oficial da entidade.'
        });
        return;
      }

      // 3. NOT FOUND IF CODE IS NOT IN HISTORY
      setVerifiedResult({
        status: 'not_found',
        code: rawInput,
        details: `CÓDIGO NÃO ENCONTRADO: O código de autenticidade "${rawInput}" não existe no sistema de atestados emitidos. Verifique se o código de 7 dígitos foi digitado corretamente ou solicite a emissão do documento no painel administrativo.`
      });

    }, 350);
  };

  const compressImage = (file: File, maxWidth = 600, maxHeight = 600, quality = 0.4): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        if (file.size > 500 * 1024) {
          reject(new Error('O arquivo PDF deve ter no máximo 500KB para ser enviado ao servidor.'));
          return;
        }
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(event.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        };
        img.onerror = (err) => reject(err);
        img.src = event.target?.result as string;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const handleMonthlyFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedExtensions = ['.png', '.jpg', '.jpeg', '.pdf'];
    const allowedMimeTypes = ['image/png', 'image/jpeg', 'application/pdf'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    const isValidType = allowedMimeTypes.includes(file.type) || allowedExtensions.includes(fileExtension);

    if (!isValidType) {
      setPayMonthReceiptError('O comprovante deve ser no formato PNG, JPEG ou PDF.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      setPayMonthReceiptError('O arquivo deve ter no máximo 2MB');
      return;
    }

    setPayMonthReceiptError('');
    try {
      const compressedBase64 = await compressImage(file);
      setPayMonthReceiptFile(compressedBase64);
      setPayMonthReceiptFileName(file.name);
    } catch (err) {
      console.error("Erro ao processar imagem:", err);
      setPayMonthReceiptError('Erro ao processar o arquivo.');
    }
  };

  // Helper to calculate days remaining until event
  const getDaysRemaining = (dateStr: string) => {
    if (!dateStr) return 999;
    const today = new Date('2026-07-11T17:20:34-07:00'); // Use current time context
    today.setHours(0, 0, 0, 0);
    
    const eventDate = new Date(dateStr);
    eventDate.setHours(0, 0, 0, 0);
    
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };
  
  // Installment Modal State
  const [isInstallmentModalOpen, setIsInstallmentModalOpen] = useState(false);
  const [selectedInstallments, setSelectedInstallments] = useState<number>(() => {
    const max = associate.maxInstallmentsAllowed || 12;
    return Math.min(3, max);
  });
  const [installmentMethod, setInstallmentMethod] = useState<string>('Pix');
  const [installmentSuccess, setInstallmentSuccess] = useState(false);
  

  // Poll vote local selections
  const [selectedOptionForPoll, setSelectedOptionForPoll] = useState<{ [pollId: string]: string }>({});

  const getPollDate = (dateStr?: string, timeStr?: string): Date => {
    if (!dateStr) return new Date();
    const time = timeStr || "00:00";
    const [hour, minute] = time.split(":").map(Number);
    if (dateStr.includes("/")) {
      const [day, month, year] = dateStr.split("/").map(Number);
      return new Date(year, month - 1, day, hour, minute, 0);
    } else {
      const [year, month, day] = dateStr.split("-").map(Number);
      return new Date(year, month - 1, day, hour, minute, 0);
    }
  };

  const handleVoteCast = async (poll: Poll) => {
    const selectedOptId = selectedOptionForPoll[poll.id];
    if (!selectedOptId) {
      alert('Selecione uma opção de voto para confirmar!');
      return;
    }

    if (associate.status !== 'Ativo') {
      alert('Seu cadastro precisa estar Ativo para exercer o direito ao voto.');
      return;
    }

    if (associate.hasVotingRight === false) {
      alert('Sua conta não possui direito a voto nas eleições. Regularize sua situação ou contate a administração.');
      return;
    }

    const startDateTime = poll.startDate ? getPollDate(poll.startDate, poll.startTime) : getPollDate(poll.date, "00:00");
    const endDateTime = poll.endDate ? getPollDate(poll.endDate, poll.endTime) : getPollDate(poll.date, poll.time || "23:59");
    const now = new Date();

    if (poll.status === 'Encerrado') {
      alert('Esta votação já foi encerrada pela administração!');
      return;
    }

    if (startDateTime && now < startDateTime) {
      alert(`Votação não iniciada! Esta votação estará aberta para votos a partir de ${dateToBRL(poll.startDate || poll.date)} às ${poll.startTime || '00:00'}h.`);
      return;
    }

    if (endDateTime && now > endDateTime) {
      alert(`Votação encerrada! O prazo para votar expirou em ${dateToBRL(poll.endDate || poll.date)} às ${poll.endTime || poll.time || '23:59'}h.`);
      return;
    }

    const updatedOptions = poll.options.map(opt => {
      if (opt.id === selectedOptId) {
        return { ...opt, votes: (Number(opt.votes) || 0) + 1 };
      }
      return opt;
    });

    const currentVoters = Array.isArray(poll.voters) ? poll.voters : [];
    if (currentVoters.includes(associate.id)) {
      alert('Você já registrou seu voto nesta votação!');
      return;
    }
    const updatedVoters = [...currentVoters, associate.id];

    const updatedVoterChoices = {
      ...(poll.voterChoices || {}),
      [associate.id]: selectedOptId
    };

    const updatedPoll: Poll = {
      ...poll,
      options: updatedOptions,
      voters: updatedVoters,
      voterChoices: updatedVoterChoices
    };

    if (onUpdatePoll) {
      await onUpdatePoll(updatedPoll);
    }

    alert('Seu voto foi registrado e enviado para o sistema!');
  };

  // Filter personal transactions
  const personalTransactions = transactions
    .filter(t => t.associateId === associate.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Filter announcements visible to this associate based on active status
  const visibleAnnouncements = announcements.filter(ann => {
    if (ann.targetGroup === 'Todos') return true;
    if (ann.targetGroup === 'Somente Ativos' && associate.status === 'Ativo') return true;
    return false;
  });

  const handleConfirmInstallment = async (e: React.FormEvent) => {
    e.preventDefault();
    const totalAmount = associate.debtAmount || 0;
    const value = parseFloat((totalAmount / selectedInstallments).toFixed(2));
    
    const installmentsList = Array.from({ length: selectedInstallments }).map((_, index) => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + (index + 1) * 30);
      return {
        number: index + 1,
        dueDate: dueDate.toISOString(),
        value,
        status: 'Pendente' as const
      };
    });

    const updatedAssociate: Associate = {
      ...associate,
      installmentPlan: {
        totalAmount,
        installmentsCount: selectedInstallments,
        installmentValue: value,
        paymentMethod: installmentMethod,
        dateConfirmed: new Date().toISOString(),
        status: 'Em Análise',
        installments: installmentsList
      }
    };
    
    if (onUpdateAssociate) {
      await onUpdateAssociate(updatedAssociate);
    }
    
    setInstallmentSuccess(true);
    setTimeout(() => {
      setIsInstallmentModalOpen(false);
      setInstallmentSuccess(false);
    }, 3000);
  };

  const handlePayMonthConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payMonthKey) return;

    if (!payMonthReceiptFile) {
      setPayMonthReceiptError('Por favor, envie o comprovante de pagamento.');
      return;
    }
    
    const monthsList = [
      { name: 'Janeiro', key: '01' },
      { name: 'Fevereiro', key: '02' },
      { name: 'Março', key: '03' },
      { name: 'Abril', key: '04' },
      { name: 'Maio', key: '05' },
      { name: 'Junho', key: '06' },
      { name: 'Julho', key: '07' },
    ];
    
    const monthObj = monthsList.find(m => m.key === payMonthKey);
    const monthName = monthObj ? monthObj.name : payMonthKey;

    const parsedAmount = parseMaskedMoney(payMonthAmount);
    const finalAmount = parsedAmount > 0 ? parsedAmount : (associate.monthlyFee ?? entityConfig?.monthlyFee ?? 0);

    const newReceipt = {
      monthKey: payMonthKey,
      monthName,
      amount: finalAmount,
      paymentMethod: payMonthMethod,
      receiptFile: payMonthReceiptFile,
      receiptFileName: payMonthReceiptFileName,
      dateSubmitted: new Date().toISOString(),
      status: 'Em Análise' as const,
      submittedAt: new Date().toISOString()
    };

    const currentPending = associate.pendingMonthlyReceipts || [];
    // Prevent duplicates
    const updatedPending = [
      ...currentPending.filter(r => r.monthKey !== payMonthKey),
      newReceipt
    ];

    if (onUpdateAssociate) {
      await onUpdateAssociate({
        ...associate,
        pendingMonthlyReceipts: updatedPending
      });
    }

    setPayMonthSuccess(true);
    setPayMonthKey(null);
    setPayMonthReceiptFile(null);
    setPayMonthReceiptFileName('');
    setPayMonthReceiptError('');
    setTimeout(() => {
      setPayMonthSuccess(false);
    }, 4000);
  };

  const handleUploadReceipt = async (installmentNumber: number, file: File) => {
    const allowedExtensions = ['.png', '.jpg', '.jpeg', '.pdf'];
    const allowedMimeTypes = ['image/png', 'image/jpeg', 'application/pdf'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    const isValidType = allowedMimeTypes.includes(file.type) || allowedExtensions.includes(fileExtension);

    if (!isValidType) {
      setInstallmentErrors(prev => ({
        ...prev,
        [installmentNumber]: 'O comprovante deve ser no formato PNG, JPEG ou PDF.'
      }));
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      setInstallmentErrors(prev => ({
        ...prev,
        [installmentNumber]: 'O arquivo deve ter no máximo 2MB'
      }));
      return;
    }

    setInstallmentErrors(prev => ({
      ...prev,
      [installmentNumber]: ''
    }));

    try {
      const compressedBase64 = await compressImage(file);
      if (!associate.installmentPlan || !associate.installmentPlan.installments) return;

      const updatedInstallments = associate.installmentPlan.installments.map(inst => {
        if (inst.number === installmentNumber) {
          return {
            ...inst,
            status: 'Em Análise' as const,
            receiptFile: compressedBase64,
            receiptFileName: file.name,
            submittedAt: new Date().toISOString()
          };
        }
        return inst;
      });

      const updatedAssociate: Associate = {
        ...associate,
        installmentPlan: {
          ...associate.installmentPlan,
          installments: updatedInstallments
        }
      };

      if (onUpdateAssociate) {
        await onUpdateAssociate(updatedAssociate);
      }
    } catch (err) {
      console.error("Erro ao processar imagem da parcela:", err);
      setInstallmentErrors(prev => ({
        ...prev,
        [installmentNumber]: 'Erro ao processar o arquivo.'
      }));
    }
  };

  const handleSaveContactInfo = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateContactInfo(associate.id, phone, address, email);
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const formatBRL = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-200 pb-12">
      {/* Top Header */}
      <header className="bg-[#111111] border-b border-white/5 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-white overflow-hidden shrink-0">
              {entityConfig?.logo ? (
                <img 
                  src={entityConfig.logo} 
                  alt="Logo" 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&q=80&w=200";
                  }}
                />
              ) : (
                <span className="text-sm font-bold text-indigo-500">
                  {entityConfig?.acronym ? entityConfig.acronym.slice(0, 2).toUpperCase() : 'UO'}
                </span>
              )}
            </div>
            <div>
              <h1 className="font-bold text-white text-sm sm:text-base leading-tight">
                {entityConfig?.name ? `${entityConfig.name} - Portal do Associado` : 'UniOn - Portal do Associado'}
              </h1>
              <p className="text-[9px] text-indigo-500 font-bold uppercase tracking-wider">
                {entityConfig?.acronym || 'Gestão Simplificada'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <span className="text-xs text-gray-500 block font-medium">Logado como:</span>
              <span className="text-xs font-bold text-gray-300 block">{associate.name}</span>
            </div>
            
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 py-1.5 px-3 bg-[#1a1a1a] hover:bg-white/5 border border-white/10 text-gray-400 hover:text-white text-xs font-semibold rounded-lg transition-all cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Welcome card with Status banner */}
        <div className="bg-[#111111] rounded-2xl border border-white/5 shadow-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-24 w-24 bg-blue-500/5 rounded-full blur-2xl"></div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 flex-1 w-full">
            {/* Foto de Perfil do Associado */}
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl border-2 border-indigo-500/20 bg-white/5 overflow-hidden shrink-0 shadow-lg shadow-black/30">
              {associate.photo ? (
                <img 
                  src={associate.photo} 
                  alt={associate.name} 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-indigo-500 bg-indigo-500/5 text-2xl">
                  {associate.name ? associate.name.charAt(0).toUpperCase() : '?'}
                </div>
              )}
            </div>

            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 font-extrabold px-2.5 py-0.5 rounded-full font-mono">
                  Matrícula: {associate.matricula || 'N/A'}
                </span>
                <span className="text-xs bg-[#1a1a1a] text-gray-400 border border-white/5 font-bold px-2.5 py-0.5 rounded-full">
                  Socio ID: {associate.id}
                </span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                  associate.status === 'Ativo' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                }`}>
                  {associate.status === 'Ativo' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                  Cadastro {associate.status}
                </span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                  associate.hasVotingRight !== false ? 'bg-blue-500/10 text-blue-400 border border-blue-500/10' : 'bg-gray-500/10 text-gray-400 border border-white/5'
                }`}>
                  {associate.hasVotingRight !== false ? '🗳️ Com Direito a Voto' : '❌ Sem Direito a Voto'}
                </span>
                {associate.associationRole && associate.associationRole !== 'Nenhum' && (
                  <span className="text-xs bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Award className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    Cargo: {associate.associationRole}
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight font-sans truncate">
                Olá, {associate.name}!
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 max-w-2xl leading-relaxed">
                Seja bem-vindo ao seu portal exclusivo. Aqui você confere seus dados, acompanha comunicados e monitora os pagamentos de mensalidade.
              </p>
            </div>
          </div>
        </div>

        {/* Dynamic Upcoming Event Notifications */}
        {(() => {
          const upcomingEvents = assemblies.filter(event => {
            const daysLeft = getDaysRemaining(event.date);
            return daysLeft > 0 && daysLeft <= 5;
          });

          if (upcomingEvents.length === 0) return null;

          return (
            <div className="space-y-3">
              {upcomingEvents.map(event => {
                const daysLeft = getDaysRemaining(event.date);
                const daysLeftText = daysLeft === 1 ? "Acontece amanhã!" : `Acontece em ${daysLeft} dias!`;
                const isAtividade = event.type === 'Atividade';

                return (
                  <motion.div 
                    key={event.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-gradient-to-r from-blue-600/10 to-indigo-600/5 border border-blue-500/15 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                    
                    <div className="flex items-start gap-3.5">
                      <div className="p-2.5 bg-blue-500/15 text-blue-400 rounded-xl border border-blue-500/10">
                        <Bell className="h-5 w-5 animate-pulse" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                            isAtividade ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          }`}>
                            {isAtividade ? 'Atividade' : 'Assembleia'}
                          </span>
                          <span className="text-[10px] text-amber-400 font-extrabold flex items-center gap-1 bg-amber-400/5 px-2 py-0.5 rounded-full border border-amber-400/10">
                            ⚠️ {daysLeftText}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-white text-sm sm:text-base leading-tight">
                          {event.title}
                        </h4>
                        <p className="text-xs text-gray-400 font-medium">
                          Agendado para o dia {dateToBRL(event.date)} às {event.time}h • Local: {event.location}
                        </p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => {
                        const tabBtn = document.querySelector('[data-tab="assemblies"]') as HTMLButtonElement;
                        if (tabBtn) tabBtn.click();
                        setTimeout(() => {
                          const element = document.getElementById(`assembly-item-${event.id}`);
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }
                        }, 100);
                      }}
                      className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-md text-center shrink-0"
                    >
                      Ver Detalhes do Evento
                    </button>
                  </motion.div>
                );
              })}
            </div>
          );
        })()}

        {/* Painel de Status e Regularidade (Bento Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Status Cadastral */}
          <div className="bg-[#111111] rounded-2xl border border-white/5 shadow-xl p-5 flex flex-col justify-between space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Cadastro Geral</p>
                <h3 className="text-sm font-bold text-white">Status do Associado</h3>
              </div>
              <span className={`p-2 rounded-xl ${
                associate.status !== 'Ativo' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                associate.financialStatus === 'Inadimplente' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              }`}>
                {associate.status !== 'Ativo' ? <XCircle className="h-5 w-5" /> :
                 associate.financialStatus === 'Inadimplente' ? <AlertTriangle className="h-5 w-5" /> :
                 <CheckCircle2 className="h-5 w-5" />}
              </span>
            </div>
            <div>
              <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full ${
                associate.status !== 'Ativo' ? 'bg-red-500/10 text-red-400' :
                associate.financialStatus === 'Inadimplente' ? 'bg-amber-500/10 text-amber-400' :
                'bg-emerald-500/10 text-emerald-400'
              }`}>
                {associate.status !== 'Ativo' ? 'Inativo' :
                 associate.financialStatus === 'Inadimplente' ? 'Acesso Suspenso' : 'Ativo / Regular'}
              </span>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                {associate.status !== 'Ativo' ? (
                  'Seu cadastro encontra-se desativado. Entre em contato com a secretaria administrativa.'
                ) : associate.financialStatus === 'Inadimplente' ? (
                  associate.hasVotingRight !== false ? (
                    <span className="text-amber-400 font-semibold block">
                      Atenção: Seu acesso físico à sede foi suspenso devido a pendências de mensalidades. Porém, seu direito de voto está ativo e liberado nas consultas e eleições.
                    </span>
                  ) : (
                    <span className="text-amber-400 font-semibold block">
                      Atenção: Seu acesso físico à sede e seus privilégios de voto democrático foram SUSPENSOS devido a pendências de mensalidades. Regularize na tesouraria.
                    </span>
                  )
                ) : (
                  'Você está em situação regular cadastral e possui livre acesso à sede, ao portal e a voto.'
                )}
              </p>
            </div>
          </div>

          {/* Card 2: Situação Documental */}
          <div className="bg-[#111111] rounded-2xl border border-white/5 shadow-xl p-5 flex flex-col justify-between space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Validação de Arquivos</p>
                <h3 className="text-sm font-bold text-white">Situação Documental</h3>
              </div>
              <span className={`p-2 rounded-xl ${
                (associate.documentStatus || 'OK') === 'OK' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}>
                {(associate.documentStatus || 'OK') === 'OK' ? <ShieldCheck className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
              </span>
            </div>
            <div>
              <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full ${
                (associate.documentStatus || 'OK') === 'OK' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
              }`}>
                {associate.documentStatus || 'OK'}
              </span>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                {(associate.documentStatus || 'OK') === 'OK'
                  ? 'Toda a sua documentação estatutária (RG, CPF, Comprovante de Residência e Filiation) está validada.'
                  : 'Atenção: Constam pendências em seus documentos. Apresente os comprovantes devidos na administração.'}
              </p>
            </div>
          </div>

          {/* Card 3: Situação Financeira & Parcelamento */}
          <div className="bg-[#111111] rounded-2xl border border-white/5 shadow-xl p-5 flex flex-col justify-between space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Tesouraria & Caixa</p>
                <h3 className="text-sm font-bold text-white">Situação Financeira</h3>
              </div>
              <span className={`p-2 rounded-xl border ${
                associate.financialStatus === 'Inadimplente' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                associate.financialStatus === 'Zona de Perigo' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                associate.financialStatus === 'Em Atenção' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              }`}>
                {associate.financialStatus === 'Inadimplente' || associate.financialStatus === 'Zona de Perigo' ? (
                  <AlertTriangle className="h-5 w-5" />
                ) : associate.financialStatus === 'Em Atenção' ? (
                  <Clock className="h-5 w-5" />
                ) : (
                  <DollarSign className="h-5 w-5" />
                )}
              </span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  associate.financialStatus === 'Inadimplente' ? 'bg-red-500/10 text-red-400' :
                  associate.financialStatus === 'Zona de Perigo' ? 'bg-orange-500/10 text-orange-400' :
                  associate.financialStatus === 'Em Atenção' ? 'bg-yellow-500/10 text-yellow-400' :
                  'bg-emerald-500/10 text-emerald-400'
                }`}>
                  {associate.financialStatus === 'Inadimplente' ? '🔴 ' :
                   associate.financialStatus === 'Zona de Perigo' ? '🟠 ' :
                   associate.financialStatus === 'Em Atenção' ? '🟡 ' : '🟢 '}
                  {associate.financialStatus}
                </span>
                {associate.installmentPlan && (
                  <span className="inline-flex items-center text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/15">
                    Acordo Ativo
                  </span>
                )}
              </div>
              
              <div className="mt-2.5">
                {associate.financialStatus === 'Inadimplente' ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center bg-red-500/5 border border-red-500/10 p-2.5 rounded-xl">
                      <span className="text-[11px] text-gray-400 font-medium">Débito Acumulado:</span>
                      <span className="text-xs font-extrabold text-red-400 font-mono">
                        {formatBRL(associate.debtAmount || 0)}
                      </span>
                    </div>
                    <button
                      onClick={() => setIsInstallmentModalOpen(true)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-900/15 cursor-pointer"
                    >
                      <Calculator className="h-3.5 w-3.5" />
                      Opções de Parcelamento / Acordo
                    </button>
                  </div>
                ) : (
                  <div>
                    {associate.installmentPlan ? (
                      <div className="p-2.5 bg-indigo-500/5 border border-indigo-500/10 rounded-xl space-y-1.5 text-xs text-gray-300">
                        <p className="font-semibold text-white text-[11px]">Acordo de Parcelamento:</p>
                        <p className="flex justify-between text-[11px] text-gray-400">
                          <span>Total do Débito:</span>
                          <span className="font-bold text-white font-mono">{formatBRL(associate.installmentPlan.totalAmount)}</span>
                        </p>
                        <p className="flex justify-between text-[11px] text-gray-400">
                          <span>Plano Firmado:</span>
                          <span className="font-bold text-indigo-400 font-mono">
                            {associate.installmentPlan.installmentsCount}x de {formatBRL(associate.installmentPlan.installmentValue)}
                          </span>
                        </p>
                        <p className="flex justify-between text-[11px] text-gray-400">
                          <span>Forma de Pagamento:</span>
                          <span className="font-bold text-white">{associate.installmentPlan.paymentMethod}</span>
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs text-gray-300 leading-relaxed">
                          Parabéns! Suas obrigações financeiras com a associação estão totalmente em dia e quitadas.
                        </p>
                        {(() => {
                          const contrib = calculateAssociateContribution(associate, entityConfig?.monthlyFee || 10);
                          return (
                            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-1">
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-300 font-medium">Total Contribuído Acumulado:</span>
                                <span className="text-emerald-400 font-extrabold font-mono text-sm">
                                  {formatBRL(contrib.totalContributed)}
                                </span>
                              </div>
                              <p className="text-[10px] text-gray-400">
                                Calculado a R$ {contrib.monthlyFee.toFixed(2)}/mês desde a sua filiação ({dateToBRL(associate.joiningDate)}) • {contrib.monthsElapsed} mes{contrib.monthsElapsed === 1 ? '' : 'es'}.
                              </p>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Seção de Verificação Mensal de Mensalidades (Ano Corrente) */}
        <div className="bg-[#111111] rounded-2xl border border-white/5 shadow-xl p-5 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
            <div className="space-y-0.5">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Calendar className="h-4.5 w-4.5 text-blue-500" />
                Verificação Mensal de Mensalidades (Exercício 2026)
              </h3>
              <p className="text-[11px] text-gray-400">
                Auditoria mensal automatizada do pagamento de contribuições estatutárias obrigatórias.
              </p>
            </div>
            {associate.monthlyFee > 0 && (
              <div className="bg-[#1a1a1a] px-3 py-1 border border-white/10 rounded-xl text-xs flex items-center gap-2">
                <span className="text-gray-500 font-bold uppercase text-[9px]">Valor da Contribuição:</span>
                <span className="font-extrabold text-blue-400 font-mono">{formatBRL(associate.monthlyFee)}</span>
              </div>
            )}
          </div>

          {payMonthSuccess && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs rounded-xl font-semibold"
            >
              Comprovante de pagamento enviado com sucesso! O comprovante passará por validação administrativa.
            </motion.div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {(() => {
              const monthsList = [
                { name: 'Janeiro', key: '01', abbr: 'Jan' },
                { name: 'Fevereiro', key: '02', abbr: 'Fev' },
                { name: 'Março', key: '03', abbr: 'Mar' },
                { name: 'Abril', key: '04', abbr: 'Abr' },
                { name: 'Maio', key: '05', abbr: 'Mai' },
                { name: 'Junho', key: '06', abbr: 'Jun' },
                { name: 'Julho', key: '07', abbr: 'Jul' },
                { name: 'Agosto', key: '08', abbr: 'Ago' },
                { name: 'Setembro', key: '09', abbr: 'Set' },
                { name: 'Outubro', key: '10', abbr: 'Out' },
                { name: 'Novembro', key: '11', abbr: 'Nov' },
                { name: 'Dezembro', key: '12', abbr: 'Dez' },
              ];

              return monthsList.map(month => {
                const trans = transactions.find(t => 
                  t.associateId === associate.id &&
                  t.category === 'Mensalidade' &&
                  t.type === 'Entrada' &&
                  t.date.startsWith(`2026-${month.key}`)
                );

                const pendingReceipt = associate.pendingMonthlyReceipts?.find(r => r.monthKey === month.key);

                const manualStatus = associate.monthlyPayments2026?.[month.key];
                const isExempt = (associate.monthlyFee === 0 || associate.memberType === 'Cliente') && !manualStatus;

                let isPaid = !!trans || (pendingReceipt && pendingReceipt.status === 'Aprovado');
                let isPending = pendingReceipt && (!pendingReceipt.status || pendingReceipt.status === 'Em Análise');
                let isRejected = pendingReceipt && pendingReceipt.status === 'Reprovado';

                if (manualStatus === 'Pago') {
                  isPaid = true;
                  isPending = false;
                  isRejected = false;
                } else if (manualStatus === 'Não Pago') {
                  isPaid = false;
                  isPending = false;
                  isRejected = false;
                }

                let cardClass = "bg-[#141414] border-white/5 hover:border-white/10";
                let statusLabel = "Não Pago";
                let badgeClass = "bg-red-500/10 text-red-400 border-red-500/20";
                
                if (isExempt) {
                  cardClass = "bg-[#141414] border-white/5 opacity-70";
                  statusLabel = "Isento";
                  badgeClass = "bg-gray-500/10 text-gray-400 border-gray-500/15";
                } else if (isPaid) {
                  cardClass = "bg-gradient-to-b from-emerald-500/[0.04] to-transparent border-emerald-500/30 hover:border-emerald-500/50";
                  statusLabel = manualStatus === 'Pago' ? "Pago (Livro)" : "Pago";
                  badgeClass = "bg-emerald-500/15 text-emerald-400 border-emerald-500/25";
                } else if (isPending) {
                  cardClass = "bg-gradient-to-b from-amber-500/[0.03] to-transparent border-amber-500/20 hover:border-amber-500/30";
                  statusLabel = "Em Análise";
                  badgeClass = "bg-amber-500/10 text-amber-400 border-amber-500/20";
                } else if (isRejected) {
                  cardClass = "bg-gradient-to-b from-red-500/[0.04] to-transparent border-red-500/30 hover:border-red-500/40";
                  statusLabel = "Recusado";
                  badgeClass = "bg-red-500/15 text-red-400 border-red-500/25";
                } else {
                  cardClass = "bg-gradient-to-b from-red-500/[0.04] to-transparent border-red-500/30 hover:border-red-500/40";
                  statusLabel = manualStatus === 'Não Pago' ? "Não Pago (Livro)" : "Não Pago";
                  badgeClass = "bg-red-500/15 text-red-400 border-red-500/25";
                }

                return (
                  <div 
                    key={month.key} 
                    className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${cardClass}`}
                  >
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">{month.name}</span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isPaid ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        ) : isExempt ? (
                          <Check className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                        ) : isPending ? (
                          <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0 animate-pulse" />
                        ) : isRejected ? (
                          <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                        ) : (
                          <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                        )}
                        <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${badgeClass}`}>
                          {statusLabel}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      {isPaid ? (
                        <div className="text-[9px] text-gray-400 font-medium space-y-0.5">
                          <p className="truncate">Via: {pendingReceipt?.paymentMethod || trans?.paymentMethod || 'Sistema'}</p>
                          <p>{pendingReceipt?.reviewedAt ? formatDateTimeBRL(pendingReceipt.reviewedAt) : (trans ? dateToBRL(trans.date) : '')}</p>
                        </div>
                      ) : isExempt ? (
                        <p className="text-[9px] text-gray-500 font-semibold italic">Isento de Taxa</p>
                      ) : isPending ? (
                        <div className="space-y-0.5">
                          <p className="text-[9px] text-amber-400 font-semibold italic flex items-center gap-1 bg-amber-500/5 px-2 py-1 rounded border border-amber-500/10">
                            <Clock className="h-3 w-3 text-amber-500 animate-pulse" />
                            Em Validação
                          </p>
                          {pendingReceipt && (
                            <p className="text-[9px] text-gray-500 font-medium">
                              Enviado: {formatDateTimeBRL(pendingReceipt.submittedAt || pendingReceipt.dateSubmitted)}
                            </p>
                          )}
                        </div>
                      ) : isRejected ? (
                        <div className="space-y-1.5">
                          <p className="text-[9px] text-red-400 font-semibold italic flex items-center gap-1 bg-red-500/5 px-2 py-1 rounded border border-red-500/10">
                            <XCircle className="h-3 w-3 text-red-400" />
                            Recusado
                          </p>
                          {pendingReceipt?.reviewedAt && (
                            <p className="text-[9px] text-gray-500 font-medium">
                              Recusado: {formatDateTimeBRL(pendingReceipt.reviewedAt)}
                            </p>
                          )}
                          <button
                            onClick={() => {
                              setPayMonthKey(month.key);
                              setPayMonthAmount(maskMoney((associate.monthlyFee ?? entityConfig?.monthlyFee ?? 0).toFixed(2)));
                              setPayMonthMethod('Pix');
                            }}
                            className="w-full py-1.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 text-[10px] font-extrabold rounded-lg transition-all cursor-pointer text-center block"
                          >
                            Reenviar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setPayMonthKey(month.key);
                            setPayMonthAmount(maskMoney((associate.monthlyFee ?? entityConfig?.monthlyFee ?? 0).toFixed(2)));
                            setPayMonthMethod('Pix');
                          }}
                          className="w-full py-1.5 bg-[#1a1a1a] hover:bg-blue-600 text-gray-300 hover:text-white border border-white/5 hover:border-blue-500 text-[10px] font-extrabold rounded-lg transition-all cursor-pointer text-center block"
                        >
                          Pagar {month.abbr}
                        </button>
                      )}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* Seção de Acompanhamento do Acordo de Parcelamento */}
        {associate.installmentPlan && (
          <div className="bg-[#111111] rounded-2xl border border-white/5 shadow-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
              <div className="space-y-0.5">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <ClipboardList className="h-4.5 w-4.5 text-blue-500" />
                  Acompanhamento do Acordo de Parcelamento
                </h3>
                <p className="text-[11px] text-gray-400">
                  Acompanhe os vencimentos, anexe os comprovantes e verifique o status de validação.
                </p>
              </div>
              <div>
                <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${
                  associate.installmentPlan.status === 'Em Análise' ? 'bg-amber-500/10 text-amber-400 border-amber-500/25' :
                  associate.installmentPlan.status === 'Aprovado' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' :
                  associate.installmentPlan.status === 'Reprovado' ? 'bg-red-500/15 text-red-400 border-red-500/25' :
                  'bg-blue-500/10 text-blue-400 border-blue-500/25'
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${
                    associate.installmentPlan.status === 'Em Análise' ? 'bg-amber-400 animate-pulse' :
                    associate.installmentPlan.status === 'Aprovado' ? 'bg-emerald-400' :
                    associate.installmentPlan.status === 'Reprovado' ? 'bg-red-400' :
                    'bg-blue-400'
                  }`} />
                  Plano: {associate.installmentPlan.status}
                </span>
              </div>
            </div>

            {/* Informações explicativas baseadas no status */}
            <div className="p-3 bg-white/5 rounded-xl text-xs text-gray-300 leading-relaxed">
              {associate.installmentPlan.status === 'Em Análise' && (
                <p>
                  ⚠️ <strong>Seu pedido de parcelamento está em análise pela diretoria.</strong> As datas e valores estão simuladas abaixo. Você poderá enviar os comprovantes assim que o plano for aprovado pelo administrador do sistema.
                </p>
              )}
              {associate.installmentPlan.status === 'Aprovado' && (
                <p>
                  ✅ <strong>Acordo Ativo e Regularizado!</strong> Seu plano de parcelamento está ativo. Para pagar cada parcela, utilize a forma acordada (<strong>{associate.installmentPlan.paymentMethod}</strong>) e envie o comprovante clicando no botão correspondente à parcela desejada. O status mudará para <span className="text-amber-400 font-bold">"Em Análise"</span> até a conferência pelo administrador.
                </p>
              )}
              {associate.installmentPlan.status === 'Reprovado' && (
                <p>
                  ❌ <strong>Acordo Recusado.</strong> O plano solicitado foi recusado pela tesouraria/secretaria. Por favor, entre em contato com o suporte administrativo para renegociar os débitos pendentes.
                </p>
              )}
              {associate.installmentPlan.status === 'Pago' && (
                <p>
                  🎉 <strong>Acordo de Parcelamento Quitado!</strong> Parabéns! Todas as parcelas foram pagas e devidamente conferidas e liquidadas em nosso caixa. Sua conta está 100% em dia.
                </p>
              )}
            </div>

            {/* Lista das parcelas */}
            <div className="border border-white/5 rounded-xl bg-[#141414] divide-y divide-white/5 overflow-hidden">
              {!associate.installmentPlan.installments || associate.installmentPlan.installments.length === 0 ? (
                <div className="p-4 text-center text-xs text-gray-500">
                  Nenhuma parcela individual gerada para este plano.
                </div>
              ) : (
                associate.installmentPlan.installments.map((inst) => (
                  <div key={inst.number} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                      <div className="space-y-0.5">
                        <span className="font-bold text-white block">Parcela {inst.number}/{associate.installmentPlan?.installmentsCount}</span>
                        <span className="text-[11px] text-gray-500 font-semibold flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-gray-600" />
                          Vencimento: {inst.dueDate ? dateToBRL(inst.dueDate) : 'Não definida'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block">Valor</span>
                        <span className="text-sm font-extrabold text-blue-400 font-mono">{formatBRL(inst.value)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block">Status</span>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          inst.status === 'Pago' ? 'bg-emerald-500/10 text-emerald-400' :
                          inst.status === 'Em Análise' ? 'bg-amber-500/10 text-amber-400' :
                          inst.status === 'Recusado' ? 'bg-red-500/15 text-red-400' :
                          'bg-white/5 text-gray-400'
                        }`}>
                          {inst.status === 'Pago' ? 'Pago e Confirmado' :
                           inst.status === 'Em Análise' ? 'Comprovante em Análise' :
                           inst.status === 'Recusado' ? 'Comprovante Recusado / Reenviar' :
                           'Aguardando Pagamento'}
                        </span>
                      </div>
                    </div>

                    {/* Ação de Upload de comprovantes */}
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-2">
                        {associate.installmentPlan?.status === 'Aprovado' && (inst.status === 'Pendente' || inst.status === 'Recusado') && (
                          <div className="relative overflow-hidden">
                            <label className="flex items-center gap-1.5 py-1.5 px-3 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/20 hover:border-blue-500/30 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-sm">
                              <Download className="h-3.5 w-3.5 rotate-180" />
                              Enviar Comprovante
                              <input 
                                type="file" 
                                accept="image/*,application/pdf"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleUploadReceipt(inst.number, file);
                                  }
                                }}
                                className="hidden" 
                              />
                            </label>
                          </div>
                        )}

                        {inst.status === 'Em Análise' && (
                          <div className="flex flex-col items-end">
                            <span className="text-[11px] text-gray-400 italic flex items-center gap-1.5 bg-[#1a1a1a] px-2.5 py-1.5 rounded-xl border border-white/5">
                              <CheckCircle2 className="h-4 w-4 text-amber-500 animate-pulse" />
                              Comprovante enviado: {inst.receiptFileName || 'comprovante.png'}
                            </span>
                            {inst.submittedAt && (
                              <span className="text-[9px] text-gray-500 mt-1">
                                Enviado em: {formatDateTimeBRL(inst.submittedAt)}
                              </span>
                            )}
                          </div>
                        )}

                        {inst.status === 'Pago' && (
                          <div className="flex flex-col items-end">
                            <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1.5 bg-emerald-500/5 px-2.5 py-1.5 rounded-xl border border-emerald-500/10">
                              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                              Confirmado em {inst.paymentDate ? dateToBRL(inst.paymentDate) : 'Recebido'}
                            </span>
                            {inst.reviewedAt && (
                              <span className="text-[9px] text-emerald-500/60 mt-1">
                                Aprovado em: {formatDateTimeBRL(inst.reviewedAt)}
                              </span>
                            )}
                          </div>
                        )}

                        {inst.status === 'Recusado' && (
                          <div className="flex flex-col items-end">
                            {inst.reviewedAt && (
                              <span className="text-[10px] text-red-400 font-semibold mb-1 bg-red-500/5 px-2.5 py-1 rounded-xl border border-red-500/10">
                                Reprovado em: {formatDateTimeBRL(inst.reviewedAt)}
                              </span>
                            )}
                            {inst.feedback && (
                              <span className="text-[10px] text-red-300 font-medium italic mt-0.5">
                                Motivo: "{inst.feedback}"
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      {installmentErrors[inst.number] && (
                        <p className="text-[10px] text-red-400 font-semibold mt-1">
                          {installmentErrors[inst.number]}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Seção de Assembleias e Votações do Associado */}
        <div className="bg-[#111111] rounded-2xl border border-white/5 shadow-xl p-6 space-y-6">
          <div className="border-b border-white/5 pb-4">
            <h3 className="font-extrabold text-white text-base flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              Assembleias & Votações Democráticas
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Participe das reuniões, acompanhe as pautas oficiais e exerça o seu direito ao voto nas decisões da associação.
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            
            {/* Bloco de Assembleias */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-2">
                <ClipboardList className="h-4 w-4 text-blue-400" />
                Assembleias Agendadas
              </h4>

              {assemblies.length === 0 ? (
                <div className="p-8 text-center bg-[#161616] border border-white/5 rounded-xl text-gray-500 text-xs">
                  Não há assembleias registradas ou agendadas no momento.
                </div>
              ) : (
                <div className="space-y-3.5 max-h-[480px] overflow-y-auto pr-1">
                  {assemblies.map((assembly) => (
                    <div 
                      key={assembly.id} 
                      className="p-4 bg-[#161616] border border-white/5 rounded-xl space-y-3 hover:border-white/10 transition-all"
                    >
                      <div className="space-y-1">
                        <h5 className="font-bold text-white text-xs sm:text-sm leading-snug">{assembly.title}</h5>
                        <span className="text-[10px] text-gray-500 block">
                          Publicado em: {new Date(assembly.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>

                      {/* Info badges */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2.5 bg-white/5 rounded-lg text-xs font-semibold text-gray-300">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-blue-400" />
                          <span>{dateToBRL(assembly.date)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4 text-blue-400" />
                          <span>{assembly.time}h</span>
                        </div>
                        <div className="flex items-center gap-1.5 col-span-1 sm:col-span-3 border-t border-white/5 pt-1.5 mt-1">
                          <MapPin className="h-4 w-4 text-blue-400 shrink-0" />
                          <span className="truncate">{assembly.location}</span>
                        </div>
                      </div>

                      {/* Agendas */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Pauta da Reunião</span>
                        <p className="text-xs text-gray-400 bg-[#121212] p-2.5 rounded-lg border border-white/5 leading-relaxed whitespace-pre-wrap">
                          {assembly.agenda}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bloco de Votações */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-2">
                <BarChart3 className="h-4 w-4 text-blue-400" />
                Votações e Decisões
              </h4>

              {polls.length === 0 ? (
                <div className="p-8 text-center bg-[#161616] border border-white/5 rounded-xl text-gray-500 text-xs">
                  Nenhuma votação cadastrada no momento.
                </div>
              ) : (
                <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
                  {polls.map((poll) => {
                    const hasVoted = poll.voters && Array.isArray(poll.voters) ? poll.voters.includes(associate.id) : false;
                    const isAdimplente = associate.financialStatus !== 'Inadimplente';
                    const totalVotes = poll.options.reduce((sum, opt) => sum + (Number(opt.votes) || 0), 0);
                    const winnerOption = poll.options.find(opt => opt.id === poll.winnerOptionId);

                    const now = new Date();
                    const startDateTime = poll.startDate ? getPollDate(poll.startDate, poll.startTime) : getPollDate(poll.date, "00:00");
                    const endDateTime = poll.endDate ? getPollDate(poll.endDate, poll.endTime) : getPollDate(poll.date, poll.time || "23:59");

                    const isNotStartedYet = startDateTime ? (now < startDateTime) : false;
                    const isExpiredByTime = endDateTime ? (now > endDateTime) : false;
                    const isPollClosed = poll.status === 'Encerrado' || isExpiredByTime;
                    const isPollOpenForVoting = poll.status === 'Ativo' && !isNotStartedYet && !isExpiredByTime;
                    const canAssociateVote = associate.status === 'Ativo' && associate.hasVotingRight !== false;

                    return (
                      <div 
                        key={poll.id} 
                        className={`p-4 rounded-xl border ${
                          isPollClosed 
                            ? 'bg-[#161616] border-emerald-500/10' 
                            : isNotStartedYet
                            ? 'bg-[#161616] border-blue-500/10'
                            : 'bg-[#161616] border-white/5'
                        } space-y-3.5`}
                      >
                        {/* Title and status */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2.5">
                          <div className="space-y-0.5">
                            <h5 className="font-bold text-white text-xs sm:text-sm leading-snug">{poll.title}</h5>
                            <div className="text-[10px] text-gray-400 flex flex-wrap gap-2 pt-0.5">
                              <span><strong>Início:</strong> {dateToBRL(poll.startDate || poll.date)} às {poll.startTime || '00:00'}h</span>
                              <span>•</span>
                              <span><strong>Término:</strong> {dateToBRL(poll.endDate || poll.date)} às {poll.endTime || poll.time || '23:59'}h</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isPollClosed ? (
                              <span className="px-2 py-0.5 rounded-full font-bold text-[9px] uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                {isExpiredByTime && poll.status === 'Ativo' ? 'Prazo Expirado' : 'Encerrada'}
                              </span>
                            ) : isNotStartedYet ? (
                              <span className="px-2 py-0.5 rounded-full font-bold text-[9px] uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                Em Breve
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full font-bold text-[9px] uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                Ativa
                              </span>
                            )}
                            {hasVoted && (
                              <span className="px-2 py-0.5 rounded-full font-bold text-[9px] uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                Votou
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Description/Agenda */}
                        <p className="text-xs text-gray-400 leading-relaxed italic bg-white/5 p-2.5 rounded-lg border border-white/5">
                          {poll.agenda}
                        </p>

                        {/* 1. Poll Not Started Yet */}
                        {isNotStartedYet && !isPollClosed && (
                          <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl flex items-start gap-3">
                            <Clock className="h-4.5 w-4.5 text-blue-400 shrink-0 mt-0.5" />
                            <div className="text-xs">
                              <span className="font-extrabold text-blue-400 block uppercase text-[10px]">Votação Não Iniciada</span>
                              <span className="text-gray-400 leading-normal block mt-1">
                                Esta votação abrirá para os associados a partir de <strong className="text-white">{dateToBRL(poll.startDate || poll.date)} às {poll.startTime || '00:00'}h</strong>. A votação ainda não foi iniciada.
                              </span>
                            </div>
                          </div>
                        )}

                        {/* 2. Interactive Voting State (Poll Open & Not Voted) */}
                        {isPollOpenForVoting && !hasVoted && (
                          <div className="space-y-3">
                            {canAssociateVote ? (
                              <div className="space-y-2.5">
                                <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Selecione uma opção para votar:</span>
                                <div className="space-y-1.5">
                                  {poll.options.map(option => {
                                    const isSelected = selectedOptionForPoll[poll.id] === option.id;
                                    return (
                                      <button
                                        key={option.id}
                                        type="button"
                                        onClick={() => setSelectedOptionForPoll({
                                          ...selectedOptionForPoll,
                                          [poll.id]: option.id
                                        })}
                                        className={`w-full text-left p-3 rounded-xl border text-xs font-semibold transition-all flex items-center justify-between gap-4 ${
                                          isSelected
                                            ? 'bg-blue-600/15 border-blue-500 text-white'
                                            : 'bg-[#121212] border-white/5 text-gray-300 hover:border-white/10'
                                        }`}
                                      >
                                        <div className="flex items-center gap-3 min-w-0">
                                          {poll.hasImages && (
                                            <img
                                              src={option.imageUrl || "https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=100&h=100&fit=crop"}
                                              alt={option.text}
                                              className="h-10 w-10 rounded-lg object-cover border border-white/10 shrink-0"
                                              referrerPolicy="no-referrer"
                                              onError={(e) => {
                                                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=100&h=100&fit=crop";
                                              }}
                                            />
                                          )}
                                          <span className="truncate">{option.text}</span>
                                        </div>
                                        <span className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                                          isSelected ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-600'
                                        }`}>
                                          {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-white inline-block"></span>}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleVoteCast(poll)}
                                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer text-center"
                                >
                                  Confirmar Meu Voto
                                </button>
                              </div>
                            ) : (
                              <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl flex items-start gap-3">
                                <Lock className="h-4.5 w-4.5 text-red-400 shrink-0 mt-0.5" />
                                <div className="text-xs">
                                  <span className="font-extrabold text-red-400 block uppercase text-[10px]">Sem Direito a Voto</span>
                                  <span className="text-gray-400 leading-normal block mt-1">
                                    {associate.status !== 'Ativo' 
                                      ? 'Seu cadastro encontra-se inativo no momento. Entre em contato com a administração.' 
                                      : 'Sua conta de associado está cadastrada sem direito a voto em consultas e eleições da associação. Regularize sua situação ou contate a diretoria.'}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Already Voted - Show confirmation and live results */}
                        {isPollOpenForVoting && hasVoted && (
                          <div className="space-y-3 pt-1">
                            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3">
                              <div className="h-8 w-8 bg-emerald-500/20 text-emerald-400 rounded-lg flex items-center justify-center shrink-0 border border-emerald-500/30">
                                <Check className="h-5 w-5" />
                              </div>
                              <div className="text-xs">
                                <span className="font-extrabold text-emerald-400 uppercase tracking-wide block text-[10px]">Voto Computado com Sucesso</span>
                                <p className="text-gray-300 leading-normal mt-0.5">
                                  Seu voto foi registrado no sistema e sincronizado com a administração. Veja a apuração em tempo real:
                                </p>
                              </div>
                            </div>

                            {/* Options with live vote counts & progress bars */}
                            <div className="space-y-2 bg-[#121212] p-3 rounded-xl border border-white/5">
                              <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase pb-1 border-b border-white/5">
                                <span>Opções</span>
                                <span>{totalVotes} {totalVotes === 1 ? 'voto registrado' : 'votos registrados'}</span>
                              </div>

                              {poll.options.map((option) => {
                                const optVotes = Number(option.votes) || 0;
                                const percent = totalVotes > 0 ? Math.round((optVotes / totalVotes) * 100) : 0;
                                const isUserChoice = poll.voterChoices?.[associate.id] === option.id || selectedOptionForPoll[poll.id] === option.id;

                                return (
                                  <div key={option.id} className="space-y-1">
                                    <div className="flex justify-between items-center text-xs">
                                      <span className={`font-semibold flex items-center gap-2 ${isUserChoice ? 'text-blue-400 font-bold' : 'text-gray-300'}`}>
                                        {poll.hasImages && (
                                          <img
                                            src={option.imageUrl || "https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=100&h=100&fit=crop"}
                                            alt={option.text}
                                            className="h-6 w-6 rounded-md object-cover border border-white/10 shrink-0"
                                            referrerPolicy="no-referrer"
                                            onError={(e) => {
                                              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=100&h=100&fit=crop";
                                            }}
                                          />
                                        )}
                                        <span className="truncate">{option.text}</span>
                                        {isUserChoice && (
                                          <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[9px] font-extrabold uppercase">
                                            Seu Voto ✓
                                          </span>
                                        )}
                                      </span>
                                      <span className="font-mono text-gray-400 font-bold text-[11px]">
                                        {optVotes} {optVotes === 1 ? 'voto' : 'votos'} ({percent}%)
                                      </span>
                                    </div>
                                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                      <div
                                        className={`h-full rounded-full transition-all duration-500 ${
                                          isUserChoice
                                            ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                                            : 'bg-gradient-to-r from-gray-600 to-gray-500'
                                        }`}
                                        style={{ width: `${percent}%` }}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Closed Poll Results */}
                        {isPollClosed && (
                          <div className="space-y-4">
                            {/* Homologation Header */}
                            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-3">
                              <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5 animate-pulse" />
                              <div className="text-xs">
                                <span className="font-extrabold text-emerald-400 uppercase tracking-wide block text-[10px]">Resultado Oficial Homologado</span>
                                <p className="text-gray-400 leading-normal mt-0.5">
                                  O escrutínio e a auditoria de votos desta consulta democrática foram concluídos com sucesso.
                                </p>
                              </div>
                            </div>

                            {/* Winner badge */}
                            {winnerOption && (
                              <div className="p-4 bg-gradient-to-br from-emerald-500/10 to-emerald-500/[0.02] border border-emerald-500/20 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-5">
                                  <Award className="h-24 w-24 text-emerald-400" />
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="p-2.5 bg-emerald-500/15 text-emerald-400 rounded-xl border border-emerald-500/10 shrink-0">
                                    <Award className="h-5 w-5" />
                                  </div>
                                  {poll.hasImages && (
                                    <img
                                      src={winnerOption.imageUrl || "https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=100&h=100&fit=crop"}
                                      alt={winnerOption.text}
                                      className="h-10 w-10 rounded-lg object-cover border border-emerald-500/20 shrink-0"
                                      referrerPolicy="no-referrer"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=100&h=100&fit=crop";
                                      }}
                                    />
                                  )}
                                  <div className="text-xs">
                                    <span className="text-[9px] text-emerald-400 font-extrabold block uppercase tracking-wider">Opção Eleita / Vencedora</span>
                                    <span className="font-extrabold text-white text-sm sm:text-base">{winnerOption.text}</span>
                                  </div>
                                </div>
                                <div className="bg-[#121212] border border-white/5 px-3 py-1.5 rounded-lg shrink-0 text-right">
                                  <span className="text-[9px] text-gray-500 font-bold block uppercase">Votos Obtidos</span>
                                  <span className="text-xs font-extrabold text-emerald-400 font-mono">
                                    {Number(winnerOption.votes) || 0} votos ({totalVotes > 0 ? Math.round(((Number(winnerOption.votes) || 0) / totalVotes) * 100) : 0}%)
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Options Breakdown */}
                            <div className="space-y-3 bg-[#111111] p-4 rounded-xl border border-white/5">
                              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Classificação de Votação Completa:</span>
                                <span className="text-[10px] text-gray-500 font-extrabold uppercase">{totalVotes} Votos Totais</span>
                              </div>
                              <div className="space-y-3">
                                {(() => {
                                  // Sort options by votes to show rank
                                  const sortedOptions = [...poll.options].sort((a, b) => (Number(b.votes) || 0) - (Number(a.votes) || 0));
                                  
                                  return sortedOptions.map((option, index) => {
                                    const optVotes = Number(option.votes) || 0;
                                    const percent = totalVotes > 0 ? Math.round((optVotes / totalVotes) * 100) : 0;
                                    const isWinner = option.id === poll.winnerOptionId;
                                    
                                    // Determine rank badge
                                    let rankLabel = `${index + 1}º Lugar`;
                                    let rankBadgeClass = "bg-white/5 text-gray-400 border-white/5";
                                    
                                    if (index === 0) {
                                      rankLabel = "Vencedor";
                                      rankBadgeClass = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                                    } else if (index === 1) {
                                      rankBadgeClass = "bg-blue-500/10 text-blue-400 border-blue-500/20";
                                    }
                                    
                                    return (
                                      <div key={option.id} className="space-y-1.5">
                                        <div className="flex justify-between items-center text-xs font-semibold">
                                          <div className="flex items-center gap-2 min-w-0">
                                            <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded border shrink-0 ${rankBadgeClass}`}>
                                              {rankLabel}
                                            </span>
                                            {poll.hasImages && (
                                              <img
                                                src={option.imageUrl || "https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=100&h=100&fit=crop"}
                                                alt={option.text}
                                                className="h-6 w-6 rounded-md object-cover border border-white/10 shrink-0"
                                                referrerPolicy="no-referrer"
                                                onError={(e) => {
                                                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=100&h=100&fit=crop";
                                                }}
                                              />
                                            )}
                                            <span className={`truncate ${isWinner ? 'text-emerald-400 font-extrabold' : 'text-gray-300'}`}>
                                              {option.text}
                                            </span>
                                          </div>
                                          <span className="text-gray-400 font-mono text-[11px] shrink-0">{option.votes} votos ({percent}%)</span>
                                        </div>
                                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                          <div 
                                            className={`h-full rounded-full transition-all duration-1000 ${isWinner ? 'bg-emerald-500' : 'bg-blue-600'}`}
                                            style={{ width: `${percent}%` }}
                                          />
                                        </div>
                                      </div>
                                    );
                                  });
                                })()}
                              </div>
                            </div>

                            {/* Audit & Secrecy note */}
                            <div className="grid grid-cols-2 gap-3 p-3 bg-[#141414] border border-white/5 rounded-xl text-[10px]">
                              <div className="space-y-0.5">
                                <span className="text-gray-500 font-bold block uppercase">Formato do Escrutínio</span>
                                <span className="font-extrabold text-gray-300">Voto Direto, Secreto e Auditado</span>
                              </div>
                              <div className="space-y-0.5 text-right">
                                <span className="text-gray-500 font-bold block uppercase">Encerramento Oficial</span>
                                <span className="font-extrabold text-gray-300">{dateToBRL(poll.date)} às {poll.time}h</span>
                              </div>
                              <div className="col-span-2 border-t border-white/5 pt-2 mt-1 text-center text-gray-500 font-medium leading-normal">
                                🔒 Em conformidade com o Estatuto Social, os votos individuais são estritamente secretos e anônimos.
                              </div>
                            </div>
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Seção de Validação de Autenticidade de Atestados e Documentos */}
        <div className="bg-[#111111] rounded-2xl border border-white/5 shadow-xl p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="font-extrabold text-white text-base">
                  Verificação de Autenticidade de Atestados & Documentos
                </h3>
              </div>
              <p className="text-xs text-gray-400 max-w-2xl leading-relaxed">
                Consulte e valide a autenticidade de atestados, declarações e recibos emitidos eletronicamente pela entidade. Digite a Chave/Código impresso no documento.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Validador Oficial Ativo
              </span>
            </div>
          </div>

          {/* Search Form Box */}
          <div className="bg-[#161616] border border-white/5 p-4 sm:p-5 rounded-xl space-y-4">
            <label className="block text-xs font-bold text-gray-300">
              Informe o Código de Autenticidade ou Número do Registro:
            </label>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-500" />
                </div>
                <input
                  type="text"
                  value={verifyCodeInput}
                  onChange={(e) => setVerifyCodeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleVerifyCode();
                    }
                  }}
                  placeholder="Ex: UNION-001-9842 ou ATEST-FIL-2026/001 ou CPF"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#111111] border border-white/10 rounded-xl text-xs font-mono font-bold text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 uppercase tracking-wider"
                />
              </div>

              <button
                type="button"
                onClick={() => handleVerifyCode()}
                disabled={isVerifying}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-900/20 flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Verificando...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    <span>Verificar Autenticidade</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick suggestions / Example buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Atalhos de Teste:</span>
              <button
                type="button"
                onClick={() => {
                  const assocMatriculaClean = (associate.matricula || '001').replace(/[^0-9]/g, '');
                  const myCode = `UNION-${assocMatriculaClean}-9842`;
                  setVerifyCodeInput(myCode);
                  handleVerifyCode(myCode);
                }}
                className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-indigo-300 text-[11px] font-mono rounded-lg transition-all cursor-pointer"
              >
                Meu Atestado de Filiação (UNION-{(associate.matricula || '001').replace(/[^0-9]/g, '')}-9842)
              </button>
              <button
                type="button"
                onClick={() => {
                  const myCpf = associate.cpf;
                  setVerifyCodeInput(myCpf);
                  handleVerifyCode(myCpf);
                }}
                className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-[11px] font-mono rounded-lg transition-all cursor-pointer"
              >
                Consultar por meu CPF ({associate.cpf})
              </button>
            </div>
          </div>

          {/* Verification Result Card */}
          <AnimatePresence mode="wait">
            {verifiedResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {verifiedResult.status === 'valid' ? (
                  <div className="p-5 bg-gradient-to-br from-emerald-500/10 via-emerald-500/[0.03] to-transparent border border-emerald-500/20 rounded-xl space-y-4 relative overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-500/15 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30 shrink-0">
                          <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider block">
                            ✓ DOCUMENTO AUTÊNTICO E VÁLIDO
                          </span>
                          <h4 className="text-sm sm:text-base font-extrabold text-white">
                            {verifiedResult.title}
                          </h4>
                        </div>
                      </div>

                      <div className="bg-[#111111] px-3 py-1.5 rounded-lg border border-emerald-500/20 text-right shrink-0">
                        <span className="text-[9px] text-gray-500 font-bold uppercase block">Código de Autenticidade</span>
                        <span className="text-xs font-mono font-extrabold text-emerald-400">{verifiedResult.code}</span>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                      <div className="bg-[#111111]/80 p-3 rounded-lg border border-white/5">
                        <span className="text-[10px] text-gray-500 font-bold uppercase block mb-0.5">Titular / Beneficiário</span>
                        <span className="font-bold text-white block truncate">{verifiedResult.personName || associate.name}</span>
                        {verifiedResult.documentNumberPerson && (
                          <span className="text-[10px] text-gray-400 font-mono block mt-0.5">{verifiedResult.documentNumberPerson}</span>
                        )}
                      </div>

                      <div className="bg-[#111111]/80 p-3 rounded-lg border border-white/5">
                        <span className="text-[10px] text-gray-500 font-bold uppercase block mb-0.5">Entidade Emissora</span>
                        <span className="font-bold text-white block truncate">{verifiedResult.issuingEntity}</span>
                        <span className="text-[10px] text-emerald-400/80 font-mono block mt-0.5">CNPJ: {entityConfig?.cnpj || '00.000.000/0001-00'}</span>
                      </div>

                      <div className="bg-[#111111]/80 p-3 rounded-lg border border-white/5 sm:col-span-2 md:col-span-1">
                        <span className="text-[10px] text-gray-500 font-bold uppercase block mb-0.5">Tipo & Data</span>
                        <span className="font-bold text-white block">{verifiedResult.type}</span>
                        <span className="text-[10px] text-gray-400 font-mono block mt-0.5">Emissão: {verifiedResult.date}</span>
                      </div>
                    </div>

                    {verifiedResult.amount !== undefined && (
                      <div className="p-3 bg-[#111111]/90 rounded-lg border border-emerald-500/20 flex justify-between items-center text-xs">
                        <span className="text-gray-400 font-medium">Valor Declarado do Atestado:</span>
                        <span className="text-sm font-black text-emerald-400 font-mono">{formatBRL(verifiedResult.amount)}</span>
                      </div>
                    )}

                    <div className="p-3 bg-[#111111]/60 rounded-lg border border-white/5 text-xs text-gray-300 leading-relaxed">
                      <p className="font-medium text-gray-300">
                        {verifiedResult.details}
                      </p>
                      <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500 font-mono">
                        <span>Certificado com Assinatura Digital do Sistema UniOn</span>
                        <span className="text-emerald-400 font-semibold">✓ Status: Ativo & Auditado</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 bg-red-500/5 border border-red-500/20 rounded-xl space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20 shrink-0">
                        <XCircle className="h-6 w-6" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase text-red-400 tracking-wider block">
                          ✕ CÓDIGO NÃO LOCALIZADO
                        </span>
                        <h4 className="text-sm font-bold text-white">
                          Não foi possível validar o código "{verifiedResult.code}"
                        </h4>
                      </div>
                    </div>

                    <p className="text-xs text-gray-400 leading-relaxed bg-[#111111] p-3 rounded-lg border border-white/5">
                      {verifiedResult.details}
                    </p>

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => setVerifiedResult(null)}
                        className="px-3 py-1.5 bg-[#1a1a1a] hover:bg-white/5 text-gray-400 hover:text-white border border-white/10 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                      >
                        Fechar
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>


        </div>

        {/* Info Grid: Info & Contact Form + Financial Statements */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Personal info & Update contact details */}
          <div className="bg-[#111111] rounded-2xl border border-white/5 shadow-xl p-5 space-y-4 h-fit">
            <h3 className="font-bold text-white text-sm flex items-center gap-2 border-b border-white/5 pb-3">
              <User className="h-4.5 w-4.5 text-blue-500" />
              Informações Cadastrais
            </h3>

            <div className="space-y-3.5 pt-1 text-xs">
              {/* Foto do Associado */}
              <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5 mb-3">
                <div className="h-14 w-14 rounded-lg border border-white/10 bg-[#151515] overflow-hidden shrink-0">
                  {associate.photo ? (
                    <img 
                      src={associate.photo} 
                      alt={associate.name} 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-gray-500 text-lg">
                      {associate.name ? associate.name.charAt(0).toUpperCase() : '?'}
                    </div>
                  )}
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase font-semibold block">Foto do Associado</span>
                  <span className="font-bold text-white text-sm block max-w-[150px] truncate">{associate.name}</span>
                </div>
              </div>

              <div className="flex justify-between py-1.5 border-b border-white/5 bg-blue-500/5 px-2 rounded-lg border-l-2 border-l-blue-500">
                <span className="text-blue-400 font-bold">Nº Matrícula</span>
                <span className="font-extrabold text-white font-mono">{associate.matricula || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-gray-500 font-medium">CPF</span>
                <span className="font-semibold text-gray-300">{associate.cpf}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-gray-500 font-medium">E-mail Cadastrado</span>
                <span className="font-semibold text-gray-300 truncate max-w-[180px]">{associate.email}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-gray-500 font-medium">Telefone de Contato</span>
                <span className="font-semibold text-gray-300">{associate.phone || 'Não informado'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-gray-500 font-medium">Mensalidade</span>
                <span className="font-semibold text-gray-300">{formatBRL(associate.monthlyFee)}</span>
              </div>
              <div className="flex flex-col gap-1 py-1.5 border-b border-white/5">
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Data de Filiação</span>
                  <span className="font-semibold text-gray-300">{dateToBRL(associate.joiningDate)}</span>
                </div>
                {associate.joiningDate && (
                  <div className="flex justify-end">
                    <span className="text-[10px] text-blue-400 font-semibold bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/10">
                      Tempo de Filiação: {calculateMembershipDuration(associate.joiningDate)}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5 bg-white/5 px-2 rounded-lg">
                <span className="text-gray-400 font-bold">Direito a Voto</span>
                <span className={`font-bold ${associate.hasVotingRight !== false ? 'text-blue-400' : 'text-gray-500'}`}>
                  {associate.hasVotingRight !== false ? '🗳️ Sim (Com Direito)' : '❌ Não (Sem Direito)'}
                </span>
              </div>
              <div className="pt-2">
                <span className="text-gray-500 font-medium block mb-1">Endereço Residencial</span>
                <span className="font-semibold text-gray-300 block leading-relaxed bg-[#1a1a1a] p-2.5 rounded-xl border border-white/5">
                  {associate.address || 'Não cadastrado'}
                </span>
              </div>
            </div>
          </div>

          {/* Column 2: Announcements Mural */}
          <div className="bg-[#111111] rounded-2xl border border-white/5 shadow-xl p-5 space-y-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2 border-b border-white/5 pb-3">
              <Bell className="h-4.5 w-4.5 text-blue-500" />
              Mural de Comunicados ({visibleAnnouncements.length})
            </h3>

            <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
              {visibleAnnouncements.length > 0 ? (
                visibleAnnouncements.map((ann) => (
                  <div key={ann.id} className="p-3.5 bg-[#1a1a1a]/60 border border-white/5 rounded-xl space-y-1.5">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="text-xs font-bold text-white leading-snug">{ann.title}</h4>
                      <span className="text-[9px] text-gray-400 shrink-0 font-semibold bg-[#111111] border border-white/5 px-1.5 py-0.5 rounded-md">
                        {dateToBRL(ann.date)}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-relaxed whitespace-pre-wrap">
                      {ann.content}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Bell className="h-8 w-8 mx-auto mb-1.5 opacity-60 text-gray-600" />
                  <p className="text-xs">Nenhum aviso ou comunicado publicado.</p>
                </div>
              )}
            </div>
          </div>

          {/* Column 3: Personal Financial contribution logs */}
          <div className="bg-[#111111] rounded-2xl border border-white/5 shadow-xl p-5 space-y-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2 border-b border-white/5 pb-3">
              <DollarSign className="h-4.5 w-4.5 text-blue-500" />
              Histórico de Pagamentos
            </h3>

            <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
              {personalTransactions.length > 0 ? (
                personalTransactions.map((t) => (
                  <div key={t.id} className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex justify-between items-center">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-gray-200 leading-tight">{t.description}</p>
                      <div className="flex items-center gap-2 text-[10px] text-gray-500 font-semibold">
                        <span>{dateToBRL(t.date)}</span>
                        <span>•</span>
                        <span>{t.paymentMethod}</span>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-emerald-400">
                      +{formatBRL(t.amount)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="h-8 w-8 mx-auto mb-1.5 opacity-60 text-gray-600" />
                  <p className="text-xs">Nenhum pagamento registrado nesta conta ainda.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>


      {/* Dialog: Installment / Agreement */}
      {isInstallmentModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#111111] rounded-2xl shadow-2xl border border-white/10 max-w-lg w-full overflow-hidden text-gray-200"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-[#1a1a1a]/40">
              <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                <Calculator className="h-4.5 w-4.5 text-blue-500" />
                Acordo de Parcelamento de Débito
              </h3>
              <button 
                onClick={() => setIsInstallmentModalOpen(false)} 
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {installmentSuccess ? (
              <div className="p-8 text-center space-y-4">
                <div className="h-14 w-14 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h4 className="text-base font-bold text-white">Acordo Confirmado!</h4>
                <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                  Seu acordo de parcelamento foi registrado e enviado para a tesouraria. Seu cadastro foi atualizado para status regularizado!
                </p>
                <div className="h-1 w-24 bg-emerald-500/20 mx-auto rounded overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 3 }}
                    className="h-full bg-emerald-500"
                  />
                </div>
              </div>
            ) : (
              <form onSubmit={handleConfirmInstallment} className="p-6 space-y-5">
                {/* Total debt box */}
                <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Total do Débito</span>
                    <span className="text-xs text-gray-400 font-medium">Acumulado na tesouraria</span>
                  </div>
                  <span className="text-lg font-black text-red-400 font-mono">
                    {formatBRL(associate.debtAmount || 0)}
                  </span>
                </div>

                {/* Configuration Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Número de Parcelas</label>
                    <select
                      value={selectedInstallments}
                      onChange={(e) => setSelectedInstallments(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {[2, 3, 4, 5, 6, 8, 10, 12, 18, 24, 36, 48]
                        .filter(num => num <= (associate.maxInstallmentsAllowed || 12))
                        .map(num => (
                          <option key={num} value={num}>{num} parcelas (Máx: {associate.maxInstallmentsAllowed || 12})</option>
                        ))
                      }
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Meio de Pagamento</label>
                    <select
                      value={installmentMethod}
                      onChange={(e) => setInstallmentMethod(e.target.value)}
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="Pix">Pix (Recomendado)</option>
                      <option value="Dinheiro em espécie">Dinheiro em espécie</option>
                      <option value="Boleto Bancário">Boleto Bancário</option>
                      <option value="Cartão de Crédito">Cartão de Crédito</option>
                    </select>
                  </div>
                </div>

                {/* Simulated table */}
                <div className="space-y-2">
                  <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Simulação do Plano de Pagamento</span>
                  <div className="max-h-[160px] overflow-y-auto border border-white/5 rounded-xl bg-[#141414]/60 divide-y divide-white/5 p-1">
                    {Array.from({ length: selectedInstallments }).map((_, index) => {
                      const value = parseFloat(((associate.debtAmount || 0) / selectedInstallments).toFixed(2));
                      const dueDate = new Date();
                      dueDate.setDate(dueDate.getDate() + (index + 1) * 30);
                      return (
                        <div key={index} className="flex justify-between items-center py-2 px-3 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-400">Parcela {index + 1}/{selectedInstallments}</span>
                            <span className="text-[10px] text-gray-500 font-semibold bg-[#1a1a1a] border border-white/5 px-1.5 py-0.5 rounded">
                              Vence {dueDate.toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          <span className="font-extrabold text-blue-400 font-mono">{formatBRL(value)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 flex gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() => setIsInstallmentModalOpen(false)}
                    className="flex-1 py-2.5 px-4 border border-white/10 text-gray-400 hover:bg-white/5 font-semibold rounded-xl"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <ClipboardList className="h-4 w-4" />
                    Confirmar Acordo
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}

      {/* Dialog: Pay Monthly Fee */}
      {payMonthKey && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#111111] rounded-2xl shadow-2xl border border-white/10 max-w-sm w-full overflow-hidden text-gray-200"
          >
            <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-[#1a1a1a]/40">
              <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                <DollarSign className="h-4.5 w-4.5 text-blue-500" />
                Enviar Comprovante de Pagamento
              </h3>
              <button 
                onClick={() => {
                  setPayMonthKey(null);
                  setPayMonthReceiptFile(null);
                  setPayMonthReceiptFileName('');
                  setPayMonthReceiptError('');
                }} 
                className="text-gray-400 hover:text-white cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePayMonthConfirm} className="p-6 space-y-4">
              <p className="text-xs text-gray-400 leading-relaxed">
                Você está enviando o comprovante de pagamento da mensalidade correspondente ao mês de <strong className="text-white">
                  {(() => {
                    const mList = [
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
                    ];
                    return mList.find(m => m.key === payMonthKey)?.name || payMonthKey;
                  })()} de 2026
                </strong>.
              </p>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  Valor da Mensalidade do Mês (R$) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-xs font-mono">R$</span>
                  </div>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    value={payMonthAmount}
                    onChange={(e) => setPayMonthAmount(maskMoney(e.target.value))}
                    placeholder="0,00"
                    className="w-full pl-9 pr-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-xs font-bold text-emerald-400 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Forma de Pagamento</label>
                <select
                  value={payMonthMethod}
                  onChange={(e) => setPayMonthMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Pix">Pix (Instantâneo)</option>
                  <option value="Dinheiro em espécie">Dinheiro em espécie</option>
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                  <option value="Boleto Bancário">Boleto Bancário</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Comprovante de Pagamento</label>
                <div className="relative border border-dashed border-white/10 hover:border-white/20 rounded-xl p-4 bg-white/[0.02] hover:bg-white/[0.04] transition-all flex flex-col items-center justify-center text-center space-y-2">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleMonthlyFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                  />
                  <Upload className="h-5 w-5 text-gray-400" />
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-gray-300 truncate max-w-[200px]">
                      {payMonthReceiptFileName || "Selecione o comprovante"}
                    </p>
                    <p className="text-[9px] text-gray-500">Imagens ou PDF (Máx. 2MB)</p>
                  </div>
                </div>
                {payMonthReceiptError && (
                  <p className="text-[10px] font-bold text-red-400">{payMonthReceiptError}</p>
                )}
              </div>

              <div className="pt-2 flex gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setPayMonthKey(null);
                    setPayMonthReceiptFile(null);
                    setPayMonthReceiptFileName('');
                    setPayMonthReceiptError('');
                  }}
                  className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 font-semibold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Upload className="h-3.5 w-3.5" />
                  Enviar Comprovante
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
