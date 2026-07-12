import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Associate, Transaction, Announcement, ReportCopy, Assembly, Poll } from '../types';

const INITIAL_ASSOCIATES: Associate[] = [
  {
    id: 'assoc-1',
    name: 'Mário Silva dos Santos',
    email: 'mario@email.com',
    cpf: '123.456.789-00',
    phone: '(11) 98765-4321',
    joiningDate: '2025-01-15',
    status: 'Ativo',
    address: 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP',
    monthlyFee: 50.00,
    financialStatus: 'Adimplente',
    debtAmount: 0
  },
  {
    id: 'assoc-2',
    name: 'Ana Júlia de Oliveira',
    email: 'ana.julia@email.com',
    cpf: '234.567.890-11',
    phone: '(21) 99876-5432',
    joiningDate: '2025-02-10',
    status: 'Ativo',
    address: 'Rua Copacabana, 500 - Rio de Janeiro - RJ',
    monthlyFee: 75.00,
    financialStatus: 'Adimplente',
    debtAmount: 0
  },
  {
    id: 'assoc-3',
    name: 'Carlos Henrique Souza',
    email: 'carlos.souza@email.com',
    cpf: '345.678.901-22',
    phone: '(31) 98888-7777',
    joiningDate: '2024-11-20',
    status: 'Ativo',
    address: 'Rua da Bahia, 120 - Lourdes, Belo Horizonte - MG',
    monthlyFee: 50.00,
    financialStatus: 'Adimplente',
    debtAmount: 0
  },
  {
    id: 'assoc-4',
    name: 'Mariana Costa Ramos',
    email: 'mariana.costa@email.com',
    cpf: '456.789-012-33',
    phone: '(47) 99123-4567',
    joiningDate: '2025-03-01',
    status: 'Inativo',
    address: 'Rua XV de Novembro, 88 - Centro, Blumenau - SC',
    monthlyFee: 60.00,
    financialStatus: 'Inadimplente',
    debtAmount: 120.00
  },
  {
    id: 'assoc-5',
    name: 'Roberto Alencar Filho',
    email: 'roberto.alencar@email.com',
    cpf: '567.890.123-44',
    phone: '(81) 98712-3456',
    joiningDate: '2024-06-15',
    status: 'Ativo',
    address: 'Av. Boa Viagem, 2400 - Recife - PE',
    monthlyFee: 50.00,
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
  const colRef = collection(db, collectionName);
  const snapshot = await getDocs(colRef);
  
  if (snapshot.empty) {
    for (const item of initialData) {
      const docRef = doc(db, collectionName, item.id);
      await setDoc(docRef, cleanForFirebase(item));
    }
    return initialData;
  }
  
  return snapshot.docs.map(doc => doc.data() as T);
}

export async function getAssociates(): Promise<Associate[]> {
  return seedCollectionIfEmpty<Associate>('associates', INITIAL_ASSOCIATES);
}

export async function getTransactions(): Promise<Transaction[]> {
  return seedCollectionIfEmpty<Transaction>('transactions', INITIAL_TRANSACTIONS);
}

export async function getAnnouncements(): Promise<Announcement[]> {
  return seedCollectionIfEmpty<Announcement>('announcements', INITIAL_ANNOUNCEMENTS);
}

export async function addAssociate(assoc: Associate): Promise<void> {
  const docRef = doc(db, 'associates', assoc.id);
  await setDoc(docRef, cleanForFirebase(assoc));
}

export async function updateAssociate(assoc: Associate): Promise<void> {
  const docRef = doc(db, 'associates', assoc.id);
  await setDoc(docRef, cleanForFirebase(assoc));
}

export async function deleteAssociate(id: string): Promise<void> {
  const docRef = doc(db, 'associates', id);
  await deleteDoc(docRef);
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
  return seedCollectionIfEmpty<Associate>('clients', INITIAL_CLIENTS);
}

export async function addClient(client: Associate): Promise<void> {
  const docRef = doc(db, 'clients', client.id);
  await setDoc(docRef, cleanForFirebase(client));
}

export async function updateClient(client: Associate): Promise<void> {
  const docRef = doc(db, 'clients', client.id);
  await setDoc(docRef, cleanForFirebase(client));
}

export async function deleteClient(id: string): Promise<void> {
  const docRef = doc(db, 'clients', id);
  await deleteDoc(docRef);
}

export async function addTransaction(trans: Transaction): Promise<void> {
  const docRef = doc(db, 'transactions', trans.id);
  await setDoc(docRef, cleanForFirebase(trans));
}

export async function deleteTransaction(id: string): Promise<void> {
  const docRef = doc(db, 'transactions', id);
  await deleteDoc(docRef);
}

export async function addAnnouncement(ann: Announcement): Promise<void> {
  const docRef = doc(db, 'announcements', ann.id);
  await setDoc(docRef, cleanForFirebase(ann));
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const docRef = doc(db, 'announcements', id);
  await deleteDoc(docRef);
}

export async function getReports(): Promise<ReportCopy[]> {
  const colRef = collection(db, 'reports');
  const snapshot = await getDocs(colRef);
  return snapshot.docs.map(doc => doc.data() as ReportCopy);
}

export async function addReport(report: ReportCopy): Promise<void> {
  const docRef = doc(db, 'reports', report.id);
  await setDoc(docRef, cleanForFirebase(report));
}

export async function deleteReport(id: string): Promise<void> {
  const docRef = doc(db, 'reports', id);
  await deleteDoc(docRef);
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
    date: '2026-07-10',
    time: '20:00',
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
  return seedCollectionIfEmpty<Assembly>('assemblies', INITIAL_ASSEMBLIES);
}

export async function addAssembly(assembly: Assembly): Promise<void> {
  const docRef = doc(db, 'assemblies', assembly.id);
  await setDoc(docRef, cleanForFirebase(assembly));
}

export async function deleteAssembly(id: string): Promise<void> {
  const docRef = doc(db, 'assemblies', id);
  await deleteDoc(docRef);
}

export async function getPolls(): Promise<Poll[]> {
  return seedCollectionIfEmpty<Poll>('polls', INITIAL_POLLS);
}

export async function addPoll(poll: Poll): Promise<void> {
  const docRef = doc(db, 'polls', poll.id);
  await setDoc(docRef, cleanForFirebase(poll));
}

export async function updatePoll(poll: Poll): Promise<void> {
  const docRef = doc(db, 'polls', poll.id);
  await setDoc(docRef, cleanForFirebase(poll));
}

export async function deletePoll(id: string): Promise<void> {
  const docRef = doc(db, 'polls', id);
  await deleteDoc(docRef);
}
