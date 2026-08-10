import { collection, getDocs, doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Associate, Transaction, Announcement, ReportCopy, Assembly, Poll, EntityConfig, AdminConfig, Collaborator, Charge } from '../types';
import { UNION_LOGO_DATA_URL } from '../components/UnionLogo';
import { getSupabaseConfig, isSupabaseConfigured } from '../lib/supabase';
import { 
  getSupabaseAssociates, getSupabaseTransactions, getSupabaseAnnouncements, getSupabaseClients,
  getSupabaseReports, getSupabaseAssemblies, getSupabasePolls, getSupabaseCharges, saveSupabaseRecord,
  deleteSupabaseRecord, getSupabaseEntityConfig, getSupabaseAdminConfig,
  getLocalCache, saveLocalCacheItem, deleteLocalCacheItem, saveLocalCacheCollection
} from './supabaseStorage';

function isSupabaseActive(): boolean {
  const config = getSupabaseConfig();
  return config.provider === 'supabase' && isSupabaseConfigured();
}

const INITIAL_ASSOCIATES: Associate[] = [
  {
    id: 'assoc-1',
    matricula: '00001',
    name: 'Mário Silva dos Santos',
    email: 'mario@email.com',
    cpf: '123.456.789-00',
    phone: '(11) 98765-4321',
    joiningDate: '2025-01-15',
    status: 'Ativo',
    address: 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP',
    monthlyFee: 10.00,
    financialStatus: 'Adimplente',
    debtAmount: 0,
    associationRole: 'Presidente'
  },
  {
    id: 'assoc-2',
    matricula: '00002',
    name: 'Ana Júlia de Oliveira',
    email: 'ana.julia@email.com',
    cpf: '234.567.890-11',
    phone: '(21) 99876-5432',
    joiningDate: '2025-02-10',
    status: 'Ativo',
    address: 'Rua Copacabana, 500 - Rio de Janeiro - RJ',
    monthlyFee: 10.00,
    financialStatus: 'Em Atenção',
    debtAmount: 0,
    associationRole: 'Tesoureira(o)'
  },
  {
    id: 'assoc-3',
    matricula: '00003',
    name: 'Carlos Henrique Souza',
    email: 'carlos.souza@email.com',
    cpf: '345.678.901-22',
    phone: '(31) 98888-7777',
    joiningDate: '2024-11-20',
    status: 'Ativo',
    address: 'Rua da Bahia, 120 - Lourdes, Belo Horizonte - MG',
    monthlyFee: 10.00,
    financialStatus: 'Zona de Perigo',
    debtAmount: 10.00
  },
  {
    id: 'assoc-4',
    matricula: '00004',
    name: 'Mariana Costa Ramos',
    email: 'mariana.costa@email.com',
    cpf: '456.789-012-33',
    phone: '(47) 99123-4567',
    joiningDate: '2025-03-01',
    status: 'Inativo',
    address: 'Rua XV de Novembro, 88 - Centro, Blumenau - SC',
    monthlyFee: 10.00,
    financialStatus: 'Inadimplente',
    debtAmount: 20.00
  },
  {
    id: 'assoc-5',
    matricula: '00005',
    name: 'Roberto Alencar Filho',
    email: 'roberto.alencar@email.com',
    cpf: '567.890.123-44',
    phone: '(81) 98712-3456',
    joiningDate: '2024-06-15',
    status: 'Ativo',
    address: 'Av. Boa Viagem, 2400 - Recife - PE',
    monthlyFee: 10.00,
    financialStatus: 'Adimplente',
    debtAmount: 0
  }
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'trans-1',
    description: 'Mensalidade - Mário Silva dos Santos',
    amount: 50.00,
    type: 'Entrada',
    date: '2026-06-15',
    time: '10:00:00',
    category: 'Mensalidade',
    associateId: 'assoc-1',
    paymentMethod: 'Pix'
  },
  {
    id: 'trans-2',
    description: 'Mensalidade - Ana Júlia de Oliveira',
    amount: 75.00,
    type: 'Entrada',
    date: '2026-06-14',
    time: '15:30:00',
    category: 'Mensalidade',
    associateId: 'assoc-2',
    paymentMethod: 'Cartão de Crédito'
  },
  {
    id: 'trans-3',
    description: 'Pagamento de Internet Banda Larga',
    amount: 149.90,
    type: 'Saída',
    date: '2026-06-10',
    time: '08:15:00',
    category: 'Infraestrutura',
    paymentMethod: 'Boleto'
  },
  {
    id: 'trans-4',
    description: 'Mensalidade - Carlos Henrique Souza',
    amount: 50.00,
    type: 'Entrada',
    date: '2026-06-08',
    time: '11:45:00',
    category: 'Mensalidade',
    associateId: 'assoc-3',
    paymentMethod: 'Pix'
  },
  {
    id: 'trans-5',
    description: 'Manutenção do Ar Condicionado',
    amount: 350.00,
    type: 'Saída',
    date: '2026-06-05',
    time: '14:00:00',
    category: 'Manutenção',
    paymentMethod: 'Pix'
  },
  {
    id: 'trans-6',
    description: 'Compra de Material de Escritório',
    amount: 85.50,
    type: 'Saída',
    date: '2026-06-02',
    time: '16:20:00',
    category: 'Suprimentos',
    paymentMethod: 'Dinheiro'
  },
  {
    id: 'trans-7',
    description: 'Doação Anônima p/ Evento Beneficente',
    amount: 500.00,
    type: 'Entrada',
    date: '2026-05-28',
    time: '19:10:00',
    category: 'Doação',
    paymentMethod: 'Pix'
  }
];

