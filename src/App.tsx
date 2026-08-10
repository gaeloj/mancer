import React, { useState, useEffect } from 'react';
import { Associate, Transaction, Announcement, ReportCopy, UserSession, Assembly, Poll, EntityConfig, AdminConfig, Collaborator, Charge } from './types';
import { 
  getAssociates, addAssociate, updateAssociate, deleteAssociate,
  getClients, addClient, updateClient, deleteClient,
  getCollaborators, addCollaborator, updateCollaborator, deleteCollaborator,
  getTransactions, addTransaction, deleteTransaction,
  getAnnouncements, addAnnouncement, updateAnnouncement, deleteAnnouncement,
  getReports, addReport, deleteReport,
  getAssemblies, addAssembly, deleteAssembly,
  getPolls, addPoll, updatePoll, deletePoll,
  getCharges, addCharge, updateCharge, deleteCharge,
  getEntityConfig, updateEntityConfig,
  getAdminConfig, updateAdminConfig
} from './utils/firebaseStorage';
import { formatMatricula, getNextMatriculaNumber } from './utils/formatters';
import { onSnapshot, collection, doc } from 'firebase/firestore';
import { db } from './lib/firebase';

import LoginScreen from './components/LoginScreen';
import AdminDashboard from './components/AdminDashboard';
import AssociateDashboard from './components/AssociateDashboard';

