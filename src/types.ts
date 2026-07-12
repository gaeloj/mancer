export interface Associate {
  id: string;
  name: string;
  email: string;
  cpf: string;
  phone: string;
  joiningDate: string;
  status: 'Ativo' | 'Inativo';
  address: string;
  monthlyFee: number;
  
  // New fields requested by user
  rgNumero?: string;
  rgOrgaoExpedidor?: string;
  rgDataExpedicao?: string;
  rgUf?: string;
  cinNumero?: string;
  nis?: string;
  caf?: string;
  birthDate?: string;
  filiation?: string;
  gender?: 'Masculino' | 'Feminino' | 'Outro';
  financialStatus: 'Adimplente' | 'Inadimplente';
  debtAmount?: number;
  documentStatus?: 'OK' | 'Com Pendência';
  maxInstallmentsAllowed?: number;
  installmentPlan?: {
    totalAmount: number;
    installmentsCount: number;
    installmentValue: number;
    paymentMethod: string;
    dateConfirmed: string;
    status: 'Em Análise' | 'Aprovado' | 'Reprovado' | 'Pago';
    installments?: {
      number: number;
      dueDate: string;
      value: number;
      status: 'Pendente' | 'Pago' | 'Em Análise' | 'Recusado';
      receiptFile?: string;
      receiptFileName?: string;
      paymentDate?: string;
      feedback?: string;
    }[];
  };
  certidaoTipo?: 'Nascimento' | 'Casamento' | 'Divórcio' | 'Óbito' | 'Nenhuma';
  certidaoModelo?: 'Novo' | 'Antigo';
  certidaoNumero?: string; // Matricula for new model, or Termo/Livro/Folha for old model
  
  pendingMonthlyReceipts?: {
    monthKey: string;
    monthName: string;
    amount: number;
    paymentMethod: string;
    receiptFile?: string;
    receiptFileName?: string;
    dateSubmitted: string;
  }[];

  // Login and Matricula fields
  matricula?: string;
  username?: string;
  password?: string;
  loginStatus?: 'Ativo' | 'Bloqueado' | 'Congelado';
  memberType?: 'Associado' | 'Cliente';
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'Entrada' | 'Saída';
  date: string;
  time?: string; // e.g. "14:30:00"
  category: string;
  associateId?: string; // Link to associate if it's a payment
  paymentMethod: string;
  document?: string; // CPF or CNPJ
  createdBy?: string; // E.g. "Administrador"
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  targetGroup: 'Todos' | 'Somente Ativos';
  createdAt?: string;
}

export interface ReportCopy {
  id: string;
  reportNumber: string;
  issuedAt: string; // e.g. "28/06/2026 20:15:59"
  issuedBy: string;
  createdAt?: string;
  filters: {
    type: string;
    category: string;
    search: string;
  };
  transactions: {
    id: string;
    description: string;
    amount: number;
    type: 'Entrada' | 'Saída';
    date: string;
    time?: string;
    category: string;
    document?: string;
    createdBy?: string;
  }[];
  totalInflow: number;
  totalOutflow: number;
  netBalance: number;
}

export interface UserSession {
  role: 'admin' | 'associate';
  associateId?: string; // If role is associate, this is their Associate ID
}

export interface Assembly {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  agenda: string; // pautas
  createdAt: string;
  type?: 'Assembleia' | 'Atividade'; // type of event
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface Poll {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  agenda: string; // pautas
  options: PollOption[];
  status: 'Ativo' | 'Encerrado';
  voters: string[]; // List of associateIds who have voted
  winnerOptionId?: string; // set once closed
  createdAt: string;
}