const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    title: 'Assembleia Geral Ordinária',
    content: 'Convocamos todos os associados ativos para a nossa Assembleia Geral que ocorrerá no dia 15 de Julho de 2026, às 19h, na sede social e via Zoom. Pauta principal: Aprovação das contas anuais e eleições de conselho.',
    date: '2026-06-25',
    targetGroup: 'Todos'
  },
  {
    id: 'ann-2',
    title: 'Recesso Administrativo de Férias',
    content: 'Informamos que a secretaria da associação estará em recesso administrativo entre os dias 1 e 10 de Julho de 2026. Atendimentos urgentes serão realizados via WhatsApp.',
    date: '2026-06-20',
    targetGroup: 'Todos'
  },
  {
    id: 'ann-3',
    title: 'Campanha de Recadastramento 2026',
    content: 'Por favor, atualize os seus dados de endereço e telefone diretamente na sua área do associado ou enviando um e-mail para contato@associacao.org.',
    date: '2026-06-18',
    targetGroup: 'Somente Ativos'
  }
];

function cleanForFirebase<T>(data: T): T {
  return JSON.parse(JSON.stringify(data, (_, value) => value === undefined ? null : value)) as T;
}

async function seedCollectionIfEmpty<T extends { id: string }>(
  collectionName: string,
  initialData: T[]
): Promise<T[]> {
  const localItems = getLocalCache<T>(collectionName, initialData);

  try {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    
    if (snapshot.empty) {
      for (const item of localItems) {
        const docRef = doc(db, collectionName, item.id);
        await setDoc(docRef, cleanForFirebase(item)).catch(() => {});
      }
      return localItems;
    }
    
    const fetched = snapshot.docs.map(doc => doc.data() as T);
    saveLocalCacheCollection(collectionName, fetched);
    return fetched;
  } catch (err) {
    console.warn(`Aviso de conexão com Firebase em '${collectionName}':`, err);
    return localItems;
  }
}

export async function getAssociates(): Promise<Associate[]> {
  if (isSupabaseActive()) {
    return getSupabaseAssociates(INITIAL_ASSOCIATES);
  }
  return seedCollectionIfEmpty<Associate>('associates', INITIAL_ASSOCIATES);
}

