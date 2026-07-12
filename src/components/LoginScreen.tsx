import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, Mail, Users, Building, AlertCircle, Sparkles, UserCheck } from 'lucide-react';
import { Associate } from '../types';

interface LoginScreenProps {
  associates: Associate[];
  onLogin: (role: 'admin' | 'associate', associateId?: string) => void;
}

export default function LoginScreen({ associates, onLogin }: LoginScreenProps) {
  const [activeTab, setActiveTab] = useState<'admin' | 'associate'>('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (activeTab === 'admin') {
      if (email.toLowerCase() === 'admin@associacao.org' && password === 'admin') {
        onLogin('admin');
      } else {
        setError('E-mail ou senha administrativa incorretos. (Use admin@associacao.org / admin)');
      }
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

  const handleQuickAccess = (assoc: Associate) => {
    if (assoc) {
      if (assoc.loginStatus === 'Bloqueado') {
        setError(`Acesso do associado ${assoc.name} está BLOQUEADO.`);
        return;
      }
      if (assoc.loginStatus === 'Congelado') {
        setError(`Acesso do associado ${assoc.name} está CONGELADO.`);
        return;
      }
      onLogin('associate', assoc.id);
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
          <div className="mx-auto h-16 w-16 bg-gradient-to-tr from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/30 mb-4">
            <Building className="h-9 w-9 text-white" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white font-sans">
            GestaAssoc
          </h2>
          <p className="mt-2 text-xs text-gray-400">
            Sistema de Gestão Unificado para Associações e Cooperativas
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex p-1 bg-[#1a1a1a] rounded-xl border border-white/5">
          <button
            id="tab-admin"
            onClick={() => {
              setActiveTab('admin');
              setError('');
              setEmail('');
              setPassword('');
            }}
            className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
              activeTab === 'admin'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Lock className="h-4 w-4" />
            Administrador
          </button>
          <button
            id="tab-associate"
            onClick={() => {
              setActiveTab('associate');
              setError('');
              setEmail('');
              setPassword('');
            }}
            className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
              activeTab === 'associate'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Users className="h-4 w-4" />
            Portal do Associado
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

        {/* Login Form */}
        <form className="mt-6 space-y-5" onSubmit={handleLoginSubmit}>
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
              {activeTab === 'admin' ? 'Endereço de E-mail' : 'Usuário (7 dígitos), Matrícula ou E-mail'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                <Mail className="h-5 w-5" />
              </div>
              <input
                id="email"
                name="email"
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={activeTab === 'admin' ? 'admin@associacao.org' : 'Ex: 1234567'}
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
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={activeTab === 'admin' ? '••••••••' : '7 dígitos'}
                className="block w-full pl-11 pr-4 py-3 bg-[#1a1a1a] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
              />
            </div>
          </div>

          {activeTab === 'associate' && (
            <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl text-xs text-blue-400 flex items-start gap-2.5">
              <Sparkles className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Credenciais de Acesso</p>
                <p className="mt-0.5 opacity-80 leading-relaxed">Insira seu Usuário (7 dígitos) ou Matrícula (6 dígitos) e a senha correspondente de 7 dígitos para acessar.</p>
              </div>
            </div>
          )}

          <button
            id="btn-login-submit"
            type="submit"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-lg shadow-blue-900/20 cursor-pointer"
          >
            {activeTab === 'admin' ? 'Acessar Painel Admin' : 'Acessar Área do Associado'}
          </button>
        </form>

        {/* Quick Access panel */}
        <div className="pt-4 border-t border-white/5">
          <div className="text-center mb-3">
            <span className="text-[10px] bg-[#1a1a1a] text-gray-400 font-bold px-2.5 py-1 rounded-full border border-white/5 uppercase tracking-wider">
              Ambiente de Simulação
            </span>
          </div>
          
          {activeTab === 'admin' ? (
            <div className="bg-[#1a1a1a] border border-white/5 rounded-xl p-3.5 text-xs text-gray-400">
              <div className="flex justify-between font-semibold text-white mb-1.5">
                <span>Login Admin Demonstrativo:</span>
                <span className="text-blue-400 font-bold">Acesso Livre</span>
              </div>
              <p className="text-gray-400">• E-mail: <code className="font-mono bg-[#111] px-1.5 py-0.5 rounded border border-white/5 text-white select-all">admin@associacao.org</code></p>
              <p className="mt-1.5">• Senha: <code className="font-mono bg-[#111] px-1.5 py-0.5 rounded border border-white/5 text-white select-all">admin</code></p>
            </div>
          ) : (
            <div className="bg-[#1a1a1a] border border-white/5 rounded-xl p-3.5">
              <p className="text-xs font-semibold text-white mb-2.5 flex items-center gap-1.5">
                <UserCheck className="h-4 w-4 text-blue-400" />
                Acesso Rápido de Associados Cadastrados:
              </p>
              <div className="grid grid-cols-1 gap-2 max-h-[220px] overflow-y-auto custom-scrollbar">
                {associates.slice(0, 4).map((assoc) => (
                  <button
                    key={assoc.id}
                    type="button"
                    onClick={() => handleQuickAccess(assoc)}
                    className="flex flex-col text-left text-xs bg-[#111111] hover:bg-white/5 border border-white/5 p-2.5 rounded-lg transition-all text-gray-300 w-full"
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="font-semibold text-white block leading-tight">{assoc.name}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                        assoc.loginStatus === 'Bloqueado' ? 'bg-red-500/25 text-red-400' :
                        assoc.loginStatus === 'Congelado' ? 'bg-amber-500/25 text-amber-400' :
                        'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        Login: {assoc.loginStatus || 'Ativo'}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1 space-y-0.5">
                      <p>• E-mail: <span className="text-white font-mono">{assoc.email}</span></p>
                      <p>• Matrícula: <span className="text-blue-400 font-mono font-bold">{assoc.matricula}</span></p>
                      <p>• Usuário: <span className="text-indigo-400 font-mono font-bold">{assoc.username}</span> | Senha: <span className="text-emerald-400 font-mono font-bold">{assoc.password}</span></p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
