import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Building2, Save, FileText, Globe, Mail, Phone, MapPin, DollarSign, CheckCircle2, Upload, Image as ImageIcon, Trash2, Link, Lock, Database, Server, Copy, Check } from 'lucide-react';
import { EntityConfig, AdminConfig } from '../types';

interface EntityConfigTabProps {
  entityConfig: EntityConfig | null;
  onUpdateEntityConfig: (config: EntityConfig) => void;
  adminConfig: AdminConfig | null;
  onUpdateAdminConfig: (config: AdminConfig) => Promise<void>;
}

export default function EntityConfigTab({
  entityConfig,
  onUpdateEntityConfig,
  adminConfig,
  onUpdateAdminConfig
}: EntityConfigTabProps) {
  // Local state for fields
  const [logo, setLogo] = useState('');
  const [name, setName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [acronym, setAcronym] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [monthlyFee, setMonthlyFee] = useState(0);

  // Admin Supremo credentials local state
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminSuccess, setShowAdminSuccess] = useState(false);
  const [adminError, setAdminError] = useState('');

  // Database dual-provider state variables
  const [dbProvider, setDbProvider] = useState(() => localStorage.getItem('db_provider') || 'firebase');
  const [supabaseUrl, setSupabaseUrl] = useState(() => localStorage.getItem('supabase_url') || (import.meta as any).env?.VITE_SUPABASE_URL || 'https://vwnjrquglxxzhamgwdta.supabase.co');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(() => localStorage.getItem('supabase_anon_key') || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_flG42FxyBPKxp3LQ_IXgew_-V5R21LY');
  const [showDbSuccess, setShowDbSuccess] = useState(false);
  const [showCopySuccess, setShowCopySuccess] = useState(false);

  const [showSuccess, setShowSuccess] = useState(false);

  const SUPABASE_SQL_SCHEMA = `-- SQL para criar as tabelas no Supabase (Cole no SQL Editor do Supabase)

-- 1. Tabela de Associados
create table if not exists associates (
  id text primary key,
  name text,
  email text,
  cpf text,
  status text,
  data jsonb not null default '{}'::jsonb
);

-- 2. Tabela de Clientes
create table if not exists clients (
  id text primary key,
  name text,
  email text,
  cpf text,
  status text,
  data jsonb not null default '{}'::jsonb
);

-- 3. Tabela de Transações Financeiras
create table if not exists transactions (
  id text primary key,
  description text,
  amount numeric,
  type text,
  date text,
  category text,
  data jsonb not null default '{}'::jsonb
);

-- 4. Tabela de Comunicados / Avisos
create table if not exists announcements (
  id text primary key,
  title text,
  content text,
  date text,
  data jsonb not null default '{}'::jsonb
);

-- 5. Tabela de Relatórios de Auditoria
create table if not exists reports (
  id text primary key,
  report_number text,
  issued_at text,
  data jsonb not null default '{}'::jsonb
);

-- 6. Tabela de Assembleias e Atividades
create table if not exists assemblies (
  id text primary key,
  title text,
  date text,
  data jsonb not null default '{}'::jsonb
);

-- 7. Tabela de Votações / Enquetes
create table if not exists polls (
  id text primary key,
  title text,
  status text,
  data jsonb not null default '{}'::jsonb
);

-- 8. Tabela de Configurações do Sistema
create table if not exists configs (
  id text primary key,
  data jsonb not null default '{}'::jsonb
);`;

  const handleSaveDbConfig = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('db_provider', dbProvider);
    localStorage.setItem('supabase_url', supabaseUrl.trim());
    localStorage.setItem('supabase_anon_key', supabaseAnonKey.trim());
    
    // Reset any cached instance so it recreates with the new keys
    import('../lib/supabase').then(mod => {
      mod.resetSupabaseClient();
    });

    setShowDbSuccess(true);
    setTimeout(() => {
      setShowDbSuccess(false);
    }, 4000);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setShowCopySuccess(true);
    setTimeout(() => {
      setShowCopySuccess(false);
    }, 2000);
  };

  // Sync state with prop
  useEffect(() => {
    if (entityConfig) {
      setLogo(entityConfig.logo || '');
      setName(entityConfig.name || '');
      setCnpj(entityConfig.cnpj || '');
      setAcronym(entityConfig.acronym || '');
      setEmail(entityConfig.email || '');
      setPhone(entityConfig.phone || '');
      setAddress(entityConfig.address || '');
      setMonthlyFee(entityConfig.monthlyFee || 0);
    }
  }, [entityConfig]);

  // Sync admin state with prop
  useEffect(() => {
    if (adminConfig) {
      setAdminEmail(adminConfig.email || '');
      setAdminPassword(adminConfig.password || '');
    }
  }, [adminConfig]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("O tamanho da imagem não deve exceder 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setLogo(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearEntityConfig = () => {
    if (window.confirm('Tem certeza que deseja limpar todos os dados cadastrais da instituição?')) {
      const cleared: EntityConfig = {
        name: '',
        acronym: '',
        cnpj: '',
        email: '',
        phone: '',
        address: '',
        monthlyFee: 0,
        logo: '',
        presidentName: '',
        inepCode: '',
        schoolSegments: '',
        city: ''
      };
      setLogo('');
      setName('');
      setCnpj('');
      setAcronym('');
      setEmail('');
      setPhone('');
      setAddress('');
      setMonthlyFee(0);
      onUpdateEntityConfig(cleared);
      alert('Dados cadastrais da instituição foram limpos.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updatedConfig: EntityConfig = {
      logo: logo || 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&q=80&w=200',
      name,
      cnpj,
      acronym,
      email,
      phone,
      address,
      monthlyFee: Number(monthlyFee) || 0
    };

    onUpdateEntityConfig(updatedConfig);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
    }, 4000);
  };

  const handleUpdateAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    setShowAdminSuccess(false);

    if (!adminEmail.trim()) {
      setAdminError('O e-mail do Administrador Supremo não pode ficar vazio.');
      return;
    }

    if (adminPassword.length < 6) {
      setAdminError('A nova senha administrativa deve conter no mínimo 6 caracteres.');
      return;
    }

    try {
      await onUpdateAdminConfig({
        email: adminEmail.trim().toLowerCase(),
        password: adminPassword,
        isConfigured: true
      });
      setShowAdminSuccess(true);
      setTimeout(() => {
        setShowAdminSuccess(false);
      }, 4000);
    } catch (err) {
      setAdminError('Erro ao atualizar credenciais do administrador no Firebase.');
    }
  };

  return (
    <div className="space-y-6 text-gray-200">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#111111] p-5 rounded-2xl border border-white/5 shadow-xl">
        <div className="space-y-1">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Building2 className="h-5 w-5 text-indigo-500" />
            Dados da Entidade
          </h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            Gerencie as informações da instituição, como nome, CNPJ, informações de contato e a taxa padrão de mensalidade cobrada dos associados.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Form */}
        <div className="lg:col-span-2 bg-[#111111] p-6 rounded-2xl border border-white/5 shadow-xl space-y-6">
          <h4 className="font-bold text-white text-xs uppercase tracking-wider text-indigo-400 border-b border-white/5 pb-2">
            Formulário de Cadastro da Entidade
          </h4>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* NOME */}
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                  Nome da Entidade *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Associação Comercial UniOn"
                  className="w-full bg-[#161616] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
                />
              </div>

              {/* Sigla/Nome fantasia */}
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                  Sigla / Nome Fantasia *
                </label>
                <input
                  type="text"
                  required
                  value={acronym}
                  onChange={(e) => setAcronym(e.target.value)}
                  placeholder="Ex: UniOn"
                  className="w-full bg-[#161616] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* CNPJ */}
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                  CNPJ *
                </label>
                <input
                  type="text"
                  required
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  placeholder="Ex: 00.000.000/0001-00"
                  className="w-full bg-[#161616] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
                />
              </div>

              {/* Valor da mensalidade */}
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                  Mensalidade Padrão Mês (R$) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-xs">R$</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={monthlyFee}
                    onChange={(e) => setMonthlyFee(Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full bg-[#161616] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Email */}
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                  E-mail de Contato *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ex: contato@entidade.org.br"
                  className="w-full bg-[#161616] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
                />
              </div>

              {/* Telefone */}
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                  Telefone *
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ex: (11) 99999-9999"
                  className="w-full bg-[#161616] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
                />
              </div>
            </div>

            {/* Endereço */}
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                Endereço Completo *
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ex: Av. Paulista, 1000 - Bela Vista, São Paulo - SP"
                className="w-full bg-[#161616] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
              />
            </div>

            {/* Logotipo da Entidade */}
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                Logotipo da Entidade *
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Upload Area */}
                <div className="border-2 border-dashed border-white/10 hover:border-indigo-500/30 rounded-xl p-4 bg-[#161616]/50 flex flex-col items-center justify-center text-center group transition-colors relative min-h-[110px]">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <Upload className="h-6 w-6 text-gray-400 group-hover:text-indigo-400 transition-colors mb-1.5" />
                  <p className="text-xs font-bold text-gray-200">Clique ou arraste a imagem</p>
                  <p className="text-[9px] text-gray-500 mt-0.5">PNG, JPG, SVG até 2MB</p>
                </div>

                {/* URL Input / Alternative */}
                <div className="flex flex-col justify-between bg-[#161616]/30 border border-white/5 rounded-xl p-4 space-y-2.5">
                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Ou insira o link da imagem</span>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                        <Link className="h-3.5 w-3.5 text-gray-500" />
                      </div>
                      <input
                        type="text"
                        value={logo.startsWith('data:') ? '' : logo}
                        onChange={(e) => setLogo(e.target.value)}
                        placeholder="Ex: https://link-da-imagem.com/logo.png"
                        className="w-full bg-[#161616] border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
                      />
                    </div>
                  </div>

                  {logo && (
                    <button
                      type="button"
                      onClick={() => setLogo('')}
                      className="flex items-center justify-center gap-1 w-full py-1.5 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] font-bold rounded-lg border border-red-500/20 transition-all cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remover Logotipo
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <AnimatePresence>
                {showSuccess && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    Dados salvos com sucesso!
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClearEntityConfig}
                  className="flex items-center gap-1.5 py-2 px-3.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  title="Limpar todos os dados cadastrais da instituição"
                >
                  <Trash2 className="h-4 w-4" />
                  Limpar Dados
                </button>

                <button
                  type="submit"
                  className="flex items-center gap-1.5 ml-auto py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-900/20 transition-all cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  Salvar Dados
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Right side bento: stack preview and admin credential edit */}
        <div className="space-y-6 flex flex-col">
          {/* Live Preview Card */}
          <div className="bg-[#111111] p-6 rounded-2xl border border-white/5 shadow-xl flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-white text-xs uppercase tracking-wider text-indigo-400 border-b border-white/5 pb-2 mb-4">
                Visualização em Tempo Real
              </h4>

              {/* Simulated branding / preview area */}
              <div className="bg-[#161616] border border-white/5 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                    {logo ? (
                      <img
                        src={logo}
                        alt="Logo Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&q=80&w=200";
                        }}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="text-lg font-bold text-indigo-500">
                        {acronym ? acronym.slice(0, 2).toUpperCase() : 'UO'}
                      </span>
                    )}
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-sm leading-tight">
                      {name || 'Nome da Entidade'}
                    </h5>
                    <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider">
                      {acronym || 'SIGLA'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-gray-400 border-t border-white/5 pt-3">
                  <div className="flex items-start gap-2">
                    <FileText className="h-3.5 w-3.5 text-gray-500 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[9px] text-gray-500 block font-bold uppercase tracking-wider">CNPJ</span>
                      <span className="text-white text-xs font-mono">{cnpj || '00.000.000/0001-00'}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Mail className="h-3.5 w-3.5 text-gray-500 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[9px] text-gray-500 block font-bold uppercase tracking-wider">E-mail</span>
                      <span className="text-white text-xs break-all">{email || 'contato@entidade.org.br'}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Phone className="h-3.5 w-3.5 text-gray-500 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[9px] text-gray-500 block font-bold uppercase tracking-wider">Telefone</span>
                      <span className="text-white text-xs">{phone || '(11) 99999-9999'}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <MapPin className="h-3.5 w-3.5 text-gray-500 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[9px] text-gray-500 block font-bold uppercase tracking-wider">Endereço</span>
                      <span className="text-white text-xs leading-relaxed">{address || 'Endereço completo da sede'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5">
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[9px] text-indigo-300 font-bold block uppercase tracking-wider">Mensalidade Padrão</span>
                  <span className="text-xs text-gray-400">Cobrada de associados</span>
                </div>
                <div className="flex items-baseline text-white font-mono font-bold text-lg">
                  <span className="text-xs text-indigo-400 mr-0.5 font-sans">R$</span>
                  {monthlyFee.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>

          {/* Super Admin Credential Settings */}
          <div className="bg-[#111111] p-6 rounded-2xl border border-white/5 shadow-xl space-y-4">
            <div className="border-b border-white/5 pb-2">
              <h4 className="font-bold text-white text-xs uppercase tracking-wider text-indigo-400">
                Acesso Administrador Supremo
              </h4>
              <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                Modifique as credenciais de e-mail e senha utilizadas pelo Administrador Supremo. Após salvar, o acesso padrão inicial é <strong>permanentemente excluído</strong> e apenas a nova senha cadastrada será válida.
              </p>
            </div>

            <form onSubmit={handleUpdateAdminSubmit} className="space-y-4">
              {adminError && (
                <div className="p-3 bg-red-950/30 border border-red-500/20 rounded-xl text-xs text-red-300 leading-tight">
                  {adminError}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                  E-mail do Administrador Supremo *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="Ex: admin@associacao.org"
                    className="w-full bg-[#161616] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                  Nova Senha Administrativa *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Mínimo de 6 caracteres"
                    className="w-full bg-[#161616] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <AnimatePresence>
                  {showAdminSuccess && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold"
                    >
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      Salvo com sucesso!
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  className="flex items-center gap-1.5 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-900/20 transition-all cursor-pointer ml-auto"
                >
                  <Save className="h-4 w-4" />
                  Salvar Credenciais
                </button>
              </div>
            </form>
          </div>

          {/* Database Configuration Card */}
          <div className="bg-[#111111] p-6 rounded-2xl border border-white/5 shadow-xl space-y-4">
            <div className="border-b border-white/5 pb-2 flex items-center gap-2">
              <Database className="h-4.5 w-4.5 text-indigo-400" />
              <div>
                <h4 className="font-bold text-white text-xs uppercase tracking-wider text-indigo-400">
                  Provedor de Banco de Dados
                </h4>
                <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                  Alterne entre Firebase (nativo) e Supabase (Vercel/GitHub) para seu armazenamento.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveDbConfig} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                  Banco de Dados Ativo
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDbProvider('firebase')}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      dbProvider === 'firebase'
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        : 'bg-[#161616] border-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    <Server className="h-3.5 w-3.5" />
                    Firebase
                  </button>
                  <button
                    type="button"
                    onClick={() => setDbProvider('supabase')}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      dbProvider === 'supabase'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-[#161616] border-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    <Database className="h-3.5 w-3.5" />
                    Supabase
                  </button>
                </div>
              </div>

              {dbProvider === 'supabase' && (
                <div className="space-y-4 pt-1 animate-fadeIn">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                      Supabase URL *
                    </label>
                    <input
                      type="text"
                      required
                      value={supabaseUrl}
                      onChange={(e) => setSupabaseUrl(e.target.value)}
                      placeholder="https://xxxxxx.supabase.co"
                      className="w-full bg-[#161616] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                      Supabase Anon Key *
                    </label>
                    <input
                      type="password"
                      required
                      value={supabaseAnonKey}
                      onChange={(e) => setSupabaseAnonKey(e.target.value)}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      className="w-full bg-[#161616] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
                    />
                  </div>

                  {/* Schema Info & SQL Helper */}
                  <div className="bg-[#161616]/50 rounded-xl p-3 border border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider block">
                        Estrutura do Supabase (SQL)
                      </span>
                      <button
                        type="button"
                        onClick={handleCopySql}
                        className="flex items-center gap-1 text-[9px] text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-wider cursor-pointer transition-colors"
                      >
                        {showCopySuccess ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-400" />
                            Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            Copiar SQL
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-400 leading-relaxed">
                      Clique em "Copiar SQL" e cole no SQL Editor do seu projeto Supabase para criar todas as tabelas necessárias de forma rápida.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <AnimatePresence>
                  {showDbSuccess && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold"
                    >
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      Banco ativo atualizado!
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  className="flex items-center gap-1.5 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-900/20 transition-all cursor-pointer ml-auto"
                >
                  <Save className="h-4 w-4" />
                  Salvar Configuração
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