export async function getTransactions(): Promise<Transaction[]> {
  if (isSupabaseActive()) {
    return getSupabaseTransactions(INITIAL_TRANSACTIONS);
  }
  return seedCollectionIfEmpty<Transaction>('transactions', INITIAL_TRANSACTIONS);
}

export async function getAnnouncements(): Promise<Announcement[]> {
  if (isSupabaseActive()) {
    return getSupabaseAnnouncements(INITIAL_ANNOUNCEMENTS);
  }
  return seedCollectionIfEmpty<Announcement>('announcements', INITIAL_ANNOUNCEMENTS);
}

export async function addAssociate(assoc: Associate): Promise<void> {
  saveLocalCacheItem('associates', assoc.id, assoc);
  if (isSupabaseActive()) {
    return saveSupabaseRecord('associates', assoc.id, assoc);
  }
  try {
    const docRef = doc(db, 'associates', assoc.id);
    await setDoc(docRef, cleanForFirebase(assoc));
  } catch (err) {
    console.warn('Erro ao salvar associado no Firestore (salvo localmente):', err);
  }
}

export async function updateAssociate(assoc: Associate): Promise<void> {
  saveLocalCacheItem('associates', assoc.id, assoc);
  if (isSupabaseActive()) {
    return saveSupabaseRecord('associates', assoc.id, assoc);
  }
  try {
    const docRef = doc(db, 'associates', assoc.id);
    await setDoc(docRef, cleanForFirebase(assoc));
  } catch (err) {
    console.warn('Erro ao atualizar associado no Firestore (salvo localmente):', err);
  }
}

export async function deleteAssociate(id: string): Promise<void> {
  deleteLocalCacheItem('associates', id);
  if (isSupabaseActive()) {
    return deleteSupabaseRecord('associates', id);
  }
  try {
    const docRef = doc(db, 'associates', id);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Erro ao deletar associado no Firestore (deletado localmente):', err);
  }
}

const INITIAL_CLIENTS: Associate[] = [
  {
    id: 'client-1',
    name: 'Roberto de Souza Ramos',
    email: 'roberto.ramos@email.com',
    cpf: '987.654.321-11',
    phone: '(11) 97654-3210',
    joiningDate: '2025-06-01',
    status: 'Ativo',
    address: 'Rua Bela Cintra, 450 - Consolação, São Paulo - SP',
    monthlyFee: 0,
    financialStatus: 'Adimplente',
    debtAmount: 0,
    memberType: 'Cliente'
  }
];

export async function getClients(): Promise<Associate[]> {
  if (isSupabaseActive()) {
    return getSupabaseClients(INITIAL_CLIENTS);
  }
  return seedCollectionIfEmpty<Associate>('clients', INITIAL_CLIENTS);
}

export async function addClient(client: Associate): Promise<void> {
  saveLocalCacheItem('clients', client.id, client);
  if (isSupabaseActive()) {
    return saveSupabaseRecord('clients', client.id, client);
  }
  try {
    const docRef = doc(db, 'clients', client.id);
    await setDoc(docRef, cleanForFirebase(client));
  } catch (err) {
    console.warn('Erro ao salvar cliente no Firestore (salvo localmente):', err);
  }
}

export async function updateClient(client: Associate): Promise<void> {
  saveLocalCacheItem('clients', client.id, client);
  if (isSupabaseActive()) {
    return saveSupabaseRecord('clients', client.id, client);
  }
  try {
    const docRef = doc(db, 'clients', client.id);
    await setDoc(docRef, cleanForFirebase(client));
  } catch (err) {
    console.warn('Erro ao atualizar cliente no Firestore (salvo localmente):', err);
  }
}

export async function deleteClient(id: string): Promise<void> {
  deleteLocalCacheItem('clients', id);
  if (isSupabaseActive()) {
    return deleteSupabaseRecord('clients', id);
  }
  try {
    const docRef = doc(db, 'clients', id);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Erro ao deletar cliente no Firestore (deletado localmente):', err);
  }
}