export default function App() {
  const [associates, setAssociates] = useState<Associate[]>([]);
  const [clients, setClients] = useState<Associate[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [reports, setReports] = useState<ReportCopy[]>([]);
  const [assemblies, setAssemblies] = useState<Assembly[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [entityConfig, setEntityConfig] = useState<EntityConfig | null>(null);
  const [adminConfig, setAdminConfig] = useState<AdminConfig | null>(null);
  
  // Session State
  const [session, setSession] = useState<UserSession | null>(null);

  // Load initial data
  useEffect(() => {
    let unsubscribes: (() => void)[] = [];

    const loadData = async () => {
      try {
        const [fetchedAssocs, fetchedClients, fetchedColabs, fetchedTrans, fetchedAnns, fetchedReports, fetchedAssemblies, fetchedPolls, fetchedCharges, fetchedConfig, fetchedAdminConfig] = await Promise.all([
          getAssociates(),
          getClients(),
          getCollaborators(),
          getTransactions(),
          getAnnouncements(),
          getReports(),
          getAssemblies(),
          getPolls(),
          getCharges(),
          getEntityConfig(),
          getAdminConfig()
        ]);
        
        // Upgrade existing associates with registration number (matricula) & login details
        const upgradedAssocs = await Promise.all(
          fetchedAssocs.map(async (assoc, idx) => {
            let hasChanges = false;
            const updated = { ...assoc };
            if (!updated.matricula || updated.matricula.length > 5) {
              updated.matricula = formatMatricula(idx + 1);
              hasChanges = true;
            } else {
              updated.matricula = formatMatricula(updated.matricula);
            }
            if (!updated.username) {
              updated.username = Math.floor(1000000 + Math.random() * 9000000).toString();
              hasChanges = true;
            }
            if (!updated.password) {
              updated.password = Math.floor(1000000 + Math.random() * 9000000).toString();
              hasChanges = true;
            }
            if (!updated.loginStatus) {
              updated.loginStatus = 'Ativo';
              hasChanges = true;
            }
            if (hasChanges) {
              try {
                await updateAssociate(updated);
              } catch (e) {
                console.error("Erro ao fazer upgrade de associado:", e);
              }
            }
            return updated;
          })
        );

        // Upgrade existing clients with registration number (matricula) & login details
        const upgradedClients = await Promise.all(
          fetchedClients.map(async (client, idx) => {
            let hasChanges = false;
            const updated = { ...client };
            if (!updated.matricula || updated.matricula.length > 5) {
              updated.matricula = formatMatricula(fetchedAssocs.length + idx + 1);
              hasChanges = true;
            } else {
              updated.matricula = formatMatricula(updated.matricula);
            }
            if (!updated.username) {
              updated.username = Math.floor(1000000 + Math.random() * 9000000).toString();
              hasChanges = true;
            }
            if (!updated.password) {
              updated.password = Math.floor(1000000 + Math.random() * 9000000).toString();
              hasChanges = true;
            }
            if (!updated.loginStatus) {
              updated.loginStatus = 'Ativo';
              hasChanges = true;
            }
            if (hasChanges) {
              try {
                await updateClient(updated);
              } catch (e) {
                console.error("Erro ao fazer upgrade de cliente:", e);
              }
            }
            return updated;
          })
        );

        setAssociates(upgradedAssocs);
        setClients(upgradedClients);
        setCollaborators(fetchedColabs || []);
        setTransactions(fetchedTrans);
        setAnnouncements(fetchedAnns);
        setReports(fetchedReports || []);
        setAssemblies(fetchedAssemblies || []);
        setPolls(fetchedPolls || []);
        setCharges(fetchedCharges || []);
        setEntityConfig(fetchedConfig);
        setAdminConfig(fetchedAdminConfig);

        // Real-time Charges sync
        const unsubCharges = onSnapshot(collection(db, 'charges'), (snapshot) => {
          const updatedCharges: Charge[] = [];
          snapshot.forEach((doc) => {
            updatedCharges.push({ id: doc.id, ...doc.data() } as Charge);
          });
          updatedCharges.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
          setCharges(updatedCharges);
        });

        // Real-time EntityConfig sync
        const unsubEntityConfig = onSnapshot(doc(db, 'configs', 'entity'), (docSnap) => {
          if (docSnap.exists()) {
            setEntityConfig(docSnap.data() as EntityConfig);
          }
        });

        // Real-time AdminConfig sync
        const unsubAdminConfig = onSnapshot(doc(db, 'configs', 'admin'), (docSnap) => {
          if (docSnap.exists()) {
            setAdminConfig(docSnap.data() as AdminConfig);
          } else {
            setAdminConfig(null);
          }
        });

        // Real-time Collaborators sync
        const unsubCollaborators = onSnapshot(collection(db, 'collaborators'), (snapshot) => {
          const updatedColabs: Collaborator[] = [];
          snapshot.forEach((doc) => {
            updatedColabs.push({ id: doc.id, ...doc.data() } as Collaborator);
          });
          setCollaborators(updatedColabs);
        });

        // Real-time Poll sync
        const unsubPolls = onSnapshot(collection(db, 'polls'), (snapshot) => {
          const updatedPolls: Poll[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data() as Poll;
            const cleanOptions = (data.options || []).map(opt => ({
              ...opt,
              votes: Number(opt.votes) || 0
            }));
            updatedPolls.push({ ...data, id: doc.id, options: cleanOptions });
          });
          updatedPolls.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
          setPolls(updatedPolls);
        });

        // Real-time Assembly sync
        const unsubAssemblies = onSnapshot(collection(db, 'assemblies'), (snapshot) => {
          const updatedAssemblies: Assembly[] = [];
          snapshot.forEach((doc) => {
            updatedAssemblies.push({ id: doc.id, ...doc.data() } as Assembly);
          });
          updatedAssemblies.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
          setAssemblies(updatedAssemblies);
        });

        // Real-time Announcement sync
        const unsubAnnouncements = onSnapshot(collection(db, 'announcements'), (snapshot) => {
          const updatedAnnouncements: Announcement[] = [];
          snapshot.forEach((doc) => {
            updatedAnnouncements.push({ id: doc.id, ...doc.data() } as Announcement);
          });
          updatedAnnouncements.sort((a, b) => {
            const timeA = new Date(a.createdAt || a.date).getTime();
            const timeB = new Date(b.createdAt || b.date).getTime();
            if (isNaN(timeA) || isNaN(timeB)) {
              return b.id.localeCompare(a.id);
            }
            return timeB - timeA;
          });
          setAnnouncements(updatedAnnouncements);
        });

        // Real-time Associate sync
        const unsubAssociates = onSnapshot(collection(db, 'associates'), (snapshot) => {
          const updatedAssociates: Associate[] = [];
          snapshot.forEach((doc) => {
            updatedAssociates.push({ id: doc.id, ...doc.data() } as Associate);
          });
          setAssociates(updatedAssociates);
        });

        // Real-time Client sync
        const unsubClients = onSnapshot(collection(db, 'clients'), (snapshot) => {
          const updatedClients: Associate[] = [];
          snapshot.forEach((doc) => {
            updatedClients.push({ id: doc.id, ...doc.data() } as Associate);
          });
          setClients(updatedClients);
        });

        // Real-time Transaction sync
        const unsubTransactions = onSnapshot(collection(db, 'transactions'), (snapshot) => {
          const updatedTransactions: Transaction[] = [];
          snapshot.forEach((doc) => {
            updatedTransactions.push({ id: doc.id, ...doc.data() } as Transaction);
          });
          updatedTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setTransactions(updatedTransactions);
        });

        // Real-time Report sync
        const unsubReports = onSnapshot(collection(db, 'reports'), (snapshot) => {
          const updatedReports: ReportCopy[] = [];
          snapshot.forEach((doc) => {
            updatedReports.push({ id: doc.id, ...doc.data() } as ReportCopy);
          });
          updatedReports.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
          setReports(updatedReports);
        });

        unsubscribes.push(unsubPolls, unsubAssemblies, unsubAnnouncements, unsubAssociates, unsubClients, unsubTransactions, unsubReports, unsubEntityConfig, unsubAdminConfig, unsubCollaborators);
      } catch (error) {
        console.error("Erro ao buscar dados do Firebase:", error);
      }
    };
    loadData();

    // Check for previous session in storage
    const savedSession = sessionStorage.getItem('assoc_session');
    if (savedSession) {
      setSession(JSON.parse(savedSession));
    }

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, []);

  const handleLogin = (role: 'admin' | 'associate' | 'collaborator', id?: string, collaboratorData?: any) => {
    const newSession: UserSession = { 
      role, 
      associateId: role === 'associate' ? id : undefined,
      collaboratorId: role === 'collaborator' ? id : undefined,
      collaboratorName: role === 'collaborator' ? (collaboratorData?.name || collaboratorData?.username || 'Colaborador') : undefined,
      collaboratorRole: role === 'collaborator' ? (collaboratorData?.accessLevel || collaboratorData?.role || 'Colaborador') : undefined
    };
    setSession(newSession);
    sessionStorage.setItem('assoc_session', JSON.stringify(newSession));
  };

  const handleLogout = () => {
    setSession(null);
    sessionStorage.removeItem('assoc_session');
  };

  // State modifiers - Collaborators
  const handleAddCollaborator = async (colab: Collaborator) => {
    const updated = [colab, ...collaborators];
    setCollaborators(updated);
    try {
      await addCollaborator(colab);
    } catch (error) {
      console.error("Erro ao salvar colaborador no Firebase:", error);
    }
  };

  const handleEditCollaborator = async (updatedColab: Collaborator) => {
    const updated = collaborators.map(c => c.id === updatedColab.id ? updatedColab : c);
    setCollaborators(updated);
    try {
      await updateCollaborator(updatedColab);
    } catch (error) {
      console.error("Erro ao atualizar colaborador no Firebase:", error);
    }
  };

  const handleDeleteCollaborator = async (id: string) => {
    const updated = collaborators.filter(c => c.id !== id);
    setCollaborators(updated);
    try {
      await deleteCollaborator(id);
    } catch (error) {
      console.error("Erro ao excluir colaborador no Firebase:", error);
    }
  };

  // State modifiers - Associates
  const handleAddAssociate = async (newAssocData: Omit<Associate, 'id'>) => {
    const nextMatricula = getNextMatriculaNumber([...associates, ...clients]);
    const newAssoc: Associate = {
      ...newAssocData,
      id: `assoc-${Date.now()}`,
      matricula: newAssocData.matricula ? formatMatricula(newAssocData.matricula) : nextMatricula,
      username: newAssocData.username || Math.floor(1000000 + Math.random() * 9000000).toString(),
      password: newAssocData.password || Math.floor(1000000 + Math.random() * 9000000).toString(),
      loginStatus: newAssocData.loginStatus || 'Ativo'
    };
    const updated = [newAssoc, ...associates];
    setAssociates(updated);
    try {
      await addAssociate(newAssoc);
    } catch (error) {
      console.error("Erro ao salvar associado no Firebase:", error);
    }
  };

  const handleEditAssociate = async (updatedAssoc: Associate) => {
    const updated = associates.map(a => a.id === updatedAssoc.id ? updatedAssoc : a);
    setAssociates(updated);
    try {
      await updateAssociate(updatedAssoc);
    } catch (error) {
      console.error("Erro ao atualizar associado no Firebase:", error);
    }
  };

  const handleDeleteAssociate = async (id: string) => {
    const updated = associates.filter(a => a.id !== id);
    setAssociates(updated);
    try {
      await deleteAssociate(id);
    } catch (error) {
      console.error("Erro ao excluir associado do Firebase:", error);
    }
  };

  // State modifiers - Clients
  const handleAddClient = async (newClientData: Omit<Associate, 'id'>) => {
    const nextMatricula = getNextMatriculaNumber([...associates, ...clients]);
    const newClient: Associate = {
      ...newClientData,
      id: `client-${Date.now()}`,
      matricula: newClientData.matricula ? formatMatricula(newClientData.matricula) : nextMatricula,
      username: newClientData.username || Math.floor(1000000 + Math.random() * 9000000).toString(),
      password: newClientData.password || Math.floor(1000000 + Math.random() * 9000000).toString(),
      loginStatus: newClientData.loginStatus || 'Ativo',
      memberType: 'Cliente'
    };
    const updated = [newClient, ...clients];
    setClients(updated);
    try {
      await addClient(newClient);
    } catch (error) {
      console.error("Erro ao salvar cliente no Firebase:", error);
    }
  };

  const handleEditClient = async (updatedClient: Associate) => {
    const updated = clients.map(c => c.id === updatedClient.id ? updatedClient : c);
    setClients(updated);
    try {
      await updateClient(updatedClient);
    } catch (error) {
      console.error("Erro ao atualizar cliente no Firebase:", error);
    }
  };

  const handleDeleteClient = async (id: string) => {
    const updated = clients.filter(c => c.id !== id);
    setClients(updated);
    try {
      await deleteClient(id);
    } catch (error) {
      console.error("Erro ao excluir cliente do Firebase:", error);
    }
  };

  // State modifiers - Contact info updated by Associate in their portal
  const handleUpdateContactInfo = async (id: string, phone: string, address: string, email: string) => {
    const target = associates.find(a => a.id === id);
    if (!target) return;
    const updatedAssoc = { ...target, phone, address, email };
    const updated = associates.map(a => a.id === id ? updatedAssoc : a);
    setAssociates(updated);
    try {
      await updateAssociate(updatedAssoc);
    } catch (error) {
      console.error("Erro ao atualizar informações de contato no Firebase:", error);
    }
  };

  // State modifiers - Transactions
  const handleAddTransaction = async (newTransData: Omit<Transaction, 'id'>) => {
    const newTrans: Transaction = {
      ...newTransData,
      id: `trans-${Date.now()}`
    };
    const updated = [newTrans, ...transactions];
    setTransactions(updated);
    try {
      await addTransaction(newTrans);
    } catch (error) {
      console.error("Erro ao registrar transação no Firebase:", error);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    const updated = transactions.filter(t => t.id !== id);
    setTransactions(updated);
    try {
      await deleteTransaction(id);
    } catch (error) {
      console.error("Erro ao excluir transação do Firebase:", error);
    }
  };

  // Quick Action: record payment of monthly fee from associate detail view
  const handleRecordPayment = async (associate: Associate, amount: number, paymentMethod: string, description?: string, customDate?: string) => {
    const finalDescription = description || `Mensalidade - ${associate.name}`;
    await handleAddTransaction({
      description: finalDescription,
      amount,
      type: 'Entrada',
      date: customDate || new Date().toISOString().split('T')[0],
      category: 'Mensalidade',
      paymentMethod,
      associateId: associate.id,
      document: associate.cpf,
      payerReceiverName: associate.name
    });
  };

  // State modifiers - Announcements
  const handleAddAnnouncement = async (newAnnData: Omit<Announcement, 'id'>) => {
    const newAnn: Announcement = {
      ...newAnnData,
      id: `ann-${Date.now()}`
    };
    const updated = [newAnn, ...announcements];
    setAnnouncements(updated);
    try {
      await addAnnouncement(newAnn);
    } catch (error) {
      console.error("Erro ao publicar comunicado no Firebase:", error);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    const updated = announcements.filter(a => a.id !== id);
    setAnnouncements(updated);
    try {
      await deleteAnnouncement(id);
    } catch (error) {
      console.error("Erro ao excluir comunicado do Firebase:", error);
    }
  };

  const handleEditAnnouncement = async (updatedAnn: Announcement) => {
    const updated = announcements.map(a => a.id === updatedAnn.id ? updatedAnn : a);
    setAnnouncements(updated);
    try {
      await updateAnnouncement(updatedAnn);
    } catch (error) {
      console.error("Erro ao atualizar comunicado no Firebase:", error);
    }
  };

  // State modifiers - Reports
  const handleAddReport = async (newReport: ReportCopy) => {
    const updated = [newReport, ...reports];
    setReports(updated);
    try {
      await addReport(newReport);
    } catch (error) {
      console.error("Erro ao salvar relatório no Firebase:", error);
    }
  };

  const handleDeleteReport = async (id: string) => {
    const updated = reports.filter(r => r.id !== id);
    setReports(updated);
    try {
      await deleteReport(id);
    } catch (error) {
      console.error("Erro ao excluir relatório do Firebase:", error);
    }
  };

  // State modifiers - Assemblies
  const handleAddAssembly = async (newAsData: Omit<Assembly, 'id' | 'createdAt'>) => {
    const newAssembly: Assembly = {
      ...newAsData,
      id: `assembly-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    const updated = [newAssembly, ...assemblies];
    setAssemblies(updated);
    try {
      await addAssembly(newAssembly);
    } catch (error) {
      console.error("Erro ao salvar assembleia no Firebase:", error);
    }
  };

  const handleDeleteAssembly = async (id: string) => {
    const updated = assemblies.filter(a => a.id !== id);
    setAssemblies(updated);
    try {
      await deleteAssembly(id);
    } catch (error) {
      console.error("Erro ao excluir assembleia no Firebase:", error);
    }
  };

  // State modifiers - Polls
  const handleAddPoll = async (newPollData: Omit<Poll, 'id' | 'createdAt'>) => {
    const newPoll: Poll = {
      ...newPollData,
      id: `poll-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    const updated = [newPoll, ...polls];
    setPolls(updated);
    try {
      await addPoll(newPoll);
    } catch (error) {
      console.error("Erro ao salvar votação no Firebase:", error);
    }
  };

  const handleUpdatePoll = async (updatedPoll: Poll) => {
    const updated = polls.map(p => p.id === updatedPoll.id ? updatedPoll : p);
    setPolls(updated);
    try {
      await updatePoll(updatedPoll);
    } catch (error) {
      console.error("Erro ao atualizar votação no Firebase:", error);
    }
  };

  const handleDeletePoll = async (id: string) => {
    const updated = polls.filter(p => p.id !== id);
    setPolls(updated);
    try {
      await deletePoll(id);
    } catch (error) {
      console.error("Erro ao excluir votação no Firebase:", error);
    }
  };

  // State modifiers - Charges
  const handleAddCharge = async (newCharge: Charge) => {
    const updated = [newCharge, ...charges];
    setCharges(updated);
    try {
      await addCharge(newCharge);
    } catch (error) {
      console.error("Erro ao salvar cobrança no Firebase:", error);
    }
  };

  const handleUpdateCharge = async (updatedCharge: Charge) => {
    const updated = charges.map(c => c.id === updatedCharge.id ? updatedCharge : c);
    setCharges(updated);
    try {
      await updateCharge(updatedCharge);
    } catch (error) {
      console.error("Erro ao atualizar cobrança no Firebase:", error);
    }
  };

  const handleDeleteCharge = async (id: string) => {
    const updated = charges.filter(c => c.id !== id);
    setCharges(updated);
    try {
      await deleteCharge(id);
    } catch (error) {
      console.error("Erro ao excluir cobrança no Firebase:", error);
    }
  };

  const handleUpdateEntityConfig = async (newConfig: EntityConfig) => {
    setEntityConfig(newConfig);
    try {
      await updateEntityConfig(newConfig);
    } catch (error) {
      console.error("Erro ao atualizar configuração de entidade no Firebase:", error);
    }
  };

  const handleUpdateAdminConfig = async (newConfig: AdminConfig) => {
    setAdminConfig(newConfig);
    try {
      await updateAdminConfig(newConfig);
    } catch (error) {
      console.error("Erro ao atualizar configuração do administrador no Firebase:", error);
    }
  };

  // Rendering Routing
  if (!session) {
    return (
      <LoginScreen 
        associates={[...associates, ...clients]} 
        collaborators={collaborators}
        onLogin={handleLogin} 
        entityConfig={entityConfig} 
        adminConfig={adminConfig}
        onUpdateAdminConfig={handleUpdateAdminConfig}
      />
    );
  }

  if (session.role === 'admin' || session.role === 'collaborator') {
    return (
      <AdminDashboard
        session={session}
        associates={associates}
        clients={clients}
        collaborators={collaborators}
        transactions={transactions}
        announcements={announcements}
        reports={reports}
        assemblies={assemblies}
        polls={polls}
        charges={charges}
        entityConfig={entityConfig}
        adminConfig={adminConfig}
        onUpdateAdminConfig={handleUpdateAdminConfig}
        onAddAssociate={handleAddAssociate}
        onEditAssociate={handleEditAssociate}
        onDeleteAssociate={handleDeleteAssociate}
        onAddClient={handleAddClient}
        onEditClient={handleEditClient}
        onDeleteClient={handleDeleteClient}
        onAddCollaborator={handleAddCollaborator}
        onEditCollaborator={handleEditCollaborator}
        onDeleteCollaborator={handleDeleteCollaborator}
        onAddTransaction={handleAddTransaction}
        onDeleteTransaction={handleDeleteTransaction}
        onAddAnnouncement={handleAddAnnouncement}
        onEditAnnouncement={handleEditAnnouncement}
        onDeleteAnnouncement={handleDeleteAnnouncement}
        onAddReport={handleAddReport}
        onDeleteReport={handleDeleteReport}
        onRecordPayment={handleRecordPayment}
        onAddAssembly={handleAddAssembly}
        onDeleteAssembly={handleDeleteAssembly}
        onAddPoll={handleAddPoll}
        onUpdatePoll={handleUpdatePoll}
        onDeletePoll={handleDeletePoll}
        onAddCharge={handleAddCharge}
        onUpdateCharge={handleUpdateCharge}
        onDeleteCharge={handleDeleteCharge}
        onUpdateEntityConfig={handleUpdateEntityConfig}
        onLogout={handleLogout}
      />
    );
  }

  // Associate portal routing
  if (session.role === 'associate' && session.associateId) {
    const loggedInAssociate = associates.find(a => a.id === session.associateId) || clients.find(c => c.id === session.associateId);
    if (loggedInAssociate) {
      const handlePortalUpdateAssociate = async (updatedMember: Associate) => {
        const isClient = clients.some(c => c.id === updatedMember.id) || updatedMember.memberType === 'Cliente';
        if (isClient) {
          await handleEditClient(updatedMember);
        } else {
          await handleEditAssociate(updatedMember);
        }
      };

      const handlePortalUpdateContactInfo = async (id: string, phone: string, address: string, email: string) => {
        const isClient = clients.some(c => c.id === id);
        if (isClient) {
          const target = clients.find(c => c.id === id);
          if (target) {
            const updated = { ...target, phone, address, email };
            await handleEditClient(updated);
          }
        } else {
          await handleUpdateContactInfo(id, phone, address, email);
        }
      };

      return (
        <AssociateDashboard
          associate={loggedInAssociate}
          transactions={transactions}
          announcements={announcements}
          assemblies={assemblies}
          polls={polls}
          entityConfig={entityConfig}
          onLogout={handleLogout}
          onUpdateContactInfo={handlePortalUpdateContactInfo}
          onUpdateAssociate={handlePortalUpdateAssociate}
          onUpdatePoll={handleUpdatePoll}
          onRecordPayment={handleRecordPayment}
        />
      );
    }
  }

  // Fallback in case associate was deleted while active session was open
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-6 text-center text-gray-200">
      <div className="max-w-md bg-[#111111] p-6 rounded-2xl shadow-xl border border-white/5">
        <h3 className="font-bold text-red-400 text-lg">Erro de Autenticação</h3>
        <p className="text-gray-400 text-sm mt-2">Este perfil de associado não existe mais ou foi excluído pelo administrador.</p>
        <button
          onClick={handleLogout}
          className="mt-4 px-4 py-2 bg-[#1a1a1a] hover:bg-white/5 border border-white/10 text-gray-300 hover:text-white text-xs font-bold rounded-lg transition-all cursor-pointer"
        >
          Voltar para Tela de Login
        </button>
      </div>
    </div>
  );
}
