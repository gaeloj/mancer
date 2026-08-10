import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  DollarSign, ArrowUpRight, ArrowDownRight, Plus, Search, 
  Trash2, X, Filter, Calendar, Clock, CreditCard, Tag, AlertCircle, 
  FileSpreadsheet, FileText, Printer, Eye, History
} from 'lucide-react';
import { Transaction, Associate, ReportCopy, EntityConfig } from '../types';
import { maskMoney, parseMaskedMoney, maskDate, dateToISO, dateToBRL, maskTime, maskCpfCnpj } from '../utils/formatters';

interface FinanceTabProps {
  transactions: Transaction[];
  associates: Associate[];
  reports: ReportCopy[];
  entityConfig?: EntityConfig | null;
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  onDeleteTransaction: (id: string) => void;
  onAddReport: (report: ReportCopy) => void;
  onDeleteReport: (id: string) => void;
}

export default function FinanceTab({ 
  transactions, 
  associates, 
  reports = [],
  entityConfig,
  onAddTransaction, 
  onDeleteTransaction,
  onAddReport,
  onDeleteReport
}: FinanceTabProps) {
  // Navigation tabs within Finance tab
  const [subTab, setSubTab] = useState<'caixa' | 'relatorios'>('caixa');

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'Todos' | 'Entrada' | 'Saída'>('Todos');
  const [categoryFilter, setCategoryFilter] = useState<string>('Todas');
  
  // Add transaction Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Report Generation Modal state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedReportCopy, setSelectedReportCopy] = useState<ReportCopy | null>(null);
  const [isReportDetailModalOpen, setIsReportDetailModalOpen] = useState(false);
  const [isPrintingDirectly, setIsPrintingDirectly] = useState(false);

  // States to hold blob URLs for seamless, unblocked printing and downloads in iframes
  const [currentReportBlobUrl, setCurrentReportBlobUrl] = useState<string>('');
  const [selectedReportBlobUrl, setSelectedReportBlobUrl] = useState<string>('');



  // Inline confirmation states for deletion
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteReportConfirmId, setDeleteReportConfirmId] = useState<string | null>(null);

  // Form fields for Transaction
  const [description, setDescription] = useState('');
  const [payerReceiverName, setPayerReceiverName] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'Entrada' | 'Saída'>('Entrada');
  const [date, setDate] = useState(() => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    return `${day}/${month}/${year}`;
  });
  const [time, setTime] = useState(() => {
    const today = new Date();
    const hrs = String(today.getHours()).padStart(2, '0');
    const mins = String(today.getMinutes()).padStart(2, '0');
    const secs = String(today.getSeconds()).padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  });
  const [category, setCategory] = useState('Mensalidade');
  const [associateId, setAssociateId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Pix');
  const [document, setDocument] = useState('');

  // Form fields for Report Generator Preview
  const [reportNumber, setReportNumber] = useState('');
  const [reportIssuedAt, setReportIssuedAt] = useState('');

  // Available standard categories
  const categories = [
    'Mensalidade',
    'Doação',
    'Evento',
    'Infraestrutura',
    'Manutenção',
    'Suprimentos',
    'Impostos/Taxas',
    'Outros'
  ];

  const handleOpenModal = () => {
    setDescription('');
    setPayerReceiverName('');
    setAmount('');
    setType('Entrada');
    setDocument('');
    
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    setDate(`${day}/${month}/${year}`);
    
    const hrs = String(today.getHours()).padStart(2, '0');
    const mins = String(today.getMinutes()).padStart(2, '0');
    const secs = String(today.getSeconds()).padStart(2, '0');
    setTime(`${hrs}:${mins}:${secs}`);
    
    setCategory('Mensalidade');
    setAssociateId('');
    setPaymentMethod('Pix');
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !date || !document || !payerReceiverName) {
      alert('Por favor, preencha todos os campos obrigatórios, incluindo o Nome e o CPF ou CNPJ de quem pagou ou recebeu.');
      return;
    }

    const parsedAmount = parseMaskedMoney(amount);
    if (parsedAmount <= 0) {
      alert('Por favor, digite um valor válido maior que zero.');
      return;
    }

    const isoDate = dateToISO(date);

    onAddTransaction({
      description,
      payerReceiverName,
      amount: parsedAmount,
      type,
      date: isoDate,
      time: time || undefined,
      category,
      paymentMethod,
      document,
      createdBy: 'Administrador',
      associateId: type === 'Entrada' ? (associateId || undefined) : undefined
    });

    setIsModalOpen(false);
  };

  // Get distinct categories present in data for filter dropdown
  const existingCategories = ['Todas', ...Array.from(new Set(transactions.map(t => t.category)))];

  // Filtering cash flow
  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'Todos' || t.type === typeFilter;
    const matchesCategory = categoryFilter === 'Todas' || t.category === categoryFilter;

    return matchesSearch && matchesType && matchesCategory;
  });

  // Calculate totals for currently filtered list
  const totalInflow = filteredTransactions
    .filter(t => t.type === 'Entrada')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalOutflow = filteredTransactions
    .filter(t => t.type === 'Saída')
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalInflow - totalOutflow;

  const formatBRL = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getReportHTML = (reportData: {
    reportNumber: string;
    issuedAt: string;
    filters: { type: string; category: string };
    transactions: Transaction[];
    totalInflow: number;
    totalOutflow: number;
    netBalance: number;
  }) => {
    const entityName = entityConfig?.name || 'UniOn - Sistema de Gestão';
    const entityAcronym = entityConfig?.acronym || 'UO';
    const entityCNPJ = entityConfig?.cnpj || '';
    const entityLogo = entityConfig?.logo || '';
    const entityAddress = entityConfig?.address || '';
    const entityEmail = entityConfig?.email || '';
    const entityPhone = entityConfig?.phone || '';

    const transactionsRows = reportData.transactions.map((t) => `
      <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
        <td style="padding: 10px; font-weight: bold; color: ${t.type === 'Entrada' ? '#059669' : '#dc2626'}">
          ${t.type === 'Entrada' ? 'Receita' : 'Despesa'}
        </td>
        <td style="padding: 10px; color: #1e293b;">
          <strong>${t.description}</strong>
        </td>
        <td style="padding: 10px; color: #334155;">${t.payerReceiverName || '-'}</td>
        <td style="padding: 10px; font-family: monospace; color: #475569;">${t.document || '-'}</td>
        <td style="padding: 10px; color: #475569;">${t.category}</td>
        <td style="padding: 10px; font-family: monospace; color: #0f172a; white-space: nowrap;">
          <div style="font-weight: bold;">${dateToBRL(t.date)}</div>
          <div style="font-size: 10px; color: #64748b; margin-top: 2px;">${t.time || '12:00:00'}</div>
        </td>
        <td style="padding: 10px; color: #475569;">${t.paymentMethod || 'Pix'}</td>
        <td style="padding: 10px; text-align: right; font-family: monospace; font-weight: bold; color: ${t.type === 'Entrada' ? '#059669' : '#dc2626'}">
          ${t.type === 'Entrada' ? '+' : '-'} ${formatBRL(t.amount)}
        </td>
      </tr>
    `).join('');

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Prestação de Contas - ${reportData.reportNumber}</title>
  <style>
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 40px;
      color: #333;
      background-color: #fff;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #000;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .logo-container {
      display: flex;
      align-items: center;
      gap: 15px;
    }
    .logo {
      width: 60px;
      height: 60px;
      object-fit: cover;
      border-radius: 8px;
      border: 1px solid #ccc;
    }
    .header-text {
      text-align: right;
    }
    .header-text h1 {
      margin: 0;
      font-size: 18px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .header-text p {
      margin: 3px 0 0 0;
      font-size: 13px;
      color: #666;
    }
    .cnpj {
      font-family: monospace;
      font-size: 11px;
      color: #888;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      background-color: #f8fafc;
      padding: 20px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      margin-bottom: 30px;
      font-size: 12px;
    }
    .meta-item span {
      display: block;
      font-size: 9px;
      text-transform: uppercase;
      color: #64748b;
      font-weight: bold;
      margin-bottom: 4px;
    }
    .meta-item strong {
      font-size: 13px;
      color: #0f172a;
    }
    .meta-item-mono {
      font-family: monospace;
    }
    .entity-section {
      grid-column: span 2;
      border-top: 1px solid #cbd5e1;
      padding-top: 15px;
      margin-top: 5px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    .table-container {
      margin-bottom: 30px;
    }
    .table-container h3 {
      font-size: 13px;
      border-bottom: 1px solid #000;
      padding-bottom: 5px;
      margin-bottom: 15px;
      text-transform: uppercase;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th {
      background-color: #f1f5f9;
      padding: 10px;
      font-size: 11px;
      font-weight: bold;
      text-align: left;
      border-bottom: 1px solid #000;
    }
    .totals-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 2px solid #000;
      padding-top: 20px;
      margin-bottom: 50px;
    }
    .totals-left {
      font-size: 12px;
      color: #475569;
    }
    .totals-left p {
      margin: 4px 0;
    }
    .totals-right {
      text-align: right;
      padding: 15px;
      background-color: #f8fafc;
      border: 1px solid #94a3b8;
      border-radius: 8px;
    }
    .totals-right span {
      font-size: 10px;
      text-transform: uppercase;
      color: #475569;
      font-weight: bold;
    }
    .totals-right strong {
      display: block;
      font-size: 18px;
      font-family: monospace;
      color: #0f172a;
      margin-top: 5px;
    }
    .signature-area {
      display: flex;
      justify-content: space-around;
      margin-top: 80px;
      text-align: center;
      font-size: 12px;
    }
    .signature-line {
      border-top: 1px solid #000;
      width: 200px;
      padding-top: 8px;
    }
    .btn-print {
      display: block;
      width: 200px;
      margin: 30px auto 0 auto;
      padding: 12px;
      background-color: #2563eb;
      color: white;
      text-align: center;
      font-weight: bold;
      border-radius: 8px;
      text-decoration: none;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
    }
    @media print {
      .btn-print {
        display: none;
      }
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>

  <div class="header">
    <div class="logo-container">
      ${entityLogo ? `<img src="${entityLogo}" alt="Logo" class="logo" />` : ''}
      <div>
        <h2 style="margin: 0; font-size: 16px; font-weight: bold; color: #0f172a;">${entityName}</h2>
        ${entityAcronym ? `<p style="margin: 2px 0 0 0; font-size: 11px; color: #475569; font-weight: bold; text-transform: uppercase;">${entityAcronym}</p>` : ''}
      </div>
    </div>
    <div class="header-text">
      <h1>Relatório de Prestação de Contas</h1>
      <p>Livro Caixa Autenticado</p>
      ${entityCNPJ ? `<p class="cnpj">CNPJ: ${entityCNPJ}</p>` : ''}
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-item">
      <span>Código do Relatório (Autenticado)</span>
      <strong class="meta-item-mono">${reportData.reportNumber}</strong>
    </div>
    <div class="meta-item">
      <span>Data e Hora de Emissão</span>
      <strong class="meta-item-mono">${reportData.issuedAt}</strong>
    </div>
    <div class="meta-item" style="margin-top: 15px;">
      <span>Responsável / Emissor</span>
      <strong>Administrador de Finanças</strong>
    </div>
    <div class="meta-item" style="margin-top: 15px;">
      <span>Filtros Aplicados</span>
      <strong class="meta-item-mono">Tipo: ${reportData.filters.type} | Categoria: ${reportData.filters.category}</strong>
    </div>

    <div class="entity-section">
      <div>
        <span>Dados da Entidade</span>
        <strong>${entityName} ${entityAcronym ? `(${entityAcronym})` : ''}</strong>
        ${entityCNPJ ? `<span style="text-transform: none; font-family: monospace; font-size: 10px; margin-top: 2px;">CNPJ: ${entityCNPJ}</span>` : ''}
      </div>
      <div>
        <span>Contato & Localização</span>
        <strong>${entityAddress || 'Não cadastrado'}</strong>
        <span style="text-transform: none; font-family: monospace; font-size: 10px; margin-top: 2px;">${entityEmail} | ${entityPhone}</span>
      </div>
    </div>
  </div>

  <div class="table-container">
    <h3>Lançamentos Financeiros Inclusos</h3>
    <table>
      <thead>
        <tr>
          <th>Tipo</th>
          <th>Descrição</th>
          <th>Pagador / Recebedor</th>
          <th>CPF/CNPJ</th>
          <th>Categoria</th>
          <th>Data / Hora</th>
          <th>Método</th>
          <th style="text-align: right;">Valor</th>
        </tr>
      </thead>
      <tbody>
        ${transactionsRows}
      </tbody>
    </table>
  </div>

  <div class="totals-container">
    <div class="totals-left">
      <p>Total Receitas Inclusas: <strong>${formatBRL(reportData.totalInflow)}</strong></p>
      <p>Total Despesas Inclusas: <strong>${formatBRL(reportData.totalOutflow)}</strong></p>
    </div>
    <div class="totals-right">
      <span>Saldo Final Líquido do Período</span>
      <strong>${formatBRL(reportData.netBalance)}</strong>
    </div>
  </div>

  <div class="signature-area">
    <div>
      <div class="signature-line"></div>
      <span>Administrador de Finanças</span>
      <p style="margin: 4px 0 0 0; font-size: 10px; color: #666;">${entityName}</p>
    </div>
    <div>
      <div class="signature-line"></div>
      <span>Conselho Fiscal / Auditoria</span>
      <p style="margin: 4px 0 0 0; font-size: 10px; color: #666;">${entityAcronym || 'Entidade'}</p>
    </div>
  </div>

  <a href="#" class="btn-print" onclick="window.print(); return false;">Imprimir / Salvar PDF</a>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>
    `;
  };

  const printReportHTML = (reportData: {
    reportNumber: string;
    issuedAt: string;
    filters: { type: string; category: string };
    transactions: Transaction[];
    totalInflow: number;
    totalOutflow: number;
    netBalance: number;
  }) => {
    const htmlContent = getReportHTML(reportData);
    
    // Create hidden iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.setAttribute('title', 'Print Frame');
    document.body.appendChild(iframe);
    
    const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(htmlContent);
      iframeDoc.close();
      
      // Wait slightly, then focus and print
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          console.error("Erro ao imprimir via iframe:", e);
        }
        
        // Cleanup frame safely
        setTimeout(() => {
          try {
            document.body.removeChild(iframe);
          } catch (err) {
            console.error(err);
          }
        }, 1500);
      }, 500);
    }
  };

  // Generate/Revoke current live report blob URL
  useEffect(() => {
    if (filteredTransactions.length === 0) {
      setCurrentReportBlobUrl('');
      return;
    }
    const htmlContent = getReportHTML({
      reportNumber,
      issuedAt: reportIssuedAt,
      filters: { type: typeFilter, category: categoryFilter },
      transactions: filteredTransactions,
      totalInflow,
      totalOutflow,
      netBalance
    });

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    setCurrentReportBlobUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [
    filteredTransactions,
    typeFilter,
    categoryFilter,
    reportNumber,
    reportIssuedAt,
    totalInflow,
    totalOutflow,
    netBalance,
    entityConfig
  ]);

  // Generate/Revoke selected archived report blob URL
  useEffect(() => {
    if (!selectedReportCopy) {
      setSelectedReportBlobUrl('');
      return;
    }

    const htmlContent = getReportHTML({
      reportNumber: selectedReportCopy.reportNumber,
      issuedAt: selectedReportCopy.issuedAt,
      filters: selectedReportCopy.filters,
      transactions: selectedReportCopy.transactions as Transaction[],
      totalInflow: selectedReportCopy.totalInflow,
      totalOutflow: selectedReportCopy.totalOutflow,
      netBalance: selectedReportCopy.netBalance
    });

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    setSelectedReportBlobUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [selectedReportCopy, entityConfig]);

  // Prepare Report Generation
  const handleOpenReportModal = () => {
    if (filteredTransactions.length === 0) {
      alert('A lista de lançamentos atual está vazia. Aplique filtros para ter lançamentos no relatório.');
      return;
    }
    
    // Generate a random 5 digit report number
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const code = `REL-${new Date().getFullYear()}-${randomNum}`;
    
    // Capture current datetime
    const now = new Date();
    const formattedDate = now.toLocaleDateString('pt-BR');
    const formattedTime = now.toLocaleTimeString('pt-BR');
    
    setReportNumber(code);
    setReportIssuedAt(`${formattedDate} às ${formattedTime}`);
    setIsReportModalOpen(true);
  };

  const downloadPrintableReport = (reportData: {
    reportNumber: string;
    issuedAt: string;
    filters: { type: string; category: string };
    transactions: Transaction[];
    totalInflow: number;
    totalOutflow: number;
    netBalance: number;
  }) => {
    const reportHtml = getReportHTML(reportData);
    
    // 1. Attempt direct download via blob URL first (might work if user is already browsing out-of-iframe)
    try {
      const blob = new Blob([reportHtml], { type: 'text/html;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const entityNameClean = (entityConfig?.acronym || entityConfig?.name || 'union').toLowerCase().replace(/[^a-z0-9]/g, '_');
      link.setAttribute('download', `prestacao_contas_${entityNameClean}_${reportData.reportNumber}.html`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Direct download blocked by sandboxed iframe environment:", e);
    }

    // 2. Open in a new tab so the user can easily click 'Baixar HTML' or 'Imprimir' with 100% bypass of sandboxing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(reportHtml);
      printWindow.document.close();
    } else {
      alert("Para baixar e imprimir com sucesso dentro do painel, por favor permita pop-ups ou abra o aplicativo em uma nova aba usando o botão no topo do painel.");
    }
    return; // Bypass legacy duplicated HTML builder below safely

    const entityName = entityConfig?.name || 'UniOn - Sistema de Gestão';
    const entityAcronym = entityConfig?.acronym || 'UO';
    const entityCNPJ = entityConfig?.cnpj || '';
    const entityLogo = entityConfig?.logo || '';
    const entityAddress = entityConfig?.address || '';
    const entityEmail = entityConfig?.email || '';
    const entityPhone = entityConfig?.phone || '';

    const transactionsRows = reportData.transactions.map((t) => `
      <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
        <td style="padding: 10px; font-weight: bold; color: ${t.type === 'Entrada' ? '#059669' : '#dc2626'}">
          ${t.type === 'Entrada' ? 'Receita' : 'Despesa'}
        </td>
        <td style="padding: 10px; color: #1e293b;">
          <strong>${t.description}</strong>
        </td>
        <td style="padding: 10px; color: #334155;">${t.payerReceiverName || '-'}</td>
        <td style="padding: 10px; font-family: monospace; color: #475569;">${t.document || '-'}</td>
        <td style="padding: 10px; color: #475569;">${t.category}</td>
        <td style="padding: 10px; font-family: monospace; color: #0f172a;">
          ${dateToBRL(t.date)} às ${t.time || '12:00:00'}
        </td>
        <td style="padding: 10px; color: #475569;">${t.paymentMethod || 'Pix'}</td>
        <td style="padding: 10px; text-align: right; font-family: monospace; font-weight: bold; color: ${t.type === 'Entrada' ? '#059669' : '#dc2626'}">
          ${t.type === 'Entrada' ? '+' : '-'} ${formatBRL(t.amount)}
        </td>
      </tr>
    `).join('');

    const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Prestação de Contas - ${reportData.reportNumber}</title>
  <style>
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 40px;
      color: #333;
      background-color: #fff;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #000;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .logo-container {
      display: flex;
      align-items: center;
      gap: 15px;
    }
    .logo {
      width: 60px;
      height: 60px;
      object-fit: cover;
      border-radius: 8px;
      border: 1px solid #ccc;
    }
    .header-text {
      text-align: right;
    }
    .header-text h1 {
      margin: 0;
      font-size: 18px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .header-text p {
      margin: 3px 0 0 0;
      font-size: 13px;
      color: #666;
    }
    .cnpj {
      font-family: monospace;
      font-size: 11px;
      color: #888;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      background-color: #f8fafc;
      padding: 20px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      margin-bottom: 30px;
      font-size: 12px;
    }
    .meta-item span {
      display: block;
      font-size: 9px;
      text-transform: uppercase;
      color: #64748b;
      font-weight: bold;
      margin-bottom: 4px;
    }
    .meta-item strong {
      font-size: 13px;
      color: #0f172a;
    }
    .meta-item-mono {
      font-family: monospace;
    }
    .entity-section {
      grid-column: span 2;
      border-top: 1px solid #cbd5e1;
      padding-top: 15px;
      margin-top: 5px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    .table-container {
      margin-bottom: 30px;
    }
    .table-container h3 {
      font-size: 13px;
      border-bottom: 1px solid #000;
      padding-bottom: 5px;
      margin-bottom: 15px;
      text-transform: uppercase;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th {
      background-color: #f1f5f9;
      padding: 10px;
      font-size: 11px;
      font-weight: bold;
      text-align: left;
      border-bottom: 1px solid #000;
    }
    .totals-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 2px solid #000;
      padding-top: 20px;
      margin-bottom: 50px;
    }
    .totals-left {
      font-size: 12px;
      color: #475569;
    }
    .totals-left p {
      margin: 4px 0;
    }
    .totals-right {
      text-align: right;
      padding: 15px;
      background-color: #f8fafc;
      border: 1px solid #94a3b8;
      border-radius: 8px;
    }
    .totals-right span {
      font-size: 10px;
      text-transform: uppercase;
      color: #475569;
      font-weight: bold;
    }
    .totals-right strong {
      display: block;
      font-size: 18px;
      font-family: monospace;
      color: #0f172a;
      margin-top: 5px;
    }
    .signature-area {
      display: flex;
      justify-content: space-around;
      margin-top: 80px;
      text-align: center;
      font-size: 12px;
    }
    .signature-line {
      border-top: 1px solid #000;
      width: 200px;
      padding-top: 8px;
    }
    .btn-print {
      display: block;
      width: 200px;
      margin: 30px auto 0 auto;
      padding: 12px;
      background-color: #059669;
      color: white;
      text-align: center;
      font-weight: bold;
      border-radius: 8px;
      text-decoration: none;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
    }
    @media print {
      .btn-print {
        display: none;
      }
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>

  <div class="header">
    <div class="logo-container">
      ${entityLogo ? `<img src="${entityLogo}" alt="Logo" class="logo" />` : ''}
      <div>
        <h2 style="margin: 0; font-size: 16px; font-weight: bold; color: #0f172a;">${entityName}</h2>
        ${entityAcronym ? `<p style="margin: 2px 0 0 0; font-size: 11px; color: #475569; font-weight: bold; text-transform: uppercase;">${entityAcronym}</p>` : ''}
      </div>
    </div>
    <div class="header-text">
      <h1>Relatório de Prestação de Contas</h1>
      <p>Livro Caixa Autenticado</p>
      ${entityCNPJ ? `<p class="cnpj">CNPJ: ${entityCNPJ}</p>` : ''}
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-item">
      <span>Código do Relatório (Autenticado)</span>
      <strong class="meta-item-mono">${reportData.reportNumber}</strong>
    </div>
    <div class="meta-item">
      <span>Data e Hora de Emissão</span>
      <strong class="meta-item-mono">${reportData.issuedAt}</strong>
    </div>
    <div class="meta-item" style="margin-top: 15px;">
      <span>Responsável / Emissor</span>
      <strong>Administrador de Finanças</strong>
    </div>
    <div class="meta-item" style="margin-top: 15px;">
      <span>Filtros Aplicados</span>
      <strong class="meta-item-mono">Tipo: ${reportData.filters.type} | Categoria: ${reportData.filters.category}</strong>
    </div>

    <div class="entity-section">
      <div>
        <span>Dados da Entidade</span>
        <strong>${entityName} ${entityAcronym ? `(${entityAcronym})` : ''}</strong>
        ${entityCNPJ ? `<span style="text-transform: none; font-family: monospace; font-size: 10px; margin-top: 2px;">CNPJ: ${entityCNPJ}</span>` : ''}
      </div>
      <div>
        <span>Contato & Localização</span>
        <strong>${entityAddress || 'Não cadastrado'}</strong>
        <span style="text-transform: none; font-family: monospace; font-size: 10px; margin-top: 2px;">${entityEmail} | ${entityPhone}</span>
      </div>
    </div>
  </div>

  <div class="table-container">
    <h3>Lançamentos Financeiros Inclusos</h3>
    <table>
      <thead>
        <tr>
          <th>Tipo</th>
          <th>Descrição</th>
          <th>Pagador / Recebedor</th>
          <th>CPF/CNPJ</th>
          <th>Categoria</th>
          <th>Data / Hora</th>
          <th>Método</th>
          <th style="text-align: right;">Valor</th>
        </tr>
      </thead>
      <tbody>
        ${transactionsRows}
      </tbody>
    </table>
  </div>

  <div class="totals-container">
    <div class="totals-left">
      <p>Total Receitas Inclusas: <strong>${formatBRL(reportData.totalInflow)}</strong></p>
      <p>Total Despesas Inclusas: <strong>${formatBRL(reportData.totalOutflow)}</strong></p>
    </div>
    <div class="totals-right">
      <span>Saldo Final Líquido do Período</span>
      <strong>${formatBRL(reportData.netBalance)}</strong>
    </div>
  </div>

  <div class="signature-area">
    <div>
      <div class="signature-line"></div>
      <span>Administrador de Finanças</span>
      <p style="margin: 4px 0 0 0; font-size: 10px; color: #666;">${entityName}</p>
    </div>
    <div>
      <div class="signature-line"></div>
      <span>Conselho Fiscal / Auditoria</span>
      <p style="margin: 4px 0 0 0; font-size: 10px; color: #666;">${entityAcronym || 'Entidade'}</p>
    </div>
  </div>

  <a href="#" class="btn-print" onclick="window.print(); return false;">Imprimir / Salvar PDF</a>

  <script>
    window.onload = function() {
      // Auto-trigger print
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const entityNameClean = entityAcronym || entityName || 'union';
    const cleanFileName = entityNameClean.toLowerCase().replace(/[^a-z0-9]/g, '_');
    link.setAttribute('download', `prestacao_contas_${cleanFileName}_${reportData.reportNumber}.html`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConfirmReportEmission = () => {
    const newReport: ReportCopy = {
      id: `rep-${Date.now()}`,
      reportNumber,
      issuedAt: reportIssuedAt,
      issuedBy: 'Administrador',
      filters: {
        type: typeFilter,
        category: categoryFilter,
        search: searchQuery
      },
      transactions: filteredTransactions.map(t => ({
        id: t.id,
        description: t.description,
        amount: t.amount,
        type: t.type,
        date: t.date,
        time: t.time,
        category: t.category,
        document: t.document,
        payerReceiverName: t.payerReceiverName || '',
        createdBy: t.createdBy || 'Administrador'
      })),
      totalInflow,
      totalOutflow,
      netBalance
    };

    onAddReport(newReport);
    setIsReportModalOpen(false);

    // Print the report using our clean hidden iframe method!
    printReportHTML({
      reportNumber,
      issuedAt: reportIssuedAt,
      filters: { type: typeFilter, category: categoryFilter },
      transactions: filteredTransactions,
      totalInflow,
      totalOutflow,
      netBalance
    });
  };

  const handlePrintExistingReport = (report: ReportCopy) => {
    printReportHTML({
      reportNumber: report.reportNumber,
      issuedAt: report.issuedAt,
      filters: report.filters,
      transactions: report.transactions as Transaction[],
      totalInflow: report.totalInflow,
      totalOutflow: report.totalOutflow,
      netBalance: report.netBalance
    });
  };

  const handleViewReportDetails = (report: ReportCopy) => {
    setSelectedReportCopy(report);
    setIsReportDetailModalOpen(true);
  };

  const handleDirectPDFPrint = () => {
    if (filteredTransactions.length === 0) {
      alert('Nenhum lançamento filtrado para exportar PDF.');
      return;
    }

    // Set printing state to render printable sheet unconditionally
    setIsPrintingDirectly(true);

    const dateStr = new Date().toLocaleDateString('pt-BR');
    const timeStr = new Date().toLocaleTimeString('pt-BR');
    const tempReportNumber = `REP-${Date.now().toString().slice(-6)}`;

    // Fallback/direct download: also prompt saving as print-ready HTML
    downloadPrintableReport({
      reportNumber: tempReportNumber,
      issuedAt: `${dateStr} às ${timeStr}`,
      filters: { type: typeFilter, category: categoryFilter },
      transactions: filteredTransactions,
      totalInflow,
      totalOutflow,
      netBalance
    });

    // Run system printer dialog
    setTimeout(() => {
      window.print();
      setIsPrintingDirectly(false);
    }, 200);
  };

  return (
    <div className="space-y-6 text-gray-200">
      
      {/* Sub-navigation bar inside FinanceTab */}
      <div className="flex border-b border-white/5 pb-0.5 gap-2">
        <button
          onClick={() => setSubTab('caixa')}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
            subTab === 'caixa'
              ? 'border-blue-500 text-blue-400 font-extrabold'
              : 'border-transparent text-gray-400 hover:text-white hover:border-white/10'
          }`}
        >
          <DollarSign className="h-4 w-4" />
          Livro Caixa
        </button>

        <button
          onClick={() => setSubTab('relatorios')}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
            subTab === 'relatorios'
              ? 'border-blue-500 text-blue-400 font-extrabold'
              : 'border-transparent text-gray-400 hover:text-white hover:border-white/10'
          }`}
        >
          <History className="h-4 w-4" />
          Relatórios Emitidos ({reports.length})
        </button>
      </div>

      <AnimatePresence mode="wait">
        {subTab === 'caixa' ? (
          <motion.div
            key="caixa-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Finance Stats Sub-Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-[#111111] p-5 rounded-2xl border border-white/5 shadow-xl flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block font-sans">Entradas Filtradas</span>
                  <span className="text-2xl font-bold text-emerald-400 block">{formatBRL(totalInflow)}</span>
                </div>
                <div className="h-10 w-10 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-400">
                  <ArrowUpRight className="h-5.5 w-5.5" />
                </div>
              </div>

              <div className="bg-[#111111] p-5 rounded-2xl border border-white/5 shadow-xl flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block font-sans">Saídas Filtradas</span>
                  <span className="text-2xl font-bold text-rose-400 block">{formatBRL(totalOutflow)}</span>
                </div>
                <div className="h-10 w-10 bg-rose-500/10 rounded-lg flex items-center justify-center text-rose-400">
                  <ArrowDownRight className="h-5.5 w-5.5" />
                </div>
              </div>

              <div className="bg-[#111111] p-5 rounded-2xl border border-white/5 shadow-xl flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block font-sans">Balanço do Período</span>
                  <span className={`text-2xl font-bold block ${netBalance >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                    {formatBRL(netBalance)}
                  </span>
                </div>
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${netBalance >= 0 ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-400'}`}>
                  <DollarSign className="h-5.5 w-5.5" />
                </div>
              </div>
            </div>

            {/* Control panel */}
            <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-[#111111] p-4 rounded-2xl border border-white/5 shadow-xl">
              {/* Search Input */}
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <Search className="h-4 w-4" />
                </div>
                <input
                  id="search-transactions"
                  type="text"
                  placeholder="Buscar lançamento por descrição ou categoria..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-9 pr-4 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Filters and trigger buttons */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Type Filter */}
                <div className="flex bg-[#1a1a1a] p-1 rounded-xl border border-white/5">
                  {(['Todos', 'Entrada', 'Saída'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setTypeFilter(filter)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        typeFilter === filter
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>

                {/* Category Filter dropdown */}
                <div className="flex items-center gap-1.5 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-gray-300 bg-[#1a1a1a]">
                  <Filter className="h-3.5 w-3.5 text-gray-500" />
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="bg-transparent focus:outline-none font-medium text-white cursor-pointer"
                  >
                    {existingCategories.map((cat) => (
                      <option key={cat} value={cat} className="bg-[#111111] text-white">{cat === 'Todas' ? 'Todas Categorias' : cat}</option>
                    ))}
                  </select>
                </div>

                {/* Export PDF button */}
                {filteredTransactions.length === 0 ? (
                  <button
                    id="btn-export-pdf-disabled"
                    disabled
                    className="flex items-center gap-1.5 py-2 px-3 bg-white/5 opacity-50 border border-white/10 text-gray-500 text-sm font-semibold rounded-xl cursor-not-allowed"
                    title="Nenhum lançamento filtrado para exportar"
                  >
                    <FileText className="h-4 w-4 text-gray-500" />
                    Gerar PDF
                  </button>
                ) : (
                  <button
                    id="btn-export-pdf"
                    onClick={() => {
                      const randomNum = Math.floor(10000 + Math.random() * 90000);
                      const code = `REL-${new Date().getFullYear()}-${randomNum}`;
                      const now = new Date();
                      const formattedDate = now.toLocaleDateString('pt-BR');
                      const formattedTime = now.toLocaleTimeString('pt-BR');

                      printReportHTML({
                        reportNumber: code,
                        issuedAt: `${formattedDate} às ${formattedTime}`,
                        filters: { type: typeFilter, category: categoryFilter },
                        transactions: filteredTransactions,
                        totalInflow,
                        totalOutflow,
                        netBalance
                      });
                    }}
                    className="flex items-center gap-1.5 py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-semibold rounded-xl transition-all cursor-pointer"
                    title="Imprimir ou salvar relatório de lançamentos filtrados em PDF"
                  >
                    <FileText className="h-4 w-4 text-blue-400" />
                    Gerar PDF
                  </button>
                )}

                {/* Emit Report PDF button */}
                <button
                  id="btn-emit-report"
                  onClick={handleOpenReportModal}
                  className="flex items-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-900/20 transition-all cursor-pointer"
                  title="Emitir relatório de prestação de contas filtrado"
                >
                  <FileText className="h-4 w-4" />
                  Prestar Contas
                </button>

                {/* New Transaction Button */}
                <button
                  id="btn-add-transaction"
                  onClick={handleOpenModal}
                  className="flex items-center gap-1.5 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-900/20 transition-all cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  Novo Lançamento
                </button>
              </div>
            </div>

            {/* Transactions table card */}
            <div className="bg-[#111111] rounded-2xl border border-white/5 shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#1a1a1a]/60 border-b border-white/5">
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Descrição / Beneficiário</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Categoria</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Data / Hora</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Método</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Valor</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    <AnimatePresence mode="popLayout">
                      {filteredTransactions.map((t) => (
                        <motion.tr
                          key={t.id}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="hover:bg-white/5 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              t.type === 'Entrada' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                            }`}>
                              {t.type === 'Entrada' ? 'Entrada' : 'Saída'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-xs font-bold text-white leading-snug">{t.description}</p>
                            <div className="flex flex-col gap-0.5 mt-0.5">
                              {t.payerReceiverName && (
                                <p className="text-[10px] text-gray-400">
                                  Pagador/Recebedor: <span className="font-medium text-gray-200">{t.payerReceiverName}</span>
                                </p>
                              )}
                              {t.document && (
                                <p className="text-[10px] text-gray-400">
                                  CPF/CNPJ: <span className="font-mono font-medium text-gray-300">{t.document}</span>
                                </p>
                              )}
                              {t.associateId && (
                                <span className="text-[10px] text-blue-400 font-medium">Vinculado a associado</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400">
                            <span className="flex items-center gap-1.5">
                              <Tag className="h-3.5 w-3.5 text-gray-500" />
                              {t.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400">
                            <div className="flex flex-col gap-0.5">
                              <span className="flex items-center gap-1.5 font-medium text-white">
                                <Calendar className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                                {dateToBRL(t.date)}
                              </span>
                              {t.time && (
                                <span className="flex items-center gap-1.5 text-[10px] text-gray-500 font-mono">
                                  <Clock className="h-3 w-3 text-gray-600 shrink-0" />
                                  {t.time}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400">
                            <span className="flex items-center gap-1.5">
                              <CreditCard className="h-3.5 w-3.5 text-gray-500" />
                              {t.paymentMethod}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-bold">
                            <span className={t.type === 'Entrada' ? 'text-emerald-400' : 'text-rose-400'}>
                              {t.type === 'Entrada' ? '+' : '-'} {formatBRL(t.amount)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {deleteConfirmId === t.id ? (
                              <div className="flex items-center justify-center gap-1.5 bg-[#161616] border border-white/10 p-1 rounded-xl">
                                <button
                                  onClick={() => {
                                    onDeleteTransaction(t.id);
                                    setDeleteConfirmId(null);
                                  }}
                                  className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded-lg transition-all cursor-pointer animate-pulse"
                                >
                                  Sim
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmId(null)}
                                  className="px-2 py-1 bg-white/5 border border-white/10 text-gray-400 hover:text-white text-[10px] font-bold rounded-lg transition-all cursor-pointer"
                                >
                                  Não
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirmId(t.id)}
                                className="text-gray-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                                title="Excluir Lançamento"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>

                    {filteredTransactions.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-16 text-center text-gray-500">
                          <FileSpreadsheet className="h-12 w-12 text-gray-700 mx-auto mb-2" />
                          <h4 className="font-semibold text-white text-sm">Nenhuma transação encontrada</h4>
                          <p className="text-xs text-gray-500 max-w-xs mx-auto mt-1">Gere novos lançamentos ou altere seus filtros de busca acima.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="relatorios-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Reports archive list */}
            <div className="bg-[#111111] rounded-2xl border border-white/5 shadow-xl overflow-hidden">
              <div className="p-5 border-b border-white/5">
                <h3 className="font-bold text-white text-sm font-sans flex items-center gap-2">
                  <History className="h-4 w-4 text-blue-500" />
                  Arquivo de Prestação de Contas (Cópia dos Relatórios Emitidos)
                </h3>
                <p className="text-xs text-gray-500 mt-1">Cópia idêntica e imutável de relatórios de prestação de contas emitidos para fins de auditoria e conformidade.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#1a1a1a]/60 border-b border-white/5">
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Número do Relatório</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Data e Hora de Emissão</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Movimentações</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Saldo Período</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {reports.map((report) => (
                      <tr key={report.id} className="hover:bg-white/5 transition-colors text-xs">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-mono font-bold text-blue-400">{report.reportNumber}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-gray-300 font-sans">{report.issuedAt}</span>
                          <span className="text-[10px] text-gray-500 block mt-0.5">Emitido por: {report.issuedBy}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-400 font-medium">
                          {report.transactions.length} transações inclusas
                          <div className="flex gap-2 text-[10px] mt-0.5 text-gray-500">
                            <span>Entradas: <strong className="text-emerald-500/80">{formatBRL(report.totalInflow)}</strong></span>
                            <span>•</span>
                            <span>Saídas: <strong className="text-rose-500/80">{formatBRL(report.totalOutflow)}</strong></span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right font-bold">
                          <span className={report.netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                            {formatBRL(report.netBalance)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleViewReportDetails(report)}
                              className="p-1.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                              title="Visualizar Cópia"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Visualizar
                            </button>
                            <button
                              onClick={() => handlePrintExistingReport(report)}
                              className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                              title="Imprimir Novamente"
                            >
                              <Printer className="h-3.5 w-3.5" />
                              Imprimir
                            </button>
                            {deleteReportConfirmId === report.id ? (
                              <div className="flex items-center justify-center gap-1.5 bg-[#161616] border border-white/10 p-1 rounded-xl">
                                <button
                                  onClick={() => {
                                    onDeleteReport(report.id);
                                    setDeleteReportConfirmId(null);
                                  }}
                                  className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded-lg transition-all cursor-pointer animate-pulse"
                                >
                                  Sim
                                </button>
                                <button
                                  onClick={() => setDeleteReportConfirmId(null)}
                                  className="px-2 py-1 bg-white/5 border border-white/10 text-gray-400 hover:text-white text-[10px] font-bold rounded-lg transition-all cursor-pointer"
                                >
                                  Não
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteReportConfirmId(report.id)}
                                className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                                title="Excluir Cópia"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}

                    {reports.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-16 text-center text-gray-500">
                          <History className="h-12 w-12 text-gray-700 mx-auto mb-2" />
                          <h4 className="font-semibold text-white text-sm">Nenhum relatório arquivado</h4>
                          <p className="text-xs text-gray-500 max-w-xs mx-auto mt-1">Os relatórios gerados a partir do botão "Prestar Contas" serão salvos automaticamente aqui para futura verificação.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: New Transaction Lançamento */}
      {isModalOpen && (
        <div id="transaction-modal" className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#111111] rounded-2xl shadow-2xl border border-white/10 max-w-lg w-full overflow-hidden text-gray-200"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-[#1a1a1a]/40">
              <h3 className="font-bold text-white text-base">Novo Lançamento Financeiro</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white p-1 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div className="space-y-4">
                {/* Type Selection */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Tipo de Fluxo</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setType('Entrada');
                        setCategory('Mensalidade');
                      }}
                      className={`py-2 px-4 rounded-xl border font-bold text-sm transition-all cursor-pointer ${
                        type === 'Entrada'
                          ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                          : 'bg-white/5 border-white/5 text-gray-400 hover:text-white'
                      }`}
                    >
                      Entrada (Receita)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setType('Saída');
                        setCategory('Infraestrutura');
                        setAssociateId('');
                      }}
                      className={`py-2 px-4 rounded-xl border font-bold text-sm transition-all cursor-pointer ${
                        type === 'Saída'
                          ? 'bg-rose-500/10 border-rose-500/25 text-rose-400'
                          : 'bg-white/5 border-white/5 text-gray-400 hover:text-white'
                      }`}
                    >
                      Saída (Despesa)
                    </button>
                  </div>
                </div>

                {/* Associate selection only for Entrada */}
                {type === 'Entrada' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Vincular Associado (Opcional)</label>
                    <select
                      value={associateId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAssociateId(val);
                        if (val) {
                          const matched = associates.find(a => a.id === val);
                          if (matched) {
                            setDescription(`Mensalidade de ${matched.name}`);
                            setDocument(matched.cpf);
                            setPayerReceiverName(matched.name);
                          }
                        } else {
                          setDescription('');
                          setDocument('');
                          setPayerReceiverName('');
                        }
                      }}
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="" className="bg-[#111111]">Nenhum associado vinculado</option>
                      {associates.map((assoc) => (
                        <option key={assoc.id} value={assoc.id} className="bg-[#111111]">
                          {assoc.name} ({assoc.cpf})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Descrição do Lançamento <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ex: Pagamento de mensalidade, Compra de papelaria..."
                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Nome do Pagador/Recebedor */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Nome do Pagador / Recebedor <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={payerReceiverName}
                    onChange={(e) => setPayerReceiverName(e.target.value)}
                    placeholder="Nome completo ou Razão Social"
                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* CPF or CNPJ */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">CPF ou CNPJ do Beneficiário/Pagador <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={document}
                    onChange={(e) => setDocument(maskCpfCnpj(e.target.value))}
                    placeholder="Ex: 000.000.000-00 ou 00.000.000/0000-00"
                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Amount and Category */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Valor <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={amount}
                      onChange={(e) => setAmount(maskMoney(e.target.value))}
                      placeholder="R$ 0,00"
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-right font-mono font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Categoria <span className="text-red-500">*</span></label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat} className="bg-[#111111]">{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Data (DD/MM/AAAA) <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={date}
                      onChange={(e) => setDate(maskDate(e.target.value))}
                      placeholder="DD/MM/AAAA"
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Hora (HH:MM:SS)</label>
                    <input
                      type="text"
                      value={time}
                      onChange={(e) => setTime(maskTime(e.target.value))}
                      placeholder="HH:MM:SS"
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                    />
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Forma de Pagamento</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Pix" className="bg-[#111111]">Pix</option>
                    <option value="Dinheiro em espécie" className="bg-[#111111]">Dinheiro em espécie</option>
                    <option value="Cartão de Crédito" className="bg-[#111111]">Cartão de Crédito</option>
                    <option value="Cartão de Débito" className="bg-[#111111]">Cartão de Débito</option>
                    <option value="Boleto" className="bg-[#111111]">Boleto</option>
                    <option value="Transferência Bancária" className="bg-[#111111]">Transferência Bancária</option>
                  </select>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-white/5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-white/10 rounded-xl text-xs font-semibold text-gray-400 hover:bg-white/5 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-900/20 cursor-pointer"
                >
                  Confirmar Lançamento
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Modal: Report Generation Preview & Emission */}
      {isReportModalOpen && (
        <div id="report-generation-modal" className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#111111] rounded-2xl shadow-2xl border border-white/10 max-w-2xl w-full overflow-hidden text-gray-200"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-[#1a1a1a]/40">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">Gerar Prestação de Contas (Relatório PDF)</h3>
              </div>
              <button onClick={() => setIsReportModalOpen(false)} className="text-gray-400 hover:text-white p-1 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Preview Body */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/10 text-xs text-gray-300 flex items-center gap-2.5">
                <AlertCircle className="h-5 w-5 text-emerald-400 shrink-0" />
                <p>Ao emitir o relatório, uma cópia autenticada contendo a lista atual de lançamentos será arquivada permanentemente na base de dados para futuras verificações fiscais.</p>
              </div>

              {/* Fake Document Mock View */}
              <div className="bg-white text-black p-6 rounded-xl space-y-4 border border-gray-300 font-sans shadow-lg">
                <div className="border-b-2 border-black pb-3 flex items-center justify-between gap-4">
                  {entityConfig?.logo && (
                    <img 
                      src={entityConfig.logo} 
                      alt="Logo da Entidade" 
                      className="h-12 w-12 object-cover rounded border border-gray-200 shrink-0" 
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&q=80&w=200";
                      }}
                    />
                  )}
                  <div className="text-right flex-1 space-y-0.5">
                    <h2 className="text-sm font-extrabold uppercase tracking-wide leading-tight text-gray-900">Relatório de Prestação de Contas</h2>
                    <p className="text-xs font-bold text-gray-700">{entityConfig?.name || 'UniOn - Sistema Unificado'}</p>
                    {entityConfig?.cnpj && <p className="text-[9px] font-mono text-gray-500">CNPJ: {entityConfig.cnpj}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] bg-gray-50 p-2.5 rounded border border-gray-200 font-sans">
                  <div>
                    <span className="text-gray-400 block font-semibold text-[8px] uppercase">Número de Registro</span>
                    <strong className="text-blue-700 font-mono">{reportNumber}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-semibold text-[8px] uppercase">Data e Hora de Emissão</span>
                    <strong className="text-gray-900 font-mono">{reportIssuedAt}</strong>
                  </div>
                  <div className="mt-1 col-span-1">
                    <span className="text-gray-400 block font-semibold text-[8px] uppercase">Responsável / Emissor</span>
                    <strong className="text-gray-800">Administrador</strong>
                  </div>
                  <div className="mt-1 col-span-1">
                    <span className="text-gray-400 block font-semibold text-[8px] uppercase">Filtros Aplicados</span>
                    <span className="text-gray-700 font-mono text-[9px]">Tipo: {typeFilter} | Categoria: {categoryFilter}</span>
                  </div>
                  {entityConfig && (
                    <div className="col-span-2 border-t border-gray-200 pt-1.5 mt-1.5 grid grid-cols-2 gap-2 text-[9px]">
                      <div>
                        <span className="text-gray-400 block font-semibold uppercase">Contato</span>
                        <span className="text-gray-700 font-mono">{entityConfig.email} | {entityConfig.phone}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block font-semibold uppercase">Endereço</span>
                        <span className="text-gray-700">{entityConfig.address}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mini transaction summary table */}
                <div className="text-[11px] space-y-1">
                  <span className="font-bold text-gray-700 block">Demonstrativo de Fluxo</span>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-[10px]">
                      <thead>
                        <tr className="bg-gray-100 border-b border-gray-300 text-gray-600 font-bold">
                          <th className="py-1 px-2">Tipo</th>
                          <th className="py-1 px-2">Descrição / Pagador / Recebedor</th>
                          <th className="py-1 px-2">Doc. CPF/CNPJ</th>
                          <th className="py-1 px-2 text-center">Data / Hora</th>
                          <th className="py-1 px-2 text-right">Valor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 text-gray-700">
                        {filteredTransactions.slice(0, 5).map(t => (
                          <tr key={t.id}>
                            <td className="py-1 px-2 font-bold">{t.type === 'Entrada' ? 'Receita' : 'Despesa'}</td>
                            <td className="py-1 px-2">
                              <p className="font-semibold">{t.description}</p>
                              {t.payerReceiverName && (
                                <p className="text-[9px] text-gray-500 font-medium">De/Para: {t.payerReceiverName}</p>
                              )}
                            </td>
                            <td className="py-1 px-2 font-mono">{t.document || '-'}</td>
                            <td className="py-1 px-2 text-center font-mono text-[9px] text-slate-700">
                              <span className="block">{dateToBRL(t.date)}</span>
                              <span className="block text-[8px] text-slate-500 font-semibold">{t.time || '12:00:00'}</span>
                            </td>
                            <td className="py-1 px-2 text-right font-mono">{formatBRL(t.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {filteredTransactions.length > 5 && (
                    <span className="text-[9px] text-gray-400 block text-center pt-1 font-mono">+ {filteredTransactions.length - 5} lançamentos no documento final</span>
                  )}
                </div>

                {/* Report Totals Summary */}
                <div className="border-t border-gray-300 pt-3 flex justify-between items-center text-xs font-mono">
                  <div>
                    <span className="text-gray-500 block">Total Recebido: <strong>{formatBRL(totalInflow)}</strong></span>
                    <span className="text-gray-500 block">Total Pago: <strong>{formatBRL(totalOutflow)}</strong></span>
                  </div>
                  <div className="text-right p-2 bg-gray-50 rounded border border-gray-200">
                    <span className="text-gray-500 block">Saldo Final Líquido</span>
                    <strong className={`text-sm ${netBalance >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{formatBRL(netBalance)}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/5 flex justify-end gap-3 bg-[#161616]">
              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="px-4 py-2 border border-white/10 rounded-xl text-xs font-semibold text-gray-400 hover:bg-white/5 hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  downloadPrintableReport({
                    reportNumber,
                    issuedAt: reportIssuedAt,
                    filters: { type: typeFilter, category: categoryFilter },
                    transactions: filteredTransactions,
                    totalInflow,
                    totalOutflow,
                    netBalance
                  });
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-900/20 flex items-center justify-center gap-1.5 cursor-pointer text-center"
                title="Baixar diretamente o arquivo HTML de prestação de contas pronto para impressão"
              >
                <FileText className="h-4 w-4" />
                Baixar Relatório (HTML)
              </button>
              <button
                type="button"
                onClick={handleConfirmReportEmission}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-1.5 cursor-pointer animate-pulse text-center"
                title="Salva a cópia no sistema e abre a janela de impressão do PDF formatado"
              >
                <Printer className="h-4 w-4" />
                Confirmar Emitir PDF & Salvar Cópia
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal: View archived report details copy */}
      {isReportDetailModalOpen && selectedReportCopy && (
        <div id="report-details-modal" className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#111111] rounded-2xl shadow-2xl border border-white/10 max-w-3xl w-full overflow-hidden text-gray-200"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-[#1a1a1a]/40">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-blue-400" />
                <h3 className="font-bold text-white text-base">Cópia do Relatório: {selectedReportCopy.reportNumber}</h3>
              </div>
              <button onClick={() => {
                setIsReportDetailModalOpen(false);
                setSelectedReportCopy(null);
              }} className="text-gray-400 hover:text-white p-1 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#161616] p-4 rounded-xl border border-white/5 space-y-1">
                  <span className="text-gray-500">Número do Relatório</span>
                  <p className="font-mono font-extrabold text-blue-400 text-sm">{selectedReportCopy.reportNumber}</p>
                </div>
                <div className="bg-[#161616] p-4 rounded-xl border border-white/5 space-y-1">
                  <span className="text-gray-500">Emissão Autenticada</span>
                  <p className="font-bold text-white text-sm">{selectedReportCopy.issuedAt}</p>
                </div>
                <div className="bg-[#161616] p-4 rounded-xl border border-white/5 space-y-1">
                  <span className="text-gray-500">Registrado por</span>
                  <p className="font-bold text-white text-sm">{selectedReportCopy.issuedBy}</p>
                </div>
              </div>

              {/* Table of transactions at that time */}
              <div className="bg-[#161616] p-4 rounded-xl border border-white/5 space-y-2">
                <h4 className="font-bold text-white">Transações Inclusas na Cópia</h4>
                <div className="overflow-x-auto max-h-60 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-[#1a1a1a] border-b border-white/5 text-gray-400">
                        <th className="py-2 px-3">Tipo</th>
                        <th className="py-2 px-3">Descrição / CPF/CNPJ / Nome</th>
                        <th className="py-2 px-3">Categoria / Data</th>
                        <th className="py-2 px-3 text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-gray-300">
                      {selectedReportCopy.transactions.map((t) => (
                        <tr key={t.id}>
                          <td className="py-2 px-3">
                            <span className={`font-bold ${t.type === 'Entrada' ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {t.type === 'Entrada' ? 'Receita' : 'Despesa'}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            <p className="font-bold text-white">{t.description}</p>
                            {t.payerReceiverName && (
                              <p className="text-[10px] text-gray-300 font-medium">De/Para: {t.payerReceiverName}</p>
                            )}
                            {t.document && <span className="text-[10px] text-gray-500 font-mono">CPF/CNPJ: {t.document}</span>}
                          </td>
                          <td className="py-2 px-3">
                            <p>{t.category}</p>
                            <span className="text-[10px] text-gray-500">{dateToBRL(t.date)} {t.time || ''}</span>
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold">
                            <span className={t.type === 'Entrada' ? 'text-emerald-400' : 'text-rose-400'}>
                              {formatBRL(t.amount)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div className="bg-[#161616] p-4 rounded-xl border border-white/5 flex justify-between items-center">
                <div className="space-y-1 text-gray-400">
                  <p>Total Entradas: <strong className="text-emerald-400 font-mono">{formatBRL(selectedReportCopy.totalInflow)}</strong></p>
                  <p>Total Saídas: <strong className="text-rose-400 font-mono">{formatBRL(selectedReportCopy.totalOutflow)}</strong></p>
                </div>
                <div className="text-right">
                  <span className="text-gray-500 block text-[10px] uppercase">Saldo Líquido</span>
                  <span className={`text-base font-black font-mono ${selectedReportCopy.netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatBRL(selectedReportCopy.netBalance)}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/5 flex justify-end gap-3 bg-[#161616]">
              <button
                type="button"
                onClick={() => {
                  setIsReportDetailModalOpen(false);
                  setSelectedReportCopy(null);
                }}
                className="px-4 py-2 bg-[#1a1a1a] border border-white/10 text-gray-300 rounded-xl text-xs font-semibold hover:bg-white/5 cursor-pointer"
              >
                Fechar Ficha
              </button>
              <button
                type="button"
                onClick={() => {
                  downloadPrintableReport({
                    reportNumber: selectedReportCopy.reportNumber,
                    issuedAt: selectedReportCopy.issuedAt,
                    filters: selectedReportCopy.filters,
                    transactions: selectedReportCopy.transactions as Transaction[],
                    totalInflow: selectedReportCopy.totalInflow,
                    totalOutflow: selectedReportCopy.totalOutflow,
                    netBalance: selectedReportCopy.netBalance
                  });
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer text-center"
                title="Baixar diretamente o arquivo HTML de prestação de contas pronto para impressão"
              >
                <FileText className="h-4 w-4" />
                Baixar Relatório (HTML)
              </button>
              <button
                type="button"
                onClick={() => {
                  printReportHTML({
                    reportNumber: selectedReportCopy.reportNumber,
                    issuedAt: selectedReportCopy.issuedAt,
                    filters: selectedReportCopy.filters,
                    transactions: selectedReportCopy.transactions as Transaction[],
                    totalInflow: selectedReportCopy.totalInflow,
                    totalOutflow: selectedReportCopy.totalOutflow,
                    netBalance: selectedReportCopy.netBalance
                  });
                  setIsReportDetailModalOpen(false);
                  setSelectedReportCopy(null);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer text-center"
                title="Abre a janela de impressão do PDF formatado"
              >
                <Printer className="h-4 w-4" />
                Imprimir Relatório
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* EXCLUSIVE PRINT LAYOUT SHEET (HIDDEN IN BROWSER, ONLY VISIBLE ON PRINT) */}
      {/* ======================================================================= */}
      {selectedReportCopy || isReportModalOpen || isPrintingDirectly ? (
        <div className="hidden print:block bg-white text-black p-8 font-sans w-full text-xs space-y-6">
          {/* Header */}
          <div className="border-b-2 border-black pb-4 flex items-center justify-between gap-4">
            {entityConfig?.logo && (
              <img 
                src={entityConfig.logo} 
                alt="Logo" 
                className="h-16 w-16 object-cover rounded border border-gray-300" 
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&q=80&w=200";
                }}
              />
            )}
            <div className="text-right flex-1 space-y-1">
              <h1 className="text-base font-black uppercase tracking-wider">Relatório de Prestação de Contas - Livro Caixa</h1>
              <p className="text-xs font-bold text-gray-700">{entityConfig?.name || 'UniOn - Sistema de Gestão de Associação'}</p>
              {entityConfig?.cnpj && <p className="text-[10px] font-mono text-gray-500">CNPJ: {entityConfig.cnpj}</p>}
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-md border border-gray-300 text-[10px]">
            <div>
              <span className="text-gray-500 block font-semibold uppercase text-[8px]">Código do Relatório (Autenticado):</span>
              <strong className="text-black text-sm font-mono">{selectedReportCopy ? selectedReportCopy.reportNumber : reportNumber}</strong>
            </div>
            <div>
              <span className="text-gray-500 block font-semibold uppercase text-[8px]">Data e Hora de Emissão:</span>
              <strong className="text-black font-mono">{selectedReportCopy ? selectedReportCopy.issuedAt : reportIssuedAt}</strong>
            </div>
            <div className="mt-2">
              <span className="text-gray-500 block font-semibold uppercase text-[8px]">Responsável / Emissor:</span>
              <strong className="text-black">Administrador de Finanças</strong>
            </div>
            <div className="mt-2">
              <span className="text-gray-500 block font-semibold uppercase text-[8px]">Filtros Aplicados:</span>
              <strong className="text-black font-mono">
                Tipo: {selectedReportCopy ? selectedReportCopy.filters.type : typeFilter} | 
                Categoria: {selectedReportCopy ? selectedReportCopy.filters.category : categoryFilter}
              </strong>
            </div>

            {entityConfig && (
              <div className="col-span-2 border-t border-gray-200 pt-3 mt-1 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-500 block font-semibold uppercase text-[8px]">Dados da Entidade:</span>
                  <span className="text-gray-900 font-medium">{entityConfig.name} {entityConfig.acronym ? `(${entityConfig.acronym})` : ''}</span>
                  {entityConfig.cnpj && <span className="block text-gray-600 font-mono text-[9px]">CNPJ: {entityConfig.cnpj}</span>}
                </div>
                <div>
                  <span className="text-gray-500 block font-semibold uppercase text-[8px]">Contato & Localização:</span>
                  <span className="text-gray-800 block">{entityConfig.address}</span>
                  <span className="text-gray-600 block font-mono text-[9px]">{entityConfig.email} | {entityConfig.phone}</span>
                </div>
              </div>
            )}
          </div>

          {/* Transactions Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-black border-b border-black pb-1">Lançamentos Financeiros Inclusos</h3>
            <table className="w-full text-left border-collapse text-[10px]">
              <thead>
                <tr className="border-b border-black bg-gray-50 text-black font-bold">
                  <th className="py-2 px-3 text-left">Tipo</th>
                  <th className="py-2 px-3 text-left">Descrição</th>
                  <th className="py-2 px-3 text-left">Pagador / Recebedor</th>
                  <th className="py-2 px-3 text-left">CPF/CNPJ</th>
                  <th className="py-2 px-3 text-left">Categoria</th>
                  <th className="py-2 px-3 text-left">Data / Hora</th>
                  <th className="py-2 px-3 text-left">Método</th>
                  <th className="py-2 px-3 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-300">
                {(selectedReportCopy ? selectedReportCopy.transactions : filteredTransactions).map((t) => (
                  <tr key={t.id} className="text-black">
                    <td className="py-1.5 px-3 font-bold">{t.type === 'Entrada' ? 'Receita' : 'Despesa'}</td>
                    <td className="py-1.5 px-3">{t.description}</td>
                    <td className="py-1.5 px-3 font-semibold">{t.payerReceiverName || '-'}</td>
                    <td className="py-1.5 px-3 font-mono">{t.document || '-'}</td>
                    <td className="py-1.5 px-3">{t.category}</td>
                    <td className="py-1.5 px-3 font-mono">
                      <span>{dateToBRL(t.date)} às {t.time || '12:00:00'}</span>
                    </td>
                    <td className="py-1.5 px-3">{t.paymentMethod || 'Pix'}</td>
                    <td className="py-1.5 px-3 text-right font-mono font-bold">
                      {t.type === 'Entrada' ? '+' : '-'} {formatBRL(t.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Report Totals Summary */}
          <div className="border-t-2 border-black pt-4 flex justify-between items-center text-xs">
            <div className="space-y-1 text-gray-700">
              <p>Total Receitas Inclusas: <strong>{formatBRL(selectedReportCopy ? selectedReportCopy.totalInflow : totalInflow)}</strong></p>
              <p>Total Despesas Inclusas: <strong>{formatBRL(selectedReportCopy ? selectedReportCopy.totalOutflow : totalOutflow)}</strong></p>
            </div>
            <div className="text-right p-3 bg-gray-50 rounded border border-gray-400 font-mono">
              <span className="text-gray-600 block text-[10px] uppercase font-bold">Saldo Final Líquido do Período</span>
              <strong className="text-base text-black font-black">
                {formatBRL(selectedReportCopy ? selectedReportCopy.netBalance : netBalance)}
              </strong>
            </div>
          </div>

          {/* Compliance signatures */}
          <div className="pt-16 grid grid-cols-2 gap-8 text-center text-[10px] font-mono">
            <div className="space-y-1">
              <div className="border-t border-black w-3/4 mx-auto pt-1"></div>
              <span>Assinatura do Responsável</span>
              <p className="text-gray-500">Administrador de Finanças</p>
            </div>
            <div className="space-y-1">
              <div className="border-t border-black w-3/4 mx-auto pt-1"></div>
              <span>Conselho Fiscal / Auditoria</span>
              <p className="text-gray-500">{entityConfig?.acronym || entityConfig?.name || 'Associação Certificada'}</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