export async function addTransaction(trans: Transaction): Promise<void> {
  saveLocalCacheItem('transactions', trans.id, trans);
  if (isSupabaseActive()) {
    return saveSupabaseRecord('transactions', trans.id, trans);
  }
  try {
    const docRef = doc(db, 'transactions', trans.id);
    await setDoc(docRef, cleanForFirebase(trans));
  } catch (err) {
    console.warn('Erro ao salvar transação no Firestore (salvo localmente):', err);
  }
}

export async function deleteTransaction(id: string): Promise<void> {
  deleteLocalCacheItem('transactions', id);
  if (isSupabaseActive()) {
    return deleteSupabaseRecord('transactions', id);
  }
  try {
    const docRef = doc(db, 'transactions', id);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Erro ao deletar transação no Firestore (deletado localmente):', err);
  }
}

export async function addAnnouncement(ann: Announcement): Promise<void> {
  saveLocalCacheItem('announcements', ann.id, ann);
  if (isSupabaseActive()) {
    return saveSupabaseRecord('announcements', ann.id, ann);
  }
  try {
    const docRef = doc(db, 'announcements', ann.id);
    await setDoc(docRef, cleanForFirebase(ann));
  } catch (err) {
    console.warn('Erro ao salvar comunicado no Firestore (salvo localmente):', err);
  }
}

export async function updateAnnouncement(ann: Announcement): Promise<void> {
  saveLocalCacheItem('announcements', ann.id, ann);
  if (isSupabaseActive()) {
    return saveSupabaseRecord('announcements', ann.id, ann);
  }
  try {
    const docRef = doc(db, 'announcements', ann.id);
    await setDoc(docRef, cleanForFirebase(ann));
  } catch (err) {
    console.warn('Erro ao atualizar comunicado no Firestore (salvo localmente):', err);
  }
}

export async function deleteAnnouncement(id: string): Promise<void> {
  deleteLocalCacheItem('announcements', id);
  if (isSupabaseActive()) {
    return deleteSupabaseRecord('announcements', id);
  }
  try {
    const docRef = doc(db, 'announcements', id);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Erro ao deletar comunicado no Firestore (deletado localmente):', err);
  }
}

export async function getReports(): Promise<ReportCopy[]> {
  if (isSupabaseActive()) {
    return getSupabaseReports();
  }
  try {
    const colRef = collection(db, 'reports');
    const snapshot = await getDocs(colRef);
    const fetched = snapshot.docs.map(doc => doc.data() as ReportCopy);
    if (fetched.length > 0) saveLocalCacheCollection('reports', fetched);
    return fetched.length > 0 ? fetched : getLocalCache<ReportCopy>('reports', []);
  } catch (err) {
    return getLocalCache<ReportCopy>('reports', []);
  }
}

export async function addReport(report: ReportCopy): Promise<void> {
  saveLocalCacheItem('reports', report.id, report);
  if (isSupabaseActive()) {
    return saveSupabaseRecord('reports', report.id, report);
  }
  try {
    const docRef = doc(db, 'reports', report.id);
    await setDoc(docRef, cleanForFirebase(report));
  } catch (err) {
    console.warn('Erro ao salvar relatório no Firestore (salvo localmente):', err);
  }
}

export async function deleteReport(id: string): Promise<void> {
  deleteLocalCacheItem('reports', id);
  if (isSupabaseActive()) {
    return deleteSupabaseRecord('reports', id);
  }
  try {
    const docRef = doc(db, 'reports', id);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Erro ao deletar relatório no Firestore (deletado localmente):', err);
  }
}

const INITIAL_ASSEMBLIES: Assembly[] = [
  {
    id: 'assembly-1',
    title: 'Assembleia Geral Extraordinária - Reforma da Sede',
    date: '2026-07-20',
    time: '19:00',
    location: 'Sede Social e Zoom',
    agenda: '1. Orçamento para reparos do teto;\n2. Votação de taxa extra temporária;\n3. Assuntos gerais.',
    createdAt: new Date().toISOString()
  }
];

