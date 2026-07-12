import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Search, Plus, Edit, Trash2, CheckCircle2, XCircle, 
  Mail, Phone, MapPin, X, Calendar, AlertCircle, Eye, Info,
  Lock, ShieldCheck, ShieldAlert, Sparkles
} from 'lucide-react';
import { Associate } from '../types';
import { maskDate, dateToISO, dateToBRL, maskCpfCnpj } from '../utils/formatters';

interface ClientsTabProps {
  clients: Associate[];
  onAddClient: (client: Omit<Associate, 'id'>) => void;
  onEditClient: (client: Associate) => void;
  onDeleteClient: (id: string) => void;
}

export default function ClientsTab({
  clients,
  onAddClient,
  onEditClient,
  onDeleteClient
}: ClientsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Ativo' | 'Inativo'>('Todos');
  
  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  
  const [selectedClient, setSelectedClient] = useState<Associate | null>(null);
  const [loginClient, setLoginClient] = useState<Associate | null>(null);
  
  // Login management states
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginStatusVal, setLoginStatusVal] = useState<'Ativo' | 'Bloqueado' | 'Congelado'>('Ativo');
  
  // Form fields
  const [editingClient, setEditingClient] = useState<Associate | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<'Ativo' | 'Inativo'>('Ativo');
  const [joiningDate, setJoiningDate] = useState(() => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    return `${day}/${month}/${year}`;
  });

  const handleOpenAddModal = () => {
    setEditingClient(null);
    setName('');
    setEmail('');
    setCpf('');
    setPhone('');
    setAddress('');
    setStatus('Ativo');
    
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    setJoiningDate(`${day}/${month}/${year}`);
    
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (client: Associate) => {
    setEditingClient(client);
    setName(client.name);
    setEmail(client.email);
    setCpf(client.cpf);
    setPhone(client.phone);
    setAddress(client.address);
    setStatus(client.status);
    setJoiningDate(dateToBRL(client.joiningDate));
    setIsFormModalOpen(true);
  };

  const handleOpenDetailsModal = (client: Associate) => {
    setSelectedClient(client);
    setIsDetailsModalOpen(true);
  };

  // Login management actions
  const handleOpenLoginModal = (client: Associate) => {
    setLoginClient(client);
    setLoginUsername(client.username || '');
    setLoginPassword(client.password || '');
    setLoginStatusVal(client.loginStatus || 'Ativo');
    setIsLoginModalOpen(true);
  };

  const handleSaveLogin = () => {
    if (!loginClient) return;
    const updated: Associate = {
      ...loginClient,
      username: loginUsername,
      password: loginPassword,
      loginStatus: loginStatusVal
    };
    onEditClient(updated);
    setIsLoginModalOpen(false);
    setLoginClient(null);
  };

  const handleBlockLogin = () => {
    if (!loginClient) return;
    const updated: Associate = {
      ...loginClient,
      loginStatus: 'Bloqueado'
    };
    onEditClient(updated);
    setLoginStatusVal('Bloqueado');
    setLoginClient(updated);
  };

  const handleFreezeLogin = () => {
    if (!loginClient) return;
    const updated: Associate = {
      ...loginClient,
      loginStatus: 'Congelado'
    };
    onEditClient(updated);
    setLoginStatusVal('Congelado');
    setLoginClient(updated);
  };

  const handleActivateLogin = () => {
    if (!loginClient) return;
    const updated: Associate = {
      ...loginClient,
      loginStatus: 'Ativo'
    };
    onEditClient(updated);
    setLoginStatusVal('Ativo');
    setLoginClient(updated);
  };

  const handleDeleteLogin = () => {
    if (!loginClient) return;
    if (window.confirm("Deseja realmente excluir as credenciais de login deste cliente? Ele não conseguirá mais logar até que novas credenciais sejam geradas.")) {
      const updated: Associate = {
        ...loginClient,
        username: '',
        password: '',
        loginStatus: 'Bloqueado'
      };
      onEditClient(updated);
      setLoginUsername('');
      setLoginPassword('');
      setLoginStatusVal('Bloqueado');
      setLoginClient(updated);
    }
  };

  const handleGenerateCredentials = () => {
    setLoginUsername(Math.floor(1000000 + Math.random() * 9000000).toString());
    setLoginPassword(Math.floor(1000000 + Math.random() * 9000000).toString());
    setLoginStatusVal('Ativo');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !cpf) {
      alert("Por favor, preencha os campos obrigatórios (Nome, CPF/CNPJ e E-mail).");
      return;
    }

    const isoJoiningDate = dateToISO(joiningDate);

    if (editingClient) {
      // Edit mode
      const updated: Associate = {
        ...editingClient,
        name,
        email,
        cpf,
        phone,
        address,
        status,
        joiningDate: isoJoiningDate
      };
      onEditClient(updated);
    } else {
      // Add mode
      const newClientData: Omit<Associate, 'id'> = {
        name,
        email,
        cpf,
        phone,
        address,
        status,
        joiningDate: isoJoiningDate,
        monthlyFee: 0, // Clients do not pay monthly fee
        financialStatus: 'Adimplente',
        debtAmount: 0,
        memberType: 'Cliente'
      };
      onAddClient(newClientData);
    }

    setIsFormModalOpen(false);
  };

  // Filtering clients
  const filteredClients = clients.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.cpf.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'Todos' || c.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate quick stats
  const totalCount = clients.length;
  const activeCount = clients.filter(c => c.status === 'Ativo').length;
  const inactiveCount = clients.filter(c => c.status === 'Inativo').length;

  return (
    <div className="space-y-6 text-gray-200">
      
      {/* Stats Sub-cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-[#111111] p-5 rounded-2xl border border-white/5 shadow-xl flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block font-sans">Total de Clientes</span>
            <span className="text-3xl font-extrabold text-white block">{totalCount}</span>
          </div>
          <div className="h-10 w-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
            <Users className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-[#111111] p-5 rounded-2xl border border-white/5 shadow-xl flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block font-sans">Clientes Ativos</span>
            <span className="text-3xl font-extrabold text-emerald-400 block">{activeCount}</span>
          </div>
          <div className="h-10 w-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-[#111111] p-5 rounded-2xl border border-white/5 shadow-xl flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block font-sans">Clientes Inativos</span>
            <span className="text-3xl font-extrabold text-rose-400 block">{inactiveCount}</span>
          </div>
          <div className="h-10 w-10 bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-400">
            <XCircle className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Control panel */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-[#111111] p-4 rounded-2xl border border-white/5 shadow-xl">
        {/* Search */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
            <Search className="h-4 w-4" />
          </div>
          <input
            id="search-clients"
            type="text"
            placeholder="Buscar por nome, e-mail ou CPF/CNPJ do cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-9 pr-4 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Filter and Add Button */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs">
            <span className="text-gray-500 font-bold uppercase tracking-wider text-[10px]">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-transparent focus:outline-none font-medium text-white cursor-pointer"
            >
              <option value="Todos" className="bg-[#111111]">Todos</option>
              <option value="Ativo" className="bg-[#111111]">Ativo</option>
              <option value="Inativo" className="bg-[#111111]">Inativo</option>
            </select>
          </div>

          <button
            id="btn-add-client"
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-900/20 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Cadastrar Cliente
          </button>
        </div>
      </div>

      {/* Table block */}
      <div className="bg-[#111111] rounded-2xl border border-white/5 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1a1a1a]/60 border-b border-white/5">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">CPF / CNPJ</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contato</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cadastro</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <AnimatePresence mode="popLayout">
                {filteredClients.map((client) => (
                  <motion.tr
                    key={client.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/10">
                          {client.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white font-sans">{client.name}</p>
                          <span className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                            <Mail className="h-3 w-3 shrink-0" />
                            {client.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs font-mono font-medium text-gray-300">{client.cpf}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs text-gray-300 flex items-center gap-1.5 font-sans">
                        <Phone className="h-3.5 w-3.5 text-gray-500" />
                        {client.phone || <span className="text-gray-600">Não informado</span>}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-gray-500" />
                        {dateToBRL(client.joiningDate)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        client.status === 'Ativo' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {client.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenDetailsModal(client)}
                          className="p-1.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                          title="Ver Detalhes do Cliente"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(client)}
                          className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                          title="Editar Cadastro"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenLoginModal(client)}
                          className="p-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                          title="Gerenciar Credenciais de Login"
                        >
                          <Lock className="h-3.5 w-3.5" />
                        </button>

                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>

              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-gray-500">
                    <Users className="h-12 w-12 text-gray-700 mx-auto mb-2" />
                    <h4 className="font-semibold text-white text-sm">Nenhum cliente cadastrado</h4>
                    <p className="text-xs text-gray-500 max-w-xs mx-auto mt-1">Nenhum cliente atende aos filtros atuais de pesquisa.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add/Edit Client */}
      {isFormModalOpen && (
        <div id="client-form-modal" className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#111111] rounded-2xl shadow-2xl border border-white/10 max-w-lg w-full overflow-hidden text-gray-200"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-[#1a1a1a]/40">
              <h3 className="font-bold text-white text-base">
                {editingClient ? 'Editar Cadastro do Cliente' : 'Cadastrar Novo Cliente'}
              </h3>
              <button onClick={() => setIsFormModalOpen(false)} className="text-gray-400 hover:text-white p-1 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Nome Completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: João da Silva Santos"
                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                      CPF ou CNPJ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={cpf}
                      onChange={(e) => setCpf(maskCpfCnpj(e.target.value))}
                      placeholder="Ex: 000.000.000-00 ou 00.000.000/0000-00"
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                      E-mail <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Ex: joao@email.com"
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                      Telefone
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Ex: (11) 99999-9999"
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                      Data de Cadastro <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={joiningDate}
                      onChange={(e) => setJoiningDate(maskDate(e.target.value))}
                      placeholder="DD/MM/AAAA"
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Endereço Completo
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Ex: Rua das Flores, 123 - Centro, São Paulo - SP"
                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Status do Cadastro
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm cursor-pointer text-gray-300">
                      <input
                        type="radio"
                        name="client-status"
                        checked={status === 'Ativo'}
                        onChange={() => setStatus('Ativo')}
                        className="accent-indigo-500 h-4.5 w-4.5"
                      />
                      <span>Ativo</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer text-gray-300">
                      <input
                        type="radio"
                        name="client-status"
                        checked={status === 'Inativo'}
                        onChange={() => setStatus('Inativo')}
                        className="accent-indigo-500 h-4.5 w-4.5"
                      />
                      <span>Inativo</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-white/5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 border border-white/10 rounded-xl text-xs font-semibold text-gray-400 hover:bg-white/5 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-900/20 cursor-pointer"
                >
                  {editingClient ? 'Salvar Alterações' : 'Salvar Cadastro'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Modal: Client Details */}
      {isDetailsModalOpen && selectedClient && (
        <div id="client-details-modal" className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#111111] rounded-2xl shadow-2xl border border-white/10 max-w-2xl w-full overflow-hidden text-gray-200"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-[#1a1a1a]/40">
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-indigo-400" />
                <h3 className="font-bold text-white text-base">Ficha Cadastral do Cliente</h3>
              </div>
              <button onClick={() => {
                setIsDetailsModalOpen(false);
                setSelectedClient(null);
              }} className="text-gray-400 hover:text-white p-1 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Information blocks */}
                <div className="bg-[#161616] p-4.5 rounded-xl border border-white/5 space-y-3">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-2">
                    Dados Básicos
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-gray-500 block">Nome Completo</span>
                      <span className="font-bold text-white text-sm">{selectedClient.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">E-mail</span>
                      <span className="font-bold text-white text-sm">{selectedClient.email}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">CPF / CNPJ</span>
                      <span className="font-bold text-white text-sm font-mono">{selectedClient.cpf}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#161616] p-4.5 rounded-xl border border-white/5 space-y-3">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-2">
                    Contato & Status
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-gray-500 block">Telefone</span>
                      <span className="font-bold text-white text-sm">{selectedClient.phone || 'Não informado'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Data de Cadastro</span>
                      <span className="font-bold text-white text-sm">{dateToBRL(selectedClient.joiningDate)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Status de Atividade</span>
                      <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase mt-1 ${
                        selectedClient.status === 'Ativo' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {selectedClient.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#161616] p-4.5 rounded-xl border border-white/5 space-y-3 md:col-span-2">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-2">
                    <MapPin className="h-4 w-4 text-indigo-500" />
                    Endereço Completo
                  </h4>
                  <p className="text-xs text-gray-300">{selectedClient.address || 'Não cadastrado'}</p>
                </div>

                {/* Login Block */}
                <div className="bg-[#161616] p-4.5 rounded-xl border border-white/5 space-y-3 md:col-span-2">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-2">
                    <Lock className="h-4 w-4 text-indigo-500" />
                    Credenciais & Login de Acesso
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-gray-500 block">Matrícula (6 dígitos)</span>
                      <span className="font-bold text-blue-400 text-sm font-mono">{selectedClient.matricula || 'Não gerada'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Usuário de Login</span>
                      <span className="font-bold text-indigo-400 text-sm font-mono">{selectedClient.username || 'Não definido'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Senha de Acesso</span>
                      <span className="font-bold text-emerald-400 text-sm font-mono">{selectedClient.password || 'Não definida'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Status do Login</span>
                      <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase mt-1 ${
                        selectedClient.loginStatus === 'Bloqueado' ? 'bg-red-500/15 text-red-400 border border-red-500/20' :
                        selectedClient.loginStatus === 'Congelado' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' :
                        'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {selectedClient.loginStatus || 'Ativo'}
                      </span>
                    </div>
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
                  setSelectedClient(null);
                }}
                className="px-4 py-2 bg-[#1a1a1a] border border-white/10 hover:bg-white/5 text-gray-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Fechar Ficha
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal: Manage Login */}
      {isLoginModalOpen && loginClient && (
        <div id="client-login-modal" className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#111111] rounded-2xl shadow-2xl border border-white/10 max-w-md w-full overflow-hidden text-gray-200"
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
                  setLoginClient(null);
                }} 
                className="text-gray-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="p-3 bg-[#1a1a1a] rounded-xl border border-white/5 text-xs text-gray-300">
                <span className="font-semibold block text-white mb-0.5">Cliente:</span>
                {loginClient.name} ({loginClient.email})
                <div className="mt-2 text-[11px] text-gray-400 flex items-center gap-2">
                  <span>Matrícula: <strong>{loginClient.matricula}</strong></span>
                  <span>•</span>
                  <span>Status: 
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
                  Ações de Status de Login
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
                  <span className="text-[9px] text-gray-500 uppercase font-semibold font-mono">Cód: {loginClient.id}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/5 flex justify-end gap-3 bg-[#161616]">
              <button
                type="button"
                onClick={() => {
                  setIsLoginModalOpen(false);
                  setLoginClient(null);
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
    </div>
  );
}
