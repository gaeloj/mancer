import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, ArrowDownLeft, ArrowUpRight, Award, Briefcase, 
  Printer, Copy, Check, Sparkles, RefreshCw, Plus, Trash2, Search, Filter, ShieldCheck, Building, User, Download, FileDown, Loader2
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Associate, Transaction, EntityConfig, AttestationRecord } from '../types';
import { 
  formatBRL, maskMoney, parseMaskedMoney, dateToBRL, dateToISO, 
  maskCpfCnpj, numberToWordsBRL, formatMatricula, generateAuthCode7 
} from '../utils/formatters';
import { UnionLogo } from './UnionLogo';

interface AttestationsTabProps {
  associates: Associate[];
  clients: Associate[];
  transactions: Transaction[];
  entityConfig: EntityConfig | null;
}

export default function AttestationsTab({
  associates,
  clients,
  transactions,
  entityConfig
}: AttestationsTabProps) {
  // Active document sub-tab
  const [activeDocType, setActiveDocType] = useState<'recebimento' | 'saida' | 'filiacao' | 'servicos'>('recebimento');

  // History of generated attestations
  const [history, setHistory] = useState<AttestationRecord[]>(() => {
    try {
      const saved = localStorage.getItem('attestations_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [copiedText, setCopiedText] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [searchHistory, setSearchHistory] = useState('');

  // Common Header & Location defaults
  const entityName = entityConfig?.name || 'Associação dos Pescadores e Moradores';
  const entityCnpj = entityConfig?.cnpj || '00.000.000/0001-00';
  const entityAddress = entityConfig?.address || 'Endereço da Sede, Nº 100 - Centro';
  const entityCity = 'Sua Cidade - UF';
  const entityPhone = entityConfig?.phone || '(00) 00000-0000';
  const entityEmail = entityConfig?.email || 'contato@entidade.org.br';

  const todayBRL = dateToBRL(new Date().toISOString().split('T')[0]);

  // Editable Location & Emission Date for the document header/footer
  const [docCity, setDocCity] = useState(entityConfig?.city || 'Sua Cidade - UF');
  const [docEmissionDate, setDocEmissionDate] = useState(todayBRL);

  useEffect(() => {
    if (entityConfig?.city) {
      setDocCity(entityConfig.city);
    }
  }, [entityConfig]);

  // Form State: 1. RECEBIMENTO DE VALORES
  const [recDocNumber, setRecDocNumber] = useState(`ATEST-REC-${new Date().getFullYear()}/001`);
  const [recSelectedTransactionId, setRecSelectedTransactionId] = useState('');
  const [recPersonName, setRecPersonName] = useState('');
  const [recPersonDoc, setRecPersonDoc] = useState('');
  const [recAmount, setRecAmount] = useState('100,00');
  const [recPaymentMethod, setRecPaymentMethod] = useState('Pix');
  const [recDate, setRecDate] = useState(todayBRL);
  const [recDescription, setRecDescription] = useState('Recebimento de contribuição associativa mensal e taxa de manutenção.');
  const [recSignatoryName, setRecSignatoryName] = useState('Mário Silva dos Santos');
  const [recSignatoryRole, setRecSignatoryRole] = useState('Presidente da Diretoria Executiva');
  const [recPayerSignatoryName, setRecPayerSignatoryName] = useState('');
  const [recPayerSignatoryRole, setRecPayerSignatoryRole] = useState('Pagador / Beneficiário');

  // Form State: 2. SAÍDA DE VALORES
  const [saiDocNumber, setSaiDocNumber] = useState(`ATEST-SAI-${new Date().getFullYear()}/001`);
  const [saiSelectedTransactionId, setSaiSelectedTransactionId] = useState('');
  const [saiPersonName, setSaiPersonName] = useState('');
  const [saiPersonDoc, setSaiPersonDoc] = useState('');
  const [saiAmount, setSaiAmount] = useState('250,00');
  const [saiPaymentMethod, setSaiPaymentMethod] = useState('Transferência Bancária / Pix');
  const [saiDate, setSaiDate] = useState(todayBRL);
  const [saiDescription, setSaiDescription] = useState('Pagamento efetuado referente a aquisição de materiais e serviços de manutenção da sede.');
  const [saiSignatoryName, setSaiSignatoryName] = useState('Mário Silva dos Santos');
  const [saiSignatoryRole, setSaiSignatoryRole] = useState('Presidente / Tesoureiro');
  const [saiReceiverSignatoryName, setSaiReceiverSignatoryName] = useState('');
  const [saiReceiverSignatoryRole, setSaiReceiverSignatoryRole] = useState('Recebedor / Beneficiário');

  // Form State: 3. ATESTADO DE FILIAÇÃO
  const [filDocNumber, setFilDocNumber] = useState(`ATEST-FIL-${new Date().getFullYear()}/001`);
  const [filSelectedAssociateId, setFilSelectedAssociateId] = useState('');
  const [filAssociateName, setFilAssociateName] = useState('');
  const [filAssociateCpf, setFilAssociateCpf] = useState('');
  const [filAssociateRg, setFilAssociateRg] = useState('');
  const [filAssociateMatricula, setFilAssociateMatricula] = useState('00001');
  const [filAssociateJoiningDate, setFilAssociateJoiningDate] = useState(todayBRL);
  const [filAssociateRole, setFilAssociateRole] = useState('Associado Efetivo');
  const [filAssociateStatus, setFilAssociateStatus] = useState('Adimplente e em pleno gozo de seus direitos estatutários');
  const [filPurpose, setFilPurpose] = useState('Para fins de comprovação de vínculo associativo perante órgãos públicos, instituições financeiras e entidades parceiras.');
  const [filSignatoryName, setFilSignatoryName] = useState('Mário Silva dos Santos');
  const [filSignatoryRole, setFilSignatoryRole] = useState('Presidente da Diretoria');
  const [filAssociateSignatoryName, setFilAssociateSignatoryName] = useState('');
  const [filAssociateSignatoryRole, setFilAssociateSignatoryRole] = useState('Filiado / Beneficiário');

  // Form State: 4. PRESTAÇÃO E RECEBIMENTO DE SERVIÇOS
  const [srvDocNumber, setSrvDocNumber] = useState(`ATEST-SRV-${new Date().getFullYear()}/001`);
  const [srvProviderName, setSrvProviderName] = useState('Construtora & Serviços Gerais LTDA');
  const [srvProviderDoc, setSrvProviderDoc] = useState('12.345.678/0001-99');
  const [srvProviderAddress, setSrvProviderAddress] = useState('Rua dos Fornecedores, 450 - Centro');
  const [srvClientName, setSrvClientName] = useState(entityName);
  const [srvDescription, setSrvDescription] = useState('Serviços especializados de reforma da fachada, pintura predial e manutenção do sistema elétrico do auditório principal.');
  const [srvStartDate, setSrvStartDate] = useState('01/06/2026');
  const [srvEndDate, setSrvEndDate] = useState('20/07/2026');
  const [srvAmount, setSrvAmount] = useState('1.500,00');
  const [srvQualityText, setSrvQualityText] = useState('Atestamos e declaramos para os devidos fins de direito que os serviços acima descritos foram prestados e concluídos com total rigor técnico, plena qualidade e em inteira conformidade com as cláusulas pactuadas, nada havendo que os desqualifique.');
  const [srvSignatory1Name, setSrvSignatory1Name] = useState('Mário Silva dos Santos');
  const [srvSignatory1Role, setSrvSignatory1Role] = useState('Presidente (Contratante)');
  const [srvSignatory2Name, setSrvSignatory2Name] = useState('Carlos Henrique Souza');
  const [srvSignatory2Role, setSrvSignatory2Role] = useState('Representante do Prestador de Serviços');

  // Unique random 7-character alphanumeric authentication code for current document
  const [currentAuthCode, setCurrentAuthCode] = useState(() => generateAuthCode7());

  const handleRefreshAuthCode = () => {
    setCurrentAuthCode(generateAuthCode7());
  };

  // Sync transaction selections
  useEffect(() => {
    if (recSelectedTransactionId) {
      const tx = transactions.find(t => t.id === recSelectedTransactionId);
      if (tx) {
        setRecPersonName(tx.payerReceiverName || tx.description);
        if (tx.document) setRecPersonDoc(maskCpfCnpj(tx.document));
        setRecAmount(maskMoney((tx.amount || 0).toFixed(2)));
        if (tx.paymentMethod) setRecPaymentMethod(tx.paymentMethod);
        if (tx.date) setRecDate(dateToBRL(tx.date));
        if (tx.description) setRecDescription(tx.description);
      }
    }
  }, [recSelectedTransactionId, transactions]);

  useEffect(() => {
    if (saiSelectedTransactionId) {
      const tx = transactions.find(t => t.id === saiSelectedTransactionId);
      if (tx) {
        setSaiPersonName(tx.payerReceiverName || tx.description);
        if (tx.document) setSaiPersonDoc(maskCpfCnpj(tx.document));
        setSaiAmount(maskMoney((tx.amount || 0).toFixed(2)));
        if (tx.paymentMethod) setSaiPaymentMethod(tx.paymentMethod);
        if (tx.date) setSaiDate(dateToBRL(tx.date));
        if (tx.description) setSaiDescription(tx.description);
      }
    }
  }, [saiSelectedTransactionId, transactions]);

  // Sync associate selections
  useEffect(() => {
    if (filSelectedAssociateId) {
      const allMembers = [...associates, ...clients];
      const member = allMembers.find(m => m.id === filSelectedAssociateId);
      if (member) {
        setFilAssociateName(member.name);
        setFilAssociateCpf(maskCpfCnpj(member.cpf || ''));
        if (member.rgNumero) {
          setFilAssociateRg(`${member.rgNumero} ${member.rgOrgaoExpedidor || ''}`.trim());
        } else if (member.cinNumero) {
          setFilAssociateRg(`CIN: ${member.cinNumero}`);
        } else {
          setFilAssociateRg('');
        }
        setFilAssociateMatricula(member.matricula ? formatMatricula(member.matricula) : '00001');
        if (member.joiningDate) setFilAssociateJoiningDate(dateToBRL(member.joiningDate));
        if (member.associationRole) {
          setFilAssociateRole(member.associationRole);
        } else {
          setFilAssociateRole(member.memberType === 'Cliente' ? 'Cliente Cadastrado' : 'Associado Efetivo');
        }
        setFilAssociateStatus(
          member.financialStatus === 'Adimplente' 
            ? 'Adimplente e em pleno gozo de seus direitos estatutários'
            : 'Filiado registrado com situação financeira em regularização'
        );
      }
    }
  }, [filSelectedAssociateId, associates, clients]);

  // Save to History
  const handleSaveToHistory = () => {
    let title = '';
    let personName = '';
    let docNumPerson = '';
    let amount = 0;
    let description = '';
    let docNum = '';

    if (activeDocType === 'recebimento') {
      title = 'Atestado de Recebimento de Valores';
      personName = recPersonName || 'Não Informado';
      docNumPerson = recPersonDoc;
      amount = parseMaskedMoney(recAmount);
      description = recDescription;
      docNum = recDocNumber;
    } else if (activeDocType === 'saida') {
      title = 'Atestado de Saída / Pagamento de Valores';
      personName = saiPersonName || 'Não Informado';
      docNumPerson = saiPersonDoc;
      amount = parseMaskedMoney(saiAmount);
      description = saiDescription;
      docNum = saiDocNumber;
    } else if (activeDocType === 'filiacao') {
      title = 'Atestado de Filiação Associativa';
      personName = filAssociateName || 'Não Informado';
      docNumPerson = filAssociateCpf;
      description = `Matrícula: ${filAssociateMatricula} - ${filPurpose}`;
      docNum = filDocNumber;
    } else {
      title = 'Atestado de Prestação e Recebimento de Serviços';
      personName = srvProviderName || 'Não Informado';
      docNumPerson = srvProviderDoc;
      amount = parseMaskedMoney(srvAmount);
      description = srvDescription;
      docNum = srvDocNumber;
    }

    const finalAuthCode = currentAuthCode || generateAuthCode7();

    const newRecord: AttestationRecord = {
      id: `attest-${Date.now()}`,
      type: activeDocType,
      documentNumber: docNum,
      authCode: finalAuthCode,
      title,
      personName,
      documentNumberPerson: docNumPerson,
      amount: amount > 0 ? amount : undefined,
      date: todayBRL,
      description,
      createdAt: new Date().toISOString()
    };

    const updated = [newRecord, ...history];
    setHistory(updated);
    try {
      localStorage.setItem('attestations_history', JSON.stringify(updated));
    } catch {
      // ignore
    }

    // Generate fresh auth code for next document
    setCurrentAuthCode(generateAuthCode7());
  };

  const handleDeleteHistoryItem = (id: string) => {
    const updated = history.filter(h => h.id !== id);
    setHistory(updated);
    try {
      localStorage.setItem('attestations_history', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handlePrintDocument = () => {
    handleSaveToHistory();
    const elem = document.getElementById('printable-attestation');
    if (!elem) {
      window.print();
      return;
    }

    try {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Atestado Oficial</title>
              <script src="https://cdn.tailwindcss.com"></script>
              <style>
                @page { size: A4; margin: 15mm; }
                body {
                  background: white !important;
                  color: black !important;
                  margin: 0;
                  padding: 24px;
                  font-family: serif;
                }
                #printable-attestation {
                  box-shadow: none !important;
                  border: none !important;
                  padding: 0 !important;
                  width: 100% !important;
                }
              </style>
            </head>
            <body>
              <div id="printable-attestation">
                ${elem.innerHTML}
              </div>
              <script>
                window.onload = function() {
                  setTimeout(function() {
                    window.focus();
                    window.print();
                  }, 400);
                };
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      } else {
        window.print();
      }
    } catch (err) {
      console.error('Fallback para window.print():', err);
      window.print();
    }
  };

  const handleDownloadPDF = async () => {
    handleSaveToHistory();
    const elem = document.getElementById('printable-attestation');
    if (!elem) return;

    setIsGeneratingPDF(true);
    try {
      let docTitle = 'atestado';
      if (activeDocType === 'recebimento') docTitle = `atestado-recebimento-${recDocNumber}`;
      else if (activeDocType === 'saida') docTitle = `atestado-saida-${saiDocNumber}`;
      else if (activeDocType === 'filiacao') docTitle = `atestado-filiacao-${filDocNumber}`;
      else docTitle = `atestado-servicos-${srvDocNumber}`;

      const fileName = `${docTitle.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}.pdf`;

      let pdf: jsPDF;

      try {
        const canvas = await html2canvas(elem, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          windowWidth: 800,
          onclone: (clonedDoc) => {
            const clonedElem = clonedDoc.getElementById('printable-attestation');
            if (clonedElem) {
              clonedElem.style.width = '800px';
              clonedElem.style.maxWidth = '800px';
              clonedElem.style.padding = '40px';
              clonedElem.style.boxSizing = 'border-box';
              clonedElem.style.transform = 'none';
              clonedElem.style.borderRadius = '0';
              clonedElem.style.boxShadow = 'none';
            }
          }
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.98);
        pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
        const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm
        const imgWidth = pdfWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        if (imgHeight <= pdfHeight) {
          pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
        } else {
          let heightLeft = imgHeight;
          let position = 0;

          pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
          heightLeft -= pdfHeight;

          while (heightLeft > 0) {
            position = heightLeft - pdfHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
            heightLeft -= pdfHeight;
          }
        }
      } catch (canvasErr) {
        console.warn('html2canvas falhou, usando gerador nativo jsPDF:', canvasErr);
        // Direct jsPDF text document generation
        pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });

        const textContent = elem.innerText || '';
        pdf.setFont('times', 'normal');
        pdf.setFontSize(11);
        const margin = 15;
        const pageW = pdf.internal.pageSize.getWidth() - margin * 2;
        const lines = pdf.splitTextToSize(textContent, pageW);
        pdf.text(lines, margin, 20);
      }

      // Multiple fallback save mechanism for sandboxed browsers/iframes
      const blob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
      }, 1000);

      // Extra fallback if a.click() is blocked in sandbox iframe
      setTimeout(() => {
        try {
          pdf.save(fileName);
        } catch {
          window.open(blobUrl, '_blank');
        }
      }, 300);

    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      alert('Não foi possível gerar o PDF automaticamente. Vamos abrir a janela de impressão para salvar em PDF.');
      handlePrintDocument();
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleDownloadDocument = () => {
    handleSaveToHistory();
    const elem = document.getElementById('printable-attestation');
    if (!elem) return;

    let docTitle = 'atestado';
    if (activeDocType === 'recebimento') docTitle = `atestado-recebimento-${recDocNumber}`;
    else if (activeDocType === 'saida') docTitle = `atestado-saida-${saiDocNumber}`;
    else if (activeDocType === 'filiacao') docTitle = `atestado-filiacao-${filDocNumber}`;
    else docTitle = `atestado-servicos-${srvDocNumber}`;

    const textContent = elem.innerText;
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${docTitle.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyDocumentText = () => {
    const elem = document.getElementById('printable-attestation');
    if (elem) {
      navigator.clipboard.writeText(elem.innerText);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2500);
    }
  };

  const filteredHistory = history.filter(item => {
    const q = searchHistory.toLowerCase();
    return item.title.toLowerCase().includes(q) || 
           item.personName.toLowerCase().includes(q) || 
           item.documentNumber.toLowerCase().includes(q) ||
           (item.documentNumberPerson && item.documentNumberPerson.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-gradient-to-r from-[#18181b] via-[#1f1f23] to-[#18181b] border border-white/10 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
            <Award className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
              Atestados e Comprovantes Oficiais
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full">
                Documentos Timbrados
              </span>
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Gere, ateste e imprima declarações oficiais de recebimento, saída de valores, filiação e prestação de serviços.
            </p>
          </div>
        </div>

        {/* Print & Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 print:hidden">
          <button
            onClick={handleCopyDocumentText}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#262626] hover:bg-[#333] text-gray-200 border border-white/10 text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            {copiedText ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-gray-400" />
                <span>Copiar Texto</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            title="Baixar atestado formatado diretamente em PDF"
          >
            {isGeneratingPDF ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Gerando PDF...</span>
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4" />
                <span>Baixar PDF</span>
              </>
            )}
          </button>

          <button
            onClick={handlePrintDocument}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
            title="Imprimir ou salvar como PDF via navegador"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir</span>
          </button>

          <button
            onClick={handleDownloadDocument}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#262626] hover:bg-[#333] text-gray-200 border border-white/10 text-xs font-semibold rounded-xl transition-all cursor-pointer"
            title="Baixar atestado em formato de texto simples (.txt)"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>Texto (.txt)</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 print:hidden">
        <button
          onClick={() => setActiveDocType('recebimento')}
          className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
            activeDocType === 'recebimento'
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-md shadow-emerald-500/5'
              : 'bg-[#18181b] border-white/5 text-gray-400 hover:text-white hover:bg-[#222]'
          }`}
        >
          <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
          <span className="truncate">Recebimento de Valores</span>
        </button>

        <button
          onClick={() => setActiveDocType('saida')}
          className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
            activeDocType === 'saida'
              ? 'bg-rose-500/10 border-rose-500/40 text-rose-400 shadow-md shadow-rose-500/5'
              : 'bg-[#18181b] border-white/5 text-gray-400 hover:text-white hover:bg-[#222]'
          }`}
        >
          <ArrowUpRight className="w-4 h-4 text-rose-400" />
          <span className="truncate">Saída de Valores</span>
        </button>

        <button
          onClick={() => setActiveDocType('filiacao')}
          className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
            activeDocType === 'filiacao'
              ? 'bg-blue-500/10 border-blue-500/40 text-blue-400 shadow-md shadow-blue-500/5'
              : 'bg-[#18181b] border-white/5 text-gray-400 hover:text-white hover:bg-[#222]'
          }`}
        >
          <Award className="w-4 h-4 text-blue-400" />
          <span className="truncate">Atestado de Filiação</span>
        </button>

        <button
          onClick={() => setActiveDocType('servicos')}
          className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
            activeDocType === 'servicos'
              ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 shadow-md shadow-amber-500/5'
              : 'bg-[#18181b] border-white/5 text-gray-400 hover:text-white hover:bg-[#222]'
          }`}
        >
          <Briefcase className="w-4 h-4 text-amber-400" />
          <span className="truncate">Prestação de Serviços</span>
        </button>
      </div>

      {/* Main Container: Split View (Form Inputs on Left, Realtime Document Preview on Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Data Selection & Form Controls */}
        <div className="lg:col-span-5 space-y-4 print:hidden">
          <div className="p-4 bg-[#18181b] border border-white/10 rounded-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span>Dados do Atestado</span>
              </h3>
              <span className="text-[10px] text-gray-400 font-mono">
                {activeDocType.toUpperCase()}
              </span>
            </div>

            {/* Common Document Location & Emission Date */}
            <div className="p-3 bg-[#121214] border border-white/5 rounded-xl space-y-2">
              <div className="text-[11px] font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-blue-400" />
                <span>Local e Data de Emissão no Documento</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Cidade - UF</label>
                  <input
                    type="text"
                    value={docCity}
                    onChange={(e) => setDocCity(e.target.value)}
                    placeholder="Sua Cidade - UF"
                    className="w-full px-2.5 py-1.5 bg-[#18181b] border border-white/10 rounded-lg text-white text-xs focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Data de Emissão</label>
                  <input
                    type="text"
                    value={docEmissionDate}
                    onChange={(e) => setDocEmissionDate(e.target.value)}
                    placeholder="31/07/2026"
                    className="w-full px-2.5 py-1.5 bg-[#18181b] border border-white/10 rounded-lg text-white text-xs focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* FORM TYPE 1: RECEBIMENTO DE VALORES */}
            {activeDocType === 'recebimento' && (
              <div className="space-y-3.5 text-xs">
                {/* Auto select from transaction */}
                {transactions.filter(t => t.type === 'Entrada').length > 0 && (
                  <div>
                    <label className="block text-gray-400 font-semibold mb-1">
                      Puxar do Livro Caixa (Entradas)
                    </label>
                    <select
                      value={recSelectedTransactionId}
                      onChange={(e) => setRecSelectedTransactionId(e.target.value)}
                      className="w-full px-3 py-2 bg-[#121214] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="">-- Selecionar lançamento existente (opcional) --</option>
                      {transactions.filter(t => t.type === 'Entrada').map(tx => (
                        <option key={tx.id} value={tx.id}>
                          {tx.date} - {tx.payerReceiverName || tx.description} ({formatBRL(tx.amount)})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Nº do Documento / Registro</label>
                  <input
                    type="text"
                    value={recDocNumber}
                    onChange={(e) => setRecDocNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-[#121214] border border-white/10 rounded-xl text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Nome do Pagador / Doador / Associado *</label>
                  <input
                    type="text"
                    required
                    value={recPersonName}
                    onChange={(e) => setRecPersonName(e.target.value)}
                    placeholder="Ex: João da Silva"
                    className="w-full px-3 py-2 bg-[#121214] border border-white/10 rounded-xl text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-gray-400 font-semibold mb-1">CPF / CNPJ</label>
                    <input
                      type="text"
                      value={recPersonDoc}
                      onChange={(e) => setRecPersonDoc(maskCpfCnpj(e.target.value))}
                      placeholder="000.000.000-00"
                      className="w-full px-3 py-2 bg-[#121214] border border-white/10 rounded-xl text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 font-semibold mb-1">Valor Recebido (R$) *</label>
                    <input
                      type="text"
                      required
                      value={recAmount}
                      onChange={(e) => setRecAmount(maskMoney(e.target.value))}
                      className="w-full px-3 py-2 bg-[#121214] border border-white/10 rounded-xl text-emerald-400 font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-gray-400 font-semibold mb-1">Forma de Pagamento</label>
                    <select
                      value={recPaymentMethod}
                      onChange={(e) => setRecPaymentMethod(e.target.value)}
                      className="w-full px-3 py-2 bg-[#121214] border border-white/10 rounded-xl text-white"
                    >
                      <option value="Pix">Pix</option>
                      <option value="Transferência Bancária">Transferência Bancária</option>
                      <option value="Boleto Bancário">Boleto Bancário</option>
                      <option value="Dinheiro em Espécie">Dinheiro em Espécie</option>
                      <option value="Cartão de Débito/Crédito">Cartão de Débito/Crédito</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-400 font-semibold mb-1">Data do Recebimento</label>
                    <input
                      type="text"
                      value={recDate}
                      onChange={(e) => setRecDate(e.target.value)}
                      className="w-full px-3 py-2 bg-[#121214] border border-white/10 rounded-xl text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Descrição / Finalidade / Referente a *</label>
                  <textarea
                    rows={3}
                    value={recDescription}
                    onChange={(e) => setRecDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-[#121214] border border-white/10 rounded-xl text-white"
                  />
                </div>

                <div className="space-y-2 pt-2 border-t border-white/5">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-gray-400 font-semibold mb-1">Signatário Entidade (Recebedor)</label>
                      <input
                        type="text"
                        value={recSignatoryName}
                        onChange={(e) => setRecSignatoryName(e.target.value)}
                        className="w-full px-3 py-2 bg-[#121214] border border-white/10 rounded-xl text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 font-semibold mb-1">Cargo / Função</label>
                      <input
                        type="text"
                        value={recSignatoryRole}
                        onChange={(e) => setRecSignatoryRole(e.target.value)}
                        className="w-full px-3 py-2 bg-[#121214] border border-white/10 rounded-xl text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-gray-400 font-semibold mb-1">Signatário Pagador (Opcional)</label>
                      <input
                        type="text"
                        placeholder={recPersonName || 'Nome do Pagador'}
                        value={recPayerSignatoryName}
                        onChange={(e) => setRecPayerSignatoryName(e.target.value)}
                        className="w-full px-3 py-2 bg-[#121214] border border-white/10 rounded-xl text-white placeholder-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 font-semibold mb-1">Cargo / Posição Pagador</label>
                      <input
                        type="text"
                        value={recPayerSignatoryRole}
                        onChange={(e) => setRecPayerSignatoryRole(e.target.value)}
                        className="w-full px-3 py-2 bg-[#121214] border border-white/10 rounded-xl text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* FORM TYPE 2: SAÍDA DE VALORES */}
            {activeDocType === 'saida' && (
              <div className="space-y-3.5 text-xs">
                {/* Auto select from transaction */}
                {transactions.filter(t => t.type === 'Saída').length > 0 && (
                  <div>
                    <label className="block text-gray-400 font-semibold mb-1">
                      Puxar do Livro Caixa (Saídas)
                    </label>
                    <select
                      value={saiSelectedTransactionId}
                      onChange={(e) => setSaiSelectedTransactionId(e.target.value)}
                      className="w-full px-3 py-2 bg-[#121214] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                    >
                      <option value="">-- Selecionar saída existente (opcional) --</option>
                      {transactions.filter(t => t.type === 'Saída').map(tx => (
                        <option key={tx.id} value={tx.id}>
                          {tx.date} - {tx.payerReceiverName || tx.description} ({formatBRL(tx.amount)})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Nº do Documento / Registro</label>
                  <input
                    type="text"
                    value={saiDocNumber}
                    onChange={(e) => setSaiDocNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-[#121214] border border-white/10 rounded-xl text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Nome do Favorecido / Credor / Fornecedor *</label>
                  <input
                    type="text"
                    required
                    value={saiPersonName}
                    onChange={(e) => setSaiPersonName(e.target.value)}
                    placeholder="Ex: Empresa ou Prestador X"
                    className="w-full px-3 py-2 bg-[#121214] border border-white/10 rounded-xl text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-gray-400 font-semibold mb-1">CPF / CNPJ</label>
                    <input
                      type="text"
                      value={saiPersonDoc}
                      onChange={(e) => setSaiPersonDoc(maskCpfCnpj(e.target.value))}
                      placeholder="00.000.000/0001-00"
                      className="w-full px-3 py-2 bg-[#121214] border border-white/10 rounded-xl text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 font-semibold mb-1">Valor Pago / Saída (R$) *</label>
                    <input
                      type="text"
                      required
                      value={saiAmount}
                      onChange={(e) => setSaiAmount(maskMoney(e.target.value))}
                      className="w-full px-3 py-2 bg-[#121214] border border-white/10 rounded-xl text-rose-400 font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-gray-400 font-semibold mb-1">Meio de Pagamento</label>
                    <select
                      value={saiPaymentMethod}
                      onChange={(e) => setSaiPaymentMethod(e.target.value)}
                      className="w-full px-3 py-2 bg-[#121214] border border-white/10 rounded-xl text-white"
                    >
                      <option value="Transferência Bancária / Pix">Transferência Bancária / Pix</option>
                      <option value="Boleto Bancário">Boleto Bancário</option>
                      <option value="Cheque Nominal">Cheque Nominal</option>
                      <option value="Dinheiro em Espécie">Dinheiro em Espécie</option>
                      <option value="Cartão Corporativo">Cartão Corporativo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-400 font-semibold mb-1">Data do Pagamento</label>
                    <input
                      type="text"
                      value={saiDate}
                      onChange={(e) => setSaiDate(e.target.value)}
                      className="w-full px-3 py-2 bg-[#121214] border border-white/10 rounded-xl text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Motivo / Descrição / Referente a *</label>
                  <textarea
                    rows={3}
                    value={saiDescription}
                    onChange={(e) => setSaiDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-[#121214] border border-white/10 rounded-xl text-white"
                  />
                </div>

                <div className="space-y-2 pt-2 border-t border-white/5">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-gray-400 font-semibold mb-1">Signatário Entidade (Pagador)</label>
                      <input
                        type="text"
                        value={saiSignatoryName}
                        onChange={(e) => setSaiSignatoryName(e.target.value)}
                        className="w-full px-3 py-2 bg-[#121214] border border-white/10 rounded-xl text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 font-semibold mb-1">Cargo / Função</label>
                      <input
                        type="text"
                        value={saiSignatoryRole}
                        onChange={(e) => setSaiSignatoryRole(e.target.value)}
                        className="w-full px-3 py-2 bg-[#121214] border border-white/10 rounded-xl text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-gray-400 font-semibold mb-1">Signatário Recebedor / Favorecido</label>
                      <input
                        type="text"
                        placeholder={saiPersonName || 'Nome do Recebedor'}
                        value={saiReceiverSignatoryName}
                        onChange={(e) => setSaiReceiverSignatoryName(e.target.value)}
                        className="w-full px-3 py-2 bg-[#121214] border border-white/10 rounded-xl text-white placeholder-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 font-semibold mb-1">Cargo / Posição Recebedor</label>
                      <input
                        type="text"
                        value={saiReceiverSignatoryRole}
                        onChange={(e) => setSaiReceiverSignatoryRole(e.target.value)}
                        className="w-full px-3 py-2 bg-[#121214] border border-white/10 rounded-xl text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* FORM TYPE 3: ATESTADO DE FILIAÇÃO */}
            {activeDocType === 'filiacao' && (
              <div className="space-y-3.5 text-xs">
                {/* Auto select associate */}
                <div>
                  <label className="block text-gray-400 font-semibold mb-1">
                    Puxar da Lista de Cadastrados (Associados / Clientes)
                  </label>
                  <select
                    value={filSelectedAssociateId}
                    onChange={(e) => setFilSelectedAssociateId(e.target.value)}
                    className="w-full px-3 py-2 bg-[#121214] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">-- Selecionar da lista ou digitar abaixo --</option>
                    <optgroup label="Associados">
                      {associates.map(a => (
                        <option key={a.id} value={a.id}>
                          Matrícula {a.matricula || '---'} - {a.name} ({a.cpf})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Clientes">
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>
                          Matrícula {c.matricula || '---'} - {c.name} ({c.cpf})
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Nº do Documento / Registro</label>
                  <input
                    type="text"
                    value={filDocNumber}
                    onChange={(e) => setFilDocNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-[#121214] border border-white/10 rounded-xl text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Nome Completo do Filiado *</label>
                  <input
                    type="text"
                    required
                    value={filAssociateName}
                    onChange={(e) => setFilAssociateName(e.target.value)}
                    placeholder="Nome do Associado"
                    className="w-full px-3 py-2 bg-[#121214] border border-white/10 rounded-xl text-white font-semibold"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-gray-400 font-semibold mb-1">CPF</label>
                    <input
                      type="text"
                      value={filAssociateCpf}
                      onChange={(e) => setFilAssociateCpf(maskCpfCnpj(e.target.value))}
                      className="w-full px-3 py-2 bg-[#121214] border border-white/10 rounded-xl text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 font-semibold mb-1">RG / CIN</label>
                    <input
                      type="text"
                      value={filAssociateRg}
                      onChange={(e) => setFilAssociateRg(e.target.value)}
                      placeholder="Nº/Órgão"
                      className="w-full px-3 py-2 bg-[#121214] border border-white/10 rounded-xl text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 font-semibold mb-1">Matrícula (5d)</label>
                    <input
                      type="text"
                      value={filAssociateMatricula}
                      onChange={(e) => setFilAssociateMatricula(formatMatricula(e.target.value))}
                      className="w-full px-3 py-2 bg-[#121214] border border-white/10 rounded-xl text-blue-400 font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-gray-400 font-semibold mb-1">Data de Filiação</label>
                    <input
                      type="text"
                      value={filAssociateJoiningDate}
                      onChange={(e) => setFilAssociateJoiningDate(e.target.value)}
                      className="w-full px-3 py-2 bg-[#121214] border border-white/10 rounded-xl text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 font-semibold mb-1">Cargo / Função Associativa</label>
                    <input
                      type="text"
                      value={filAssociateRole}
                      onChange={(e) => setFilAssociateRole(e.target.value)}
                      placeholder="Ex: Associado Efetivo"
                      className="w-full px-3 py-2 bg-[#121214] border border-white/10 rounded-xl text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Situação Estatutária / Regularidade</label>
                  <input
                    type="text"
                    value={filAssociateStatus}
                    onChange={(e) => setFilAssociateStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-[#121214] border border-white/10 rounded-xl text-white"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Finalidade do Atestado *</label>
                  <textarea
                    rows={3}
                    value={filPurpose}
                    onChange={(e) => setFilPurpose(e.target.value)}
                    className="w-full px-3 py-2 bg-[#121214] border border-white/10 rounded-xl text-white"
                  />
                </div>

                <div className="space-y-2 pt-2 border-t border-white/5">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-gray-400 font-semibold mb-1">Signatário Entidade (Presidente / Diretoria)</label>
                      <input
                        type="text"
                        value={filSignatoryName}
                        onChange={(e) => setFilSignatoryName(e.target.value)}
                        className="w-full px-3 py-2 bg-[#121214] border border-white/10 rounded-xl text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 font-semibold mb-1">Cargo / Função</label>
                      <input
                        type="text"
                        value={filSignatoryRole}
                        onChange={(e) => setFilSignatoryRole(e.target.value)}
                        className="w-full px-3 py-2 bg-[#121214] border border-white/10 rounded-xl text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-gray-400 font-semibold mb-1">Signatário Filiado / Titular</label>
                      <input
                        type="text"
                        placeholder={filAssociateName || 'Nome do Filiado'}
                        value={filAssociateSignatoryName}
                        onChange={(e) => setFilAssociateSignatoryName(e.target.value)}
                        className="w-full px-3 py-2 bg-[#121214] border border-white/10 rounded-xl text-white placeholder-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 font-semibold mb-1">Cargo / Posição Filiado</label>
                      <input
                        type="text"
                        value={filAssociateSignatoryRole}
                        onChange={(e) => setFilAssociateSignatoryRole(e.target.value)}
                        className="w-full px-3 py-2 bg-[#121214] border border-white/10 rounded-xl text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* FORM TYPE 4: PRESTAÇÃO E RECEBIMENTO DE SERVIÇOS */}
            {activeDocType === 'servicos' && (
              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Nº do Documento / Registro</label>
                  <input
                    type="text"
                    value={srvDocNumber}
                    onChange={(e) => setSrvDocNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-[#121214] border border-white/10 rounded-xl text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Prestador dos Serviços (Razão Social / Nome) *</label>
                  <input
                    type="text"
                    required
                    value={srvProviderName}
                    onChange={(e) => setSrvProviderName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#121214] border border-white/10 rounded-xl text-white font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-gray-400 font-semibold mb-1">CNPJ / CPF do Prestador</label>
                    <input
                      type="text"
                      value={srvProviderDoc}
                      onChange={(e) => setSrvProviderDoc(maskCpfCnpj(e.target.value))}
                      className="w-full px-3 py-2 bg-[#121214] border border-white/10 rounded-xl text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 font-semibold mb-1">Valor Contratado / Total (R$)</label>
                    <input
                      type="text"
                      value={srvAmount}
                      onChange={(e) => setSrvAmount(maskMoney(e.target.value))}
                      className="w-full px-3 py-2 bg-[#121214] border border-white/10 rounded-xl text-amber-400 font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Tomador dos Serviços (Entidade / Cliente)</label>
                  <input
                    type="text"
                    value={srvClientName}
                    onChange={(e) => setSrvClientName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#121214] border border-white/10 rounded-xl text-white"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Descrição Detalhada dos Serviços Executados *</label>
                  <textarea
                    rows={3}
                    value={srvDescription}
                    onChange={(e) => setSrvDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-[#121214] border border-white/10 rounded-xl text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-gray-400 font-semibold mb-1">Data de Início</label>
                    <input
                      type="text"
                      value={srvStartDate}
                      onChange={(e) => setSrvStartDate(e.target.value)}
                      className="w-full px-3 py-2 bg-[#121214] border border-white/10 rounded-xl text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 font-semibold mb-1">Data de Término / Conclusão</label>
                    <input
                      type="text"
                      value={srvEndDate}
                      onChange={(e) => setSrvEndDate(e.target.value)}
                      className="w-full px-3 py-2 bg-[#121214] border border-white/10 rounded-xl text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Declaração de Qualidade e Recebimento</label>
                  <textarea
                    rows={3}
                    value={srvQualityText}
                    onChange={(e) => setSrvQualityText(e.target.value)}
                    className="w-full px-3 py-2 bg-[#121214] border border-white/10 rounded-xl text-white"
                  />
                </div>

                <div className="space-y-2 pt-2 border-t border-white/5">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-gray-400 font-semibold mb-1">Signatário 1 (Entidade)</label>
                      <input
                        type="text"
                        value={srvSignatory1Name}
                        onChange={(e) => setSrvSignatory1Name(e.target.value)}
                        className="w-full px-3 py-2 bg-[#121214] border border-white/10 rounded-xl text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 font-semibold mb-1">Cargo / Posição</label>
                      <input
                        type="text"
                        value={srvSignatory1Role}
                        onChange={(e) => setSrvSignatory1Role(e.target.value)}
                        className="w-full px-3 py-2 bg-[#121214] border border-white/10 rounded-xl text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-gray-400 font-semibold mb-1">Signatário 2 (Prestador)</label>
                      <input
                        type="text"
                        value={srvSignatory2Name}
                        onChange={(e) => setSrvSignatory2Name(e.target.value)}
                        className="w-full px-3 py-2 bg-[#121214] border border-white/10 rounded-xl text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 font-semibold mb-1">Cargo / Posição</label>
                      <input
                        type="text"
                        value={srvSignatory2Role}
                        onChange={(e) => setSrvSignatory2Role(e.target.value)}
                        className="w-full px-3 py-2 bg-[#121214] border border-white/10 rounded-xl text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Official Timbrado Document Live Preview */}
        <div className="lg:col-span-7">
          <div className="bg-white text-gray-900 rounded-2xl shadow-2xl p-8 border border-gray-200 relative overflow-hidden" id="printable-attestation">
            
            {/* OFFICIAL HEADER / TIMBRADO */}
            <div className="text-center pb-6 border-b-2 border-gray-900 mb-6 relative">
              <div className="flex items-center justify-between gap-4 mb-3">
                <div className="w-16 h-16 flex items-center justify-center">
                  {entityConfig?.logo ? (
                    <img src={entityConfig.logo} alt="Logo" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <UnionLogo size={56} />
                  )}
                </div>

                <div className="text-center flex-1">
                  <h1 className="text-lg font-black uppercase text-gray-900 tracking-wider">
                    {entityName}
                  </h1>
                  <p className="text-[11px] font-bold text-gray-700 tracking-wide mt-0.5">
                    CNPJ: {entityCnpj}
                  </p>
                  <p className="text-[10px] text-gray-600 mt-0.5">
                    {entityAddress} | Tel: {entityPhone}
                  </p>
                  <p className="text-[10px] text-gray-500 font-mono">
                    {entityEmail}
                  </p>
                </div>

                <div className="text-right text-[10px] font-mono font-bold text-gray-500 border border-gray-300 rounded px-2 py-1">
                  <div>REGISTRO OFICIAL</div>
                  <div className="text-gray-900 font-bold">
                    {activeDocType === 'recebimento' && recDocNumber}
                    {activeDocType === 'saida' && saiDocNumber}
                    {activeDocType === 'filiacao' && filDocNumber}
                    {activeDocType === 'servicos' && srvDocNumber}
                  </div>
                </div>
              </div>
            </div>

            {/* DOCUMENT TITLE */}
            <div className="text-center my-8">
              <h2 className="text-xl font-black uppercase text-gray-900 tracking-widest border-b-2 border-gray-300 pb-2 inline-block">
                {activeDocType === 'recebimento' && 'ATESTADO DE RECEBIMENTO DE VALORES'}
                {activeDocType === 'saida' && 'ATESTADO DE SAÍDA E PAGAMENTO DE VALORES'}
                {activeDocType === 'filiacao' && 'ATESTADO DE FILIAÇÃO E QUITAÇÃO ASSOCIATIVA'}
                {activeDocType === 'servicos' && 'ATESTADO DE PRESTAÇÃO E RECEBIMENTO DE SERVIÇOS'}
              </h2>
            </div>

            {/* DOCUMENT BODY CONTENT */}
            <div className="text-sm leading-relaxed text-gray-800 space-y-6 my-8 text-justify font-serif">
              
              {/* BODY 1: RECEBIMENTO */}
              {activeDocType === 'recebimento' && (
                <>
                  <p>
                    Atestamos e declaramos para os devidos fins de direito, sob as penas da lei, que esta instituição jurídica <strong className="font-bold text-gray-900">{entityName}</strong>, inscrita no CNPJ/MF sob o nº <strong className="font-bold text-gray-900">{entityCnpj}</strong>, recebeu formalmente do(a) Sr(a). / Entidade <strong className="font-bold text-gray-900">{recPersonName || '________________________'}</strong>
                    {recPersonDoc && <>, portador(a) do CPF/CNPJ nº <strong className="font-bold text-gray-900">{recPersonDoc}</strong></>}, a quantia exata e integral de <strong className="font-bold text-gray-900">R$ {recAmount || '0,00'}</strong> ({numberToWordsBRL(parseMaskedMoney(recAmount))}).
                  </p>

                  <p>
                    O referido pagamento foi efetuado na data de <strong className="font-bold text-gray-900">{recDate}</strong> através da modalidade <strong className="font-bold text-gray-900">{recPaymentMethod}</strong>, destinado ao seguinte propósito:
                  </p>

                  <div className="p-4 bg-gray-50 border-l-4 border-gray-900 font-sans text-xs my-4 rounded-r">
                    <span className="font-bold block text-gray-900 uppercase text-[10px] mb-1">Histórico / Descrição:</span>
                    <p className="italic text-gray-800">{recDescription || 'Sem especificação informada.'}</p>
                  </div>

                  <p>
                    Por ser verdade e ter sido dada a devida quitação do valor acima especificado, firmamos o presente atestado de recebimento para que produza os devidos e legais efeitos.
                  </p>
                </>
              )}

              {/* BODY 2: SAÍDA */}
              {activeDocType === 'saida' && (
                <>
                  <p>
                    Atestamos e declaramos para todos os fins de comprovação financeira, contábil e fiscal que a entidade <strong className="font-bold text-gray-900">{entityName}</strong>, inscrita no CNPJ sob o nº <strong className="font-bold text-gray-900">{entityCnpj}</strong>, efetuou o pagamento/saída de valores em favor de <strong className="font-bold text-gray-900">{saiPersonName || '________________________'}</strong>
                    {saiPersonDoc && <>, inscrito(a) no CPF/CNPJ nº <strong className="font-bold text-gray-900">{saiPersonDoc}</strong></>}, no montante total de <strong className="font-bold text-gray-900">R$ {saiAmount || '0,00'}</strong> ({numberToWordsBRL(parseMaskedMoney(saiAmount))}).
                  </p>

                  <p>
                    A operação financeira foi concretizada em <strong className="font-bold text-gray-900">{saiDate}</strong> via <strong className="font-bold text-gray-900">{saiPaymentMethod}</strong>, com a seguinte fundamentação e destinação contábil:
                  </p>

                  <div className="p-4 bg-gray-50 border-l-4 border-gray-900 font-sans text-xs my-4 rounded-r">
                    <span className="font-bold block text-gray-900 uppercase text-[10px] mb-1">Motivo / Descrição da Despesa:</span>
                    <p className="italic text-gray-800">{saiDescription || 'Sem especificação informada.'}</p>
                  </div>

                  <p>
                    Declaramos que o presente comprovante possui respaldo em documentos comprobatórios idôneos arquivados junto à Tesouraria desta instituição.
                  </p>
                </>
              )}

              {/* BODY 3: FILIAÇÃO */}
              {activeDocType === 'filiacao' && (
                <>
                  <p>
                    Atestamos e declaramos com fé pública e para os devidos fins de direito que o(a) Sr(a). <strong className="font-bold text-gray-900">{filAssociateName || '________________________'}</strong>
                    {filAssociateCpf && <>, inscrito(a) no CPF nº <strong className="font-bold text-gray-900">{filAssociateCpf}</strong></>}
                    {filAssociateRg && <>, possuidor(a) do documento de identidade {filAssociateRg}</>}, encontra-se devidamente <strong className="font-bold text-gray-900">FILIADO(A) E REGISTRADO(A)</strong> nos quadros sociais desta entidade sob o número de Matrícula <strong className="font-bold text-gray-900 font-mono">№ {filAssociateMatricula}</strong> desde a data de <strong className="font-bold text-gray-900">{filAssociateJoiningDate}</strong>.
                  </p>

                  <p>
                    O(A) referido(a) filiado(a) exerce a função/condição de <strong className="font-bold text-gray-900">{filAssociateRole}</strong> e encontra-se na seguinte situação estatutária:
                  </p>

                  <div className="p-4 bg-[#f4f4f5] border-l-4 border-blue-600 font-sans text-xs my-4 rounded-r">
                    <span className="font-bold block text-blue-900 uppercase text-[10px] mb-1">Regularidade Associativa:</span>
                    <p className="font-bold text-gray-900">{filAssociateStatus}</p>
                  </div>

                  <p>
                    Expede-se este atestado a pedido do(a) interessado(a) com a finalidade de:
                  </p>

                  <p className="italic bg-gray-50 p-3 rounded border border-gray-200 font-sans text-xs">
                    "{filPurpose || 'Para todos os fins de direito.'}"
                  </p>
                </>
              )}

              {/* BODY 4: PRESTAÇÃO E RECEBIMENTO DE SERVIÇOS */}
              {activeDocType === 'servicos' && (
                <>
                  <p>
                    Atestamos e declaramos para os devidos fins de comprovação técnica, administrativa e contratual que o prestador de serviços <strong className="font-bold text-gray-900">{srvProviderName || '________________________'}</strong>
                    {srvProviderDoc && <>, inscrito(a) no CNPJ/CPF nº <strong className="font-bold text-gray-900">{srvProviderDoc}</strong></>}
                    {srvProviderAddress && <>, com sede/endereço em {srvProviderAddress}</>}, prestou a esta instituição <strong className="font-bold text-gray-900">{srvClientName}</strong> os serviços discriminados a seguir:
                  </p>

                  <div className="p-4 bg-gray-50 border border-gray-200 font-sans text-xs my-4 rounded">
                    <div className="font-bold text-gray-900 uppercase text-[10px] mb-1">Detalhamento dos Serviços Prestados:</div>
                    <p className="text-gray-800">{srvDescription}</p>
                    
                    <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-gray-300 font-mono text-[11px]">
                      <div>
                        <span className="text-gray-600 block text-[9px] uppercase">Período de Execução:</span>
                        <strong>{srvStartDate} a {srvEndDate}</strong>
                      </div>
                      <div>
                        <span className="text-gray-600 block text-[9px] uppercase">Valor Total do Contrato:</span>
                        <strong className="text-gray-900">R$ {srvAmount}</strong> ({numberToWordsBRL(parseMaskedMoney(srvAmount))})
                      </div>
                    </div>
                  </div>

                  <p className="italic">
                    "{srvQualityText}"
                  </p>
                </>
              )}
            </div>

            {/* DATE AND SIGNATURES */}
            <div className="mt-12 pt-6 border-t border-gray-300">
              <div className="text-right text-xs font-serif text-gray-700 mb-12">
                {docCity}{docCity && docEmissionDate ? ', ' : ''}{docEmissionDate}.
              </div>

              {/* SIGNATURE BLOCK */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-end text-center text-xs font-sans">
                {activeDocType === 'recebimento' && (
                  <>
                    <div>
                      <div className="border-b border-gray-900 w-3/4 mx-auto mb-1.5"></div>
                      <div className="font-bold text-gray-900">{recSignatoryName}</div>
                      <div className="text-gray-600 text-[10px]">{recSignatoryRole}</div>
                      <div className="text-gray-500 text-[9px] font-mono">{entityName} (Recebedor)</div>
                    </div>
                    <div>
                      <div className="border-b border-gray-900 w-3/4 mx-auto mb-1.5"></div>
                      <div className="font-bold text-gray-900">{recPayerSignatoryName || recPersonName || '________________________'}</div>
                      <div className="text-gray-600 text-[10px]">{recPayerSignatoryRole}</div>
                      <div className="text-gray-500 text-[9px] font-mono">Assinatura do Pagador ou Beneficiário</div>
                    </div>
                  </>
                )}

                {activeDocType === 'saida' && (
                  <>
                    <div>
                      <div className="border-b border-gray-900 w-3/4 mx-auto mb-1.5"></div>
                      <div className="font-bold text-gray-900">{saiSignatoryName}</div>
                      <div className="text-gray-600 text-[10px]">{saiSignatoryRole}</div>
                      <div className="text-gray-500 text-[9px] font-mono">{entityName} (Pagador)</div>
                    </div>
                    <div>
                      <div className="border-b border-gray-900 w-3/4 mx-auto mb-1.5"></div>
                      <div className="font-bold text-gray-900">{saiReceiverSignatoryName || saiPersonName || '________________________'}</div>
                      <div className="text-gray-600 text-[10px]">{saiReceiverSignatoryRole}</div>
                      <div className="text-gray-500 text-[9px] font-mono">Assinatura do Recebedor ou Beneficiário</div>
                    </div>
                  </>
                )}

                {activeDocType === 'filiacao' && (
                  <>
                    <div>
                      <div className="border-b border-gray-900 w-3/4 mx-auto mb-1.5"></div>
                      <div className="font-bold text-gray-900">{filSignatoryName}</div>
                      <div className="text-gray-600 text-[10px]">{filSignatoryRole}</div>
                      <div className="text-gray-500 text-[9px] font-mono">{entityName}</div>
                    </div>
                    <div>
                      <div className="border-b border-gray-900 w-3/4 mx-auto mb-1.5"></div>
                      <div className="font-bold text-gray-900">{filAssociateSignatoryName || filAssociateName || '________________________'}</div>
                      <div className="text-gray-600 text-[10px]">{filAssociateSignatoryRole}</div>
                      <div className="text-gray-500 text-[9px] font-mono">Assinatura do Filiado ou Beneficiário</div>
                    </div>
                  </>
                )}

                {activeDocType === 'servicos' && (
                  <>
                    <div>
                      <div className="border-b border-gray-900 w-3/4 mx-auto mb-1.5"></div>
                      <div className="font-bold text-gray-900">{srvSignatory1Name}</div>
                      <div className="text-gray-600 text-[10px]">{srvSignatory1Role}</div>
                      <div className="text-gray-500 text-[9px] font-mono">{entityName}</div>
                    </div>

                    <div>
                      <div className="border-b border-gray-900 w-3/4 mx-auto mb-1.5"></div>
                      <div className="font-bold text-gray-900">{srvSignatory2Name}</div>
                      <div className="text-gray-600 text-[10px]">{srvSignatory2Role}</div>
                      <div className="text-gray-500 text-[9px] font-mono">{srvProviderName}</div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* FOOTER AUTHENTICITY BADGE */}
            <div className="mt-12 pt-4 border-t border-gray-200 flex items-center justify-between text-[9px] text-gray-500 font-mono">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Documento emitido eletronicamente via Sistema de Gestão UniOn</span>
              </div>
              <div className="flex items-center gap-2">
                <span>Código de Autenticidade (7 dígitos):</span>
                <strong className="text-gray-900 font-mono text-[10px] bg-gray-100 px-2 py-0.5 rounded border border-gray-300 font-extrabold tracking-wider">{currentAuthCode}</strong>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* HISTÓRICO DE ATESTADOS EMITIDOS */}
      <div className="p-5 bg-[#18181b] border border-white/10 rounded-2xl space-y-4 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <span>Histórico de Atestados e Declarados Emitidos</span>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Registros salvos localmente no sistema para auditoria e re-impressão.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-500" />
            <input
              type="text"
              value={searchHistory}
              onChange={(e) => setSearchHistory(e.target.value)}
              placeholder="Buscar histórico..."
              className="w-full pl-8 pr-3 py-1.5 bg-[#121214] border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none"
            />
          </div>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="text-center py-8 text-xs text-gray-500">
            Nenhum atestado foi registrado no histórico ainda. Ao imprimir ou salvar, os registros aparecerão aqui.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-[#121214] text-gray-400 font-semibold border-b border-white/10">
                <tr>
                  <th className="p-3">Nº Registro</th>
                  <th className="p-3">Código Autenticidade</th>
                  <th className="p-3">Tipo de Atestado</th>
                  <th className="p-3">Titular / Beneficiário</th>
                  <th className="p-3">Valor (R$)</th>
                  <th className="p-3">Data</th>
                  <th className="p-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredHistory.map((item) => {
                  const itemAuthCode = item.authCode || `UNION-${(item.documentNumber || '001').replace(/[^a-zA-Z0-9]/g, '')}-9842`;
                  return (
                    <tr key={item.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-3 font-mono font-bold text-blue-400">{item.documentNumber}</td>
                      <td className="p-3 font-mono">
                        <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded">
                          {itemAuthCode}
                        </span>
                      </td>
                      <td className="p-3 font-medium text-white">{item.title}</td>
                      <td className="p-3">
                        <div className="font-semibold text-gray-200">{item.personName}</div>
                        {item.documentNumberPerson && (
                          <div className="text-[10px] text-gray-500 font-mono">{item.documentNumberPerson}</div>
                        )}
                      </td>
                      <td className="p-3 font-mono font-semibold">
                        {item.amount ? formatBRL(item.amount) : '---'}
                      </td>
                      <td className="p-3 text-gray-400">{item.date}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleDeleteHistoryItem(item.id)}
                          className="p-1.5 hover:bg-red-500/20 text-gray-500 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                          title="Excluir histórico"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