const INITIAL_POLLS: Poll[] = [
  {
    id: 'poll-1',
    title: 'Decisão sobre cor da nova fachada',
    date: '2026-08-30',
    time: '20:00',
    startDate: '2026-08-01',
    startTime: '08:00',
    endDate: '2026-08-30',
    endTime: '20:00',
    location: 'Sede Virtual (Zoom)',
    agenda: 'Escolha da cor predominante para a pintura externa da associação.',
    options: [
      { id: 'opt-1', text: 'Azul Marinho com Branco', votes: 12 },
      { id: 'opt-2', text: 'Cinza Grafite com Detalhes Amarelos', votes: 15 },
      { id: 'opt-3', text: 'Verde Musgo Clássico', votes: 5 }
    ],
    status: 'Ativo',
    voters: [],
    createdAt: new Date().toISOString()
  }
];

export async function getAssemblies(): Promise<Assembly[]> {
  if (isSupabaseActive()) {
    return getSupabaseAssemblies(INITIAL_ASSEMBLIES);
  }
  return seedCollectionIfEmpty<Assembly>('assemblies', INITIAL_ASSEMBLIES);
}

export async function addAssembly(assembly: Assembly): Promise<void> {
  saveLocalCacheItem('assemblies', assembly.id, assembly);
  if (isSupabaseActive()) {
    return saveSupabaseRecord('assemblies', assembly.id, assembly);
  }
  try {
    const docRef = doc(db, 'assemblies', assembly.id);
    await setDoc(docRef, cleanForFirebase(assembly));
  } catch (err) {
    console.warn('Erro ao salvar assembleia no Firestore:', err);
  }
}

export async function deleteAssembly(id: string): Promise<void> {
  deleteLocalCacheItem('assemblies', id);
  if (isSupabaseActive()) {
    return deleteSupabaseRecord('assemblies', id);
  }
  try {
    const docRef = doc(db, 'assemblies', id);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Erro ao deletar assembleia no Firestore:', err);
  }
}

export async function getPolls(): Promise<Poll[]> {
  if (isSupabaseActive()) {
    return getSupabasePolls(INITIAL_POLLS);
  }
  return seedCollectionIfEmpty<Poll>('polls', INITIAL_POLLS);
}

export async function addPoll(poll: Poll): Promise<void> {
  saveLocalCacheItem('polls', poll.id, poll);
  if (isSupabaseActive()) {
    return saveSupabaseRecord('polls', poll.id, poll);
  }
  try {
    const docRef = doc(db, 'polls', poll.id);
    await setDoc(docRef, cleanForFirebase(poll));
  } catch (err) {
    console.warn('Erro ao salvar enquete no Firestore:', err);
  }
}

export async function updatePoll(poll: Poll): Promise<void> {
  saveLocalCacheItem('polls', poll.id, poll);
  if (isSupabaseActive()) {
    return saveSupabaseRecord('polls', poll.id, poll);
  }
  try {
    const docRef = doc(db, 'polls', poll.id);
    await setDoc(docRef, cleanForFirebase(poll));
  } catch (err) {
    console.warn('Erro ao atualizar enquete no Firestore:', err);
  }
}

export async function deletePoll(id: string): Promise<void> {
  deleteLocalCacheItem('polls', id);
  if (isSupabaseActive()) {
    return deleteSupabaseRecord('polls', id);
  }
  try {
    const docRef = doc(db, 'polls', id);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Erro ao deletar enquete no Firestore:', err);
  }
}

