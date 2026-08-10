import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  School, Search, Plus, Edit, Trash2, 
  CheckCircle2, X, Building2, ShieldCheck, Feather, Hash, Upload, Image as ImageIcon, MapPin,
  Users, UserPlus, Briefcase, Phone, Clock, UserCheck, UserX, ChevronRight, FileText, CreditCard, Mail,
  Key, Lock, Eye, EyeOff, BadgeCheck, Globe, Cpu, Camera, Calculator
} from 'lucide-react';
import { EntityConfig, TimePunchLog, formatDateBR, formatTimeBR, getTodayFormatted, getTimeNowFormatted } from '../types';

export type StaffRole = 
  | 'Servente de Limpeza'
  | 'Cozinheira(o)'
  | 'Porteiro(a)'
  | 'Professor(a)'
  | 'Recepção I'
  | 'Apoio ADM I'
  | 'Oficineiro(a)'
  | 'Cuidador(a) Escolar'
  | 'Outro';

export const STAFF_ROLES: StaffRole[] = [
  'Servente de Limpeza',
  'Cozinheira(o)',
  'Porteiro(a)',
  'Professor(a)',
  'Recepção I',
  'Apoio ADM I',
  'Oficineiro(a)',
  'Cuidador(a) Escolar',
  'Outro'
];

export interface SchoolStaff {
  id: string;
  schoolId: string;
  name: string;
  registrationCode?: string; // Matrícula
  username?: string;         // Usuário
  password?: string;         // Senha
  email?: string;
  birthDate?: string;
  maritalStatus?: 'Solteiro(a)' | 'Casado(a)' | 'Divorciado(a)' | 'Viúvo(a)' | 'União Estável';
  motherName?: string;
  fatherName?: string;
  docType?: 'RG' | 'CNH' | 'CIN';
  docNumber?: string;
  docIssuer?: string;
  docUf?: string;
  docIssueDate?: string;
  cpf?: string;
  nis?: string;
  sus?: string;
  role: StaffRole | string;
  shift: 'Manhã' | 'Tarde' | 'Noite' | 'Integral';
  phone?: string;
  status: 'Ativo' | 'Inativo';
}

const DEFAULT_STAFF: SchoolStaff[] = [
  { 
    id: 'stf-1', schoolId: 'sch-ind-1', name: 'Maria das Graças Xukuru', role: 'Cozinheira(o)', shift: 'Integral', 
    registrationCode: 'MAT-2026-001', username: 'maria.xukuru', password: 'Xukuru@2026',
    email: 'maria.xukuru@escola.pe.gov.br', birthDate: '1985-05-14', maritalStatus: 'Casado(a)', motherName: 'Luzia das Graças Xukuru', fatherName: 'José Pedro Xukuru',
    docType: 'RG', docNumber: '8.765.432', docIssuer: 'SDS', docUf: 'PE', docIssueDate: '2015-04-12',
    cpf: '123.456.789-00', nis: '123.45678.90-1', sus: '700 1234 5678 9012', phone: '(87) 99812-3456', status: 'Ativo' 
  },
  { 
    id: 'stf-2', schoolId: 'sch-ind-1', name: 'João Pedro Ororubá', role: 'Servente de Limpeza', shift: 'Manhã', 
    registrationCode: 'MAT-2026-002', username: 'joao.ororuba', password: 'Ororuba@2026',
    email: 'joao.ororuba@escola.pe.gov.br', birthDate: '1992-11-03', maritalStatus: 'Solteiro(a)', motherName: 'Ana Maria Ororubá', fatherName: 'Antônio Ororubá',
    docType: 'CIN', docNumber: '012.345.678.90', docIssuer: 'SSP', docUf: 'PE', docIssueDate: '2023-01-20',
    cpf: '234.567.890-11', nis: '234.56789.01-2', sus: '700 2345 6789 0123', phone: '(87) 99123-4567', status: 'Ativo' 
  },
  { 
    id: 'stf-3', schoolId: 'sch-ind-1', name: 'Prof. Tiago Xukuru', role: 'Professor(a)', shift: 'Manhã', 
    registrationCode: 'MAT-2026-003', username: 'tiago.xukuru', password: 'Tiago@2026',
    email: 'tiago.xukuru@educacao.pe.gov.br', birthDate: '1988-03-22', maritalStatus: 'Casado(a)', motherName: 'Tereza Xukuru', fatherName: 'Manoel Xukuru',
    docType: 'CNH', docNumber: '04589234100', docIssuer: 'DETRAN', docUf: 'PE', docIssueDate: '2020-08-10',
    cpf: '345.678.901-22', nis: '345.67890.12-3', sus: '700 3456 7890 1234', phone: '(87) 99654-3210', status: 'Ativo' 
  },
  { 
    id: 'stf-4', schoolId: 'sch-ind-1', name: 'Sebastião Silva', role: 'Porteiro(a)', shift: 'Integral', 
    registrationCode: 'MAT-2026-004', username: 'sebastiao.silva', password: 'Silva@2026',
    docType: 'RG', docNumber: '7.654.321', docIssuer: 'SDS', docUf: 'PE', docIssueDate: '2012-03-05',
    cpf: '456.789.012-33', nis: '456.78901.23-4', sus: '700 4567 8901 2345', phone: '(87) 98877-6655', status: 'Ativo' 
  },
  { id: 'stf-5', schoolId: 'sch-ind-1', name: 'Ana Lúcia Xukuru', role: 'Recepção I', shift: 'Manhã', registrationCode: 'MAT-2026-005', username: 'ana.xukuru', password: 'Ana@2026', docType: 'RG', docNumber: '6.543.210', docIssuer: 'SDS', docUf: 'PE', cpf: '567.890.123-44', phone: '(87) 99221-3344', status: 'Ativo' },
  { id: 'stf-6', schoolId: 'sch-ind-1', name: 'Carlos Eduardo Santos', role: 'Apoio ADM I', shift: 'Integral', registrationCode: 'MAT-2026-006', username: 'carlos.santos', password: 'Carlos@2026', docType: 'CNH', docNumber: '05678912344', docIssuer: 'DETRAN', docUf: 'PE', cpf: '678.901.234-55', phone: '(87) 99334-4455', status: 'Ativo' },
  { id: 'stf-7', schoolId: 'sch-ind-1', name: 'Mestre Pajé Arani', role: 'Oficineiro(a)', shift: 'Tarde', registrationCode: 'MAT-2026-007', username: 'paje.arani', password: 'Paje@2026', docType: 'RG', docNumber: '5.432.109', docIssuer: 'SDS', docUf: 'PE', cpf: '789.012.345-66', phone: '(87) 99445-5566', status: 'Ativo' },
  { id: 'stf-8', schoolId: 'sch-ind-1', name: 'Clara Luzia Xukuru', role: 'Cuidador(a) Escolar', shift: 'Tarde', registrationCode: 'MAT-2026-008', username: 'clara.xukuru', password: 'Clara@2026', docType: 'CIN', docNumber: '890.123.456.77', docIssuer: 'SSP', docUf: 'PE', cpf: '890.123.456-77', phone: '(87) 99556-6677', status: 'Ativo' },
  { id: 'stf-9', schoolId: 'sch-ind-2', name: 'Luzia Yaathe Fulni-ô', role: 'Cozinheira(o)', shift: 'Integral', registrationCode: 'MAT-2026-009', username: 'luzia.fulnio', password: 'Luzia@2026', docType: 'RG', docNumber: '9.012.345', docIssuer: 'SDS', docUf: 'PE', cpf: '901.234.567-88', phone: '(87) 99667-7788', status: 'Ativo' },
  { id: 'stf-10', schoolId: 'sch-ind-2', name: 'Prof. Txai Fulni-ô', role: 'Professor(a)', shift: 'Manhã', registrationCode: 'MAT-2026-010', username: 'txai.fulnio', password: 'Txai@2026', docType: 'RG', docNumber: '0.123.456', docIssuer: 'SDS', docUf: 'PE', cpf: '012.345.678-99', phone: '(87) 99778-8899', status: 'Ativo' }
];

interface IndigenousSchool {
  id: string;
  name: string;
  logoUrl?: string;
  cnpj?: string;
  esfera: 'Estadual' | 'Municipal' | 'Federal' | 'Outro';
  category: 'Pública' | 'Privada';
  inepCode: string;
  secCode: string; // Código SEC (Secretaria de Educação)
  ethnicity: string; // ex: Povo Xukuru, Povo Fulni-ô, Povo Pankararu
  village: string; // Aldeia / Comunidade
  address?: string; // Logradouro / Rua / Sítio
  neighborhood?: string; // Bairro / Distrito
  city: string;
  uf: string;
  cep?: string; // CEP
  directorName: string;
  bilingualProgram: boolean; // Programa Bilíngue / Língua Materna
  nativeLanguage?: string; // ex: Yaathe, Torá, Nheengatu, Português/Língua Materna
  totalStudents: number;
  status: 'Ativa / Credenciada' | 'Em Credenciamento' | 'Inativa';
}

interface UeeiTabProps {
  entityConfig?: EntityConfig | null;
}

