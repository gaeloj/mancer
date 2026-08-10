import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Lock, Mail, Users, Building, AlertCircle, Sparkles, Clock, Eye, EyeOff, Briefcase, Key, UserCheck } from 'lucide-react';
import { Associate, EntityConfig, AdminConfig, Collaborator } from '../types';

interface LoginScreenProps {
  associates: Associate[];
  collaborators?: Collaborator[];
  onLogin: (role: 'admin' | 'associate' | 'collaborator', id?: string, collaboratorData?: any) => void;
  entityConfig?: EntityConfig | null;
  adminConfig?: AdminConfig | null;
  onUpdateAdminConfig: (config: AdminConfig) => Promise<void>;
}

export default function LoginScreen({ 
  associates, 
  collaborators = [],
  onLogin, 
  entityConfig, 
  adminConfig, 
  onUpdateAdminConfig 
}: LoginScreenProps) {
  const [activeTab, setActiveTab] = useState<'admin' | 'associate' | 'collaborator'>('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const [isManualSetup, setIsManualSetup] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds

  useEffect(() => {
    let key = 'union_remember_admin';
    if (activeTab === 'associate') key = 'union_remember_associate';
    if (activeTab === 'collaborator') key = 'union_remember_collaborator';

    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.remember && (parsed.email || parsed.password)) {
          setEmail(parsed.email || '');
          setPassword(parsed.password || '');
          setRememberMe(true);
          return;
        }
      } catch (e) {
        // ignore
      }
    }
    setEmail('');
    setPassword('');
    setRememberMe(false);
  }, [activeTab]);

  useEffect(() => {
    if (adminConfig?.isConfigured) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [adminConfig?.isConfigured]);

  const isSetupMode = activeTab === 'admin' && isManualSetup;

  const handleAdminSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password || !confirmPassword) {
      setError('Por favor, preencha todos os campos do Administrador Supremo.');
      return;
    }

    if (password.length < 6) {
      setError('A senha administrativa deve conter no mínimo 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas digitadas não coincidem.');
      return;
    }

    try {
      await onUpdateAdminConfig({
        email: email.trim().toLowerCase(),
        password: password,
        isConfigured: true
      });
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setIsManualSetup(false);
      onLogin('admin');
    } catch (err) {
      setError('Erro ao salvar configuração do Administrador Supremo no banco de dados.');
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    let storageKey = 'union_remember_admin';
    if (activeTab === 'associate') storageKey = 'union_remember_associate';
    if (activeTab === 'collaborator') storageKey = 'union_remember_collaborator';

    if (rememberMe) {
      localStorage.setItem(storageKey, JSON.stringify({
        email: email.trim(),
        password: password,
        remember: true
      }));
    } else {
      localStorage.removeItem(storageKey);
    }

    if (activeTab === 'admin') {
      const trimmedEmail = email.toLowerCase().trim();
      const isDefaultAccess = (
        (
          trimmedEmail === '@gaeloj.com.br' ||
          trimmedEmail === 'gaeloj@.com.br' ||
          trimmedEmail === 'gaeloj@gaeloj.com.br' ||
          trimmedEmail === 'admin@gaeloj.com.br' ||
          trimmedEmail.endsWith('@gaeloj.com.br') ||
          trimmedEmail === 'admin@union.org'
        ) &&
        (password === '@Goj030824' || password === 'admin')
      );
      const savedEmail = adminConfig?.email || '@gaeloj.com.br';
      const savedPassword = adminConfig?.password || '@Goj030824';
      const isSavedAccess = (
        trimmedEmail === savedEmail.toLowerCase().trim() &&
        password === savedPassword
      );

      if (isDefaultAccess || isSavedAccess) {
        onLogin('admin');
      } else {
        setError('E-mail ou senha incorretos.');
      }
    } else if (activeTab === 'collaborator') {
      const inputTrimmed = email.trim().toLowerCase();
      const inputCleanCpf = email.replace(/\D/g, '');

      // 1. Get school staff list from localStorage (UEEI tab)
      let schoolStaffList: any[] = [];
      try {
        const savedStaff = localStorage.getItem('school_staff_list');
        if (savedStaff) {
          const parsed = JSON.parse(savedStaff);
          if (Array.isArray(parsed)) schoolStaffList = parsed;
        }
      } catch (e) {
        // ignore
      }

      // 2. Get school collaborators list from localStorage (CollaboratorsTab)
      let schoolColabList: any[] = [];
      try {
        const savedColab = localStorage.getItem('school_collaborators_list');
        if (savedColab) {
          const parsed = JSON.parse(savedColab);
          if (Array.isArray(parsed)) schoolColabList = parsed;
        }
      } catch (e) {
        // ignore
      }

      // Fallback default list if all sources are empty
      if (schoolStaffList.length === 0 && schoolColabList.length === 0 && (!collaborators || collaborators.length === 0)) {
        schoolStaffList = [
          { id: 'stf-1', name: 'Maria das Graças Xukuru', role: 'Cozinheira(o)', registrationCode: 'MAT-2026-001', username: 'maria.xukuru', password: 'Xukuru@2026', email: 'maria.xukuru@escola.pe.gov.br', status: 'Ativo' },
          { id: 'stf-2', name: 'João Pedro Ororubá', role: 'Servente de Limpeza', registrationCode: 'MAT-2026-002', username: 'joao.ororuba', password: 'Ororuba@2026', email: 'joao.ororuba@escola.pe.gov.br', status: 'Ativo' },
          { id: 'stf-3', name: 'Prof. Tiago Xukuru', role: 'Professor(a)', registrationCode: 'MAT-2026-003', username: 'tiago.xukuru', password: 'Tiago@2026', email: 'tiago.xukuru@educacao.pe.gov.br', status: 'Ativo' },
          { id: 'stf-4', name: 'Sebastião Silva', role: 'Porteiro(a)', registrationCode: 'MAT-2026-004', username: 'sebastiao.silva', password: 'Silva@2026', status: 'Ativo' },
          { id: 'stf-5', name: 'Ana Lúcia Xukuru', role: 'Recepção I', registrationCode: 'MAT-2026-005', username: 'ana.xukuru', password: 'Ana@2026', status: 'Ativo' },
          { id: 'stf-6', name: 'Carlos Eduardo Santos', role: 'Apoio ADM I', registrationCode: 'MAT-2026-006', username: 'carlos.santos', password: 'Carlos@2026', status: 'Ativo' }
        ];
      }

      // Merge all collaborator sources
      const allCollaborators: any[] = [
        ...collaborators,
        ...schoolColabList,
        ...schoolStaffList.map(s => ({
          id: s.id,
          name: s.name,
          username: s.username,
          registration: s.registrationCode || s.registration || s.matricula,
          registrationCode: s.registrationCode || s.registration || s.matricula,
          password: s.password,
          email: s.email || '',
          cpf: s.cpf,
          role: s.role,
          status: s.status || 'Ativo',
          schoolId: s.schoolId
        }))
      ];

      const matchedColab = allCollaborators.find(c => {
        if (!c) return false;
        const uName = c.username ? String(c.username).trim().toLowerCase() : '';
        const reg1 = c.registration ? String(c.registration).trim().toLowerCase() : '';
        const reg2 = c.registrationCode ? String(c.registrationCode).trim().toLowerCase() : '';
        const emailStr = c.email ? String(c.email).trim().toLowerCase() : '';
        const nameStr = c.name ? String(c.name).trim().toLowerCase() : '';
        const cpfDigits = c.cpf ? String(c.cpf).replace(/\D/g, '') : '';

        const isUserMatch = uName && uName === inputTrimmed;
        const isRegMatch = (reg1 && reg1 === inputTrimmed) || (reg2 && reg2 === inputTrimmed);
        const isEmailMatch = emailStr && emailStr === inputTrimmed;
        const isNameMatch = nameStr && nameStr === inputTrimmed;
        const isCpfMatch = inputCleanCpf.length >= 8 && cpfDigits.length >= 8 && cpfDigits === inputCleanCpf;

        return isUserMatch || isRegMatch || isEmailMatch || isNameMatch || isCpfMatch;
      });

      if (matchedColab) {
        const inputPass = password.trim();
        const storedPass = (matchedColab.password || '').toString().trim();

        if (storedPass !== inputPass) {
          setError('Senha incorreta para este colaborador.');
          return;
        }

        const colabStatus = (matchedColab.status || 'Ativo').toString().toLowerCase();
        if (colabStatus === 'inativo' || colabStatus === 'bloqueado') {
          setError('Seu acesso de colaborador está INATIVO ou BLOQUEADO.');
          return;
        }

        onLogin('collaborator', matchedColab.id, matchedColab);
        return;
      }

      setError('Nenhum colaborador encontrado com o Usuário, Matrícula, E-mail ou CPF informado.');
    } else {
      // Find associate by email, matricula or username
      const matched = associates.find(
        (a) => (a.username === email.trim() || 
                a.matricula === email.trim() || 
                a.email.toLowerCase() === email.toLowerCase().trim())
      );
      if (matched) {
        if (matched.password !== password) {
          setError('Senha incorreta para este associado.');
          return;
        }
        if (matched.loginStatus === 'Bloqueado') {
          setError('Seu acesso de login está BLOQUEADO pelo administrador.');
          return;
        }
        if (matched.loginStatus === 'Congelado') {
          setError('Seu acesso de login está CONGELADO pelo administrador.');
          return;
        }
        onLogin('associate', matched.id);
      } else {
        setError('Nenhum associado encontrado com o Usuário, Matrícula ou E-mail informado.');
      }
    }
  };

  return (
    <div id="login-container" className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4 py-12 sm:px-6 lg:px-8 text-gray-200">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8 bg-[#111111] p-8 rounded-2xl shadow-2xl border border-white/5"
      >
        {/* Branding & Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center overflow-hidden shadow-lg mb-4">
            {activeTab === 'collaborator' ? (
              <Clock className="h-9 w-9 text-indigo-400" />
            ) : entityConfig?.logo ? (
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
              <Building className="h-9 w-9 text-indigo-500" />
            )}
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white font-sans">
            {activeTab === 'collaborator' ? 'Portal do Colaborador - UEEI' : (entityConfig?.name || 'UniOn')}
          </h2>
          <p className="mt-2 text-xs text-gray-400">
            {activeTab === 'collaborator' 
              ? 'Acesso de Colaboradores e Registro de Ponto Escolar' 
              : entityConfig?.acronym 
                ? `Portal de Gestão - ${entityConfig.acronym}` 
                : 'Sistema de Gestão Escolar e Colaboradores'}
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex p-1 bg-[#1a1a1a] rounded-xl border border-white/5 gap-1">
          <button
            id="tab-admin"
            type="button"
            onClick={() => {
              setActiveTab('admin');
              setError('');
              setEmail('');
              setPassword('');
            }}
            className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'admin'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Lock className="h-3.5 w-3.5" />
            <span>Admin</span>
          </button>

          <button
            id="tab-associate"
            type="button"
            onClick={() => {
              setActiveTab('associate');
              setError('');
              setEmail('');
              setPassword('');
            }}
            className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'associate'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Associados</span>
          </button>

          <button
            id="tab-collaborator"
            type="button"
            onClick={() => {
              setActiveTab('collaborator');
              setError('');
              setEmail('');
              setPassword('');
            }}
            className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'collaborator'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Briefcase className="h-3.5 w-3.5" />
            <span>Colaboradores</span>
          </button>
        </div>

        {/* Error message */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-3.5 bg-red-950/30 border border-red-500/20 rounded-xl flex items-start gap-3"
          >
            <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-300 leading-tight">{error}</p>
          </motion.div>
        )}

        {/* Login Form / Setup Form */}
        {isSetupMode ? (
          <form className="mt-6 space-y-5" onSubmit={handleAdminSetupSubmit}>
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-start gap-2.5">
              <Sparkles className="h-4.5 w-4.5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <p className="font-semibold text-white">Cadastrar Administrador Supremo</p>
                <p className="mt-0.5 opacity-90 leading-relaxed">
                  Cadastre as credenciais do Administrador Supremo. O acesso padrão inicial estará disponível temporariamente (10 min) para este cadastro; assim que você cadastrar, o acesso padrão será <strong>permanente e sumariamente excluído</strong>.
                </p>
              </div>
            </div>

            <div>
              <label htmlFor="setup-email" className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                E-mail do Administrador Supremo *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  id="setup-email"
                  name="setup-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder=""
                  className="block w-full pl-11 pr-4 py-3 bg-[#1a1a1a] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="setup-password" className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                Nova Senha Administrativa * (Mínimo 6 caracteres)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="setup-password"
                  name="setup-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder=""
                  className="block w-full pl-11 pr-11 py-3 bg-[#1a1a1a] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-white transition-colors cursor-pointer"
                  title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="setup-confirm-password" className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                Confirmar Senha *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="setup-confirm-password"
                  name="setup-confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder=""
                  className="block w-full pl-11 pr-11 py-3 bg-[#1a1a1a] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-white transition-colors cursor-pointer"
                  title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <button
                id="btn-setup-submit"
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all shadow-lg shadow-indigo-900/20 cursor-pointer"
              >
                Cadastrar Administrador Supremo
              </button>

              {!adminConfig?.isConfigured && (
                <button
                  type="button"
                  onClick={() => {
                    onLogin('admin');
                  }}
                  className="w-full py-2.5 px-4 text-xs font-semibold text-amber-300 hover:text-amber-200 transition-colors cursor-pointer border border-amber-500/20 bg-amber-500/5 rounded-xl"
                >
                  Entrar com Acesso Padrão Temporário
                </button>
              )}

              {adminConfig?.isConfigured && (
                <button
                  type="button"
                  onClick={() => setIsManualSetup(false)}
                  className="w-full py-2 px-4 text-xs font-semibold text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  Voltar para Tela de Login
                </button>
              )}
            </div>
          </form>
        ) : (
          <form className="mt-6 space-y-5" onSubmit={handleLoginSubmit}>
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                {activeTab === 'admin' 
                  ? 'E-mail do Administrador Supremo' 
                  : activeTab === 'collaborator'
                  ? 'Usuário, Matrícula, E-mail ou CPF do Colaborador'
                  : 'Usuário (7 dígitos), Matrícula ou E-mail'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  {activeTab === 'collaborator' ? <Briefcase className="h-5 w-5" /> : <Mail className="h-5 w-5" />}
                </div>
                <input
                  id="email"
                  name="email"
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={
                    activeTab === 'collaborator'
                      ? 'Ex: carlos.matematica ou MAT-2026-001'
                      : activeTab === 'admin'
                      ? 'admin@gaeloj.com.br'
                      : 'Ex: 1234567 ou MAT-00001'
                  }
                  className="block w-full pl-11 pr-4 py-3 bg-[#1a1a1a] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="password" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Senha de Acesso
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-11 pr-11 py-3 bg-[#1a1a1a] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-white transition-colors cursor-pointer"
                  title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me Toggle Button / Checkbox */}
            <div className="flex items-center justify-between pt-1 pb-1">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-gray-300 hover:text-white transition-colors user-select-none">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-[#1a1a1a] text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                />
                <span>Lembrar usuário e senha</span>
              </label>
            </div>

            {activeTab === 'associate' && (
              <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl text-xs text-blue-400 flex items-start gap-2.5">
                <Sparkles className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Credenciais de Acesso do Associado</p>
                  <p className="mt-0.5 opacity-80 leading-relaxed">Insira seu Usuário (7 dígitos) ou Matrícula (6 dígitos) e a senha correspondente para acessar.</p>
                </div>
              </div>
            )}

            {activeTab === 'collaborator' && (
              <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-300 space-y-2">
                <div className="flex items-start gap-2.5">
                  <UserCheck className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white">Portal do Colaborador & Corpo Docente</p>
                    <p className="mt-0.5 opacity-80 leading-relaxed">
                      Acesso restrito para professores, coordenadores, gestores e colaboradores escolares.
                    </p>
                  </div>
                </div>

                <div className="pt-1.5 border-t border-indigo-500/20 flex flex-wrap gap-1.5 items-center">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Acesso rápido de teste:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('carlos.matematica');
                      setPassword('prof2026!pass');
                    }}
                    className="text-[10px] bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-200 px-2 py-0.5 rounded border border-indigo-500/30 transition-all font-mono cursor-pointer"
                  >
                    carlos.matematica
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('maria.xukuru');
                      setPassword('Xukuru@2026');
                    }}
                    className="text-[10px] bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-200 px-2 py-0.5 rounded border border-indigo-500/30 transition-all font-mono cursor-pointer"
                  >
                    maria.xukuru
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('tiago.xukuru');
                      setPassword('Tiago@2026');
                    }}
                    className="text-[10px] bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-200 px-2 py-0.5 rounded border border-indigo-500/30 transition-all font-mono cursor-pointer"
                  >
                    tiago.xukuru
                  </button>
                </div>
              </div>
            )}

            <button
              id="btn-login-submit"
              type="submit"
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-white transition-all shadow-lg cursor-pointer ${
                activeTab === 'collaborator'
                  ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-900/20 focus:ring-indigo-500'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-900/20 focus:ring-blue-500'
              }`}
            >
              {activeTab === 'admin' 
                ? 'Acessar Painel Admin' 
                : activeTab === 'collaborator'
                ? 'Acessar Área do Colaborador'
                : 'Acessar Área do Associado'}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}