const INITIAL_CHARGES: Charge[] = [
  {
    id: 'charge-1',
    codeNumber: 'COB-2026-001',
    recipientId: 'assoc-1',
    recipientName: 'Mário Silva dos Santos',
    recipientType: 'Associado',
    recipientDocument: '123.456.789-00',
    recipientEmail: 'mario@email.com',
    recipientPhone: '(11) 98765-4321',
    title: 'Mensalidade Agosto/2026',
    description: 'Cobrança referente à mensalidade de associado do mês de agosto.',
    amount: 10.00,
    issueDate: '2026-08-01',
    dueDate: '2026-08-15',
    status: 'Pendente',
    paymentMethod: 'PIX',
    pixKey: '00.000.000/0001-00',
    createdAt: new Date().toISOString()
  },
  {
    id: 'charge-2',
    codeNumber: 'COB-2026-002',
    recipientId: 'assoc-3',
    recipientName: 'Carlos Henrique Souza',
    recipientType: 'Associado',
    recipientDocument: '345.678.901-22',
    recipientEmail: 'carlos.souza@email.com',
    recipientPhone: '(31) 98888-7777',
    title: 'Acordo de Regularização - Parcela 1/2',
    description: 'Primeira parcela referente à renegociação de débito pendente.',
    amount: 25.00,
    issueDate: '2026-08-01',
    dueDate: '2026-08-10',
    status: 'Pendente',
    paymentMethod: 'PIX',
    pixKey: '00.000.000/0001-00',
    createdAt: new Date().toISOString()
  }
];

export async function getCharges(): Promise<Charge[]> {
  if (isSupabaseActive()) {
    return getSupabaseCharges(INITIAL_CHARGES);
  }
  return seedCollectionIfEmpty<Charge>('charges', INITIAL_CHARGES);
}

export async function addCharge(charge: Charge): Promise<void> {
  saveLocalCacheItem('charges', charge.id, charge);
  if (isSupabaseActive()) {
    return saveSupabaseRecord('charges', charge.id, charge);
  }
  try {
    const docRef = doc(db, 'charges', charge.id);
    await setDoc(docRef, cleanForFirebase(charge));
  } catch (err) {
    console.warn('Erro ao salvar cobrança no Firestore:', err);
  }
}

export async function updateCharge(charge: Charge): Promise<void> {
  saveLocalCacheItem('charges', charge.id, charge);
  if (isSupabaseActive()) {
    return saveSupabaseRecord('charges', charge.id, charge);
  }
  try {
    const docRef = doc(db, 'charges', charge.id);
    await setDoc(docRef, cleanForFirebase(charge));
  } catch (err) {
    console.warn('Erro ao atualizar cobrança no Firestore:', err);
  }
}

export async function deleteCharge(id: string): Promise<void> {
  deleteLocalCacheItem('charges', id);
  if (isSupabaseActive()) {
    return deleteSupabaseRecord('charges', id);
  }
  try {
    const docRef = doc(db, 'charges', id);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Erro ao deletar cobrança no Firestore:', err);
  }
}

const DEFAULT_ENTITY_CONFIG: EntityConfig = {
  logo: UNION_LOGO_DATA_URL,
  name: 'UniOn - Sistema de Gestão',
  cnpj: '00.000.000/0001-00',
  acronym: 'UniOn',
  email: 'contato@union.org.br',
  phone: '(11) 99999-9999',
  address: 'Rua Principal, 123 - Centro, São Paulo - SP',
  monthlyFee: 10.00
};

export async function getEntityConfig(): Promise<EntityConfig> {
  if (isSupabaseActive()) {
    return getSupabaseEntityConfig(DEFAULT_ENTITY_CONFIG);
  }
  try {
    const docRef = doc(db, 'configs', 'entity');
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      const data = snapshot.data() as EntityConfig;
      if (!data.logo || data.logo === 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&q=80&w=200') {
        data.logo = UNION_LOGO_DATA_URL;
        await setDoc(docRef, cleanForFirebase(data)).catch(() => {});
      }
      localStorage.setItem('union_db_config_entity', JSON.stringify(data));
      return data;
    } else {
      await setDoc(docRef, cleanForFirebase(DEFAULT_ENTITY_CONFIG)).catch(() => {});
      localStorage.setItem('union_db_config_entity', JSON.stringify(DEFAULT_ENTITY_CONFIG));
      return DEFAULT_ENTITY_CONFIG;
    }
  } catch (err) {
    console.warn('Aviso de conexão para entity config:', err);
    try {
      const local = localStorage.getItem('union_db_config_entity');
      if (local) return JSON.parse(local);
    } catch (e) {}
    return DEFAULT_ENTITY_CONFIG;
  }
}

