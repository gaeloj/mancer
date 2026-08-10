import React, { useState, useEffect } from 'react';
import { 
  UserPlus, Search, Shield, Key, Eye, EyeOff, Copy, Edit2, Trash2, 
  CheckCircle, Lock, Mail, Phone, UserCheck, RefreshCw, X, ShieldAlert, 
  BadgeCheck, Building2, Save, Upload, MapPin, User, ChevronDown, ChevronUp, Image as ImageIcon,
  GraduationCap, BookOpen, School, Award, Briefcase, FileSpreadsheet
} from 'lucide-react';
import { Collaborator, EntityConfig } from '../types';
import { maskCpfCnpj } from '../utils/formatters';

const STORAGE_KEY = 'school_collaborators_list';

const INITIAL_SCHOOL_COLLABORATORS: Collaborator[] = [
  {
    id: 'colab-1',
    name: 'Prof. Carlos Eduardo Andrade',
    cpf: '123.456.789-00',
    email: 'carlos.andrade@escola.edu.br',
    phone: '(81) 99888-1122',
    role: 'Professor Titular',
    department: 'Corpo Docente',
    subject: 'Matemática e Física',
    registration: 'ESC-2026-001',
    accessLevel: 'Docente',
    username: 'carlos.matematica',
    password: 'prof2026!pass',
    status: 'Ativo',
    createdAt: '15/01/2026',
    lastAccess: 'Hoje às 14:20'
  },
  {
    id: 'colab-2',
    name: 'Juliana Lima Medeiros',
    cpf: '987.654.321-11',
    email: 'juliana.coordenacao@escola.edu.br',
    phone: '(81) 99777-3344',
    role: 'Coordenadora Pedagógica',
    department: 'Coordenação Pedagógica',
    registration: 'ESC-2026-002',
    accessLevel: 'Administrador',
    username: 'juliana.coord',
    password: 'coord2026#pass',
    status: 'Ativo',
    createdAt: '01/02/2026',
    lastAccess: 'Hoje às 09:15'
  },
  {
    id: 'colab-3',
    name: 'Roberto Alves Santos',
    cpf: '456.789.123-22',
    email: 'secretaria@escola.edu.br',
    phone: '(81) 99666-5566',
    role: 'Secretário Escolar',
    department: 'Secretaria Escolar',
    registration: 'ESC-2026-003',
    accessLevel: 'Atendimento',
    username: 'roberto.secretaria',
    password: 'sec2026!pass',
    status: 'Ativo',
    createdAt: '10/02/2026',
    lastAccess: 'Ontem às 17:40'
  },
  {
    id: 'colab-4',
    name: 'Profa. Fernanda Souza Lima',
    cpf: '321.654.987-33',
    email: 'fernanda.portugues@escola.edu.br',
    phone: '(81) 99555-4433',
    role: 'Professora',
    department: 'Corpo Docente',
    subject: 'Língua Portuguesa e Redação',
    registration: 'ESC-2026-004',
    accessLevel: 'Docente',
    username: 'fernanda.portugues',
    password: 'port2026#pass',
    status: 'Ativo',
    createdAt: '20/02/2026',
    lastAccess: '28/07/2026'
  },
  {
    id: 'colab-5',
    name: 'Marcos Vinicius Silva',
    cpf: '789.123.456-44',
    email: 'financeiro@escola.edu.br',
    phone: '(81) 99444-2211',
    role: 'Analista de Tesouraria Escolar',
    department: 'Financeiro Escolar',
    registration: 'ESC-2026-005',
    accessLevel: 'Financeiro',
    username: 'marcos.financeiro',
    password: 'fin2026!pass',
    status: 'Ativo',
    createdAt: '01/03/2026',
    lastAccess: '25/07/2026'
  }
];

interface CollaboratorsTabProps {
  collaborators?: Collaborator[];
  onAddCollaborator?: (colab: Collaborator) => void;
  onEditCollaborator?: (colab: Collaborator) => void;
  onDeleteCollaborator?: (id: string) => void;
  entityConfig?: EntityConfig | null;
  onUpdateEntityConfig?: (config: EntityConfig) => void;
}

