import React, { useState, useEffect } from 'react';
import { Associate, Transaction, Announcement, ReportCopy, UserSession, Assembly, Poll } from './types';
import { 
  getAssociates, addAssociate, updateAssociate, deleteAssociate,
  getClients, addClient, updateClient, deleteClient,
  getTransactions, addTransaction, deleteTransaction,
  getAnnouncements, addAnnouncement, deleteAnnouncement,
  getReports, addReport, deleteReport,
  getAssemblies, addAssembly, deleteAssembly,
  getPolls, addPoll, updatePoll, deletePoll
} from './utils/firebaseStorage';
import { onSnapshot, collection } from 'firebase/firestore';
import { db } from './lib/firebase';

import LoginScreen from './components/LoginScreen';
import AdminDashboard from './components/AdminDashboard';
import AssociateDashboard from './components/AssociateDashboard';

export default function App() {
  const [associates, setAssociates] = useState<Associate[]>([]);
  const [clients, setClients] = useState<Associate[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [reports, setReports] = useState<ReportCopy[]>([]);
  const [assemblies, setAssemblies] = useState<Assembly[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  
  // Session State
  const [session, setSession] = useState<UserSession | null>(null);

  // Load initial data
  useEffect(() => {
    let unsubscribes: (() => void)[] = [];

    const loadData = async () => {
      try {
        const [fetchedAssocs, fetchedClients, fetchedTrans, fetchedAnns, fetchedReports, fetchedAssemblies, fetchedPolls] = await Promise.all([
          getAssociates(),
          getClients(),
          getTransactions(),
          getAnnouncements(),
          getReports(),
          getAssemblies(),
          getPolls()
        ]);
        
        // Upgrade existing associates with registration number (matricula) & login details
        const upgradedAssocs = await Promise.all(
          fetchedAssocs.map(async (assoc) => {
            let hasChanges = false;
            const updated = { ...assoc };
            if (!updated.matricula) {
              updated.matricula = Math.floor(100000 + Math.random() * 900000).toString();
              hasChanges = true;
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
          fetchedClients.map(async (client) => {
            let hasChanges = false;
            const updated = { ...client };
            if (!updated.matricula) {
              updated.matricula = Math.floor(100000 + Math.random() * 900000).toString();
              hasChanges = true;
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
        setTransactions(fetchedTrans);
        setAnnouncements(fetchedAnns);
        setReports(fetchedReports || []);
        setAssemblies(fetchedAssemblies || []);
        setPolls(fetchedPolls || []);

        // Real-time Poll sync
        const unsubPolls = onSnapshot(collection(db, 'polls'), (snapshot) => {
          const updatedPolls: Poll[] = [];
          snapshot.forEach((doc) => {
            updatedPolls.push({ id: doc.id, ...doc.data() } as Poll);
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
          updatedAnnouncements.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
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

        unsubscribes.push(unsubPolls, unsubAssemblies, unsubAnnouncements, unsubAssociates, unsubClients, unsubTransactions, unsubReports);
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

  const handleLogin = (role: 'admin' | 'associate', associateId?: string) => {
    const newSession: UserSession = { role, associateId };
    setSession(newSession);
    sessionStorage.setItem('assoc_session', JSON.stringify(newSession));
  };

  const handleLogout = () => {
    setSession(null);
    sessionStorage.removeItem('assoc_session');
  };

  // State modifiers - Associates
  const handleAddAssociate = async (newAssocData: Omit<Associate, 'id'>) => {
    const newAssoc: Associate = {
      ...newAssocData,
      id: `assoc-${Date.now()}`,
      matricula: newAssocData.matricula || Math.floor(100000 + Math.random() * 900000).toString(),
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
    const newClient: Associate = {
      ...newClientData,
      id: `client-${Date.now()}`,
      matricula: newClientData.matricula || Math.floor(100000 + Math.random() * 900000).toString(),
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
  const handleRecordPayment = async (associate: Associate, amount: number, paymentMethod: string, description?: string) => {
    const finalDescription = description || `Mensalidade - ${associate.name}`;
    await handleAddTransaction({
      description: finalDescription,
      amount,
      type: 'Entrada',
      date: new Date().toISOString().split('T')[0],
      category: 'Mensalidade',
      paymentMethod,
      associateId: associate.id
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

  // Rendering Routing
  if (!session) {
    return <LoginScreen associates={[...associates, ...clients]} onLogin={handleLogin} />;
  }

  if (session.role === 'admin') {
    return (
      <AdminDashboard
        associates={associates}
        clients={clients}
        transactions={transactions}
        announcements={announcements}
        reports={reports}
        assemblies={assemblies}
        polls={polls}
        onAddAssociate={handleAddAssociate}
        onEditAssociate={handleEditAssociate}
        onDeleteAssociate={handleDeleteAssociate}
        onAddClient={handleAddClient}
        onEditClient={handleEditClient}
        onDeleteClient={handleDeleteClient}
        onAddTransaction={handleAddTransaction}
        onDeleteTransaction={handleDeleteTransaction}
        onAddAnnouncement={handleAddAnnouncement}
        onDeleteAnnouncement={handleDeleteAnnouncement}
        onAddReport={handleAddReport}
        onDeleteReport={handleDeleteReport}
        onRecordPayment={handleRecordPayment}
        onAddAssembly={handleAddAssembly}
        onDeleteAssembly={handleDeleteAssembly}
        onAddPoll={handleAddPoll}
        onUpdatePoll={handleUpdatePoll}
        onDeletePoll={handleDeletePoll}
        onLogout={handleLogout}
      />
    );
  }

  // Associate portal routing
  if (session.role === 'associate' && session.associateId) {
    const loggedInAssociate = associates.find(a => a.id === session.associateId) || clients.find(c => c.id === session.associateId);
    if (loggedInAssociate) {
      const handlePortalUpdateAssociate = async (updatedMember: Associate) => {
        if (updatedMember.memberType === 'Cliente') {
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