export async function updateEntityConfig(config: EntityConfig): Promise<void> {
  localStorage.setItem('union_db_config_entity', JSON.stringify(config));
  if (isSupabaseActive()) {
    return saveSupabaseRecord('configs', 'entity', config);
  }
  try {
    const docRef = doc(db, 'configs', 'entity');
    await setDoc(docRef, cleanForFirebase(config));
  } catch (err) {
    console.warn('Erro ao salvar entity config no Firestore:', err);
  }
}

const DEFAULT_ADMIN_CONFIG: AdminConfig = {
  email: '@gaeloj.com.br',
  password: '@Goj030824',
  isConfigured: true
};

export async function getAdminConfig(): Promise<AdminConfig | null> {
  if (isSupabaseActive()) {
    return getSupabaseAdminConfig();
  }
  try {
    const docRef = doc(db, 'configs', 'admin');
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      const data = snapshot.data() as AdminConfig;
      localStorage.setItem('union_db_config_admin', JSON.stringify(data));
      return data;
    } else {
      await setDoc(docRef, cleanForFirebase(DEFAULT_ADMIN_CONFIG)).catch(() => {});
      localStorage.setItem('union_db_config_admin', JSON.stringify(DEFAULT_ADMIN_CONFIG));
      return DEFAULT_ADMIN_CONFIG;
    }
  } catch (err) {
    console.warn('Aviso de conexão para admin config:', err);
    try {
      const local = localStorage.getItem('union_db_config_admin');
      if (local) return JSON.parse(local);
    } catch (e) {}
    return DEFAULT_ADMIN_CONFIG;
  }
}

export async function updateAdminConfig(config: AdminConfig): Promise<void> {
  localStorage.setItem('union_db_config_admin', JSON.stringify(config));
  if (isSupabaseActive()) {
    return saveSupabaseRecord('configs', 'admin', config);
  }
  try {
    const docRef = doc(db, 'configs', 'admin');
    await setDoc(docRef, cleanForFirebase(config));
  } catch (err) {
    console.warn('Erro ao salvar admin config no Firestore:', err);
  }
}

const INITIAL_COLLABORATORS: Collaborator[] = [
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

export async function getCollaborators(): Promise<Collaborator[]> {
  if (isSupabaseActive()) {
    return getLocalCache<Collaborator>('collaborators', INITIAL_COLLABORATORS);
  }
  return seedCollectionIfEmpty<Collaborator>('collaborators', INITIAL_COLLABORATORS);
}

export async function addCollaborator(colab: Collaborator): Promise<void> {
  saveLocalCacheItem('collaborators', colab.id, colab);
  if (isSupabaseActive()) {
    return saveSupabaseRecord('collaborators', colab.id, colab);
  }
  try {
    const docRef = doc(db, 'collaborators', colab.id);
    await setDoc(docRef, cleanForFirebase(colab));
  } catch (err) {
    console.warn('Erro ao salvar colaborador no Firestore:', err);
  }
}

export async function updateCollaborator(colab: Collaborator): Promise<void> {
  saveLocalCacheItem('collaborators', colab.id, colab);
  if (isSupabaseActive()) {
    return saveSupabaseRecord('collaborators', colab.id, colab);
  }
  try {
    const docRef = doc(db, 'collaborators', colab.id);
    await setDoc(docRef, cleanForFirebase(colab));
  } catch (err) {
    console.warn('Erro ao atualizar colaborador no Firestore:', err);
  }
}

export async function deleteCollaborator(id: string): Promise<void> {
  deleteLocalCacheItem('collaborators', id);
  if (isSupabaseActive()) {
    return deleteSupabaseRecord('collaborators', id);
  }
  try {
    const docRef = doc(db, 'collaborators', id);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Erro ao deletar colaborador no Firestore:', err);
  }
}

