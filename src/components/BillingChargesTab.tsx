import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { 
  Receipt, Plus, Search, Filter, Calendar, DollarSign, 
  Send, CheckCircle, Clock, AlertTriangle, XCircle, Printer, 
  Copy, FileText, QrCode, Users, UserCheck, Trash2, Check,
  ChevronRight, ArrowUpRight, Sparkles, AlertCircle, ShieldAlert,
  Download, Image as ImageIcon, FileDown, Share2, ShieldCheck,
  UploadCloud, Link, X, ArrowLeft
} from 'lucide-react';
import { Associate, Charge, EntityConfig, Transaction } from '../types';
import { dateToBRL } from '../utils/formatters';

interface BillingChargesTabProps {
  associates: Associate[];
  clients: Associate[];
  charges: Charge[];
  entityConfig: EntityConfig | null;
  onAddCharge: (charge: Charge) => void;
  onUpdateCharge: (charge: Charge) => void;
  onDeleteCharge: (id: string) => void;
  onAddTransaction?: (transaction: Omit<Transaction, 'id'>) => void;
}

export function generateAuthCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const getChunk = (n: number) => Array.from({ length: n }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  return `AUTH-${getChunk(4)}-${getChunk(4)}-${getChunk(4)}`;
}

export function getAuthCodeForCharge(charge: Charge): string {
  if (charge.authCode) return charge.authCode;
  let hash = 0;
  const str = (charge.id || '') + (charge.codeNumber || '');
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const absHash = Math.abs(hash);
  const part1 = chars[(absHash % 36)] + chars[((absHash >> 3) % 36)] + chars[((absHash >> 6) % 36)] + chars[((absHash >> 9) % 36)];
  const part2 = chars[((absHash >> 12) % 36)] + chars[((absHash >> 15) % 36)] + chars[((absHash >> 18) % 36)] + chars[((absHash >> 21) % 36)];
  const part3 = chars[((absHash >> 24) % 36)] + chars[((absHash >> 27) % 36)] + chars[((absHash >> 30) % 36)] + chars[((absHash >> 2) % 36)];
  return `AUTH-${part1}-${part2}-${part3}`;
}

function convertDriveUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  const matchD = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (matchD && matchD[1]) {
    return `https://drive.google.com/uc?export=view&id=${matchD[1]}`;
  }
  const matchId = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (matchId && matchId[1]) {
    return `https://drive.google.com/uc?export=view&id=${matchId[1]}`;
  }
  return trimmed;
}