export default function UeeiTab({ entityConfig }: UeeiTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEthnicityFilter, setSelectedEthnicityFilter] = useState<string>('Todas');

  // Initial Indigenous Schools list state (UEEI)
  const [schools, setSchools] = useState<IndigenousSchool[]>([
    {
      id: 'sch-ind-1',
      name: 'Escola Estadual Indígena Xukuru do Ororubá',
      cnpj: '10.548.912/0001-34',
      esfera: 'Estadual',
      category: 'Pública',
      inepCode: '26104891',
      secCode: 'SEC-PE-2045',
      ethnicity: 'Povo Xukuru',
      village: 'Aldeia Cimbres',
      city: entityConfig?.city || 'Pesqueira',
      uf: 'PE',
      directorName: 'Prof. Cacique Marcos Xukuru',
      bilingualProgram: true,
      nativeLanguage: 'Língua Materna Xukuru / Português',
      totalStudents: 540,
      status: 'Ativa / Credenciada'
    },
    {
      id: 'sch-ind-2',
      name: 'Escola Estadual Indígena Marechal Rondon (Fulni-ô)',
      cnpj: '11.893.010/0001-52',
      esfera: 'Estadual',
      category: 'Pública',
      inepCode: '26158930',
      secCode: 'SEC-PE-3088',
      ethnicity: 'Povo Fulni-ô',
      village: 'Aldeia Mãe Fulni-ô',
      city: 'Águas Belas',
      uf: 'PE',
      directorName: 'Profª. Maria Tãk~a Fulni-ô',
      bilingualProgram: true,
      nativeLanguage: 'Yaathe (Língua Materna Fulni-ô)',
      totalStudents: 890,
      status: 'Ativa / Credenciada'
    },
    {
      id: 'sch-ind-3',
      name: 'Escola Estadual Indígena Pankararu Dr. Geraldo',
      cnpj: '09.823.411/0001-19',
      esfera: 'Estadual',
      category: 'Pública',
      inepCode: '26098234',
      secCode: 'SEC-PE-4102',
      ethnicity: 'Povo Pankararu',
      village: 'Aldeia Brejo dos Padres',
      city: 'Tacaratu',
      uf: 'PE',
      directorName: 'Prof. José Pankararu',
      bilingualProgram: true,
      nativeLanguage: 'Português / Tradição Pankararu',
      totalStudents: 610,
      status: 'Ativa / Credenciada'
    },
    {
      id: 'sch-ind-4',
      name: 'Escola Municipal Indígena Kapinawá',
      cnpj: '07.112.233/0001-88',
      esfera: 'Municipal',
      category: 'Pública',
      inepCode: '26071122',
      secCode: 'SEC-BUIQUE-102',
      ethnicity: 'Povo Kapinawá',
      village: 'Aldeia Mina Grande',
      city: 'Buíque',
      uf: 'PE',
      directorName: 'Profª. Tereza Kapinawá',
      bilingualProgram: true,
      nativeLanguage: 'Língua Materna / Tradição Oral',
      totalStudents: 380,
      status: 'Ativa / Credenciada'
    }
  ]);

  // Modals state
  const [isAddSchoolOpen, setIsAddSchoolOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<IndigenousSchool | null>(null);
  const [deletingSchoolItem, setDeletingSchoolItem] = useState<IndigenousSchool | null>(null);

  // Staff State (Colaboradores das Escolas)
  const [staffList, setStaffList] = useState<SchoolStaff[]>(() => {
    try {
      const saved = localStorage.getItem('school_staff_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Erro ao ler school_staff_list:', e);
    }
    try {
      localStorage.setItem('school_staff_list', JSON.stringify(DEFAULT_STAFF));
    } catch (e) {}
    return DEFAULT_STAFF;
  });

  useEffect(() => {
    try {
      localStorage.setItem('school_staff_list', JSON.stringify(staffList));
      window.dispatchEvent(new Event('school_staff_updated'));
    } catch (e) {
      console.error('Erro ao salvar school_staff_list no localStorage:', e);
    }
  }, [staffList]);
  const [activeStaffSchool, setActiveStaffSchool] = useState<IndigenousSchool | null>(null);
  const [staffSearchTerm, setStaffSearchTerm] = useState('');
  const [staffRoleFilter, setStaffRoleFilter] = useState<string>('Todos');

  // Add/Edit Staff Modal State
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<SchoolStaff | null>(null);
  const [deletingStaffItem, setDeletingStaffItem] = useState<SchoolStaff | null>(null);

  // Form fields for Staff
  const [staffName, setStaffName] = useState('');
  const [staffRegistrationCode, setStaffRegistrationCode] = useState('');
  const [staffUsername, setStaffUsername] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [showStaffPassword, setShowStaffPassword] = useState(false);
  const [visiblePasswordsMap, setVisiblePasswordsMap] = useState<Record<string, boolean>>({});
  const [staffEmail, setStaffEmail] = useState('');
  const [staffBirthDate, setStaffBirthDate] = useState('');
  const [staffMaritalStatus, setStaffMaritalStatus] = useState<'Solteiro(a)' | 'Casado(a)' | 'Divorciado(a)' | 'Viúvo(a)' | 'União Estável'>('Solteiro(a)');
  const [staffMotherName, setStaffMotherName] = useState('');
  const [staffFatherName, setStaffFatherName] = useState('');
  const [staffDocType, setStaffDocType] = useState<'RG' | 'CNH' | 'CIN'>('RG');
  const [staffDocNumber, setStaffDocNumber] = useState('');
  const [staffDocIssuer, setStaffDocIssuer] = useState('');
  const [staffDocUf, setStaffDocUf] = useState('PE');
  const [staffDocIssueDate, setStaffDocIssueDate] = useState('');
  const [staffCpf, setStaffCpf] = useState('');
  const [staffNis, setStaffNis] = useState('');
  const [staffSus, setStaffSus] = useState('');
  const [staffRole, setStaffRole] = useState<StaffRole>('Servente de Limpeza');
  const [staffCustomRole, setStaffCustomRole] = useState('');
  const [staffShift, setStaffShift] = useState<'Manhã' | 'Tarde' | 'Noite' | 'Integral'>('Integral');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffStatus, setStaffStatus] = useState<'Ativo' | 'Inativo'>('Ativo');

  // Sub-tabs State for UEEI
  const [activeSubTab, setActiveSubTab] = useState<'schools' | 'punches'>('schools');

  // Global Punch Logs State for UEEI Approval
  const loadGlobalPunches = (): TimePunchLog[] => {
    try {
      const saved = localStorage.getItem('all_collaborator_punches');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    const todayBR = getTodayFormatted();
    const initialSamples: TimePunchLog[] = [
      {
        id: 'punch-sample-1',
        collaboratorId: 'stf-1',
        collaboratorName: 'Maria das Graças Xukuru',
        registration: 'MAT-2026-001',
        date: todayBR,
        time: '07:30:15',
        type: 'Entrada',
        location: 'Escola Estadual Indígena Xukuru do Ororubá',
        coords: { latitude: -8.0476, longitude: -34.8770, accuracy: 4, addressString: 'Aldeia Cimbres, Pesqueira - PE' },
        ipAddress: '187.58.120.45',
        macAddress: '74:89:C2:A1:FE:33',
        wifiSsid: 'REDE_ESCOLA_PROFESSORES_5G',
        wifiPassword: '••••••••••••',
        status: 'Pendente'
      },
      {
        id: 'punch-sample-2',
        collaboratorId: 'stf-2',
        collaboratorName: 'João Pedro Ororubá',
        registration: 'MAT-2026-002',
        date: todayBR,
        time: '07:32:40',
        type: 'Entrada',
        location: 'Escola Estadual Indígena Xukuru do Ororubá',
        coords: { latitude: -8.0481, longitude: -34.8765, accuracy: 5, addressString: 'Aldeia Cimbres, Pesqueira - PE' },
        ipAddress: '187.58.120.46',
        macAddress: 'A2:3B:4C:5D:6E:7F',
        wifiSsid: 'REDE_ESCOLA_PROFESSORES_5G',
        wifiPassword: '••••••••••••',
        status: 'Pendente'
      },
      {
        id: 'punch-sample-3',
        collaboratorId: 'stf-3',
        collaboratorName: 'Prof. Tiago Xukuru',
        registration: 'MAT-2026-003',
        date: todayBR,
        time: '07:45:10',
        type: 'Entrada',
        location: 'Escola Estadual Indígena Marechal Rondon (Fulni-ô)',
        coords: { latitude: -9.1123, longitude: -37.1234, accuracy: 3, addressString: 'Aldeia Mãe Fulni-ô, Águas Belas - PE' },
        ipAddress: '177.12.89.102',
        macAddress: 'B8:27:EB:A1:C2:D3',
        wifiSsid: 'FULNIO_ESCOLA_WIFI',
        wifiPassword: '••••••••••••',
        status: 'Pendente'
      }
    ];
    try {
      localStorage.setItem('all_collaborator_punches', JSON.stringify(initialSamples));
    } catch (e) {}
    return initialSamples;
  };

  const [globalPunches, setGlobalPunches] = useState<TimePunchLog[]>(loadGlobalPunches);
  const [punchStatusFilter, setPunchStatusFilter] = useState<'Todos' | 'Pendente' | 'Aprovado' | 'Rejeitado'>('Todos');
  const [punchSearchTerm, setPunchSearchTerm] = useState('');
  const [selectedPhotoModal, setSelectedPhotoModal] = useState<{ photoUrl: string; title: string; colab: string; date: string; time: string } | null>(null);
  const [rejectingPunchId, setRejectingPunchId] = useState<string | null>(null);
  const [rejectionInputReason, setRejectionInputReason] = useState('');
  const [deletingPunchId, setDeletingPunchId] = useState<string | null>(null);

  const handleDeletePunch = (punchId: string) => {
    const updated = globalPunches.filter(p => p.id !== punchId);
    saveGlobalPunches(updated);
    setDeletingPunchId(null);
  };

  useEffect(() => {
    const handleSync = () => {
      try {
        const saved = localStorage.getItem('all_collaborator_punches');
        if (saved) setGlobalPunches(JSON.parse(saved));
      } catch (e) {}
    };
    window.addEventListener('punch_updated', handleSync);
    return () => window.removeEventListener('punch_updated', handleSync);
  }, []);

  const saveGlobalPunches = (updated: TimePunchLog[]) => {
    setGlobalPunches(updated);
    try {
      localStorage.setItem('all_collaborator_punches', JSON.stringify(updated));

      // Also sync individual collaborator keys so deletion is reflected immediately across stores
      const colabIds = new Set<string>();
      globalPunches.forEach(p => { if (p.collaboratorId) colabIds.add(p.collaboratorId); });
      updated.forEach(p => { if (p.collaboratorId) colabIds.add(p.collaboratorId); });

      colabIds.forEach(id => {
        const colabPunches = updated.filter(p => p.collaboratorId === id);
        localStorage.setItem(`colab_punches_${id}`, JSON.stringify(colabPunches));
      });

      window.dispatchEvent(new Event('punch_updated'));
    } catch (e) {}
  };

  const handleApprovePunch = (punchId: string) => {
    const nowStr = `${getTodayFormatted()} e ${getTimeNowFormatted()}`;
    const updated = globalPunches.map(p => {
      if (p.id === punchId) {
        return {
          ...p,
          status: 'Aprovado' as const,
          approvedAt: nowStr,
          approvedBy: 'Gestão UEEI'
        };
      }
      return p;
    });
    saveGlobalPunches(updated);
  };

  const handleOpenRejectModal = (punchId: string) => {
    setRejectingPunchId(punchId);
    setRejectionInputReason('');
  };

  const handleConfirmRejectPunch = () => {
    if (!rejectingPunchId) return;
    const nowStr = `${getTodayFormatted()} e ${getTimeNowFormatted()}`;
    const updated = globalPunches.map(p => {
      if (p.id === rejectingPunchId) {
        return {
          ...p,
          status: 'Rejeitado' as const,
          rejectionReason: rejectionInputReason || 'Inconsistência identificada pela gestão UEEI.',
          approvedAt: nowStr,
          approvedBy: 'Gestão UEEI'
        };
      }
      return p;
    });
    saveGlobalPunches(updated);
    setRejectingPunchId(null);
    setRejectionInputReason('');
  };

  const handleApproveAllPending = () => {
    const nowStr = `${getTodayFormatted()} e ${getTimeNowFormatted()}`;
    const updated = globalPunches.map(p => {
      if (!p.status || p.status === 'Pendente') {
        return {
          ...p,
          status: 'Aprovado' as const,
          approvedAt: nowStr,
          approvedBy: 'Gestão UEEI'
        };
      }
      return p;
    });
    saveGlobalPunches(updated);
  };

  const pendingPunchesCount = globalPunches.filter(p => !p.status || p.status === 'Pendente').length;
  const approvedPunchesCount = globalPunches.filter(p => p.status === 'Aprovado').length;
  const rejectedPunchesCount = globalPunches.filter(p => p.status === 'Rejeitado').length;

  const filteredPunches = globalPunches.filter(p => {
    const statusMatch = punchStatusFilter === 'Todos' || 
      (punchStatusFilter === 'Pendente' && (!p.status || p.status === 'Pendente')) ||
      p.status === punchStatusFilter;

    const query = punchSearchTerm.toLowerCase();
    const searchMatch = !query || 
      (p.collaboratorName && p.collaboratorName.toLowerCase().includes(query)) ||
      (p.registration && p.registration.toLowerCase().includes(query)) ||
      (p.location && p.location.toLowerCase().includes(query)) ||
      (p.date && p.date.includes(query)) ||
      (p.type && p.type.toLowerCase().includes(query));

    return statusMatch && searchMatch;
  });

  const parseTimeToMinutes = (timeStr?: string): number | null => {
    if (!timeStr) return null;
    const parts = timeStr.split(':').map(Number);
    if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return null;
    return parts[0] * 60 + parts[1] + (parts[2] ? parts[2] / 60 : 0);
  };

  const formatMinutesToHHMM = (totalMinutes: number | null): string => {
    if (totalMinutes === null || isNaN(totalMinutes) || totalMinutes < 0) return '--:--';
    const hours = Math.floor(totalMinutes / 60);
    const mins = Math.round(totalMinutes % 60);
    return `${hours}h ${mins.toString().padStart(2, '0')}m`;
  };

  const groupedDailyPunches = React.useMemo(() => {
    const map = new Map<string, {
      groupKey: string;
      collaboratorId: string;
      collaboratorName: string;
      registration?: string;
      date: string;
      location: string;
      punches: TimePunchLog[];
    }>();

    filteredPunches.forEach(p => {
      const colabId = p.collaboratorId || p.collaboratorName || 'unknown';
      const key = `${colabId}_${p.date}`;
      if (!map.has(key)) {
        map.set(key, {
          groupKey: key,
          collaboratorId: p.collaboratorId || '',
          collaboratorName: p.collaboratorName || 'Colaborador UEEI',
          registration: p.registration,
          date: p.date,
          location: p.location || 'Escola Indígena UEEI',
          punches: []
        });
      }
      map.get(key)!.punches.push(p);
    });

    return Array.from(map.values()).map(group => {
      const sorted = [...group.punches].sort((a, b) => a.time.localeCompare(b.time));
      
      const entrada = sorted.find(p => p.type === 'Entrada');
      const pausa = sorted.find(p => p.type === 'Pausa' || p.type === 'Pausa Almoço');
      const retorno = sorted.find(p => p.type === 'Retorno' || p.type === 'Retorno Almoço');
      const saida = sorted.find(p => p.type === 'Saída');

      const mEntrada = parseTimeToMinutes(entrada?.time);
      const mPausa = parseTimeToMinutes(pausa?.time);
      const mRetorno = parseTimeToMinutes(retorno?.time);
      const mSaida = parseTimeToMinutes(saida?.time);

      const turno1Min = (mEntrada !== null && mPausa !== null && mPausa >= mEntrada) ? (mPausa - mEntrada) : null;
      const intervalMin = (mPausa !== null && mRetorno !== null && mRetorno >= mPausa) ? (mRetorno - mPausa) : null;
      const turno2Min = (mRetorno !== null && mSaida !== null && mSaida >= mRetorno) ? (mSaida - mRetorno) : null;

      let totalWorkedMin: number | null = null;
      if (turno1Min !== null || turno2Min !== null) {
        totalWorkedMin = (turno1Min || 0) + (turno2Min || 0);
      } else if (mEntrada !== null && mSaida !== null && mSaida >= mEntrada) {
        totalWorkedMin = mSaida - mEntrada;
      }

      const slots = [
        { stage: 'Entrada' as const, label: 'Entrada', punch: entrada, color: 'emerald' },
        { stage: 'Pausa' as const, label: 'Pausa', punch: pausa, color: 'amber' },
        { stage: 'Retorno' as const, label: 'Retorno', punch: retorno, color: 'indigo' },
        { stage: 'Saída' as const, label: 'Saída', punch: saida, color: 'rose' }
      ];

      return {
        ...group,
        slots,
        hoursCalculation: {
          turno1Str: formatMinutesToHHMM(turno1Min),
          intervalStr: formatMinutesToHHMM(intervalMin),
          turno2Str: formatMinutesToHHMM(turno2Min),
          totalWorkedStr: formatMinutesToHHMM(totalWorkedMin),
          turno1Min,
          intervalMin,
          turno2Min,
          totalWorkedMin
        }
      };
    });
  }, [filteredPunches]);

  // Helper getters
  const getStaffCount = (schoolId: string) => staffList.filter(s => s.schoolId === schoolId && s.status === 'Ativo').length;

  // Open Staff Management Modal for a School
  const handleOpenStaffManagement = (school: IndigenousSchool) => {
    setActiveStaffSchool(school);
    setStaffSearchTerm('');
    setStaffRoleFilter('Todos');
  };

  const togglePasswordVisibility = (staffId: string) => {
    setVisiblePasswordsMap(prev => ({ ...prev, [staffId]: !prev[staffId] }));
  };

  // Open Add Staff Modal
  const handleOpenAddStaff = () => {
    setEditingStaff(null);
    setStaffName('');
    const defaultMat = `MAT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    setStaffRegistrationCode(defaultMat);
    setStaffUsername('');
    setStaffPassword('');
    setShowStaffPassword(false);
    setStaffEmail('');
    setStaffBirthDate('');
    setStaffMaritalStatus('Solteiro(a)');
    setStaffMotherName('');
    setStaffFatherName('');
    setStaffDocType('RG');
    setStaffDocNumber('');
    setStaffDocIssuer('');
    setStaffDocUf('PE');
    setStaffDocIssueDate('');
    setStaffCpf('');
    setStaffNis('');
    setStaffSus('');
    setStaffRole('Servente de Limpeza');
    setStaffCustomRole('');
    setStaffShift('Integral');
    setStaffPhone('');
    setStaffStatus('Ativo');
    setIsAddStaffModalOpen(true);
  };

  // Open Edit Staff Modal
  const handleOpenEditStaff = (staff: SchoolStaff) => {
    setEditingStaff(staff);
    setStaffName(staff.name);
    setStaffRegistrationCode(staff.registrationCode || '');
    setStaffUsername(staff.username || '');
    setStaffPassword(staff.password || '');
    setShowStaffPassword(false);
    setStaffEmail(staff.email || '');
    setStaffBirthDate(staff.birthDate || '');
    setStaffMaritalStatus(staff.maritalStatus || 'Solteiro(a)');
    setStaffMotherName(staff.motherName || '');
    setStaffFatherName(staff.fatherName || '');
    setStaffDocType(staff.docType || 'RG');
    setStaffDocNumber(staff.docNumber || '');
    setStaffDocIssuer(staff.docIssuer || '');
    setStaffDocUf(staff.docUf || 'PE');
    setStaffDocIssueDate(staff.docIssueDate || '');
    setStaffCpf(staff.cpf || '');
    setStaffNis(staff.nis || '');
    setStaffSus(staff.sus || '');
    if (STAFF_ROLES.includes(staff.role as StaffRole)) {
      setStaffRole(staff.role as StaffRole);
      setStaffCustomRole('');
    } else {
      setStaffRole('Outro');
      setStaffCustomRole(staff.role);
    }
    setStaffShift(staff.shift);
    setStaffPhone(staff.phone || '');
    setStaffStatus(staff.status);
    setIsAddStaffModalOpen(true);
  };

  // Save Staff Submit
  const handleSaveStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStaffSchool || !staffName.trim()) return;

    const finalRole = staffRole === 'Outro' ? (staffCustomRole.trim() || 'Outro') : staffRole;

    if (editingStaff) {
      setStaffList(prev => prev.map(s => s.id === editingStaff.id ? {
        ...s,
        name: staffName,
        registrationCode: staffRegistrationCode || undefined,
        username: staffUsername || undefined,
        password: staffPassword || undefined,
        email: staffEmail || undefined,
        birthDate: staffBirthDate || undefined,
        maritalStatus: staffMaritalStatus,
        motherName: staffMotherName || undefined,
        fatherName: staffFatherName || undefined,
        docType: staffDocType,
        docNumber: staffDocNumber || undefined,
        docIssuer: staffDocIssuer || undefined,
        docUf: staffDocUf || undefined,
        docIssueDate: staffDocIssueDate || undefined,
        cpf: staffCpf || undefined,
        nis: staffNis || undefined,
        sus: staffSus || undefined,
        role: finalRole,
        shift: staffShift,
        phone: staffPhone || undefined,
        status: staffStatus
      } : s));
    } else {
      const newStaffItem: SchoolStaff = {
        id: `stf-${Date.now()}`,
        schoolId: activeStaffSchool.id,
        name: staffName,
        registrationCode: staffRegistrationCode || undefined,
        username: staffUsername || undefined,
        password: staffPassword || undefined,
        email: staffEmail || undefined,
        birthDate: staffBirthDate || undefined,
        maritalStatus: staffMaritalStatus,
        motherName: staffMotherName || undefined,
        fatherName: staffFatherName || undefined,
        docType: staffDocType,
        docNumber: staffDocNumber || undefined,
        docIssuer: staffDocIssuer || undefined,
        docUf: staffDocUf || undefined,
        docIssueDate: staffDocIssueDate || undefined,
        cpf: staffCpf || undefined,
        nis: staffNis || undefined,
        sus: staffSus || undefined,
        role: finalRole,
        shift: staffShift,
        phone: staffPhone || undefined,
        status: staffStatus
      };
      setStaffList(prev => [newStaffItem, ...prev]);
    }
    setIsAddStaffModalOpen(false);
  };

  // Confirm Delete Staff
  const handleConfirmDeleteStaff = () => {
    if (deletingStaffItem) {
      setStaffList(prev => prev.filter(s => s.id !== deletingStaffItem.id));
      setDeletingStaffItem(null);
    }
  };

  // New/Edit School Form State
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newSchoolLogoUrl, setNewSchoolLogoUrl] = useState('');
  const [newSchoolCnpj, setNewSchoolCnpj] = useState('');
  const [newSchoolEsfera, setNewSchoolEsfera] = useState<'Estadual' | 'Municipal' | 'Federal' | 'Outro'>('Estadual');
  const [newSchoolCategory, setNewSchoolCategory] = useState<'Pública' | 'Privada'>('Pública');
  const [newSchoolInep, setNewSchoolInep] = useState('');
  const [newSchoolSec, setNewSchoolSec] = useState('');
  const [newSchoolEthnicity, setNewSchoolEthnicity] = useState('Povo Xukuru');
  const [newSchoolVillage, setNewSchoolVillage] = useState('');
  const [newSchoolAddress, setNewSchoolAddress] = useState('');
  const [newSchoolNeighborhood, setNewSchoolNeighborhood] = useState('');
  const [newSchoolCity, setNewSchoolCity] = useState(entityConfig?.city || 'Pesqueira');
  const [newSchoolUf, setNewSchoolUf] = useState('PE');
  const [newSchoolCep, setNewSchoolCep] = useState('');
  const [newSchoolDirector, setNewSchoolDirector] = useState('');
  const [newSchoolLanguage, setNewSchoolLanguage] = useState('Língua Materna / Português');

  // Handle Logo Upload File
  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewSchoolLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Open Add School Modal
  const handleOpenAddSchool = () => {
    setEditingSchool(null);
    setNewSchoolName('');
    setNewSchoolLogoUrl('');
    setNewSchoolCnpj('');
    setNewSchoolEsfera('Estadual');
    setNewSchoolCategory('Pública');
    setNewSchoolInep('');
    setNewSchoolSec('');
    setNewSchoolEthnicity('Povo Xukuru');
    setNewSchoolVillage('');
    setNewSchoolAddress('');
    setNewSchoolNeighborhood('');
    setNewSchoolCity(entityConfig?.city || 'Pesqueira');
    setNewSchoolUf('PE');
    setNewSchoolCep('');
    setNewSchoolDirector('');
    setNewSchoolLanguage('Língua Materna / Português');
    setIsAddSchoolOpen(true);
  };

  // Open Edit School Modal
  const handleOpenEditSchool = (school: IndigenousSchool) => {
    setEditingSchool(school);
    setNewSchoolName(school.name);
    setNewSchoolLogoUrl(school.logoUrl || '');
    setNewSchoolCnpj(school.cnpj || '');
    setNewSchoolEsfera(school.esfera);
    setNewSchoolCategory(school.category);
    setNewSchoolInep(school.inepCode);
    setNewSchoolSec(school.secCode);
    setNewSchoolEthnicity(school.ethnicity);
    setNewSchoolVillage(school.village);
    setNewSchoolAddress(school.address || '');
    setNewSchoolNeighborhood(school.neighborhood || '');
    setNewSchoolCity(school.city || entityConfig?.city || 'Pesqueira');
    setNewSchoolUf(school.uf || 'PE');
    setNewSchoolCep(school.cep || '');
    setNewSchoolDirector(school.directorName);
    setNewSchoolLanguage(school.nativeLanguage || '');
    setIsAddSchoolOpen(true);
  };

  // Delete School
  const handleDeleteSchool = (schoolId: string) => {
    const school = schools.find(s => s.id === schoolId);
    if (school) {
      setDeletingSchoolItem(school);
    }
  };

  const handleConfirmDeleteSchool = () => {
    if (deletingSchoolItem) {
      setSchools(prev => prev.filter(s => s.id !== deletingSchoolItem.id));
      setDeletingSchoolItem(null);
    }
  };

  // Submit Add or Edit Indigenous School / Unit
  const handleAddSchoolSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchoolName) return;

    if (editingSchool) {
      // Update existing
      setSchools(schools.map(s => {
        if (s.id === editingSchool.id) {
          return {
            ...s,
            name: newSchoolName,
            logoUrl: newSchoolLogoUrl || undefined,
            cnpj: newSchoolCnpj || undefined,
            esfera: newSchoolEsfera,
            category: newSchoolCategory,
            inepCode: newSchoolInep || '00000000',
            secCode: newSchoolSec || 'N/A',
            ethnicity: newSchoolEthnicity || 'Povo Indígena',
            village: newSchoolVillage || 'Aldeia / Comunidade',
            address: newSchoolAddress || undefined,
            neighborhood: newSchoolNeighborhood || undefined,
            city: newSchoolCity || 'Pesqueira',
            uf: newSchoolUf || 'PE',
            cep: newSchoolCep || undefined,
            directorName: newSchoolDirector || 'Gestão Escolar Indígena',
            nativeLanguage: newSchoolLanguage
          };
        }
        return s;
      }));
    } else {
      // Create new
      const newSchool: IndigenousSchool = {
        id: `sch-ind-${Date.now()}`,
        name: newSchoolName,
        logoUrl: newSchoolLogoUrl || undefined,
        cnpj: newSchoolCnpj || undefined,
        esfera: newSchoolEsfera,
        category: newSchoolCategory,
        inepCode: newSchoolInep || '00000000',
        secCode: newSchoolSec || 'N/A',
        ethnicity: newSchoolEthnicity || 'Povo Indígena',
        village: newSchoolVillage || 'Aldeia / Comunidade',
        address: newSchoolAddress || undefined,
        neighborhood: newSchoolNeighborhood || undefined,
        city: newSchoolCity || entityConfig?.city || 'Pesqueira',
        uf: newSchoolUf || 'PE',
        cep: newSchoolCep || undefined,
        directorName: newSchoolDirector || 'Gestão Escolar Indígena',
        bilingualProgram: true,
        nativeLanguage: newSchoolLanguage,
        totalStudents: 0,
        status: 'Ativa / Credenciada'
      };
      setSchools([newSchool, ...schools]);
    }

    setIsAddSchoolOpen(false);
    setEditingSchool(null);
  };

  const filteredSchools = schools.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (s.cnpj && s.cnpj.includes(searchTerm)) ||
                          s.inepCode.includes(searchTerm) ||
                          s.secCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.ethnicity.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.village.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEthnicity = selectedEthnicityFilter === 'Todas' || s.ethnicity === selectedEthnicityFilter;
    return matchesSearch && matchesEthnicity;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner UEEI - Unidade Estadual de Ensino Indígena */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-amber-950 border border-emerald-500/30 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Feather className="h-56 w-56 text-emerald-300" />
        </div>
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-gradient-to-br from-emerald-500 via-teal-600 to-amber-600 text-black rounded-2xl shadow-lg shadow-emerald-500/20">
              <Feather className="h-8 w-8 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-bold tracking-wider uppercase">
                  Educação Escolar Indígena
                </span>
                <span className="text-xs text-amber-300 font-semibold flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" /> Módulo de Gestão UEEI
                </span>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight mt-0.5">
                UEEI - Unidade Estadual de Ensino Indígena
              </h1>
              <p className="text-xs text-emerald-200/80 max-w-2xl mt-1 leading-relaxed">
                Gestão das unidades de ensino indígena com suporte a cadastro, edição e exclusão de unidades de ensino (CNPJ, Esfera, Pública/Privada, INEP e SEC).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenAddSchool}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-600 hover:to-teal-500 text-black font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>Cadastrar Unidade UEEI</span>
            </button>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6 pt-5 border-t border-emerald-500/20 text-xs">
          <div className="bg-black/40 backdrop-blur-xs p-3 rounded-xl border border-emerald-500/20">
            <span className="text-emerald-300/70 font-semibold block text-[11px]">Unidades Credenciadas UEEI</span>
            <span className="text-xl font-bold text-white font-mono mt-0.5 block">{schools.length}</span>
          </div>
          <div className="bg-black/40 backdrop-blur-xs p-3 rounded-xl border border-emerald-500/20">
            <span className="text-emerald-300/70 font-semibold block text-[11px]">Povos / Etnias Atendidas</span>
            <span className="text-xl font-bold text-amber-300 font-mono mt-0.5 block">
              {Array.from(new Set(schools.map(s => s.ethnicity))).length}
            </span>
          </div>
          <div className="bg-black/40 backdrop-blur-xs p-3 rounded-xl border border-emerald-500/20">
            <span className="text-emerald-300/70 font-semibold block text-[11px]">Registros INEP & SEC</span>
            <span className="text-xs font-bold text-emerald-400 mt-1 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> 100% Homologados
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs: Unidades UEEI vs Aprovação de Batimentos de Ponto */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('schools')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'schools'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-black shadow-lg shadow-emerald-500/20 font-black'
                : 'bg-[#141414] text-gray-400 hover:text-white border border-white/10'
            }`}
          >
            <School className="h-4 w-4" />
            Unidades Escolares ({schools.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('punches')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer relative ${
              activeSubTab === 'punches'
                ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-black shadow-lg shadow-amber-500/20 font-black'
                : 'bg-[#141414] text-gray-400 hover:text-white border border-white/10'
            }`}
          >
            <Clock className="h-4 w-4" />
            Aprovação de Batimentos de Ponto (Frequência)
            {pendingPunchesCount > 0 && (
              <span className="px-2 py-0.5 bg-rose-600 text-white text-[10px] font-mono font-black rounded-full animate-pulse ml-1">
                {pendingPunchesCount}
              </span>
            )}
          </button>
        </div>

        {activeSubTab === 'schools' && (
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, CNPJ, INEP, SEC, etnia..."
              className="w-full pl-9 pr-3 py-2 bg-[#141414] border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        )}
      </div>

      {/* SUB-TAB 1: UNIDADES ESCOLARES */}
      {activeSubTab === 'schools' && (
        <div className="space-y-4">

      {/* List of UEEI Schools */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        {filteredSchools.map((school) => (
          <div
            key={school.id}
            className="bg-[#141414] border border-white/10 rounded-2xl p-5 space-y-3.5 hover:border-emerald-500/40 transition-all shadow-lg flex flex-col justify-between"
          >
            <div>
              {/* Badges Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md text-[10px] font-bold">
                    Esfera: {school.esfera}
                  </span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                    school.category === 'Pública' 
                      ? 'bg-blue-500/10 text-blue-300 border-blue-500/20' 
                      : 'bg-purple-500/10 text-purple-300 border-purple-500/20'
                  }`}>
                    {school.category}
                  </span>
                  <span className="px-2 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-md text-[10px] font-bold">
                    {school.ethnicity}
                  </span>
                </div>

                <span className="text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
                  <CheckCircle2 className="h-3.5 w-3.5" /> {school.status}
                </span>
              </div>

              {/* Title & Logo */}
              <div className="mt-3 flex items-start gap-3">
                {school.logoUrl ? (
                  <img 
                    src={school.logoUrl} 
                    alt={`Logo da ${school.name}`} 
                    className="w-12 h-12 rounded-xl object-cover border border-emerald-500/30 bg-black/40 shrink-0 shadow-md"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl border border-white/10 bg-emerald-500/10 flex items-center justify-center shrink-0 text-emerald-400">
                    <School className="h-6 w-6" />
                  </div>
                )}
                <div>
                  <h4 className="text-base font-bold text-white leading-tight">{school.name}</h4>
                  {school.cnpj && (
                    <p className="text-xs text-emerald-300/90 font-mono mt-0.5">
                      CNPJ: <span className="font-semibold">{school.cnpj}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Codes Strip */}
              <div className="grid grid-cols-2 gap-2 bg-black/40 p-2.5 rounded-xl border border-white/5 text-xs font-mono my-3">
                <div className="flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-gray-500 block">Código INEP</span>
                    <span className="font-bold text-white">{school.inepCode}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-gray-500 block">Código SEC</span>
                    <span className="font-bold text-amber-300">{school.secCode}</span>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-1 text-xs text-gray-300">
                <p><span className="text-gray-500">Aldeia / Comunidade:</span> <strong className="text-white">{school.village}</strong></p>
                {(school.address || school.neighborhood || school.city) && (
                  <p className="flex items-start gap-1 text-gray-300">
                    <MapPin className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      {[school.address, school.neighborhood, `${school.city}/${school.uf}`, school.cep ? `CEP: ${school.cep}` : null].filter(Boolean).join(', ')}
                    </span>
                  </p>
                )}
                <p><span className="text-gray-500">Gestão / Direção:</span> {school.directorName}</p>
                {school.nativeLanguage && (
                  <p className="text-amber-200 font-medium">
                    <span className="text-gray-500">Língua / Matriz:</span> {school.nativeLanguage}
                  </p>
                )}
              </div>
            </div>

            {/* Edit & Delete Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-white/5 mt-3">
              <button
                onClick={() => handleOpenStaffManagement(school)}
                className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                title="Gerenciar quadro de colaboradores"
              >
                <Users className="h-3.5 w-3.5 text-emerald-400" />
                <span>Colaboradores ({getStaffCount(school.id)})</span>
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleOpenEditSchool(school)}
                  className="px-2.5 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                  title="Editar dados da unidade"
                >
                  <Edit className="h-3.5 w-3.5" />
                  Editar
                </button>

                <button
                  onClick={() => handleDeleteSchool(school.id)}
                  className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                  title="Excluir unidade"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Excluir
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredSchools.length === 0 && (
        <div className="text-center py-12 bg-[#141414] rounded-2xl border border-white/5">
          <School className="h-12 w-12 text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-400">Nenhuma unidade UEEI encontrada para a busca.</p>
          <button
            onClick={handleOpenAddSchool}
            className="mt-3 px-4 py-2 bg-emerald-500 text-black font-bold text-xs rounded-xl hover:bg-emerald-400 cursor-pointer"
          >
            Cadastrar Primeira Unidade
          </button>
        </div>
      )}
        </div>
      )}

      {/* SUB-TAB 2: TIME PUNCH APPROVAL DASHBOARD (FREQUÊNCIA) */}
      {activeSubTab === 'punches' && (
        <div className="space-y-6">
          {/* Stats overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#121625] border border-white/10 rounded-2xl p-4 space-y-1 shadow-lg">
              <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider block">Total de Batimentos</span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-mono font-black text-white">{globalPunches.length}</span>
                <Clock className="h-6 w-6 text-indigo-400" />
              </div>
            </div>

            <div className="bg-[#121625] border border-amber-500/30 rounded-2xl p-4 space-y-1 shadow-lg">
              <span className="text-amber-300/80 text-xs font-semibold uppercase tracking-wider block">Pendentes de Aprovação</span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-mono font-black text-amber-300">{pendingPunchesCount}</span>
                <Clock className="h-6 w-6 text-amber-400 animate-pulse" />
              </div>
            </div>

            <div className="bg-[#121625] border border-emerald-500/30 rounded-2xl p-4 space-y-1 shadow-lg">
              <span className="text-emerald-300/80 text-xs font-semibold uppercase tracking-wider block">Pontos Aprovados</span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-mono font-black text-emerald-300">{approvedPunchesCount}</span>
                <CheckCircle2 className="h-6 w-6 text-emerald-400" />
              </div>
            </div>

            <div className="bg-[#121625] border border-rose-500/30 rounded-2xl p-4 space-y-1 shadow-lg">
              <span className="text-rose-300/80 text-xs font-semibold uppercase tracking-wider block">Pontos Rejeitados</span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-mono font-black text-rose-300">{rejectedPunchesCount}</span>
                <X className="h-6 w-6 text-rose-400" />
              </div>
            </div>
          </div>

          {/* Control bar */}
          <div className="bg-[#121625] border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-xl">
            {/* Search & Filter */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  value={punchSearchTerm}
                  onChange={(e) => setPunchSearchTerm(e.target.value)}
                  placeholder="Buscar colaborador, matrícula, local..."
                  className="w-full pl-9 pr-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* Status Filter buttons */}
              <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 text-xs font-bold">
                {(['Todos', 'Pendente', 'Aprovado', 'Rejeitado'] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setPunchStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      punchStatusFilter === status
                        ? status === 'Pendente' ? 'bg-amber-500 text-black font-black' :
                          status === 'Aprovado' ? 'bg-emerald-500 text-black font-black' :
                          status === 'Rejeitado' ? 'bg-rose-500 text-white font-black' :
                          'bg-white text-black font-black'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Bulk Action */}
            {pendingPunchesCount > 0 && (
              <button
                type="button"
                onClick={handleApproveAllPending}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Aprovar Todos os {pendingPunchesCount} Pendentes</span>
              </button>
            )}
          </div>

          {/* Punch Cards Grid (Grouped Horizontally by Day & Collaborator) */}
          {filteredPunches.length === 0 ? (
            <div className="bg-[#121625] border border-white/10 rounded-2xl p-12 text-center text-gray-500 text-sm">
              Nenhum registro de ponto encontrado com os filtros aplicados.
            </div>
          ) : (
            <div className="space-y-6">
              {groupedDailyPunches.map((group) => (
                <div
                  key={group.groupKey}
                  className="bg-[#121625] border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl"
                >
                  {/* Group Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-sm">
                        {group.collaboratorName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-extrabold text-white">
                            {group.collaboratorName}
                          </h4>
                          {group.registration && (
                            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded font-mono text-[10px] font-bold">
                              Matrícula: {group.registration}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                          <Building2 className="h-3.5 w-3.5 text-emerald-400" />
                          <span>{group.location}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-xl text-xs font-mono font-bold text-gray-300 flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-indigo-400" />
                        Data: {formatDateBR(group.date)}
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Stage Grid: Entrada > Pausa > Retorno > Saída */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    {group.slots.map((slot, idx) => {
                      const punch = slot.punch;
                      const isPending = punch && (!punch.status || punch.status === 'Pendente');
                      const isApproved = punch && punch.status === 'Aprovado';
                      const isRejected = punch && punch.status === 'Rejeitado';

                      return (
                        <div key={slot.stage} className="relative flex flex-col">
                          <div className={`flex-1 rounded-2xl p-4 border transition-all flex flex-col justify-between space-y-3 ${
                            punch 
                              ? isPending ? 'bg-amber-500/5 border-amber-500/30' :
                                isApproved ? 'bg-emerald-500/5 border-emerald-500/30' :
                                'bg-rose-500/5 border-rose-500/30'
                              : 'bg-black/20 border-white/5 border-dashed'
                          }`}>
                            {/* Slot Header */}
                            <div className="flex items-center justify-between gap-2">
                              <span className={`px-2.5 py-0.5 rounded-lg text-xs font-extrabold border ${
                                slot.stage === 'Entrada' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                                slot.stage === 'Pausa' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                                slot.stage === 'Retorno' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' :
                                'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              }`}>
                                {slot.label}
                              </span>

                              {punch && (
                                <div>
                                  {isPending ? (
                                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded text-[10px] font-bold animate-pulse">
                                      Pendente
                                    </span>
                                  ) : isApproved ? (
                                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[10px] font-bold">
                                      Aprovado
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 rounded text-[10px] font-bold">
                                      Rejeitado
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Time or Placeholder */}
                            {punch ? (
                              <div className="space-y-2 my-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-indigo-200 text-lg font-black font-mono">
                                    {formatTimeBR(punch.time)}
                                  </span>

                                  {/* Photo thumbnail */}
                                  {punch.photoUrl ? (
                                    <div 
                                      onClick={() => setSelectedPhotoModal({ photoUrl: punch.photoUrl!, title: punch.type, colab: punch.collaboratorName || 'Colaborador', date: punch.date, time: punch.time })}
                                      className="relative group cursor-pointer shrink-0"
                                    >
                                      <img 
                                        src={punch.photoUrl} 
                                        alt="Selfie" 
                                        className="w-8 h-8 rounded-lg object-cover border border-indigo-500/50 group-hover:scale-105 transition-transform"
                                      />
                                    </div>
                                  ) : (
                                    <Camera className="h-4 w-4 text-gray-500" />
                                  )}
                                </div>

                                {/* Coords & Network */}
                                <div className="text-[10px] font-mono text-gray-400 space-y-0.5">
                                  {punch.coords && (
                                    <p className="truncate text-rose-400/90 flex items-center gap-1">
                                      <MapPin className="h-3 w-3 shrink-0" />
                                      Lat: {punch.coords.latitude.toFixed(4)}, Lon: {punch.coords.longitude.toFixed(4)}
                                    </p>
                                  )}
                                  <p className="truncate text-cyan-400/80">IP: {punch.ipAddress || '187.58.120.45'}</p>
                                </div>

                                {/* Slot Actions */}
                                <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-1">
                                  <button
                                    type="button"
                                    onClick={() => setDeletingPunchId(punch.id)}
                                    className="p-1 text-gray-500 hover:text-rose-400 transition-colors cursor-pointer"
                                    title="Excluir ponto"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>

                                  <div className="flex items-center gap-1">
                                    {isPending ? (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => handleOpenRejectModal(punch.id)}
                                          className="p-1 bg-rose-500/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded transition-colors cursor-pointer"
                                          title="Rejeitar"
                                        >
                                          <X className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleApprovePunch(punch.id)}
                                          className="p-1 bg-emerald-500/20 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded transition-colors cursor-pointer"
                                          title="Aprovar"
                                        >
                                          <CheckCircle2 className="h-3.5 w-3.5" />
                                        </button>
                                      </>
                                    ) : isApproved ? (
                                      <button
                                        type="button"
                                        onClick={() => handleOpenRejectModal(punch.id)}
                                        className="px-2 py-0.5 text-[10px] bg-white/5 hover:bg-rose-900/40 text-gray-400 hover:text-rose-300 rounded cursor-pointer transition-colors"
                                      >
                                        Rejeitar
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => handleApprovePunch(punch.id)}
                                        className="px-2 py-0.5 text-[10px] bg-white/5 hover:bg-emerald-900/40 text-gray-400 hover:text-emerald-300 rounded cursor-pointer transition-colors"
                                      >
                                        Aprovar
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="py-4 text-center my-auto">
                                <Clock className="h-5 w-5 text-gray-600 mx-auto mb-1" />
                                <span className="text-[11px] text-gray-500 font-medium block">Não Registrado</span>
                              </div>
                            )}
                          </div>

                          {/* Visual Arrow Connector with calculated time badge */}
                          {idx < 3 && (
                            <div className="hidden md:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-10 flex-col items-center">
                              <div className="w-6 h-6 bg-black/80 border border-indigo-500/40 rounded-full flex items-center justify-center text-indigo-300 shadow-lg">
                                <ChevronRight className="h-3.5 w-3.5" />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Daily Hours Calculation Banner */}
                  <div className="bg-black/40 border border-white/10 rounded-xl p-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                        <Calculator className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-white font-extrabold block text-xs">Cálculo de Jornada Diária</span>
                        <span className="text-[10px] text-gray-400 block">Apuração automática de turnos e intervalo fora</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full md:w-auto font-mono">
                      {/* Turno 1 */}
                      <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-emerald-300">
                        <span className="text-[10px] text-gray-400 font-sans block font-semibold">1º Turno (Entrada ➔ Pausa)</span>
                        <strong className="text-xs text-emerald-300 font-bold">{group.hoursCalculation.turno1Str}</strong>
                      </div>

                      {/* Tempo Fora (Intervalo / Pausa) */}
                      <div className="bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg text-amber-300">
                        <span className="text-[10px] text-gray-400 font-sans block font-semibold">Tempo Fora (Pausa)</span>
                        <strong className="text-xs text-amber-300 font-bold">{group.hoursCalculation.intervalStr}</strong>
                      </div>

                      {/* Turno 2 */}
                      <div className="bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-lg text-indigo-300">
                        <span className="text-[10px] text-gray-400 font-sans block font-semibold">2º Turno (Retorno ➔ Saída)</span>
                        <strong className="text-xs text-indigo-300 font-bold">{group.hoursCalculation.turno2Str}</strong>
                      </div>

                      {/* Total Trabalhado */}
                      <div className="bg-emerald-500/20 border border-emerald-400/40 px-3 py-1.5 rounded-lg text-white shadow-lg">
                        <span className="text-[10px] text-emerald-300 font-sans block uppercase font-extrabold">Total Trabalhado</span>
                        <strong className="text-xs text-emerald-300 font-black">{group.hoursCalculation.totalWorkedStr}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal 1: Register or Edit UEEI Unit / School */}
      {isAddSchoolOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#111111] rounded-2xl border border-emerald-500/30 max-w-xl w-full overflow-hidden text-gray-200 shadow-2xl my-8"
          >
            <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-[#1a1a1a]">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <School className="h-5 w-5 text-emerald-400" />
                {editingSchool ? 'Editar Unidade UEEI' : 'Cadastrar Unidade UEEI (Unidade Estadual de Ensino Indígena)'}
              </div>
              <button onClick={() => setIsAddSchoolOpen(false)} className="text-gray-400 hover:text-white cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddSchoolSubmit} className="p-6 space-y-4 text-xs">
              {/* Logo da Escola */}
              <div className="bg-[#181818] p-3.5 rounded-xl border border-white/10 space-y-2">
                <label className="block text-emerald-400 font-bold flex items-center gap-1.5 text-xs">
                  <ImageIcon className="h-4 w-4" /> Logo da Escola / Insígnia
                </label>
                
                <div className="flex items-center gap-4">
                  {newSchoolLogoUrl ? (
                    <div className="relative group shrink-0">
                      <img 
                        src={newSchoolLogoUrl} 
                        alt="Preview Logo" 
                        className="w-16 h-16 rounded-xl object-cover border border-emerald-500/40 bg-black/50 shadow-md"
                      />
                      <button
                        type="button"
                        onClick={() => setNewSchoolLogoUrl('')}
                        className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-500 text-white p-1 rounded-full shadow-lg cursor-pointer"
                        title="Remover logo"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl border border-dashed border-white/20 bg-white/5 flex flex-col items-center justify-center shrink-0 text-gray-400">
                      <School className="h-6 w-6 opacity-40" />
                      <span className="text-[9px] text-gray-500 mt-1">Sem logo</span>
                    </div>
                  )}

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-lg font-bold text-xs cursor-pointer flex items-center gap-1.5 transition-all">
                        <Upload className="h-3.5 w-3.5" />
                        <span>Carregar Imagem</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                    
                    <div>
                      <input
                        type="url"
                        value={newSchoolLogoUrl}
                        onChange={(e) => setNewSchoolLogoUrl(e.target.value)}
                        placeholder="ou cole o Link da Imagem (https://...)"
                        className="w-full px-3 py-1.5 bg-[#121212] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:ring-1 focus:ring-emerald-500 text-[11px]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Nome da Unidade */}
              <div>
                <label className="block text-gray-400 font-semibold mb-1">
                  Nome da Unidade / Escola *
                </label>
                <input
                  type="text"
                  required
                  value={newSchoolName}
                  onChange={(e) => setNewSchoolName(e.target.value)}
                  placeholder="Ex: Escola Estadual Indígena Xukuru do Ororubá"
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* CNPJ & Esfera */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 font-semibold mb-1">
                    CNPJ da Unidade
                  </label>
                  <input
                    type="text"
                    value={newSchoolCnpj}
                    onChange={(e) => setNewSchoolCnpj(e.target.value)}
                    placeholder="Ex: 00.000.000/0001-00"
                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-white font-mono placeholder-gray-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-semibold mb-1">
                    Esfera Administrativa *
                  </label>
                  <select
                    value={newSchoolEsfera}
                    onChange={(e) => setNewSchoolEsfera(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-white focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="Estadual">Estadual</option>
                    <option value="Municipal">Municipal</option>
                    <option value="Federal">Federal</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
              </div>

              {/* Pública vs Privada & Categoria */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 font-semibold mb-1">
                    Pública ou Privada *
                  </label>
                  <div className="flex bg-[#1a1a1a] p-1 rounded-xl border border-white/10 font-semibold">
                    <button
                      type="button"
                      onClick={() => setNewSchoolCategory('Pública')}
                      className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer text-center ${
                        newSchoolCategory === 'Pública' 
                          ? 'bg-emerald-600 text-white font-bold shadow-md' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      🏛️ Pública
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewSchoolCategory('Privada')}
                      className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer text-center ${
                        newSchoolCategory === 'Privada' 
                          ? 'bg-purple-600 text-white font-bold shadow-md' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      🏢 Privada
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Etnia / Povo Atendido *</label>
                  <input
                    type="text"
                    required
                    value={newSchoolEthnicity}
                    onChange={(e) => setNewSchoolEthnicity(e.target.value)}
                    placeholder="Ex: Povo Xukuru, Povo Fulni-ô"
                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-white"
                  />
                </div>
              </div>

              {/* Código INEP & Código SEC */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 font-semibold mb-1">
                    Código INEP *
                  </label>
                  <input
                    type="text"
                    required
                    value={newSchoolInep}
                    onChange={(e) => setNewSchoolInep(e.target.value)}
                    placeholder="Ex: 26104891"
                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-white font-mono placeholder-gray-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-semibold mb-1">
                    Código SEC (Secretaria de Educação) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newSchoolSec}
                    onChange={(e) => setNewSchoolSec(e.target.value)}
                    placeholder="Ex: SEC-PE-2045"
                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-white font-mono placeholder-gray-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Aldeia / Comunidade & Direção */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Aldeia / Comunidade *</label>
                  <input
                    type="text"
                    required
                    value={newSchoolVillage}
                    onChange={(e) => setNewSchoolVillage(e.target.value)}
                    placeholder="Ex: Aldeia Cimbres"
                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-white"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Gestão / Direção Escolar</label>
                  <input
                    type="text"
                    value={newSchoolDirector}
                    onChange={(e) => setNewSchoolDirector(e.target.value)}
                    placeholder="Ex: Prof. Cacique Marcos Xukuru"
                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-white placeholder-gray-500"
                  />
                </div>
              </div>

              {/* Endereço Completo da Escola */}
              <div className="bg-[#181818] p-3.5 rounded-xl border border-white/10 space-y-3">
                <label className="block text-emerald-400 font-bold flex items-center gap-1.5 text-xs">
                  <MapPin className="h-4 w-4" /> Endereço Completo da Escola
                </label>

                {/* Logradouro / Rua / Sítio */}
                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Logradouro / Rua / Sítio / Acesso</label>
                  <input
                    type="text"
                    value={newSchoolAddress}
                    onChange={(e) => setNewSchoolAddress(e.target.value)}
                    placeholder="Ex: Sítio Cimbres, s/n ou Av. Indígena, 100"
                    className="w-full px-3 py-2 bg-[#121212] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-1 focus:ring-emerald-500 text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Bairro / Distrito */}
                  <div>
                    <label className="block text-gray-400 font-semibold mb-1">Bairro / Distrito</label>
                    <input
                      type="text"
                      value={newSchoolNeighborhood}
                      onChange={(e) => setNewSchoolNeighborhood(e.target.value)}
                      placeholder="Ex: Distrito de Cimbres"
                      className="w-full px-3 py-2 bg-[#121212] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-1 focus:ring-emerald-500 text-xs"
                    />
                  </div>

                  {/* CEP */}
                  <div>
                    <label className="block text-gray-400 font-semibold mb-1">CEP</label>
                    <input
                      type="text"
                      value={newSchoolCep}
                      onChange={(e) => setNewSchoolCep(e.target.value)}
                      placeholder="Ex: 55200-000"
                      className="w-full px-3 py-2 bg-[#121212] border border-white/10 rounded-xl text-white font-mono placeholder-gray-500 focus:ring-1 focus:ring-emerald-500 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Cidade */}
                  <div className="sm:col-span-2">
                    <label className="block text-gray-400 font-semibold mb-1">Cidade / Município *</label>
                    <input
                      type="text"
                      required
                      value={newSchoolCity}
                      onChange={(e) => setNewSchoolCity(e.target.value)}
                      placeholder="Ex: Pesqueira"
                      className="w-full px-3 py-2 bg-[#121212] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-1 focus:ring-emerald-500 text-xs"
                    />
                  </div>

                  {/* UF */}
                  <div>
                    <label className="block text-gray-400 font-semibold mb-1">UF *</label>
                    <input
                      type="text"
                      required
                      maxLength={2}
                      value={newSchoolUf}
                      onChange={(e) => setNewSchoolUf(e.target.value.toUpperCase())}
                      placeholder="PE"
                      className="w-full px-3 py-2 bg-[#121212] border border-white/10 rounded-xl text-white font-mono uppercase text-center focus:ring-1 focus:ring-emerald-500 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Língua Materna */}
              <div>
                <label className="block text-gray-400 font-semibold mb-1">Língua Materna / Projeto Pedagógico Bilíngue</label>
                <input
                  type="text"
                  value={newSchoolLanguage}
                  onChange={(e) => setNewSchoolLanguage(e.target.value)}
                  placeholder="Ex: Língua Materna Xukuru / Português"
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-white placeholder-gray-500"
                />
              </div>

              <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddSchoolOpen(false)}
                  className="px-4 py-2 border border-white/10 rounded-xl font-semibold text-gray-400 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold rounded-xl shadow-lg cursor-pointer"
                >
                  {editingSchool ? 'Salvar Alterações' : 'Salvar Unidade UEEI'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Confirmation Modal: Delete School */}
      {deletingSchoolItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#111111] rounded-2xl border border-red-500/30 max-w-md w-full overflow-hidden text-gray-200 shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                <Trash2 className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Excluir Unidade UEEI</h3>
                <p className="text-xs text-gray-400">Confirmação de exclusão</p>
              </div>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              Tem certeza de que deseja excluir permanentemente a unidade de ensino <strong className="text-white">"{deletingSchoolItem.name}"</strong>? Esta ação removerá os registros locais e não poderá ser desfeita.
            </p>

            <div className="pt-3 border-t border-white/10 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setDeletingSchoolItem(null)}
                className="px-4 py-2 border border-white/10 rounded-xl font-semibold text-gray-400 hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteSchool}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Excluir Definitivamente
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal 3: Staff Management Modal (Colaboradores da Escola) */}
      {activeStaffSchool && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 z-50 overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#121212] rounded-2xl border border-emerald-500/30 max-w-4xl w-full overflow-hidden text-gray-200 shadow-2xl my-auto"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#18261e] via-[#121c16] to-[#121212] p-5 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {activeStaffSchool.logoUrl ? (
                  <img 
                    src={activeStaffSchool.logoUrl} 
                    alt="Logo" 
                    className="w-12 h-12 rounded-xl object-cover border border-emerald-500/40 bg-black/50 shadow-md"
                  />
                ) : (
                  <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                    <Users className="h-6 w-6" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      UEEI - Quadro de Colaboradores
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      INEP: {activeStaffSchool.inepCode}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white leading-tight mt-0.5">
                    {activeStaffSchool.name}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {activeStaffSchool.village} ({activeStaffSchool.city}/{activeStaffSchool.uf})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenAddStaff}
                  className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Cadastrar Colaborador(a)</span>
                </button>
                <button 
                  onClick={() => setActiveStaffSchool(null)}
                  className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-all cursor-pointer"
                  title="Fechar"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-5 space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Role Filters */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-thin">
                  <button
                    onClick={() => setStaffRoleFilter('Todos')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                      staffRoleFilter === 'Todos'
                        ? 'bg-emerald-500 text-black shadow-md'
                        : 'bg-[#1e1e1e] text-gray-300 hover:bg-white/10 border border-white/5'
                    }`}
                  >
                    Todos ({staffList.filter(s => s.schoolId === activeStaffSchool.id).length})
                  </button>

                  {STAFF_ROLES.map((role) => {
                    const count = staffList.filter(s => s.schoolId === activeStaffSchool.id && s.role === role).length;
                    if (count === 0 && staffRoleFilter !== role) return null;
                    return (
                      <button
                        key={role}
                        onClick={() => setStaffRoleFilter(role)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                          staffRoleFilter === role
                            ? 'bg-emerald-500 text-black shadow-md'
                            : 'bg-[#1e1e1e] text-gray-300 hover:bg-white/10 border border-white/5'
                        }`}
                      >
                        {role} ({count})
                      </button>
                    );
                  })}
                </div>

                {/* Search */}
                <div className="relative w-full sm:w-64 shrink-0">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-500" />
                  <input
                    type="text"
                    value={staffSearchTerm}
                    onChange={(e) => setStaffSearchTerm(e.target.value)}
                    placeholder="Buscar colaborador ou CPF..."
                    className="w-full pl-8 pr-3 py-1.5 bg-[#181818] border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Staff List */}
              <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
                {staffList
                  .filter(s => s.schoolId === activeStaffSchool.id)
                  .filter(s => staffRoleFilter === 'Todos' || s.role === staffRoleFilter)
                  .filter(s => 
                    !staffSearchTerm || 
                    s.name.toLowerCase().includes(staffSearchTerm.toLowerCase()) || 
                    (s.registrationCode && s.registrationCode.toLowerCase().includes(staffSearchTerm.toLowerCase())) ||
                    (s.username && s.username.toLowerCase().includes(staffSearchTerm.toLowerCase())) ||
                    (s.email && s.email.toLowerCase().includes(staffSearchTerm.toLowerCase())) ||
                    (s.motherName && s.motherName.toLowerCase().includes(staffSearchTerm.toLowerCase())) ||
                    (s.fatherName && s.fatherName.toLowerCase().includes(staffSearchTerm.toLowerCase())) ||
                    (s.cpf && s.cpf.includes(staffSearchTerm)) ||
                    (s.docNumber && s.docNumber.includes(staffSearchTerm)) ||
                    (s.nis && s.nis.includes(staffSearchTerm)) ||
                    (s.sus && s.sus.includes(staffSearchTerm)) ||
                    s.role.toLowerCase().includes(staffSearchTerm.toLowerCase())
                  )
                  .map((staff) => (
                    <div 
                      key={staff.id}
                      className="bg-[#181818] border border-white/10 hover:border-emerald-500/30 rounded-xl p-3.5 flex flex-col sm:flex-row items-start justify-between gap-3 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-sm mt-0.5">
                          {staff.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-sm font-bold text-white">{staff.name}</h4>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              staff.role === 'Professor(a)' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' :
                              staff.role === 'Servente de Limpeza' ? 'bg-sky-500/15 text-sky-300 border-sky-500/30' :
                              staff.role === 'Cozinheira(o)' ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' :
                              staff.role === 'Porteiro(a)' ? 'bg-blue-500/15 text-blue-300 border-blue-500/30' :
                              staff.role === 'Recepção I' ? 'bg-purple-500/15 text-purple-300 border-purple-500/30' :
                              staff.role === 'Apoio ADM I' ? 'bg-teal-500/15 text-teal-300 border-teal-500/30' :
                              staff.role === 'Oficineiro(a)' ? 'bg-rose-500/15 text-rose-300 border-rose-500/30' :
                              staff.role === 'Cuidador(a) Escolar' ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' :
                              'bg-gray-500/15 text-gray-300 border-gray-500/30'
                            }`}>
                              {staff.role}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              staff.status === 'Ativo' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                            }`}>
                              {staff.status}
                            </span>
                          </div>

                          {/* Secondary info line: Birth date, marital status, shift, phone & email */}
                          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 font-mono">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-amber-400" />
                              Turno: <strong className="text-gray-200">{staff.shift}</strong>
                            </span>
                            {staff.birthDate && (
                              <span>Nasc: <strong className="text-gray-200">{staff.birthDate}</strong></span>
                            )}
                            {staff.maritalStatus && (
                              <span className="bg-white/5 px-1.5 py-0.5 rounded text-[10px] text-gray-300 border border-white/5">{staff.maritalStatus}</span>
                            )}
                            {staff.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3 text-emerald-400" />
                                {staff.phone}
                              </span>
                            )}
                            {staff.email && (
                              <span className="flex items-center gap-1 text-sky-300">
                                <Mail className="h-3 w-3 text-sky-400" />
                                {staff.email}
                              </span>
                            )}
                          </div>

                          {/* Credentials Badges (Matrícula, Usuário e Senha) */}
                          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-mono">
                            {staff.registrationCode && (
                              <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-md text-amber-300 flex items-center gap-1">
                                <BadgeCheck className="h-3 w-3 text-amber-400" />
                                <strong>Matrícula:</strong> {staff.registrationCode}
                              </span>
                            )}
                            {staff.username && (
                              <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded-md text-indigo-300 flex items-center gap-1">
                                <Key className="h-3 w-3 text-indigo-400" />
                                <strong>Usuário:</strong> {staff.username}
                              </span>
                            )}
                            {staff.password && (
                              <span className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 rounded-md text-rose-300 flex items-center gap-1">
                                <Lock className="h-3 w-3 text-rose-400" />
                                <strong>Senha:</strong> {visiblePasswordsMap[staff.id] ? staff.password : '••••••••'}
                                <button
                                  type="button"
                                  onClick={() => togglePasswordVisibility(staff.id)}
                                  className="ml-1 p-0.5 text-rose-300 hover:text-white transition-colors cursor-pointer"
                                  title={visiblePasswordsMap[staff.id] ? "Ocultar senha" : "Exibir senha"}
                                >
                                  {visiblePasswordsMap[staff.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                </button>
                              </span>
                            )}
                          </div>

                          {/* Filiação (Mãe e Pai) */}
                          {(staff.motherName || staff.fatherName) && (
                            <div className="text-[11px] text-gray-400 space-y-0.5 pt-0.5">
                              {staff.motherName && (
                                <div><span className="text-gray-500 font-semibold">Mãe:</span> {staff.motherName}</div>
                              )}
                              {staff.fatherName && (
                                <div><span className="text-gray-500 font-semibold">Pai:</span> {staff.fatherName}</div>
                              )}
                            </div>
                          )}

                          {/* Documentation Badges */}
                          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-mono">
                            {/* Documento (CNH / RG / CIN) */}
                            {staff.docNumber ? (
                              <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-md text-gray-300 flex items-center gap-1">
                                <FileText className="h-3 w-3 text-blue-400" />
                                <strong>{staff.docType || 'RG'}:</strong> {staff.docNumber} 
                                {(staff.docIssuer || staff.docUf) && ` (${staff.docIssuer || ''}${staff.docUf ? '/' + staff.docUf : ''})`}
                                {staff.docIssueDate && <span className="text-gray-500 text-[10px]">Exp: {staff.docIssueDate}</span>}
                              </span>
                            ) : null}

                            {/* CPF */}
                            {staff.cpf && (
                              <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-emerald-300">
                                <strong>CPF:</strong> {staff.cpf}
                              </span>
                            )}

                            {/* NIS */}
                            {staff.nis && (
                              <span className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded-md text-purple-300">
                                <strong>NIS:</strong> {staff.nis}
                              </span>
                            )}

                            {/* SUS */}
                            {staff.sus && (
                              <span className="px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/20 rounded-md text-cyan-300">
                                <strong>SUS:</strong> {staff.sus}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-start shrink-0">
                        <button
                          onClick={() => handleOpenEditStaff(staff)}
                          className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg transition-all cursor-pointer"
                          title="Editar colaborador"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={() => setDeletingStaffItem(staff)}
                          className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg transition-all cursor-pointer"
                          title="Remover colaborador"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                {staffList.filter(s => s.schoolId === activeStaffSchool.id).length === 0 && (
                  <div className="text-center py-10 bg-[#181818] rounded-xl border border-white/5 space-y-2">
                    <Users className="h-10 w-10 text-gray-600 mx-auto" />
                    <p className="text-xs text-gray-400">Nenhum colaborador cadastrado para esta escola.</p>
                    <button
                      onClick={handleOpenAddStaff}
                      className="px-3.5 py-1.5 bg-emerald-500 text-black font-bold text-xs rounded-lg cursor-pointer"
                    >
                      Cadastrar Primeiro Colaborador
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#181818] border-t border-white/10 flex items-center justify-between text-xs text-gray-400">
              <span className="font-mono">
                Total registrado: {staffList.filter(s => s.schoolId === activeStaffSchool.id).length} colaborador(es)
              </span>
              <button
                type="button"
                onClick={() => setActiveStaffSchool(null)}
                className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl cursor-pointer"
              >
                Concluir / Fechar
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal 4: Add / Edit Staff Member */}
      {isAddStaffModalOpen && activeStaffSchool && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#121212] rounded-2xl border border-emerald-500/40 max-w-lg w-full overflow-hidden text-gray-200 shadow-2xl my-auto"
          >
            <div className="p-5 bg-gradient-to-r from-[#1a2d21] to-[#121212] border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingStaff ? 'Editar Colaborador(a)' : 'Cadastrar Colaborador(a)'}
                  </h3>
                  <p className="text-xs text-emerald-300 font-mono">
                    {activeStaffSchool.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddStaffModalOpen(false)}
                className="text-gray-400 hover:text-white p-1.5 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStaffSubmit} className="p-5 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              {/* Nome Completo */}
              <div>
                <label className="block text-gray-300 font-semibold mb-1">
                  Nome Completo do(a) Colaborador(a) *
                </label>
                <input
                  type="text"
                  required
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="Ex: Maria José da Silva"
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Cargo / Função */}
              <div>
                <label className="block text-emerald-400 font-bold mb-1">
                  Função / Cargo / Ocupação Escolar *
                </label>
                <select
                  value={staffRole}
                  onChange={(e) => setStaffRole(e.target.value as StaffRole)}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-white font-semibold focus:ring-1 focus:ring-emerald-500"
                >
                  {STAFF_ROLES.map((role) => (
                    <option key={role} value={role} className="bg-[#181818] text-white">
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              {staffRole === 'Outro' && (
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">
                    Especifique a Função
                  </label>
                  <input
                    type="text"
                    required
                    value={staffCustomRole}
                    onChange={(e) => setStaffCustomRole(e.target.value)}
                    placeholder="Ex: Bibliotecário(a), Monitor(a), Coordenador(a)..."
                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Turno de Trabalho */}
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Turno *</label>
                  <select
                    value={staffShift}
                    onChange={(e) => setStaffShift(e.target.value as 'Manhã' | 'Tarde' | 'Noite' | 'Integral')}
                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-white focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="Manhã" className="bg-[#181818]">Manhã</option>
                    <option value="Tarde" className="bg-[#181818]">Tarde</option>
                    <option value="Noite" className="bg-[#181818]">Noite</option>
                    <option value="Integral" className="bg-[#181818]">Integral</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Situação *</label>
                  <select
                    value={staffStatus}
                    onChange={(e) => setStaffStatus(e.target.value as 'Ativo' | 'Inativo')}
                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-white focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="Ativo" className="bg-[#181818]">Ativo(a)</option>
                    <option value="Inativo" className="bg-[#181818]">Inativo(a)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Telefone */}
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    value={staffPhone}
                    onChange={(e) => setStaffPhone(e.target.value)}
                    placeholder="(87) 90000-0000"
                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-white font-mono placeholder-gray-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* E-mail */}
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">E-mail de Contato / Institucional</label>
                  <input
                    type="email"
                    value={staffEmail}
                    onChange={(e) => setStaffEmail(e.target.value)}
                    placeholder="colaborador@escola.pe.gov.br"
                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Seção Credenciais de Acesso & Matrícula */}
              <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold">
                    <Key className="h-4 w-4 text-indigo-400" />
                    <span>Matrícula & Credenciais de Acesso</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (staffName.trim()) {
                        const parts = staffName.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/\s+/);
                        const user = parts.length > 1 ? `${parts[0]}.${parts[parts.length - 1]}` : parts[0];
                        const pass = `${parts[0].charAt(0).toUpperCase()}${parts[0].slice(1)}@2026`;
                        setStaffUsername(user);
                        setStaffPassword(pass);
                      }
                    }}
                    className="text-[11px] font-bold text-indigo-300 hover:text-white bg-indigo-500/20 hover:bg-indigo-500/30 px-2 py-1 rounded-lg border border-indigo-500/40 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Key className="h-3 w-3" />
                    Gerar Usuário e Senha
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Matrícula */}
                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">Matrícula Escolar / Funcional</label>
                    <input
                      type="text"
                      value={staffRegistrationCode}
                      onChange={(e) => setStaffRegistrationCode(e.target.value)}
                      placeholder="Ex: MAT-2026-001"
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-white font-mono placeholder-gray-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Usuário */}
                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">Usuário de Login</label>
                    <input
                      type="text"
                      value={staffUsername}
                      onChange={(e) => setStaffUsername(e.target.value)}
                      placeholder="Ex: maria.xukuru"
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-white font-mono placeholder-gray-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Senha */}
                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">Senha de Acesso</label>
                    <div className="relative">
                      <input
                        type={showStaffPassword ? "text" : "password"}
                        value={staffPassword}
                        onChange={(e) => setStaffPassword(e.target.value)}
                        placeholder="Ex: Senha123"
                        className="w-full pl-3 pr-10 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-white font-mono placeholder-gray-500 focus:ring-1 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowStaffPassword(!showStaffPassword)}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-white transition-colors cursor-pointer"
                        title={showStaffPassword ? "Ocultar senha" : "Exibir senha"}
                      >
                        {showStaffPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seção 0: Dados Pessoais e Filiação */}
              <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-purple-400 font-bold border-b border-white/10 pb-2">
                  <Users className="h-4 w-4" />
                  <span>Dados Pessoais & Filiação</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Data de Nascimento */}
                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">Data de Nascimento</label>
                    <input
                      type="date"
                      value={staffBirthDate}
                      onChange={(e) => setStaffBirthDate(e.target.value)}
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-white font-mono focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Estado Civil */}
                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">Estado Civil</label>
                    <select
                      value={staffMaritalStatus}
                      onChange={(e) => setStaffMaritalStatus(e.target.value as any)}
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-white font-semibold focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="Solteiro(a)" className="bg-[#181818]">Solteiro(a)</option>
                      <option value="Casado(a)" className="bg-[#181818]">Casado(a)</option>
                      <option value="Divorciado(a)" className="bg-[#181818]">Divorciado(a)</option>
                      <option value="Viúvo(a)" className="bg-[#181818]">Viúvo(a)</option>
                      <option value="União Estável" className="bg-[#181818]">União Estável</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Nome da Mãe */}
                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">Nome Completo da Mãe (Filiação 1)</label>
                    <input
                      type="text"
                      value={staffMotherName}
                      onChange={(e) => setStaffMotherName(e.target.value)}
                      placeholder="Ex: Maria José de Oliveira"
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Nome do Pai */}
                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">Nome Completo do Pai (Filiação 2)</label>
                    <input
                      type="text"
                      value={staffFatherName}
                      onChange={(e) => setStaffFatherName(e.target.value)}
                      placeholder="Ex: Antônio José da Silva"
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Seção 1: Documento Oficial de Identificação (RG / CNH / CIN) */}
              <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-blue-400 font-bold border-b border-white/10 pb-2">
                  <FileText className="h-4 w-4" />
                  <span>Documento Oficial de Identificação (CNH, RG ou CIN)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Tipo de Documento */}
                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">Tipo de Documento</label>
                    <select
                      value={staffDocType}
                      onChange={(e) => setStaffDocType(e.target.value as 'RG' | 'CNH' | 'CIN')}
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-white font-bold focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="RG" className="bg-[#181818]">RG - Registro Geral</option>
                      <option value="CNH" className="bg-[#181818]">CNH - Habilitação</option>
                      <option value="CIN" className="bg-[#181818]">CIN - Identidade Nacional</option>
                    </select>
                  </div>

                  {/* Número do Documento */}
                  <div className="sm:col-span-2">
                    <label className="block text-gray-300 font-semibold mb-1">
                      Número do Documento ({staffDocType})
                    </label>
                    <input
                      type="text"
                      value={staffDocNumber}
                      onChange={(e) => setStaffDocNumber(e.target.value)}
                      placeholder={staffDocType === 'CNH' ? 'Nº do Registro CNH' : staffDocType === 'CIN' ? '000.000.000.00' : 'Nº do RG'}
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-white font-mono placeholder-gray-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Órgão Expedidor */}
                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">Órgão Expedidor</label>
                    <input
                      type="text"
                      value={staffDocIssuer}
                      onChange={(e) => setStaffDocIssuer(e.target.value)}
                      placeholder="Ex: SDS, SSP, DETRAN"
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-white font-mono placeholder-gray-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  {/* UF do Documento */}
                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">UF Expedidora</label>
                    <input
                      type="text"
                      maxLength={2}
                      value={staffDocUf}
                      onChange={(e) => setStaffDocUf(e.target.value.toUpperCase())}
                      placeholder="Ex: PE"
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-white font-mono uppercase placeholder-gray-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Data de Expedição */}
                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">Data de Expedição</label>
                    <input
                      type="date"
                      value={staffDocIssueDate}
                      onChange={(e) => setStaffDocIssueDate(e.target.value)}
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-white font-mono focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Seção 2: Registros Nacionais e Sociais (CPF, NIS, SUS) */}
              <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold border-b border-white/10 pb-2">
                  <CreditCard className="h-4 w-4" />
                  <span>Cadastros Nacionais e Sociais (CPF, NIS, SUS)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* CPF */}
                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">CPF</label>
                    <input
                      type="text"
                      value={staffCpf}
                      onChange={(e) => setStaffCpf(e.target.value)}
                      placeholder="000.000.000-00"
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-white font-mono placeholder-gray-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  {/* NIS / PIS */}
                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">NIS / PIS / PASEP</label>
                    <input
                      type="text"
                      value={staffNis}
                      onChange={(e) => setStaffNis(e.target.value)}
                      placeholder="000.00000.00-0"
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-white font-mono placeholder-gray-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Cartão SUS */}
                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">Cartão SUS</label>
                    <input
                      type="text"
                      value={staffSus}
                      onChange={(e) => setStaffSus(e.target.value)}
                      placeholder="000 0000 0000 0000"
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-white font-mono placeholder-gray-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddStaffModalOpen(false)}
                  className="px-4 py-2 border border-white/10 rounded-xl font-semibold text-gray-400 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold rounded-xl shadow-lg cursor-pointer"
                >
                  {editingStaff ? 'Salvar Alterações' : 'Cadastrar Colaborador'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Modal 5: Confirmation Delete Staff */}
      {deletingStaffItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#111111] rounded-2xl border border-red-500/30 max-w-md w-full overflow-hidden text-gray-200 shadow-2xl p-6 space-y-4 z-50"
          >
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                <Trash2 className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Remover Colaborador(a)</h3>
                <p className="text-xs text-gray-400">Confirmação de exclusão</p>
              </div>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              Tem certeza de que deseja remover <strong className="text-white">"{deletingStaffItem.name}"</strong> ({deletingStaffItem.role}) do quadro de colaboradores?
            </p>

            <div className="pt-3 border-t border-white/10 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setDeletingStaffItem(null)}
                className="px-4 py-2 border border-white/10 rounded-xl font-semibold text-gray-400 hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteStaff}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remover Colaborador
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Lightbox Photo Preview Modal */}
      {selectedPhotoModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121625] border border-indigo-500/40 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">{selectedPhotoModal.colab}</h3>
                <p className="text-xs text-indigo-300 font-mono">Ponto: {selectedPhotoModal.title} - {formatDateBR(selectedPhotoModal.date)} às {formatTimeBR(selectedPhotoModal.time)}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPhotoModal(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 flex items-center justify-center cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative w-full h-80 bg-black rounded-2xl overflow-hidden border border-white/10">
              <img 
                src={selectedPhotoModal.photoUrl} 
                alt="Foto do Ponto" 
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedPhotoModal(null)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                Fechar Visualização
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectingPunchId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121625] border border-rose-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20">
                <X className="h-6 w-6 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Rejeitar Batimento de Ponto</h3>
                <p className="text-xs text-gray-400">Informe a justificativa da rejeição UEEI</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-300">
                Motivo da Rejeição:
              </label>
              <textarea
                value={rejectionInputReason}
                onChange={(e) => setRejectionInputReason(e.target.value)}
                placeholder="Ex: Foto indisponível, ausência de GPS válido, divergência na jornada de trabalho..."
                className="w-full h-24 bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-rose-500 text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 text-xs">
              <button
                type="button"
                onClick={() => setRejectingPunchId(null)}
                className="px-4 py-2 bg-white/10 text-gray-300 hover:bg-white/20 rounded-xl font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmRejectPunch}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-extrabold rounded-xl shadow-lg cursor-pointer"
              >
                Confirmar Rejeição
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Punch Confirmation Modal */}
      {deletingPunchId && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121625] border border-rose-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-3 bg-rose-500/20 rounded-xl border border-rose-500/30">
                <Trash2 className="h-6 w-6 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Excluir Registro de Ponto</h3>
                <p className="text-xs text-gray-400">Confirmação de exclusão definitiva pela UEEI</p>
              </div>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              Tem certeza de que deseja excluir permanentemente este registro de ponto? Esta ação não pode ser desfeita e removerá o registro dos relatórios.
            </p>

            <div className="flex justify-end gap-2 pt-2 text-xs">
              <button
                type="button"
                onClick={() => setDeletingPunchId(null)}
                className="px-4 py-2 bg-white/10 text-gray-300 hover:bg-white/20 rounded-xl font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleDeletePunch(deletingPunchId)}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-extrabold rounded-xl shadow-lg cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="h-4 w-4" /> Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