export default function CollaboratorsTab({
  collaborators: propsCollaborators,
  onAddCollaborator,
  onEditCollaborator,
  onDeleteCollaborator,
  entityConfig,
  onUpdateEntityConfig
}: CollaboratorsTabProps) {
  // Collaborators List State
  const [collaborators, setCollaborators] = useState<Collaborator[]>(() => {
    if (propsCollaborators && propsCollaborators.length > 0) return propsCollaborators;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Erro ao ler colaboradores:', e);
    }
    return INITIAL_SCHOOL_COLLABORATORS;
  });

  // Keep state synced with props if provided
  useEffect(() => {
    if (propsCollaborators && propsCollaborators.length > 0) {
      setCollaborators(propsCollaborators);
    }
  }, [propsCollaborators]);

  // School Entity Data State
  const [showEntitySection, setShowEntitySection] = useState(true);
  const [entityData, setEntityData] = useState<EntityConfig>(() => {
    if (entityConfig) return entityConfig;
    try {
      const stored = localStorage.getItem('entity_config');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return {
      name: 'Escola e Colégio Modelo de Excelência',
      acronym: 'ECME',
      cnpj: '12.345.678/0001-90',
      inepCode: '26048123',
      email: 'secretaria@colegiomodelo.edu.br',
      phone: '(81) 3456-7890',
      address: 'Av. das Academias, 500 - Bairro Universitário',
      city: 'Recife/PE',
      monthlyFee: 350,
      logo: '',
      presidentName: 'Prof. Dr. Antônio Carlos de Mendonça',
      schoolSegments: 'Educação Infantil, Ensino Fundamental I e II, Ensino Médio'
    };
  });

  // Sync entityData when props update
  useEffect(() => {
    if (entityConfig) {
      setEntityData({
        logo: entityConfig.logo || '',
        name: entityConfig.name || '',
        acronym: entityConfig.acronym || '',
        cnpj: entityConfig.cnpj || '',
        inepCode: entityConfig.inepCode || '',
        email: entityConfig.email || '',
        phone: entityConfig.phone || '',
        address: entityConfig.address || '',
        city: entityConfig.city || '',
        monthlyFee: entityConfig.monthlyFee || 0,
        presidentName: entityConfig.presidentName || '',
        schoolSegments: entityConfig.schoolSegments || ''
      });
    }
  }, [entityConfig]);

  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('Todos');
  const [accessFilter, setAccessFilter] = useState<string>('Todos');
  const [statusFilter, setStatusFilter] = useState<string>('Todos');

  // Modal State for Collaborators
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingColab, setEditingColab] = useState<Collaborator | null>(null);

  // Form State for Collaborator
  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    email: '',
    phone: '',
    role: '',
    department: 'Corpo Docente',
    subject: '',
    registration: '',
    accessLevel: 'Docente' as Collaborator['accessLevel'],
    username: '',
    password: '',
    status: 'Ativo' as Collaborator['status']
  });

  const [visiblePasswords, setVisiblePasswords] = useState<{ [id: string]: boolean }>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Save collaborators list to localStorage whenever updated
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(collaborators));
    } catch (e) {
      console.error('Erro ao salvar colaboradores:', e);
    }
  }, [collaborators]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Save Entity Data
  const handleSaveEntityData = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateEntityConfig) {
      onUpdateEntityConfig(entityData);
    }
    try {
      localStorage.setItem('entity_config', JSON.stringify(entityData));
    } catch (err) {
      console.error('Erro ao gravar entity_config:', err);
    }
    showToast('Dados cadastrais da Escola atualizados com sucesso!');
  };

  // Clear / Reset Entity Data
  const handleClearEntityData = () => {
    if (window.confirm('Tem certeza que deseja limpar todos os dados cadastrais da Escola?')) {
      const cleared: EntityConfig = {
        name: '',
        acronym: '',
        cnpj: '',
        inepCode: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        monthlyFee: 0,
        logo: '',
        presidentName: '',
        schoolSegments: ''
      };
      setEntityData(cleared);
      if (onUpdateEntityConfig) {
        onUpdateEntityConfig(cleared);
      }
      try {
        localStorage.setItem('entity_config', JSON.stringify(cleared));
      } catch (e) {}
      showToast('Dados cadastrais da Escola foram limpos.');
    }
  };

  // Clear / Delete All Collaborators
  const handleClearAllCollaborators = () => {
    if (window.confirm('ATENÇÃO: Tem certeza que deseja EXCLUIR TODOS os colaboradores da escola?')) {
      setCollaborators([]);
      showToast('Todos os colaboradores foram excluídos.');
    }
  };

  // Restore Default Collaborators
  const handleRestoreDefaultCollaborators = () => {
    if (window.confirm('Deseja restaurar a lista inicial com os colaboradores modelo?')) {
      setCollaborators(INITIAL_SCHOOL_COLLABORATORS);
      showToast('Lista inicial de colaboradores restaurada!');
    }
  };

  // Logo File Upload Handler
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('A imagem da logomarca deve ter no máximo 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setEntityData(prev => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenModal = (colab?: Collaborator) => {
    if (colab) {
      setEditingColab(colab);
      setFormData({
        name: colab.name,
        cpf: colab.cpf,
        email: colab.email,
        phone: colab.phone,
        role: colab.role,
        department: colab.department || 'Corpo Docente',
        subject: colab.subject || '',
        registration: colab.registration || '',
        accessLevel: colab.accessLevel,
        username: colab.username,
        password: colab.password || '',
        status: colab.status
      });
    } else {
      setEditingColab(null);
      const nextNum = String(collaborators.length + 1).padStart(3, '0');
      setFormData({
        name: '',
        cpf: '',
        email: '',
        phone: '',
        role: '',
        department: 'Corpo Docente',
        subject: '',
        registration: `ESC-2026-${nextNum}`,
        accessLevel: 'Docente',
        username: '',
        password: generateRandomPassword(),
        status: 'Ativo'
      });
    }
    setIsModalOpen(true);
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let pwd = '';
    for (let i = 0; i < 9; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pwd;
  };

  const handleGenerateUsername = () => {
    if (!formData.name.trim()) return;
    const parts = formData.name.trim().toLowerCase().replace(/prof(a)?\.\s*/g, '').split(' ');
    const first = parts[0];
    const last = parts.length > 1 ? parts[parts.length - 1] : '';
    const suggested = last ? `${first}.${last}` : first;
    setFormData(prev => ({ ...prev, username: suggested }));
  };

  const handleSubmitCollaborator = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.username.trim()) {
      showToast('Preencha pelo menos o Nome e o Nome de Usuário.');
      return;
    }

    if (editingColab) {
      const updatedColab: Collaborator = {
        ...editingColab,
        name: formData.name.trim(),
        cpf: formData.cpf.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        role: formData.role.trim() || 'Colaborador Escolar',
        department: formData.department,
        subject: formData.subject.trim(),
        registration: formData.registration.trim(),
        accessLevel: formData.accessLevel,
        username: formData.username.trim().toLowerCase(),
        password: formData.password.trim(),
        status: formData.status
      };

      setCollaborators(prev =>
        prev.map(c => c.id === editingColab.id ? updatedColab : c)
      );

      if (onEditCollaborator) {
        onEditCollaborator(updatedColab);
      }

      showToast(`Colaborador ${formData.name} atualizado com sucesso!`);
    } else {
      const newColab: Collaborator = {
        id: `colab-${Date.now()}`,
        name: formData.name.trim(),
        cpf: formData.cpf.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        role: formData.role.trim() || 'Colaborador Escolar',
        department: formData.department,
        subject: formData.subject.trim(),
        registration: formData.registration.trim(),
        accessLevel: formData.accessLevel,
        username: formData.username.trim().toLowerCase(),
        password: formData.password.trim() || generateRandomPassword(),
        status: formData.status,
        createdAt: new Date().toLocaleDateString('pt-BR'),
        lastAccess: 'Nunca acessou'
      };

      setCollaborators(prev => [newColab, ...prev]);

      if (onAddCollaborator) {
        onAddCollaborator(newColab);
      }

      showToast(`Novo colaborador escolar ${formData.name} cadastrado com sucesso!`);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    setCollaborators(prev => prev.filter(c => c.id !== id));
    if (onDeleteCollaborator) {
      onDeleteCollaborator(id);
    }
    showToast(`Acesso de ${name} removido.`);
  };

  const handleToggleStatus = (id: string) => {
    const target = collaborators.find(c => c.id === id);
    if (!target) return;
    const newStatus = target.status === 'Ativo' ? 'Bloqueado' : 'Ativo';
    const updatedTarget: Collaborator = { ...target, status: newStatus };

    setCollaborators(prev =>
      prev.map(c => c.id === id ? updatedTarget : c)
    );

    if (onEditCollaborator) {
      onEditCollaborator(updatedTarget);
    }

    showToast(`Status de ${target.name} alterado para ${newStatus}.`);
  };

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyCredentials = (colab: Collaborator) => {
    const text = `Credenciais do Portal Escolar - UniOn:\nUsuário: ${colab.username}\nSenha: ${colab.password || '******'}\nFunção: ${colab.role}\nNível: ${colab.accessLevel}`;
    navigator.clipboard.writeText(text);
    showToast(`Credenciais de ${colab.name} copiadas com sucesso!`);
  };

  // Filtering
  const filtered = collaborators.filter(c => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      c.name.toLowerCase().includes(term) ||
      c.username.toLowerCase().includes(term) ||
      c.cpf.includes(term) ||
      c.role.toLowerCase().includes(term) ||
      (c.subject && c.subject.toLowerCase().includes(term)) ||
      (c.registration && c.registration.toLowerCase().includes(term)) ||
      c.email.toLowerCase().includes(term);

    const matchesDept = departmentFilter === 'Todos' || c.department === departmentFilter;
    const matchesAccess = accessFilter === 'Todos' || c.accessLevel === accessFilter;
    const matchesStatus = statusFilter === 'Todos' || c.status === statusFilter;

    return matchesSearch && matchesDept && matchesAccess && matchesStatus;
  });

  const totalColabs = collaborators.length;
  const teachersCount = collaborators.filter(c => c.department === 'Corpo Docente' || c.accessLevel === 'Docente').length;
  const coordCount = collaborators.filter(c => c.department === 'Coordenação Pedagógica' || c.department === 'Direção').length;
  const activeColabs = collaborators.filter(c => c.status === 'Ativo').length;

  const getAccessBadgeColor = (level: Collaborator['accessLevel']) => {
    switch (level) {
      case 'Administrador':
        return 'bg-purple-500/10 border-purple-500/30 text-purple-400';
      case 'Docente':
        return 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400';
      case 'Financeiro':
        return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
      case 'Atendimento':
        return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
      case 'Consulta':
        return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
      default:
        return 'bg-gray-500/10 border-gray-500/30 text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold border border-emerald-400/30 animate-bounce">
          <BadgeCheck className="w-5 h-5 text-emerald-200 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* SECTION 1: DADOS CADASTRAIS DA ESCOLA / INSTITUIÇÃO */}
      <div className="bg-[#161618] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div 
          onClick={() => setShowEntitySection(!showEntitySection)}
          className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950/60 to-zinc-900 border-b border-white/10 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
              <School className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-white text-base">Dados Cadastrais da Escola / Instituição de Ensino</h3>
                <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold rounded-md">
                  Gestão Escolar
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Preencha as informações institucionais do Colégio/Escola, código INEP, CNPJ, Direção e segmentos ofertados.
              </p>
            </div>
          </div>

          <button className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-300 transition-colors">
            {showEntitySection ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>

        {showEntitySection && (
          <form onSubmit={handleSaveEntityData} className="p-6 space-y-4 text-xs">
            {/* Grid Row 1: Nome da Escola, Sigla e Cód. INEP + CNPJ */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-5">
                <label className="block text-gray-300 font-semibold mb-1 flex items-center gap-1.5">
                  <School className="w-3.5 h-3.5 text-indigo-400" />
                  Nome Oficial da Escola / Colégio *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Colégio Modelo de Excelência"
                  value={entityData.name}
                  onChange={e => setEntityData({ ...entityData, name: e.target.value })}
                  className="w-full bg-[#121214] border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-gray-300 font-semibold mb-1">
                  Sigla Escolar
                </label>
                <input
                  type="text"
                  placeholder="Ex: ECME"
                  value={entityData.acronym}
                  onChange={e => setEntityData({ ...entityData, acronym: e.target.value.toUpperCase() })}
                  className="w-full bg-[#121214] border border-white/10 rounded-xl px-3.5 py-2.5 text-white font-mono uppercase focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-gray-300 font-semibold mb-1">
                  Cód. INEP (MEC)
                </label>
                <input
                  type="text"
                  placeholder="Ex: 26048123"
                  value={entityData.inepCode || ''}
                  onChange={e => setEntityData({ ...entityData, inepCode: e.target.value })}
                  className="w-full bg-[#121214] border border-white/10 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-gray-300 font-semibold mb-1">
                  CNPJ da Escola
                </label>
                <input
                  type="text"
                  placeholder="00.000.000/0001-00"
                  value={entityData.cnpj}
                  onChange={e => setEntityData({ ...entityData, cnpj: maskCpfCnpj(e.target.value) })}
                  className="w-full bg-[#121214] border border-white/10 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Grid Row 2: Diretor(a) Escolar, E-mail da Secretaria, Telefone */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-gray-300 font-semibold mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  Diretor(a) Geral / Gestor(a) Escolar
                </label>
                <input
                  type="text"
                  placeholder="Nome do Diretor(a) ou Mantenedor"
                  value={entityData.presidentName || ''}
                  onChange={e => setEntityData({ ...entityData, presidentName: e.target.value })}
                  className="w-full bg-[#121214] border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-indigo-400" />
                  E-mail da Secretaria Escolar
                </label>
                <input
                  type="email"
                  placeholder="secretaria@escola.edu.br"
                  value={entityData.email}
                  onChange={e => setEntityData({ ...entityData, email: e.target.value })}
                  className="w-full bg-[#121214] border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-indigo-400" />
                  Telefone / WhatsApp da Recepção
                </label>
                <input
                  type="text"
                  placeholder="(00) 0000-0000"
                  value={entityData.phone}
                  onChange={e => setEntityData({ ...entityData, phone: e.target.value })}
                  className="w-full bg-[#121214] border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Grid Row 3: Endereço, Segmentos de Ensino e Escudo/Logo */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-4">
                <label className="block text-gray-300 font-semibold mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                  Endereço do Campus / Unidade
                </label>
                <input
                  type="text"
                  placeholder="Rua, Número, Bairro, Cidade/UF"
                  value={entityData.address}
                  onChange={e => setEntityData({ ...entityData, address: e.target.value })}
                  className="w-full bg-[#121214] border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="md:col-span-4">
                <label className="block text-gray-300 font-semibold mb-1 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                  Etapas & Segmentos Atendidos
                </label>
                <input
                  type="text"
                  placeholder="Ex: Infantil, Fundamental I e II, Ensino Médio"
                  value={entityData.schoolSegments || ''}
                  onChange={e => setEntityData({ ...entityData, schoolSegments: e.target.value })}
                  className="w-full bg-[#121214] border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Logo / Escudo Escolar */}
              <div className="md:col-span-4">
                <label className="block text-gray-300 font-semibold mb-1 flex items-center justify-between">
                  <span>Logomarca / Escudo da Escola</span>
                  {entityData.logo && (
                    <button
                      type="button"
                      onClick={() => setEntityData({ ...entityData, logo: '' })}
                      className="text-[10px] text-red-400 hover:underline cursor-pointer"
                    >
                      Remover Logo
                    </button>
                  )}
                </label>

                <div className="flex items-center gap-3">
                  {entityData.logo ? (
                    <div className="w-12 h-12 rounded-xl bg-white/10 p-1 border border-white/20 flex items-center justify-center shrink-0 overflow-hidden">
                      <img src={entityData.logo} alt="Logo Escola" className="max-w-full max-h-full object-contain" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-[#121214] border border-dashed border-white/20 flex items-center justify-center shrink-0 text-gray-500">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                  )}

                  <label className="flex-1 bg-[#121214] hover:bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-center text-gray-300 hover:text-white cursor-pointer transition-colors flex items-center justify-center gap-2">
                    <Upload className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="truncate">{entityData.logo ? 'Alterar Escudo' : 'Enviar Imagem/Escudo'}</span>
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                </div>
              </div>
            </div>

            {/* Save & Clear Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <button
                type="button"
                onClick={handleClearEntityData}
                className="px-3.5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Limpar todos os campos da escola"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpar Dados da Escola</span>
              </button>

              <button
                type="submit"
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/25 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Dados Institucionais da Escola</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* SECTION 2: GERENCIAMENTO E CADASTRO DE COLABORADORES ESCOLARES */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-zinc-900 p-6 rounded-2xl border border-indigo-500/20 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <GraduationCap className="w-48 h-48 text-indigo-400" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full text-xs font-bold mb-2">
              <UserPlus className="w-3.5 h-3.5" />
              <span>Gestão do Corpo Docente e Colaboradores Escolares</span>
            </div>
            <h2 className="text-xl font-black text-white tracking-wide">Cadastro de Colaboradores da Escola</h2>
            <p className="text-xs text-gray-400 mt-1 max-w-2xl">
              Cadastre professores, coordenadores pedagógicos, secretários escolares, diretores e apoio operacional. Crie acessos ao Portal Escolar com logins e senhas individuais.
            </p>
          </div>

          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all cursor-pointer shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Novo Colaborador Escolar</span>
          </button>
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-[#161618] border border-white/5 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total de Colaboradores</span>
            <span className="text-lg font-black text-white">{totalColabs}</span>
          </div>
        </div>

        <div className="p-4 bg-[#161618] border border-white/5 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Professores / Corpo Docente</span>
            <span className="text-lg font-black text-indigo-400">{teachersCount}</span>
          </div>
        </div>

        <div className="p-4 bg-[#161618] border border-white/5 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 bg-purple-500/10 rounded-xl text-purple-400 border border-purple-500/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Coordenação & Direção</span>
            <span className="text-lg font-black text-purple-400">{coordCount}</span>
          </div>
        </div>

        <div className="p-4 bg-[#161618] border border-white/5 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Acessos Ativos</span>
            <span className="text-lg font-black text-emerald-400">{activeColabs}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-[#161618] border border-white/5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome, usuário, disciplina, matrícula, CPF..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-[#121214] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Department Filter */}
          <select
            value={departmentFilter}
            onChange={e => setDepartmentFilter(e.target.value)}
            className="bg-[#121214] border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="Todos">Todos os Setores</option>
            <option value="Corpo Docente">Corpo Docente (Professores)</option>
            <option value="Coordenação Pedagógica">Coordenação Pedagógica</option>
            <option value="Secretaria Escolar">Secretaria Escolar</option>
            <option value="Direção">Direção Geral</option>
            <option value="Financeiro Escolar">Financeiro / Mensalidades</option>
            <option value="Apoio Operacional">Apoio / Monitoria / Inspetoria</option>
          </select>

          {/* Access Level Filter */}
          <select
            value={accessFilter}
            onChange={e => setAccessFilter(e.target.value)}
            className="bg-[#121214] border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="Todos">Todas Permissões</option>
            <option value="Docente">Portal do Professor (Docente)</option>
            <option value="Administrador">Administrador Escolar</option>
            <option value="Atendimento">Secretaria & Atendimento</option>
            <option value="Financeiro">Caixa / Mensalidades</option>
            <option value="Consulta">Consulta / Leitura</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-[#121214] border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="Todos">Todos Status</option>
            <option value="Ativo">Ativo</option>
            <option value="Bloqueado">Bloqueado</option>
          </select>

          {/* Quick List Action Buttons */}
          <button
            onClick={handleRestoreDefaultCollaborators}
            className="p-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl border border-white/10 transition-colors cursor-pointer"
            title="Restaurar Lista Inicial de Exemplo"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          
          <button
            onClick={handleClearAllCollaborators}
            className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-xl border border-red-500/20 transition-colors cursor-pointer"
            title="Excluir Todos os Colaboradores"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Collaborators List Table */}
      <div className="bg-[#161618] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-500 space-y-3">
            <ShieldAlert className="w-10 h-10 mx-auto text-gray-600 stroke-[1.5]" />
            <p className="text-xs font-semibold">Nenhum colaborador escolar localizado com os filtros selecionados.</p>
            <button
              onClick={() => { setSearchTerm(''); setDepartmentFilter('Todos'); setAccessFilter('Todos'); setStatusFilter('Todos'); }}
              className="text-xs text-indigo-400 hover:underline cursor-pointer"
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#121214] text-gray-400 font-semibold border-b border-white/10">
                <tr>
                  <th className="p-3.5">Colaborador / Função Escolar</th>
                  <th className="p-3.5">Setor / Disciplina</th>
                  <th className="p-3.5">Contatos</th>
                  <th className="p-3.5">Permissão no Portal</th>
                  <th className="p-3.5">Credenciais (Login)</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(colab => {
                  const isPwdVisible = !!visiblePasswords[colab.id];
                  return (
                    <tr key={colab.id} className="hover:bg-white/5 transition-colors">
                      {/* Name & Role */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-slate-800 border border-indigo-400/30 flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-inner">
                            {colab.name.replace(/Prof(a)?\.\s*/g, '').split(' ').map(n => n[0]).slice(0, 2).join('')}
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm flex items-center gap-1.5">
                              <span>{colab.name}</span>
                            </div>
                            <div className="text-[11px] text-gray-400 font-medium flex items-center gap-2 mt-0.5">
                              <span>{colab.role}</span>
                              {colab.registration && (
                                <span className="bg-white/5 text-indigo-300 px-1.5 py-0.2 rounded border border-white/10 font-mono text-[10px]">
                                  {colab.registration}
                                </span>
                              )}
                            </div>
                            {colab.cpf && (
                              <div className="text-[10px] text-gray-500 font-mono">CPF: {colab.cpf}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Department & Subject */}
                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          <span className="text-gray-200 font-medium block">{colab.department || 'Geral'}</span>
                          {colab.subject ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                              <BookOpen className="w-3 h-3" />
                              {colab.subject}
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-500 block">Equipe de Apoio / Gestão</span>
                          )}
                        </div>
                      </td>

                      {/* Contacts */}
                      <td className="p-3.5 space-y-1">
                        {colab.email && (
                          <div className="flex items-center gap-1.5 text-gray-300">
                            <Mail className="w-3 h-3 text-gray-500 shrink-0" />
                            <span className="truncate max-w-[170px]">{colab.email}</span>
                          </div>
                        )}
                        {colab.phone && (
                          <div className="flex items-center gap-1.5 text-gray-400 text-[11px]">
                            <Phone className="w-3 h-3 text-gray-500 shrink-0" />
                            <span>{colab.phone}</span>
                          </div>
                        )}
                      </td>

                      {/* Access Level Badge */}
                      <td className="p-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-bold ${getAccessBadgeColor(colab.accessLevel)}`}>
                          {colab.accessLevel === 'Docente' ? <BookOpen className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                          <span>{colab.accessLevel}</span>
                        </span>
                      </td>

                      {/* Credentials (Username / Password) */}
                      <td className="p-3.5">
                        <div className="space-y-1 bg-[#121214] p-2 rounded-lg border border-white/5 font-mono text-[11px] max-w-[210px]">
                          <div className="flex items-center justify-between gap-1 text-gray-300">
                            <span className="text-gray-500 text-[10px]">User:</span>
                            <span className="font-bold text-indigo-300 truncate">{colab.username}</span>
                          </div>
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-gray-500 text-[10px]">Pass:</span>
                            <span className="text-gray-200">
                              {isPwdVisible ? (colab.password || '******') : '••••••••'}
                            </span>
                            <div className="flex items-center gap-0.5">
                              <button
                                onClick={() => togglePasswordVisibility(colab.id)}
                                className="p-1 hover:text-white text-gray-500 transition-colors cursor-pointer"
                                title={isPwdVisible ? "Ocultar senha" : "Exibir senha"}
                              >
                                {isPwdVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              </button>
                              <button
                                onClick={() => handleCopyCredentials(colab)}
                                className="p-1 hover:text-emerald-400 text-gray-500 transition-colors cursor-pointer"
                                title="Copiar credenciais do portal"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-3.5">
                        <button
                          onClick={() => handleToggleStatus(colab.id)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider cursor-pointer border transition-all ${
                            colab.status === 'Ativo'
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                              : 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'
                          }`}
                          title="Clique para alternar status do acesso"
                        >
                          {colab.status === 'Ativo' ? <CheckCircle className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                          <span>{colab.status}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenModal(colab)}
                            className="p-1.5 bg-white/5 hover:bg-indigo-600/20 text-gray-300 hover:text-indigo-400 rounded-lg transition-colors cursor-pointer"
                            title="Editar Colaborador Escolar"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(colab.id, colab.name)}
                            className="p-1.5 bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                            title="Excluir Colaborador"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* MODAL: Cadastrar / Editar Colaborador Escolar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#18181b] border border-white/10 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-indigo-950 to-slate-900 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    {editingColab ? 'Editar Colaborador Escolar' : 'Novo Cadastramento de Colaborador Escolar'}
                  </h3>
                  <p className="text-xs text-gray-400">Cadastre professores, coordenadores ou equipe administrativa e crie credenciais de acesso.</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitCollaborator} className="p-6 space-y-4 text-xs">
              {/* Row 1: Nome Completo + Matrícula */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-8">
                  <label className="block text-gray-300 font-semibold mb-1">
                    Nome Completo do Colaborador / Professor *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Prof. Carlos Eduardo Andrade"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-[#121214] border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-gray-300 font-semibold mb-1">
                    Matrícula Funcional
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: ESC-2026-001"
                    value={formData.registration}
                    onChange={e => setFormData({ ...formData, registration: e.target.value.toUpperCase() })}
                    className="w-full bg-[#121214] border border-white/10 rounded-xl px-3 py-2.5 text-white font-mono uppercase focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Row 2: Setor / Departamento & Cargo / Função */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Setor / Departamento Escolar *</label>
                  <select
                    value={formData.department}
                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                    className="w-full bg-[#121214] border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="Corpo Docente">Corpo Docente (Professores)</option>
                    <option value="Coordenação Pedagógica">Coordenação Pedagógica</option>
                    <option value="Secretaria Escolar">Secretaria Escolar</option>
                    <option value="Direção">Direção Geral / Gestão</option>
                    <option value="Financeiro Escolar">Financeiro / Mensalidades</option>
                    <option value="Apoio Operacional">Apoio / Monitoria / Inspetoria</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Cargo / Função Específica *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Professor Titular, Coordenadora, Secretário"
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                    className="w-full bg-[#121214] border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Row 3: Disciplina / Matéria (Se for Corpo Docente) */}
              <div>
                <label className="block text-gray-300 font-semibold mb-1 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                  Disciplina / Matéria Ministrada (para Professores)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Matemática, Física, Língua Portuguesa, História"
                  value={formData.subject}
                  onChange={e => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full bg-[#121214] border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Row 4: CPF + Telefone / WhatsApp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">CPF do Colaborador</label>
                  <input
                    type="text"
                    placeholder="000.000.000-00"
                    value={formData.cpf}
                    onChange={e => setFormData({ ...formData, cpf: maskCpfCnpj(e.target.value) })}
                    className="w-full bg-[#121214] border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="(00) 00000-0000"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-[#121214] border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Row 5: Email + Nível de Acesso */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">E-mail do Colaborador</label>
                  <input
                    type="email"
                    placeholder="colaborador@escola.edu.br"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-[#121214] border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Nível de Permissão no Portal</label>
                  <select
                    value={formData.accessLevel}
                    onChange={e => setFormData({ ...formData, accessLevel: e.target.value as Collaborator['accessLevel'] })}
                    className="w-full bg-[#121214] border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="Docente">Docente (Portal do Professor)</option>
                    <option value="Administrador">Administrador Escolar (Acesso Total)</option>
                    <option value="Atendimento">Secretaria Escolar & Atendimento</option>
                    <option value="Financeiro">Financeiro / Caixa Escolar</option>
                    <option value="Consulta">Consulta (Apenas Leitura)</option>
                  </select>
                </div>
              </div>

              {/* Section: Credenciais de Login no Portal Escolar */}
              <div className="p-4 bg-[#121214] border border-indigo-500/20 rounded-xl space-y-3 mt-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-400 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                    <Key className="w-3.5 h-3.5" />
                    Credenciais de Acesso ao Portal Escolar
                  </span>
                  <button
                    type="button"
                    onClick={handleGenerateUsername}
                    className="text-[10px] text-indigo-300 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" /> Sugerir Usuário
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-400 font-semibold mb-1">Nome de Usuário (Login) *</label>
                    <input
                      type="text"
                      required
                      placeholder="ex: carlos.matematica"
                      value={formData.username}
                      onChange={e => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                      className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-2 text-white font-mono placeholder-gray-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 font-semibold mb-1 flex items-center justify-between">
                      <span>Senha Inicial *</span>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, password: generateRandomPassword() })}
                        className="text-[9px] text-emerald-400 hover:underline cursor-pointer"
                      >
                        Gerar Senha
                      </button>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Senha do colaborador"
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-2 text-white font-mono placeholder-gray-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <div>
                  {editingColab && (
                    <button
                      type="button"
                      onClick={() => {
                        handleDelete(editingColab.id, editingColab.name);
                        setIsModalOpen(false);
                      }}
                      className="px-3.5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Excluir Colaborador</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>{editingColab ? 'Salvar Alterações' : 'Cadastrar Colaborador Escolar'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