function QrCodeImagePicker({
  value,
  onChange,
  label = "Imagem do QR Code Personalizado (Upload ou Link)"
}: {
  value: string;
  onChange: (val: string) => void;
  label?: string;
}) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione um arquivo de imagem válido (PNG, JPG, etc).');
        return;
      }
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          onChange(evt.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione um arquivo de imagem válido (PNG, JPG, etc).');
        return;
      }
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          onChange(evt.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const activeUrl = value ? convertDriveUrl(value) : '';

  return (
    <div className="space-y-2">
      <label className="block text-[11px] font-semibold text-gray-300">
        {label}
      </label>

      {value ? (
        <div className="flex items-center gap-3 bg-[#111111] border border-blue-500/30 rounded-xl p-2.5">
          <div className="h-14 w-14 bg-white p-1 rounded-lg shrink-0 border border-gray-200 flex items-center justify-center overflow-hidden">
            <img
              src={activeUrl}
              alt="QR Code Personalizado"
              className="h-full w-full object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle className="h-3.5 w-3.5" /> QR Code Personalizado Definido
            </span>
            <p className="text-[10px] text-gray-400 truncate mt-0.5">
              {value.startsWith('data:') ? 'Imagem carregada por Upload' : value}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onChange('')}
            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
            title="Remover QR Code personalizado"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-3 text-center transition-colors cursor-pointer relative ${
              isDragging
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-white/10 hover:border-blue-400/50 bg-[#111111]'
            }`}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <div className="flex flex-col items-center justify-center gap-1 text-gray-400">
              <UploadCloud className="h-5 w-5 text-blue-400" />
              <span className="text-[11px] text-gray-300 font-medium">
                Arraste o QR Code verdadeiro aqui ou <strong className="text-blue-400 underline">clique para procurar</strong>
              </span>
              <span className="text-[9px] text-gray-500">
                Formatos suportados: PNG, JPG, WEBP, SVG
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Link className="h-3.5 w-3.5 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Ou cole o link da imagem / Google Drive..."
                className="w-full bg-[#111111] border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InvoicePrintableDocument({ 
  charge, 
  entityConfig, 
  elementId, 
  onCopyPix 
}: { 
  charge: Charge; 
  entityConfig?: EntityConfig | null; 
  elementId: string; 
  onCopyPix?: (key: string) => void; 
}) {
  const pixKey = charge.pixKey || entityConfig?.cnpj || '00.000.000/0001-00';
  const qrData = encodeURIComponent(charge.barcode || pixKey);
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}`;
  const activeQrCodeUrl = charge.customQrCodeUrl ? convertDriveUrl(charge.customQrCodeUrl) : qrCodeUrl;

  const fullAddress = [entityConfig?.address, entityConfig?.city].filter(Boolean).join(' - ');
  const contactInfo = [entityConfig?.phone, entityConfig?.email].filter(Boolean).join(' • ');

  const showPix = charge.includePixCode !== false;
  const isPhysical = charge.invoiceType === 'fisica';
  const authCodeDisplay = getAuthCodeForCharge(charge);

  return (
    <div 
      id={elementId} 
      className="bg-white text-gray-900 w-full max-w-[210mm] min-h-[297mm] p-6 sm:p-10 font-sans mx-auto border border-gray-300 rounded-sm shadow-lg text-xs flex flex-col justify-between space-y-5 box-border relative my-0"
      style={{ width: '100%', maxWidth: '210mm', minHeight: '297mm' }}
    >
      <div className="space-y-5 flex-1">
        {/* A4 DOCUMENT HEADER INDICATOR */}
        <div className="flex justify-between items-center border-b border-gray-200 pb-2 text-[9px] text-gray-400 uppercase font-semibold">
          <span>Formato A4 • Documento Oficial de Cobrança {isPhysical ? '(Fatura Física)' : '(Fatura Digital)'}</span>
          <span>Via do Sacado / Entidade</span>
        </div>

        {/* INSTITUTIONAL HEADER BAR */}
        <div className="bg-slate-900 text-white p-5 rounded-xl flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3.5 pr-2">
            {entityConfig?.logo ? (
              <img src={entityConfig.logo} alt="Logo" crossOrigin="anonymous" className="h-12 w-auto object-contain bg-white p-1 rounded-lg shrink-0" />
            ) : (
              <div className="h-12 w-12 bg-blue-600 text-white font-black rounded-lg flex items-center justify-center text-lg shadow-inner shrink-0">
                {entityConfig?.acronym || 'ENT'}
              </div>
            )}
            <div>
              <h2 className="font-extrabold text-sm sm:text-base leading-snug tracking-tight text-white">{entityConfig?.name || 'Entidade / Associação'}</h2>
              <p className="text-slate-300 text-[11px] font-medium">CNPJ: {entityConfig?.cnpj || '00.000.000/0001-00'}</p>
              {fullAddress && (
                <p className="text-slate-300 text-[10px] leading-snug mt-0.5 whitespace-normal break-words">
                  {fullAddress}
                </p>
              )}
              {contactInfo && (
                <p className="text-slate-400 text-[9px] leading-tight mt-0.5">
                  {contactInfo}
                </p>
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="inline-block bg-blue-500/20 border border-blue-400/40 text-blue-200 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full mb-1">
              Cobrança Oficial {isPhysical ? '• Física' : ''}
            </div>
            <div className="font-mono text-white font-black text-sm">{charge.codeNumber}</div>
            <div className="text-[9px] font-mono text-blue-200/90 mt-0.5 tracking-wider">
              Autenticação: <span className="font-bold text-amber-300">{authCodeDisplay}</span>
            </div>
          </div>
        </div>

        {/* DATES & STATUS BAR */}
        <div className="grid grid-cols-3 gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Data de Emissão</span>
            <span className="font-bold text-slate-800 text-xs">{dateToBRL(charge.issueDate)}</span>
          </div>
          <div className="border-x border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Data de Vencimento</span>
            <span className="font-black text-red-600 text-xs">{dateToBRL(charge.dueDate)}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Situação</span>
            <span className={`inline-block font-extrabold text-[11px] uppercase ${charge.status === 'Pago' ? 'text-emerald-700' : charge.status === 'Vencido' ? 'text-red-700' : 'text-amber-700'}`}>
              {charge.status === 'Pago' ? 'PAGO' : charge.status === 'Vencido' ? 'EM ATRASO' : charge.status.toUpperCase()}
            </span>
          </div>
        </div>

        {/* SACADO / PAGADOR */}
        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h4 className="font-extrabold text-slate-700 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-slate-500" />
              Dados do Sacado / Pagador
            </h4>
            <span className="px-2 py-0.5 bg-slate-200 text-slate-700 font-bold text-[10px] rounded-full uppercase">
              {charge.recipientType}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
            <div>
              <span className="text-slate-500 text-[10px] uppercase block font-medium">Nome do Pagador:</span>
              <strong className="text-slate-900 font-bold text-sm block">{charge.recipientName}</strong>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase block font-medium">Documento (CPF / CNPJ):</span>
              <strong className="text-slate-900 font-bold block font-mono">{charge.recipientDocument || 'Não informado'}</strong>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase block font-medium">E-mail de Contato:</span>
              <span className="text-slate-800 font-medium">{charge.recipientEmail || 'Não informado'}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase block font-medium">Telefone / WhatsApp:</span>
              <span className="text-slate-800 font-medium font-mono">{charge.recipientPhone || 'Não informado'}</span>
            </div>
          </div>
        </div>

        {/* DETALHAMENTO DA COBRANÇA */}
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="bg-slate-100 border-b border-slate-200 px-4 py-2.5 flex justify-between items-center">
            <span className="font-extrabold text-slate-700 uppercase text-[10px] tracking-wider">
              Detalhamento da Cobrança / Serviço
            </span>
            <span className="text-[10px] font-bold text-slate-500">Ref: {charge.codeNumber}</span>
          </div>
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3">Descrição do Item</th>
                <th className="p-3 text-right">Valor (R$)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              <tr>
                <td className="p-3.5">
                  <strong className="block text-slate-900 text-xs font-bold">{charge.title}</strong>
                  {charge.description && (
                    <p className="text-slate-500 text-[11px] mt-0.5 leading-relaxed">{charge.description}</p>
                  )}
                </td>
                <td className="p-3.5 text-right font-black text-sm text-slate-900">
                  R$ {charge.amount.toFixed(2)}
                </td>
              </tr>
            </tbody>
            <tfoot className="bg-slate-900 text-white font-extrabold">
              <tr>
                <td className="p-3.5 text-right uppercase text-xs tracking-wider">Valor Total a Pagar:</td>
                <td className="p-3.5 text-right text-base text-emerald-400 font-black">
                  R$ {charge.amount.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* INSTRUÇÕES PIX (SE includePixCode !== false) */}
        {showPix ? (
          <div className="border-2 border-blue-600/30 bg-blue-50/50 rounded-xl p-4 sm:p-5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-3 border-b border-blue-200/80 pb-2">
              <div className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-blue-700" />
                <h4 className="font-extrabold text-blue-950 text-xs uppercase tracking-wider">
                  Instruções e Dados de Pagamento via PIX
                </h4>
              </div>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                Pagamento Instantâneo
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              <div className="sm:col-span-2 space-y-2.5 text-xs">
                {/* INFORMAÇÕES DO RECEBEDOR E BANCO */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-white/90 border border-blue-200 rounded-xl p-2.5 shadow-sm text-[11px]">
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Favorecido / Recebedor:</span>
                    <strong className="text-slate-900 font-bold block leading-snug whitespace-normal break-words">{charge.receiverName || entityConfig?.name || 'Associação / Entidade'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Instituição / Banco:</span>
                    <strong className="text-slate-900 font-bold block leading-snug whitespace-normal break-words">{charge.receiverBank || 'Não especificado'}</strong>
                  </div>
                </div>

                <div>
                  <span className="text-slate-600 text-[10px] uppercase font-bold block mb-1">
                    Chave PIX da Entidade (CNPJ / Chave Direta):
                  </span>
                  <div className="flex items-center justify-between gap-2 bg-white border border-blue-300 rounded-xl p-2.5 shadow-sm">
                    <span className="font-mono text-slate-900 font-black text-xs sm:text-sm truncate">{pixKey}</span>
                    {onCopyPix && (
                      <button
                        type="button"
                        onClick={() => onCopyPix(pixKey)}
                        className="px-2.5 py-1 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-[11px] font-bold shrink-0 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Copy className="h-3 w-3" /> Copiar Chave
                      </button>
                    )}
                  </div>
                </div>

                {charge.pixCopiaECola && (
                  <div>
                    <span className="text-slate-600 text-[10px] uppercase font-bold block mb-1">
                      Código PIX Copia e Cola:
                    </span>
                    <div className="flex items-center justify-between gap-2 bg-emerald-50 border border-emerald-300 rounded-xl p-2.5 shadow-sm">
                      <span className="font-mono text-slate-800 text-[10px] sm:text-xs break-all line-clamp-2 select-all font-semibold">
                        {charge.pixCopiaECola}
                      </span>
                      {onCopyPix && (
                        <button
                          type="button"
                          onClick={() => onCopyPix(charge.pixCopiaECola!)}
                          className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[11px] font-bold shrink-0 transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                        >
                          <Copy className="h-3 w-3" /> Copiar Código PIX
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <ol className="list-decimal list-inside text-[11px] text-slate-600 space-y-1 bg-white/60 p-2.5 rounded-lg border border-blue-100">
                  <li>Abra o aplicativo do seu banco ({charge.receiverBank || 'sua instituição'})</li>
                  <li>Acesse a opção <strong>PIX</strong> &gt; <strong>Pagar com Chave ou QR Code</strong></li>
                  <li>Confira o valor de <strong>R$ {charge.amount.toFixed(2)}</strong> e o favorecido <strong>({charge.receiverName || entityConfig?.name || 'Entidade'})</strong></li>
                </ol>
              </div>

              <div className="flex flex-col items-center justify-center p-2.5 bg-white border border-blue-200 rounded-xl text-center shadow-sm">
                <img
                  src={activeQrCodeUrl}
                  alt="QR Code PIX"
                  crossOrigin="anonymous"
                  className="h-28 w-28 object-contain rounded"
                  onError={(e) => {
                    if ((e.target as HTMLImageElement).src !== qrCodeUrl) {
                      (e.target as HTMLImageElement).src = qrCodeUrl;
                    }
                  }}
                />
                <span className="text-[9px] font-bold text-slate-600 uppercase mt-1">
                  Escaneie o QR Code
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="border border-slate-200 bg-slate-50 rounded-xl p-4 text-xs space-y-1.5">
            <span className="font-extrabold text-slate-700 uppercase text-[10px] tracking-wider block">
              Instruções de Pagamento (Tesouraria / Secretaria)
            </span>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Efetue o pagamento diretamente na tesouraria da entidade ou solicite as contas bancárias para transferência com a administração.
            </p>
          </div>
        )}

        {/* LOCAL DE ASSINATURA E RECIBO PARA FATURA FÍSICA */}
        {isPhysical && (
          <div className="border-2 border-slate-300 bg-slate-50/80 rounded-xl p-4 mt-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-extrabold text-slate-800 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-slate-600" />
                Termo de Recebimento & Assinatura (Fatura Física)
              </span>
              <span className="text-[10px] text-slate-500 font-bold uppercase bg-slate-200 px-2 py-0.5 rounded-full">
                Via Física de Cobrança
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div className="text-center space-y-1">
                <div className="border-b-2 border-slate-400 w-full min-h-[40px] flex items-end justify-center pb-1">
                  <span className="text-[10px] text-slate-400 italic">Assinatura do Sacado / Pagador</span>
                </div>
                <p className="font-bold text-slate-800 text-[11px] mt-1">{charge.recipientName}</p>
                <p className="text-slate-500 text-[9px]">CPF/CNPJ: {charge.recipientDocument || 'Não informado'}</p>
              </div>

              <div className="text-center space-y-1">
                <div className="border-b-2 border-slate-400 w-full min-h-[40px] flex items-end justify-center pb-1">
                  <span className="text-[10px] text-slate-400 italic">Assinatura / Carimbo da Tesouraria</span>
                </div>
                <p className="font-bold text-slate-800 text-[11px] mt-1">{entityConfig?.name || 'Tesouraria / Secretaria'}</p>
                <p className="text-slate-500 text-[9px]">Data de Recebimento: ____ / ____ / ________</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* INSTITUTIONAL FOOTER */}
      <div className="border-t border-slate-200 pt-3 text-center space-y-1 text-[10px] text-slate-500 mt-auto">
        <p className="font-semibold text-slate-700">
          Documento Oficial gerado por {entityConfig?.name || 'UniOn Sistema de Gestão'}.
        </p>
        <p className="font-mono text-[9px] text-slate-600 font-bold tracking-wider">
          CÓDIGO DE AUTENTICAÇÃO DIGITAL: <span className="text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{authCodeDisplay}</span>
        </p>
        <p>
          Após a confirmação do pagamento, a baixa é realizada no sistema. Dúvidas contatar a tesouraria/secretaria da entidade.
        </p>
      </div>
    </div>
  );
}

export default function BillingChargesTab({
  associates,
  clients,
  charges,
  entityConfig,
  onAddCharge,
  onUpdateCharge,
  onDeleteCharge,
  onAddTransaction
}: BillingChargesTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Pendente' | 'Pago' | 'Vencido' | 'Cancelado'>('Todos');
  const [typeFilter, setTypeFilter] = useState<'Todos' | 'Associado' | 'Cliente'>('Todos');

  // Modals
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [selectedChargeForInvoice, setSelectedChargeForInvoice] = useState<Charge | null>(null);
  const [selectedChargeForSend, setSelectedChargeForSend] = useState<Charge | null>(null);
  const [selectedChargeForDelete, setSelectedChargeForDelete] = useState<Charge | null>(null);
  const [exportingCharge, setExportingCharge] = useState<Charge | null>(null);
  const [sendPhone, setSendPhone] = useState('');
  const [sendCustomMessage, setSendCustomMessage] = useState('');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Helper to Export Invoice as PDF
  const handleExportPDF = async (charge: Charge) => {
    setIsExporting(true);
    setExportingCharge(charge);
    try {
      // Pause briefly to ensure React mounts offscreen element with target charge
      await new Promise((resolve) => setTimeout(resolve, 200));

      const element = document.getElementById('offscreen-printable-invoice') 
        || document.getElementById(`printable-invoice-${charge.id}`) 
        || document.getElementById('printable-invoice');

      if (!element) {
        alert('Visualização da fatura não disponível para gerar PDF.');
        setIsExporting(false);
        setExportingCharge(null);
        return;
      }

      const canvas = await html2canvas(element, { 
        scale: 2, 
        useCORS: true, 
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 1200
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, Math.min(imgHeight, pdfHeight));
      pdf.save(`Fatura_${charge.codeNumber}_${charge.recipientName.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      alert('Ocorreu um erro ao gerar o arquivo PDF da fatura.');
    } finally {
      setIsExporting(false);
      setExportingCharge(null);
    }
  };

  // Helper to Export Invoice as Image (PNG/JPEG)
  const handleExportImage = async (charge: Charge, format: 'png' | 'jpeg' = 'png') => {
    setIsExporting(true);
    setExportingCharge(charge);
    try {
      await new Promise((resolve) => setTimeout(resolve, 200));

      const element = document.getElementById('offscreen-printable-invoice') 
        || document.getElementById(`printable-invoice-${charge.id}`) 
        || document.getElementById('printable-invoice');

      if (!element) {
        alert('Visualização da fatura não disponível para gerar imagem.');
        setIsExporting(false);
        setExportingCharge(null);
        return;
      }

      const canvas = await html2canvas(element, { 
        scale: 2, 
        useCORS: true, 
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 1200
      });

      const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
      const imgData = canvas.toDataURL(mimeType, 1.0);
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `Fatura_${charge.codeNumber}_${charge.recipientName.replace(/\s+/g, '_')}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Erro ao gerar Imagem:', err);
      alert('Ocorreu um erro ao gerar a imagem da fatura.');
    } finally {
      setIsExporting(false);
      setExportingCharge(null);
    }
  };

  // Helper for Direct Download from Table
  const handleDownloadDirect = async (charge: Charge) => {
    await handleExportPDF(charge);
  };

  // Helper for Printing Invoice
  const handlePrintInvoice = (charge: Charge) => {
    const element = document.getElementById(`printable-invoice-${charge.id}`) || document.getElementById('printable-invoice');
    if (!element) {
      alert('Fatura não encontrada para impressão.');
      return;
    }

    const printWindow = window.open('', '_blank', 'width=900,height=1200');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Fatura ${charge.codeNumber} - ${charge.recipientName}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @page {
                size: A4 portrait;
                margin: 0;
              }
              html, body {
                margin: 0;
                padding: 0;
                background: #ffffff;
                color: #000000;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              body {
                width: 210mm;
                min-height: 297mm;
                padding: 8mm;
                box-sizing: border-box;
                margin: 0 auto;
                font-family: system-ui, -apple-system, sans-serif;
              }
              @media print {
                body {
                  width: 210mm;
                  height: 297mm;
                  padding: 8mm;
                  margin: 0 auto;
                }
              }
            </style>
          </head>
          <body>
            <div style="width: 100%; max-width: 210mm; min-height: 297mm; margin: 0 auto;">
              ${element.innerHTML}
            </div>
            <script>
              setTimeout(() => {
                window.print();
                window.close();
              }, 500);
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } else {
      window.print();
    }
  };

  // Send WhatsApp and Auto-Download Invoice Image
  const handleSendWhatsAppAndDownloadImage = async (charge: Charge, format: 'png' | 'jpeg' = 'png') => {
    if (!sendPhone.trim()) {
      alert('Por favor, informe um número de telefone com DDD para envio via WhatsApp.');
      return;
    }
    // First download image so user can attach it
    await handleExportImage(charge, format);
    // Then open WhatsApp chat
    handleExecuteSendWhatsApp();
  };

  // New Charge Form State
  const [recipientType, setRecipientType] = useState<'Associado' | 'Cliente'>('Associado');
  const [selectedRecipientId, setSelectedRecipientId] = useState('');
  const [chargeTitle, setChargeTitle] = useState('');
  const [chargeDescription, setChargeDescription] = useState('');
  const [chargeAmount, setChargeAmount] = useState<number>(entityConfig?.monthlyFee || 10);
  const [dueDate, setDueDate] = useState(() => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 10);
    return nextWeek.toISOString().split('T')[0];
  });
  const [paymentMethod, setPaymentMethod] = useState('PIX');
  const [pixKey, setPixKey] = useState(entityConfig?.cnpj || '00.000.000/0001-00');
  const [receiverName, setReceiverName] = useState(entityConfig?.name || '');
  const [receiverBank, setReceiverBank] = useState('Banco do Brasil');
  const [customQrCodeUrl, setCustomQrCodeUrl] = useState('');
  const [chargeNotes, setChargeNotes] = useState('Pagamento referente a serviços e contribuições sociais.');
  const [includePixCode, setIncludePixCode] = useState<boolean>(true);
  const [pixCopiaECola, setPixCopiaECola] = useState('');
  const [invoiceType, setInvoiceType] = useState<'digital' | 'fisica'>('digital');

  // Batch Charge Form State
  const [batchTargetGroup, setBatchTargetGroup] = useState<'Associados Ativos' | 'Todos os Associados' | 'Inadimplentes' | 'Clientes'>('Associados Ativos');
  const [batchTitle, setBatchTitle] = useState('Mensalidade de ' + new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' }));
  const [batchAmount, setBatchAmount] = useState<number>(entityConfig?.monthlyFee || 10);
  const [batchDueDate, setBatchDueDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 10);
    return date.toISOString().split('T')[0];
  });
  const [batchPixKey, setBatchPixKey] = useState(entityConfig?.cnpj || '00.000.000/0001-00');
  const [batchReceiverName, setBatchReceiverName] = useState(entityConfig?.name || '');
  const [batchReceiverBank, setBatchReceiverBank] = useState('Banco do Brasil');
  const [batchCustomQrCodeUrl, setBatchCustomQrCodeUrl] = useState('');
  const [batchIncludePixCode, setBatchIncludePixCode] = useState<boolean>(true);
  const [batchPixCopiaECola, setBatchPixCopiaECola] = useState('');
  const [batchInvoiceType, setBatchInvoiceType] = useState<'digital' | 'fisica'>('digital');

  const allRecipients = recipientType === 'Associado' ? associates : clients;

  // Filtered charges
  const filteredCharges = charges.filter(c => {
    const matchesSearch = 
      c.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.codeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.recipientDocument.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'Todos' || c.status === statusFilter;
    const matchesType = typeFilter === 'Todos' || c.recipientType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Calculate statistics
  const totalEmitted = charges.reduce((acc, c) => acc + (Number(c.amount) || 0), 0);
  const pendingCharges = charges.filter(c => c.status === 'Pendente');
  const totalPending = pendingCharges.reduce((acc, c) => acc + (Number(c.amount) || 0), 0);
  
  const paidCharges = charges.filter(c => c.status === 'Pago');
  const totalPaid = paidCharges.reduce((acc, c) => acc + (Number(c.amount) || 0), 0);

  const expiredCharges = charges.filter(c => {
    if (c.status === 'Pago' || c.status === 'Cancelado') return false;
    const today = new Date().toISOString().split('T')[0];
    return c.dueDate < today;
  });
  const totalExpired = expiredCharges.reduce((acc, c) => acc + (Number(c.amount) || 0), 0);

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2500);
  };

  // Submit Single Charge
  const handleCreateSingleCharge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecipientId) {
      alert('Por favor, selecione um destinatário.');
      return;
    }

    const recipient = allRecipients.find(r => r.id === selectedRecipientId);
    if (!recipient) return;

    const count = charges.length + 1;
    const codeNumber = `COB-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`;
    const todayStr = new Date().toISOString().split('T')[0];

    const newCharge: Charge = {
      id: `charge-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      codeNumber,
      recipientId: recipient.id,
      recipientName: recipient.name,
      recipientType: recipientType,
      recipientDocument: recipient.cpf || 'Não informado',
      recipientEmail: recipient.email || '',
      recipientPhone: recipient.phone || '',
      title: chargeTitle.trim(),
      description: chargeDescription.trim(),
      amount: Number(chargeAmount) || 0,
      issueDate: todayStr,
      dueDate: dueDate,
      status: 'Pendente',
      paymentMethod: paymentMethod,
      pixKey: pixKey.trim() || entityConfig?.cnpj || '00.000.000/0001-00',
      receiverName: receiverName.trim() || entityConfig?.name || '',
      receiverBank: receiverBank.trim() || '',
      customQrCodeUrl: customQrCodeUrl.trim() || undefined,
      barcode: `34191.${Math.floor(10000 + Math.random() * 90000)} ${Math.floor(10000 + Math.random() * 90000)}.${Math.floor(100000 + Math.random() * 900000)} ${Math.floor(10000 + Math.random() * 90000)}.${Math.floor(100000 + Math.random() * 900000)} 1 ${Math.floor(10000000000000 + Math.random() * 90000000000000)}`,
      includePixCode: includePixCode,
      pixCopiaECola: includePixCode ? (pixCopiaECola.trim() || undefined) : undefined,
      invoiceType: invoiceType,
      authCode: generateAuthCode(),
      createdAt: new Date().toISOString(),
      notes: chargeNotes
    };

    onAddCharge(newCharge);
    setIsNewModalOpen(false);
    setSelectedChargeForInvoice(newCharge);
    
    // Reset form
    setChargeTitle('');
    setChargeDescription('');
    setSelectedRecipientId('');
    setCustomQrCodeUrl('');
    setPixCopiaECola('');
  };

  // Submit Batch Charges
  const handleCreateBatchCharges = (e: React.FormEvent) => {
    e.preventDefault();
    let targets: Associate[] = [];

    if (batchTargetGroup === 'Associados Ativos') {
      targets = associates.filter(a => a.status === 'Ativo');
    } else if (batchTargetGroup === 'Todos os Associados') {
      targets = associates;
    } else if (batchTargetGroup === 'Inadimplentes') {
      targets = associates.filter(a => a.financialStatus === 'Inadimplente' || a.financialStatus === 'Zona de Perigo');
    } else if (batchTargetGroup === 'Clientes') {
      targets = clients;
    }

    if (targets.length === 0) {
      alert('Nenhum destinatário encontrado no grupo selecionado.');
      return;
    }

    if (!confirm(`Confirma a emissão de ${targets.length} cobranças no valor de R$ ${batchAmount.toFixed(2)} cada?`)) {
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    let startIdx = charges.length + 1;

    targets.forEach((recipient, idx) => {
      const codeNumber = `COB-${new Date().getFullYear()}-${String(startIdx + idx).padStart(3, '0')}`;
      const isClient = batchTargetGroup === 'Clientes';

      const newCharge: Charge = {
        id: `charge-batch-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        codeNumber,
        recipientId: recipient.id,
        recipientName: recipient.name,
        recipientType: isClient ? 'Cliente' : 'Associado',
        recipientDocument: recipient.cpf || 'Não informado',
        recipientEmail: recipient.email || '',
        recipientPhone: recipient.phone || '',
        title: batchTitle.trim(),
        description: `Cobrança emitida em lote para ${recipient.name}.`,
        amount: Number(batchAmount) || 0,
        issueDate: todayStr,
        dueDate: batchDueDate,
        status: 'Pendente',
        paymentMethod: 'PIX',
        pixKey: batchPixKey.trim() || entityConfig?.cnpj || '00.000.000/0001-00',
        receiverName: batchReceiverName.trim() || entityConfig?.name || '',
        receiverBank: batchReceiverBank.trim() || '',
        customQrCodeUrl: batchCustomQrCodeUrl.trim() || undefined,
        barcode: `34191.${Math.floor(10000 + Math.random() * 90000)} ${Math.floor(10000 + Math.random() * 90000)}.${Math.floor(100000 + Math.random() * 900000)} ${Math.floor(10000 + Math.random() * 90000)}.${Math.floor(100000 + Math.random() * 900000)} 1 ${Math.floor(10000000000000 + Math.random() * 90000000000000)}`,
        includePixCode: batchIncludePixCode,
        pixCopiaECola: batchIncludePixCode ? (batchPixCopiaECola.trim() || undefined) : undefined,
        invoiceType: batchInvoiceType,
        authCode: generateAuthCode(),
        createdAt: new Date().toISOString(),
        notes: 'Emissão em lote via painel administrativo.'
      };

      onAddCharge(newCharge);
    });

    setIsBatchModalOpen(false);
    setBatchCustomQrCodeUrl('');
    setBatchPixCopiaECola('');
    alert(`${targets.length} cobranças foram emitidas com sucesso!`);
  };

  // Mark Charge as Paid
  const handleMarkAsPaid = (charge: Charge) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const updatedCharge: Charge = {
      ...charge,
      status: 'Pago',
      paidAt: todayStr
    };

    onUpdateCharge(updatedCharge);

    // Optionally record to Cash Book / Transactions if provided
    if (onAddTransaction) {
      if (confirm(`Deseja registrar uma entrada de R$ ${charge.amount.toFixed(2)} no Livro Caixa referente a esta cobrança?`)) {
        onAddTransaction({
          description: `Recebimento - Cobrança ${charge.codeNumber} (${charge.recipientName})`,
          amount: charge.amount,
          type: 'Entrada',
          date: todayStr,
          time: new Date().toLocaleTimeString('pt-BR'),
          category: 'Mensalidade/Cobrança',
          paymentMethod: charge.paymentMethod || 'PIX',
          document: charge.recipientDocument,
          payerReceiverName: charge.recipientName,
          createdBy: 'Administrador'
        });
      }
    }
  };

  // Open Send Charge Modal
  const handleOpenSendModal = (charge: Charge) => {
    setSelectedChargeForSend(charge);
    setSendPhone(charge.recipientPhone || '');
    
    const pixValue = charge.pixKey || entityConfig?.cnpj || 'Chave PIX da Entidade';
    const receiverText = charge.receiverName || entityConfig?.name || 'Entidade / Associação';
    const bankText = charge.receiverBank ? ` (Banco: ${charge.receiverBank})` : '';
    const authCode = getAuthCodeForCharge(charge);

    let pixCopiaEColaBlock = '';
    if (charge.includePixCode !== false && charge.pixCopiaECola) {
      pixCopiaEColaBlock = `\n\n📋 *PIX Copia e Cola:*\n${charge.pixCopiaECola.trim()}`;
    }

    const msg = `Olá *${charge.recipientName}*,

Informamos que consta em nosso sistema um *VALOR EM ABERTO* para pagamento junto à *${receiverText}*:

📌 *Cobrança:* ${charge.title}
🔢 *Código da Fatura:* ${charge.codeNumber}
🔐 *Código de Autenticação:* ${authCode}
💰 *Valor em Aberto:* R$ ${charge.amount.toFixed(2)}
📅 *Data de Vencimento:* ${dateToBRL(charge.dueDate)}

🏢 *Recebedor / Favorecido:* ${receiverText}${bankText}
🔑 *Chave PIX:* ${pixValue}${pixCopiaEColaBlock}

Por gentileza, efetue o pagamento até o vencimento. Caso já tenha realizado a quitação, favor desconsiderar esta notificação ou encaminhar o comprovante.

Qualquer dúvida, estamos à disposição!`;
    setSendCustomMessage(msg);
  };

  // Execute Send WhatsApp
  const handleExecuteSendWhatsApp = () => {
    if (!sendPhone.trim()) {
      alert('Por favor, informe um número de telefone com DDD para envio via WhatsApp.');
      return;
    }

    const cleanPhone = sendPhone.replace(/\D/g, '');
    const phoneWithDDD = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
    
    const url = `https://api.whatsapp.com/send?phone=${phoneWithDDD}&text=${encodeURIComponent(sendCustomMessage)}`;
    window.open(url, '_blank');
  };

  // Execute Send Email
  const handleExecuteSendEmail = () => {
    if (!selectedChargeForSend) return;
    const email = selectedChargeForSend.recipientEmail || '';
    if (!email) {
      alert('Este destinatário não possui e-mail cadastrado.');
      return;
    }
    const subject = `Cobrança ${selectedChargeForSend.codeNumber} - ${selectedChargeForSend.title}`;
    const body = sendCustomMessage;
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, '_blank');
  };

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (!selectedChargeForDelete) return;
    const chargeId = selectedChargeForDelete.id;
    onDeleteCharge(chargeId);
    if (selectedChargeForInvoice?.id === chargeId) {
      setSelectedChargeForInvoice(null);
    }
    setSelectedChargeForDelete(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Header */}
      <div className="bg-[#111111] border border-white/5 rounded-2xl p-5 md:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Módulo Financeiro
              </span>
              <span className="text-gray-500 text-xs">• emissão de faturas e mensalidades</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
              <Receipt className="h-6 w-6 text-blue-400 shrink-0" />
              Emitir & Gestão de Cobranças
            </h2>
            <p className="text-gray-400 text-xs md:text-sm mt-1 max-w-2xl">
              Crie faturas individuais ou em lote para associados e clientes. Notifique via WhatsApp, acompanhe vencimentos e dê baixa automática.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setIsBatchModalOpen(true)}
              className="px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              Cobrança em Lote
            </button>
            <button
              onClick={() => setIsNewModalOpen(true)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Nova Cobrança
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        
        <div className="bg-[#111111] border border-white/5 rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-gray-400 text-xs font-medium mb-1">
            <span>Total Emitido</span>
            <DollarSign className="h-4 w-4 text-gray-500" />
          </div>
          <div className="text-lg md:text-xl font-black text-white">
            R$ {totalEmitted.toFixed(2)}
          </div>
          <div className="text-[10px] text-gray-500 mt-1">
            {charges.length} cobranças registradas
          </div>
        </div>

        <div className="bg-[#111111] border border-amber-500/10 rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-amber-400/80 text-xs font-medium mb-1">
            <span>Pendentes</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-lg md:text-xl font-black text-amber-400">
            R$ {totalPending.toFixed(2)}
          </div>
          <div className="text-[10px] text-amber-500/80 mt-1">
            {pendingCharges.length} aguardando pagamento
          </div>
        </div>

        <div className="bg-[#111111] border border-emerald-500/10 rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-emerald-400/80 text-xs font-medium mb-1">
            <span>Recebidas / Pagas</span>
            <CheckCircle className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-lg md:text-xl font-black text-emerald-400">
            R$ {totalPaid.toFixed(2)}
          </div>
          <div className="text-[10px] text-emerald-500/80 mt-1">
            {paidCharges.length} quitadas com sucesso
          </div>
        </div>

        <div className="bg-[#111111] border border-red-500/10 rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-red-400/80 text-xs font-medium mb-1">
            <span>Vencidas</span>
            <AlertTriangle className="h-4 w-4 text-red-400" />
          </div>
          <div className="text-lg md:text-xl font-black text-red-400">
            R$ {totalExpired.toFixed(2)}
          </div>
          <div className="text-[10px] text-red-500/80 mt-1">
            {expiredCharges.length} requerem atenção
          </div>
        </div>

      </div>

      {/* Filters Bar */}
      <div className="bg-[#111111] border border-white/5 rounded-xl p-3 md:p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por nome, código ou CPF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#181818] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          
          <div className="flex items-center gap-1 bg-[#181818] border border-white/10 rounded-lg p-1 text-xs">
            <span className="text-gray-500 text-[10px] uppercase font-bold px-1.5">Destinatário:</span>
            {(['Todos', 'Associado', 'Cliente'] as const).map(type => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-2.5 py-1 rounded-md font-semibold text-[11px] transition-all cursor-pointer ${
                  typeFilter === type
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-[#181818] border border-white/10 rounded-lg p-1 text-xs">
            <span className="text-gray-500 text-[10px] uppercase font-bold px-1.5">Status:</span>
            {(['Todos', 'Pendente', 'Pago', 'Vencido', 'Cancelado'] as const).map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2 py-1 rounded-md font-semibold text-[11px] transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-white/10 text-white border border-white/10'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

        </div>

      </div>

      {/* Charges Table / List */}
      <div className="bg-[#111111] border border-white/5 rounded-2xl overflow-hidden shadow-lg">
        {filteredCharges.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="h-12 w-12 text-gray-600 mx-auto mb-3 opacity-40" />
            <h4 className="text-white font-bold text-sm">Nenhuma cobrança encontrada</h4>
            <p className="text-gray-500 text-xs mt-1">
              {searchTerm || statusFilter !== 'Todos' || typeFilter !== 'Todos'
                ? 'Tente ajustar os filtros de busca acima.'
                : 'Clique no botão "Nova Cobrança" para registrar a primeira cobrança.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#161616] border-b border-white/5 text-gray-400 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Código / Título</th>
                  <th className="py-3.5 px-4">Destinatário</th>
                  <th className="py-3.5 px-4">Valor</th>
                  <th className="py-3.5 px-4">Datas (Emissão / Venc.)</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-gray-300">
                {filteredCharges.map((charge) => {
                  const todayStr = new Date().toISOString().split('T')[0];
                  const isExpired = charge.status === 'Pendente' && charge.dueDate < todayStr;
                  const displayStatus = isExpired ? 'Vencido' : charge.status;

                  return (
                    <tr key={charge.id} className="hover:bg-white/[0.02] transition-colors">
                      
                      <td className="py-3.5 px-4 font-medium">
                        <div className="flex items-center gap-2.5">
                          <div className="flex flex-col gap-0.5 shrink-0">
                            <span className="font-mono text-[10px] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md font-bold">
                              {charge.codeNumber}
                            </span>
                            <span className="font-mono text-[8.5px] text-amber-300/90 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded text-center font-semibold">
                              {getAuthCodeForCharge(charge)}
                            </span>
                          </div>
                          <div>
                            <span className="text-white font-bold block">{charge.title}</span>
                            <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mt-0.5">
                              {charge.paymentMethod && <span>Via {charge.paymentMethod}</span>}
                              {charge.invoiceType === 'fisica' ? (
                                <span className="text-amber-300 bg-amber-500/20 border border-amber-500/30 px-1.5 py-0.2 rounded text-[9px] font-bold">
                                  Física
                                </span>
                              ) : (
                                <span className="text-blue-300 bg-blue-500/20 border border-blue-500/30 px-1.5 py-0.2 rounded text-[9px] font-bold">
                                  Digital
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                            charge.recipientType === 'Associado'
                              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                              : 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                          }`}>
                            {charge.recipientType}
                          </span>
                          <div>
                            <span className="text-white font-medium block">{charge.recipientName}</span>
                            <span className="text-[10px] text-gray-500">{charge.recipientDocument}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-white font-black text-sm">
                          R$ {charge.amount.toFixed(2)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-gray-400">
                        <div className="space-y-0.5 text-[11px]">
                          <div>Emissão: <span className="text-gray-300">{dateToBRL(charge.issueDate)}</span></div>
                          <div className={isExpired ? 'text-red-400 font-bold' : ''}>
                            Venc: <span className={isExpired ? 'text-red-400' : 'text-gray-300'}>{dateToBRL(charge.dueDate)}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {displayStatus === 'Pago' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 w-max">
                            <CheckCircle className="h-3 w-3" /> Quitado
                          </span>
                        )}
                        {displayStatus === 'Pendente' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1 w-max">
                            <Clock className="h-3 w-3" /> Pendente
                          </span>
                        )}
                        {displayStatus === 'Vencido' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1 w-max">
                            <AlertTriangle className="h-3 w-3" /> Vencido
                          </span>
                        )}
                        {displayStatus === 'Cancelado' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-gray-500/10 text-gray-400 border border-gray-500/20 flex items-center gap-1 w-max">
                            <XCircle className="h-3 w-3" /> Cancelado
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* Download Invoice PDF Direct */}
                          <button
                            onClick={() => handleDownloadDirect(charge)}
                            disabled={isExporting}
                            title="Baixar Fatura (PDF)"
                            className="px-2 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-lg text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
                          >
                            <Download className="h-3.5 w-3.5" /> Baixar
                          </button>

                          {/* Direct Print Button */}
                          <button
                            onClick={() => handlePrintInvoice(charge)}
                            title="Imprimir Fatura"
                            className="px-2 py-1 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 rounded-lg text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Printer className="h-3.5 w-3.5" /> Imprimir
                          </button>

                          {/* Print Invoice Modal */}
                          <button
                            onClick={() => setSelectedChargeForInvoice(charge)}
                            title="Visualizar Fatura"
                            className="p-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg transition-colors cursor-pointer"
                          >
                            <FileText className="h-4 w-4" />
                          </button>

                          {/* Send Charge Modal Trigger */}
                          <button
                            onClick={() => handleOpenSendModal(charge)}
                            title="Enviar / Notificar Cobrança"
                            className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Send className="h-4 w-4" />
                          </button>

                          {/* Give Clearance / Mark Paid */}
                          {charge.status !== 'Pago' && (
                            <button
                              onClick={() => handleMarkAsPaid(charge)}
                              title="Dar Baixa (Marcar como Pago)"
                              className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-lg text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <Check className="h-3 w-3" /> Baixa
                            </button>
                          )}

                          {/* Delete Charge Modal Trigger */}
                          <button
                            onClick={() => setSelectedChargeForDelete(charge)}
                            title="Excluir Cobrança"
                            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>

                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: Nova Cobrança Individual */}
      <AnimatePresence>
        {isNewModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#121212] border border-white/10 rounded-2xl w-full max-w-lg p-5 md:p-6 shadow-2xl relative my-8"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsNewModalOpen(false)}
                    className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors cursor-pointer flex items-center gap-1 font-bold text-xs mr-1"
                    title="Voltar"
                  >
                    <ArrowLeft className="h-4 w-4" /> Voltar
                  </button>
                  <Receipt className="h-5 w-5 text-blue-400" />
                  <h3 className="text-lg font-bold text-white">Emitir Nova Cobrança</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="p-1 text-gray-400 hover:text-white rounded-lg cursor-pointer"
                  title="Fechar"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateSingleCharge} className="space-y-4">
                
                {/* Select Recipient Type */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Tipo de Destinatário</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setRecipientType('Associado');
                        setSelectedRecipientId('');
                      }}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        recipientType === 'Associado'
                          ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                          : 'bg-[#1a1a1a] border-white/10 text-gray-400 hover:text-white'
                      }`}
                    >
                      <Users className="h-4 w-4" /> Associado
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setRecipientType('Cliente');
                        setSelectedRecipientId('');
                      }}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        recipientType === 'Cliente'
                          ? 'bg-teal-500/20 border-teal-500/50 text-teal-300'
                          : 'bg-[#1a1a1a] border-white/10 text-gray-400 hover:text-white'
                      }`}
                    >
                      <UserCheck className="h-4 w-4" /> Cliente
                    </button>
                  </div>
                </div>

                {/* Recipient Dropdown */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Selecionar {recipientType} <span className="text-red-400">*</span>
                  </label>
                  <select
                    required
                    value={selectedRecipientId}
                    onChange={(e) => setSelectedRecipientId(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- Escolha um {recipientType.toLowerCase()} --</option>
                    {allRecipients.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.cpf || 'Sem CPF'}) {r.status ? `- ${r.status}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Charge Title */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Título / Assunto da Cobrança <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Mensalidade de Agosto/2026, Taxa de Inscrição..."
                    value={chargeTitle}
                    onChange={(e) => setChargeTitle(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Amount & Due Date */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      Valor (R$) <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      min="0.01"
                      value={chargeAmount}
                      onChange={(e) => setChargeAmount(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      Data de Vencimento <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* DADOS DE PAGAMENTO PIX, RECEBEDOR E BANCO */}
                <div className="bg-[#18181b] border border-blue-500/20 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center gap-1.5 text-blue-400 font-bold text-xs uppercase tracking-wide">
                    <QrCode className="h-4 w-4" />
                    Dados de Recebimento (PIX e Banco)
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-300 mb-1">Chave PIX da Entidade</label>
                    <input
                      type="text"
                      value={pixKey}
                      onChange={(e) => setPixKey(e.target.value)}
                      placeholder="CNPJ, E-mail, Telefone, CPF ou Chave Aleatória"
                      className="w-full bg-[#111111] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-300 mb-1">Nome do Recebedor / Favorecido</label>
                      <input
                        type="text"
                        value={receiverName}
                        onChange={(e) => setReceiverName(e.target.value)}
                        placeholder="Ex: Associação Comercial, Nome do Titular"
                        className="w-full bg-[#111111] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-300 mb-1">Instituição / Banco</label>
                      <input
                        type="text"
                        list="single-banks-list"
                        value={receiverBank}
                        onChange={(e) => setReceiverBank(e.target.value)}
                        placeholder="Ex: Banco do Brasil, NuBank, Caixa..."
                        className="w-full bg-[#111111] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                      />
                      <datalist id="single-banks-list">
                        <option value="Banco do Brasil" />
                        <option value="Caixa Econômica Federal" />
                        <option value="Bradesco" />
                        <option value="Itaú Unibanco" />
                        <option value="Santander" />
                        <option value="NuBank (Nu Pagamentos)" />
                        <option value="Banco Inter" />
                        <option value="Mercado Pago" />
                        <option value="C6 Bank" />
                        <option value="Sicoob" />
                        <option value="Sicredi" />
                        <option value="PagBank / PagSeguro" />
                        <option value="BTG Pactual" />
                      </datalist>
                    </div>
                  </div>

                  {/* QR CODE UPLOAD OU LINK */}
                  <div className="pt-1 border-t border-white/5">
                    <QrCodeImagePicker
                      value={customQrCodeUrl}
                      onChange={setCustomQrCodeUrl}
                      label="QR Code da Cobrança (Upload da imagem ou Link do Google Drive)"
                    />
                  </div>
                </div>

                {/* OPÇÕES DE EMISSÃO: CÓDIGO PIX E FORMATO (DIGITAL OU FÍSICA) */}
                <div className="bg-[#18181b] border border-blue-500/20 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center gap-1.5 text-blue-400 font-bold text-xs uppercase tracking-wide">
                    <Sparkles className="h-4 w-4" />
                    Opções de Impressão e Formato da Fatura
                  </div>

                  {/* Incluir Código PIX */}
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                      Terá Código PIX Copia e Cola e QR Code na Fatura?
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setIncludePixCode(true)}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          includePixCode
                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                            : 'bg-[#111111] border-white/10 text-gray-400 hover:text-white'
                        }`}
                      >
                        <QrCode className="h-4 w-4" /> Sim (Com PIX)
                      </button>
                      <button
                        type="button"
                        onClick={() => setIncludePixCode(false)}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          !includePixCode
                            ? 'bg-red-500/20 border-red-500/50 text-red-300'
                            : 'bg-[#111111] border-white/10 text-gray-400 hover:text-white'
                        }`}
                      >
                        <X className="h-4 w-4" /> Não (Sem PIX)
                      </button>
                    </div>

                    {includePixCode && (
                      <div className="mt-2.5 pt-2 border-t border-white/5">
                        <label className="block text-[11px] font-semibold text-emerald-300 mb-1 flex items-center gap-1">
                          <Copy className="h-3.5 w-3.5" /> Cole o Código PIX Copia e Cola (Payload BR Code)
                        </label>
                        <textarea
                          rows={2}
                          value={pixCopiaECola}
                          onChange={(e) => setPixCopiaECola(e.target.value)}
                          placeholder="Cole aqui o código PIX Copia e Cola (ex: 00020126580014br.gov.bcb.pix...)"
                          className="w-full bg-[#111111] border border-emerald-500/30 rounded-xl px-3 py-2 text-xs font-mono text-emerald-300 placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    )}
                  </div>

                  {/* Fatura Digital ou Física */}
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                      A fatura vai ser Digital ou Física (Impressa com Assinatura)?
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setInvoiceType('digital')}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          invoiceType === 'digital'
                            ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                            : 'bg-[#111111] border-white/10 text-gray-400 hover:text-white'
                        }`}
                      >
                        <FileText className="h-4 w-4" /> Digital (WhatsApp/PDF)
                      </button>
                      <button
                        type="button"
                        onClick={() => setInvoiceType('fisica')}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          invoiceType === 'fisica'
                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                            : 'bg-[#111111] border-white/10 text-gray-400 hover:text-white'
                        }`}
                      >
                        <Printer className="h-4 w-4" /> Física (Com Assinatura)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Notes / Description */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Instruções ou Observações</label>
                  <textarea
                    rows={2}
                    value={chargeNotes}
                    onChange={(e) => setChargeNotes(e.target.value)}
                    placeholder="Instruções para o pagador..."
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsNewModalOpen(false)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/20 cursor-pointer flex items-center gap-2"
                  >
                    <Check className="h-4 w-4" />
                    Emitir Cobrança
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Cobrança em Lote */}
      <AnimatePresence>
        {isBatchModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#121212] border border-amber-500/20 rounded-2xl w-full max-w-lg p-5 md:p-6 shadow-2xl relative my-8"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsBatchModalOpen(false)}
                    className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors cursor-pointer flex items-center gap-1 font-bold text-xs mr-1"
                    title="Voltar"
                  >
                    <ArrowLeft className="h-4 w-4" /> Voltar
                  </button>
                  <Sparkles className="h-5 w-5 text-amber-400" />
                  <h3 className="text-lg font-bold text-white">Emitir Cobranças em Lote</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBatchModalOpen(false)}
                  className="p-1 text-gray-400 hover:text-white rounded-lg cursor-pointer"
                  title="Fechar"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateBatchCharges} className="space-y-4">
                
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 leading-relaxed">
                  Gere faturas automaticamente para múltiplos usuários simultaneamente (ex: mensalidades do mês).
                </div>

                {/* Target Group */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Grupo Alvo</label>
                  <select
                    value={batchTargetGroup}
                    onChange={(e) => setBatchTargetGroup(e.target.value as any)}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Associados Ativos">Todos os Associados Ativos ({associates.filter(a => a.status === 'Ativo').length})</option>
                    <option value="Todos os Associados">Todos os Associados ({associates.length})</option>
                    <option value="Inadimplentes">Somente Inadimplentes ({associates.filter(a => a.financialStatus === 'Inadimplente').length})</option>
                    <option value="Clientes">Todos os Clientes ({clients.length})</option>
                  </select>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Título / Assunto da Cobrança</label>
                  <input
                    type="text"
                    required
                    value={batchTitle}
                    onChange={(e) => setBatchTitle(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Amount & Due Date */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Valor Por Pessoa (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      min="0.01"
                      value={batchAmount}
                      onChange={(e) => setBatchAmount(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Data de Vencimento</label>
                    <input
                      type="date"
                      required
                      value={batchDueDate}
                      onChange={(e) => setBatchDueDate(e.target.value)}
                      className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* DADOS DE PAGAMENTO PIX, RECEBEDOR E BANCO */}
                <div className="bg-[#18181b] border border-amber-500/20 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs uppercase tracking-wide">
                    <QrCode className="h-4 w-4" />
                    Dados de Recebimento (PIX e Banco)
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-300 mb-1">Chave PIX das Faturas</label>
                    <input
                      type="text"
                      value={batchPixKey}
                      onChange={(e) => setBatchPixKey(e.target.value)}
                      placeholder="CNPJ, E-mail, Telefone, CPF ou Chave Aleatória"
                      className="w-full bg-[#111111] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-300 mb-1">Nome do Recebedor / Favorecido</label>
                      <input
                        type="text"
                        value={batchReceiverName}
                        onChange={(e) => setBatchReceiverName(e.target.value)}
                        placeholder="Ex: Nome da Entidade / Titular"
                        className="w-full bg-[#111111] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-300 mb-1">Instituição / Banco</label>
                      <input
                        type="text"
                        list="batch-banks-list"
                        value={batchReceiverBank}
                        onChange={(e) => setBatchReceiverBank(e.target.value)}
                        placeholder="Ex: Banco do Brasil, NuBank..."
                        className="w-full bg-[#111111] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                      />
                      <datalist id="batch-banks-list">
                        <option value="Banco do Brasil" />
                        <option value="Caixa Econômica Federal" />
                        <option value="Bradesco" />
                        <option value="Itaú Unibanco" />
                        <option value="Santander" />
                        <option value="NuBank (Nu Pagamentos)" />
                        <option value="Banco Inter" />
                        <option value="Mercado Pago" />
                        <option value="C6 Bank" />
                        <option value="Sicoob" />
                        <option value="Sicredi" />
                        <option value="PagBank / PagSeguro" />
                        <option value="BTG Pactual" />
                      </datalist>
                    </div>
                  </div>

                  {/* QR CODE UPLOAD OU LINK */}
                  <div className="pt-1 border-t border-white/5">
                    <QrCodeImagePicker
                      value={batchCustomQrCodeUrl}
                      onChange={setBatchCustomQrCodeUrl}
                      label="QR Code das Cobranças em Lote (Upload da imagem ou Link do Google Drive)"
                    />
                  </div>
                </div>

                {/* OPÇÕES DE EMISSÃO EM LOTE: CÓDIGO PIX E FORMATO (DIGITAL OU FÍSICA) */}
                <div className="bg-[#18181b] border border-amber-500/20 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs uppercase tracking-wide">
                    <Sparkles className="h-4 w-4" />
                    Opções de Impressão e Formato (Lote)
                  </div>

                  {/* Incluir Código PIX */}
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                      Terá Código PIX Copia e Cola e QR Code nas Faturas?
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setBatchIncludePixCode(true)}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          batchIncludePixCode
                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                            : 'bg-[#111111] border-white/10 text-gray-400 hover:text-white'
                        }`}
                      >
                        <QrCode className="h-4 w-4" /> Sim (Com PIX)
                      </button>
                      <button
                        type="button"
                        onClick={() => setBatchIncludePixCode(false)}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          !batchIncludePixCode
                            ? 'bg-red-500/20 border-red-500/50 text-red-300'
                            : 'bg-[#111111] border-white/10 text-gray-400 hover:text-white'
                        }`}
                      >
                        <X className="h-4 w-4" /> Não (Sem PIX)
                      </button>
                    </div>

                    {batchIncludePixCode && (
                      <div className="mt-2.5 pt-2 border-t border-white/5">
                        <label className="block text-[11px] font-semibold text-emerald-300 mb-1 flex items-center gap-1">
                          <Copy className="h-3.5 w-3.5" /> Cole o Código PIX Copia e Cola para as Faturas em Lote (Payload BR Code)
                        </label>
                        <textarea
                          rows={2}
                          value={batchPixCopiaECola}
                          onChange={(e) => setBatchPixCopiaECola(e.target.value)}
                          placeholder="Cole aqui o código PIX Copia e Cola padrão (ex: 00020126580014br.gov.bcb.pix...)"
                          className="w-full bg-[#111111] border border-emerald-500/30 rounded-xl px-3 py-2 text-xs font-mono text-emerald-300 placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    )}
                  </div>

                  {/* Fatura Digital ou Física */}
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                      As faturas serão Digitais ou Físicas (Impressas com Assinatura)?
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setBatchInvoiceType('digital')}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          batchInvoiceType === 'digital'
                            ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                            : 'bg-[#111111] border-white/10 text-gray-400 hover:text-white'
                        }`}
                      >
                        <FileText className="h-4 w-4" /> Digital (WhatsApp/PDF)
                      </button>
                      <button
                        type="button"
                        onClick={() => setBatchInvoiceType('fisica')}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          batchInvoiceType === 'fisica'
                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                            : 'bg-[#111111] border-white/10 text-gray-400 hover:text-white'
                        }`}
                      >
                        <Printer className="h-4 w-4" /> Física (Com Assinatura)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsBatchModalOpen(false)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-xs font-bold shadow-lg shadow-amber-500/20 cursor-pointer flex items-center gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    Gerar Cobranças em Lote
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: Visualizar Fatura / Boleto Imprimível */}
      <AnimatePresence>
        {selectedChargeForInvoice && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white text-black rounded-2xl w-full max-w-4xl p-4 sm:p-6 shadow-2xl relative my-8 print:m-0 print:p-0 print:shadow-none"
            >
              {/* Top Controls (Hidden when printing) */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-6 border-b border-gray-200 print:hidden">
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setSelectedChargeForInvoice(null)}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 border border-gray-300 shadow-sm"
                  >
                    <ArrowLeft className="h-4 w-4 text-gray-700" /> Voltar ao Painel
                  </button>
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <span className="font-bold text-gray-900 text-sm">Fatura de Cobrança #{selectedChargeForInvoice.codeNumber}</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleExportPDF(selectedChargeForInvoice)}
                    disabled={isExporting}
                    className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                    title="Baixar em PDF"
                  >
                    <FileDown className="h-3.5 w-3.5" /> PDF
                  </button>
                  <button
                    onClick={() => handleExportImage(selectedChargeForInvoice, 'png')}
                    disabled={isExporting}
                    className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                    title="Baixar em Imagem PNG"
                  >
                    <ImageIcon className="h-3.5 w-3.5" /> PNG
                  </button>
                  <button
                    onClick={() => {
                      const c = selectedChargeForInvoice;
                      setSelectedChargeForInvoice(null);
                      handleOpenSendModal(c);
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    title="Enviar Cobrança via WhatsApp"
                  >
                    <Send className="h-3.5 w-3.5" /> WhatsApp
                  </button>
                  <button
                    onClick={() => handlePrintInvoice(selectedChargeForInvoice)}
                    className="px-3.5 py-1.5 bg-gray-900 hover:bg-black text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Printer className="h-3.5 w-3.5" /> Imprimir
                  </button>
                  <button
                    onClick={() => setSelectedChargeForDelete(selectedChargeForInvoice)}
                    className="px-2.5 py-1.5 bg-red-600/10 hover:bg-red-600/20 text-red-600 border border-red-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    title="Excluir Cobrança"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Excluir
                  </button>
                  <button
                    onClick={() => setSelectedChargeForInvoice(null)}
                    className="p-1.5 text-gray-500 hover:text-black rounded-lg cursor-pointer"
                    title="Fechar"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Printable Invoice Body Container */}
              <InvoicePrintableDocument 
                charge={selectedChargeForInvoice} 
                entityConfig={entityConfig} 
                elementId="printable-invoice" 
                onCopyPix={(key) => handleCopy(key, 'chave')}
              />

              {/* Bottom Action Footer */}
              <div className="mt-6 pt-4 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3 print:hidden">
                <button
                  onClick={() => setSelectedChargeForInvoice(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar para Lista de Cobranças
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleExportPDF(selectedChargeForInvoice)}
                    disabled={isExporting}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow cursor-pointer disabled:opacity-50"
                  >
                    <Download className="h-4 w-4" />
                    {isExporting ? 'Baixando...' : 'Baixar Fatura (PDF)'}
                  </button>
                  <button
                    onClick={() => handleExportImage(selectedChargeForInvoice, 'png')}
                    disabled={isExporting}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow cursor-pointer disabled:opacity-50"
                  >
                    <ImageIcon className="h-4 w-4" />
                    {isExporting ? 'Baixando...' : 'Baixar Imagem (PNG)'}
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 4: Send Charge / Notify Modal */}
      <AnimatePresence>
        {selectedChargeForSend && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#18181b] border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative text-white my-8"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedChargeForSend(null)}
                    className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors cursor-pointer flex items-center gap-1 font-bold text-xs"
                    title="Voltar"
                  >
                    <ArrowLeft className="h-4 w-4" /> Voltar
                  </button>
                  <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                    <Send className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-white">Enviar & Notificar Cobrança</h3>
                    <p className="text-gray-400 text-[11px]">
                      Envie a fatura e dados para pagamento via WhatsApp ou E-mail
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedChargeForSend(null)}
                  className="p-1 text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                  title="Fechar"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                {/* Charge Summary Box */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-blue-400 font-bold">{selectedChargeForSend.codeNumber}</span>
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 font-black rounded text-[11px]">
                      R$ {selectedChargeForSend.amount.toFixed(2)}
                    </span>
                  </div>
                  <div className="font-bold text-sm text-white">{selectedChargeForSend.title}</div>
                  <div className="text-gray-400 text-[11px]">
                    Sacado: <strong className="text-gray-200">{selectedChargeForSend.recipientName}</strong> ({selectedChargeForSend.recipientType})
                  </div>
                  <div className="text-gray-400 text-[11px]">
                    Vencimento: <strong className="text-gray-200">{dateToBRL(selectedChargeForSend.dueDate)}</strong>
                  </div>
                </div>

                {/* Phone Input */}
                <div>
                  <label className="block text-gray-300 font-bold mb-1 text-xs">
                    Telefone WhatsApp (com DDD):
                  </label>
                  <input
                    type="text"
                    value={sendPhone}
                    onChange={(e) => setSendPhone(e.target.value)}
                    placeholder="(00) 90000-0000"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white font-mono placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-sm"
                  />
                  {!sendPhone && (
                    <span className="text-[10px] text-amber-400 mt-1 block">
                      ⚠️ Digite o número de telefone do destinatário acima para ativar o envio via WhatsApp.
                    </span>
                  )}
                </div>

                {/* Editable Message Box */}
                <div>
                  <label className="block text-gray-300 font-bold mb-1 text-xs">
                    Mensagem de Cobrança:
                  </label>
                  <textarea
                    rows={5}
                    value={sendCustomMessage}
                    onChange={(e) => setSendCustomMessage(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-gray-200 font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Info Helper Banner */}
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-[11px] text-emerald-300 flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>Envio completo com imagem/fatura:</strong> Ao clicar em <strong>Enviar no WhatsApp + Baixar Imagem</strong>, a imagem da fatura em PNG é baixada e o WhatsApp abre com o texto formatado para você anexar a imagem!
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => handleSendWhatsAppAndDownloadImage(selectedChargeForSend, 'png')}
                    disabled={isExporting}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-sm transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" /> Enviar no WhatsApp + Baixar Imagem (PNG)
                  </button>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleExportImage(selectedChargeForSend, 'png')}
                      disabled={isExporting}
                      className="py-2.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-bold rounded-xl text-[11px] transition-all cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50"
                      title="Baixar imagem da fatura em formato PNG"
                    >
                      <ImageIcon className="h-3.5 w-3.5" /> Baixar PNG
                    </button>

                    <button
                      type="button"
                      onClick={() => handleExportPDF(selectedChargeForSend)}
                      disabled={isExporting}
                      className="py-2.5 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 font-bold rounded-xl text-[11px] transition-all cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50"
                      title="Baixar fatura em arquivo PDF"
                    >
                      <FileDown className="h-3.5 w-3.5" /> Baixar PDF
                    </button>

                    <button
                      type="button"
                      onClick={handleExecuteSendEmail}
                      className="py-2.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 font-bold rounded-xl text-[11px] transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      Enviar E-mail
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedChargeForSend(null)}
                    className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 mt-2"
                  >
                    <ArrowLeft className="h-4 w-4" /> Voltar para Lista de Cobranças
                  </button>
                </div>

                {/* Render Target Element for html2canvas Export when in Send Modal */}
                <div className="fixed top-0 left-0 -z-50 pointer-events-none opacity-100 bg-white">
                  <InvoicePrintableDocument 
                    charge={selectedChargeForSend} 
                    entityConfig={entityConfig} 
                    elementId={`printable-invoice-${selectedChargeForSend.id}`} 
                    onCopyPix={(key) => handleCopy(key, 'chave')}
                  />
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 5: Delete Confirmation Modal */}
      <AnimatePresence>
        {selectedChargeForDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#18181b] border border-red-500/30 rounded-2xl p-6 w-full max-w-md shadow-2xl relative text-white"
            >
              <div className="flex flex-col items-center text-center gap-3 mb-5">
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl">
                  <Trash2 className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="font-black text-xl text-white">Excluir Cobrança</h3>
                  <p className="text-gray-400 text-xs mt-1">
                    Esta ação removerá permanentemente a cobrança do sistema.
                  </p>
                </div>
              </div>

              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 mb-6 text-left space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-mono text-red-400 font-bold">{selectedChargeForDelete.codeNumber}</span>
                  <span className="font-black text-white">R$ {selectedChargeForDelete.amount.toFixed(2)}</span>
                </div>
                <div className="font-bold text-sm text-gray-100">{selectedChargeForDelete.title}</div>
                <div className="text-xs text-gray-400">
                  Destinatário: <strong className="text-gray-200">{selectedChargeForDelete.recipientName}</strong>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedChargeForDelete(null)}
                  className="w-1/2 py-2.5 bg-white/10 hover:bg-white/15 text-gray-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="w-1/2 py-2.5 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-red-900/40"
                >
                  <Trash2 className="h-4 w-4" /> Sim, Excluir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* OFFSCREEN CONTAINER FOR PDF & IMAGE EXPORT */}
      <div 
        style={{ position: 'fixed', left: '-9999px', top: '0px', width: '210mm', pointerEvents: 'none', opacity: 1, zIndex: -100 }}
      >
        {(exportingCharge || selectedChargeForInvoice) && (
          <InvoicePrintableDocument
            charge={exportingCharge || selectedChargeForInvoice!}
            entityConfig={entityConfig}
            elementId="offscreen-printable-invoice"
            onCopyPix={(key) => handleCopy(key, 'chave')}
          />
        )}
      </div>

    </div>
  );
}
