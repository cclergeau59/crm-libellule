import React, { useState, useMemo, useEffect } from 'react';
import { 
  LayoutDashboard, Users, KanbanSquare, Search, Plus, X, Building2, 
  Phone, Mail, Briefcase, TrendingUp, Award, Clock, ChevronRight, 
  MoreVertical, Target, LogIn, LogOut 
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, doc, writeBatch } from 'firebase/firestore';

// --- FIREBASE SETUP ---
const firebaseConfig = {
  apiKey: "AIzaSyArBrqqePsBEPY1udEW5j2YQLd3taQi93U",
  authDomain: "libellule-crm.firebaseapp.com",
  projectId: "libellule-crm",
  storageBucket: "libellule-crm.firebasestorage.app",
  messagingSenderId: "146063665167",
  appId: "1:146063665167:web:feeb984d3cb903f7a0db7a"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = "libellule-crm";

// --- MOCK DATA ---
const initialContacts = [
  { id: 1, name: 'Sophie Laurent', role: 'DRH', company: 'TechSolutions France', email: 's.laurent@techsolutions.fr', phone: '06 12 34 56 78', needType: 'Coaching' },
  { id: 2, name: 'Marc Dupont', role: 'CEO', company: 'Innovatech', email: 'm.dupont@innovatech.com', phone: '06 98 76 54 32', needType: 'Transformation Orga' },
  { id: 3, name: 'Julie Martin', role: 'Directrice Opérations', company: 'GreenEnergy', email: 'j.martin@greenenergy.fr', phone: '07 11 22 33 44', needType: 'Formation' },
  { id: 4, name: 'Thomas Bernard', role: 'Fondateur', company: 'StartUp Studio', email: 'thomas@startup-studio.io', phone: '06 55 44 33 22', needType: 'Cadrage Stratégique' },
  { id: 5, name: 'Élodie Dubois', role: 'Responsable Formation', company: 'Grand Retail', email: 'e.dubois@grandretail.com', phone: '07 88 99 00 11', needType: 'Formation' },
];

const initialPipeline = [
  { id: 101, company: 'Innovatech', type: 'Accompagnement Comex', value: 15000, status: 'diagnostic', contactName: 'Marc Dupont' },
  { id: 102, company: 'TechSolutions France', type: 'Coaching individuel (6 mois)', value: 4500, status: 'won', contactName: 'Sophie Laurent' },
  { id: 103, company: 'GreenEnergy', type: 'Formation Leadership', value: 8000, status: 'proposal', contactName: 'Julie Martin' },
  { id: 104, company: 'StartUp Studio', type: 'Atelier Vision & Valeurs', value: 2500, status: 'contact', contactName: 'Thomas Bernard' },
  { id: 105, company: 'Grand Retail', type: 'Parcours Managers (3 groupes)', value: 22000, status: 'diagnostic', contactName: 'Élodie Dubois' },
  { id: 106, company: 'Agence Alpha', type: 'Médiation d\'équipe', value: 3000, status: 'lost', contactName: 'Jean Lefebvre' },
  { id: 107, company: 'Financière Horizon', type: 'Design d\'organisation', value: 35000, status: 'won', contactName: 'Alice Tremblay' },
];

const KANBAN_COLUMNS = [
  { id: 'contact', title: 'Prise de contact', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  { id: 'diagnostic', title: 'Diagnostic / Cadrage', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'proposal', title: 'Proposition envoyée', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { id: 'won', title: 'Mission gagnée', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'lost', title: 'Perdu', color: 'bg-rose-50 text-rose-700 border-rose-200' },
];

export default function App() {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [contacts, setContacts] = useState([]);
  const [pipeline, setPipeline] = useState([]);

  // States for Contacts View
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', role: '', company: '', email: '', phone: '', needType: '' });

  // --- CUSTOM FONT (QUICKSAND) ---
  useEffect(() => {
    if (!document.getElementById('quicksand-font')) {
      const link = document.createElement('link');
      link.id = 'quicksand-font';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  // --- FIREBASE LOGIC ---
  useEffect(() => {
    if (!auth) {
      setContacts(initialContacts);
      setPipeline(initialPipeline);
      setIsAuthLoading(false);
      return;
    }

    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Erreur d'authentification:", error);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !db) return;

    const contactsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'contacts');
    const unsubContacts = onSnapshot(contactsRef, (snap) => {
      setContacts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => console.error("Erreur contacts:", error));

    const pipelineRef = collection(db, 'artifacts', appId, 'users', user.uid, 'pipeline');
    const unsubPipeline = onSnapshot(pipelineRef, (snap) => {
      setPipeline(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => console.error("Erreur pipeline:", error));

    return () => {
      unsubContacts();
      unsubPipeline();
    };
  }, [user]);

  const handleGoogleLogin = async () => {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Erreur de connexion Google:", error);
    }
  };

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      window.location.reload();
    } catch (error) {
      console.error("Erreur de déconnexion:", error);
    }
  };

  const seedDemoData = async () => {
    if (!user || !db) return;
    try {
      const batch = writeBatch(db);
      initialContacts.forEach(contact => {
        const { id, ...data } = contact;
        const newDocRef = doc(collection(db, 'artifacts', appId, 'users', user.uid, 'contacts'));
        batch.set(newDocRef, data);
      });
      initialPipeline.forEach(mission => {
        const { id, ...data } = mission;
        const newDocRef = doc(collection(db, 'artifacts', appId, 'users', user.uid, 'pipeline'));
        batch.set(newDocRef, data);
      });
      await batch.commit();
    } catch (error) {
      console.error("Erreur d'insertion des données de test:", error);
    }
  };

  // --- Computed Data ---
  const filteredContacts = useMemo(() => {
    return contacts.filter(c => 
      (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.company || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.needType || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [contacts, searchQuery]);

  // Dashboard KPIs
  const activeMissionsCount = pipeline.filter(p => p.status === 'won').length;
  const orgsAccompanied = new Set(pipeline.filter(p => p.status === 'won').map(p => p.company)).size;
  const pipelineEstimatedValue = pipeline
    .filter(p => ['contact', 'diagnostic', 'proposal'].includes(p.status))
    .reduce((acc, curr) => acc + curr.value, 0);

  // --- Handlers ---
  const handleAddContact = async (e) => {
    e.preventDefault();
    if (!newContact.name || !newContact.company) return;

    if (user && db) {
      try {
        const contactsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'contacts');
        await addDoc(contactsRef, { ...newContact, createdAt: new Date().toISOString() });
      } catch (error) {
        console.error("Erreur lors de l'ajout du contact:", error);
      }
    } else {
        setContacts([{ ...newContact, id: Date.now() }, ...contacts]);
    }
    
    setIsAddContactOpen(false);
    setNewContact({ name: '', role: '', company: '', email: '', phone: '', needType: '' });
  };

  const movePipelineItem = async (itemId, newStatus) => {
    if (user && db) {
      try {
        const itemRef = doc(db, 'artifacts', appId, 'users', user.uid, 'pipeline', itemId);
        await updateDoc(itemRef, { status: newStatus });
      } catch (error) {
        console.error("Erreur de mise à jour du statut:", error);
      }
    } else {
        setPipeline(pipeline.map(item => 
            item.id === itemId ? { ...item, status: newStatus } : item
        ));
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
  };

  // --- Renderers ---
  const renderDashboard = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Vue d'ensemble</h2>
          <p className="text-slate-500 mt-1">Bienvenue dans votre espace de gestion d'activité.</p>
        </div>
        {contacts.length === 0 && pipeline.length === 0 && user && (
          <button 
            onClick={seedDemoData} 
            className="px-4 py-2 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-xl hover:bg-indigo-100 transition-colors shadow-sm"
          >
            Générer les données d'exemple
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Organisations accompagnées</p>
            <h3 className="text-2xl font-bold text-slate-800">{orgsAccompanied}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Valeur estimée du pipeline</p>
            <h3 className="text-2xl font-bold text-slate-800">{formatCurrency(pipelineEstimatedValue)}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Missions actives (ce mois)</p>
            <h3 className="text-2xl font-bold text-slate-800">{activeMissionsCount}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Missions en cours</h3>
          <div className="space-y-4">
            {pipeline.filter(p => p.status === 'won').map(mission => (
              <div key={mission.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                    {mission.company.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{mission.company}</p>
                    <p className="text-xs text-slate-500">{mission.type}</p>
                  </div>
                </div>
                <span className="text-sm font-medium text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">Actif</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderContacts = () => (
    <div className="space-y-6 animate-in fade-in duration-500 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Contacts & Répertoire</h2>
          <p className="text-slate-500 mt-1">Gérez vos prospects et clients.</p>
        </div>
        <button 
          onClick={() => setIsAddContactOpen(true)}
          className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau contact</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="p-4 border-b border-slate-100 flex items-center">
          <div className="relative w-full max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Rechercher par nom, entreprise, besoin..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-xl transition-all text-sm outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-medium">Contact</th>
                <th className="p-4 font-medium">Organisation</th>
                <th className="p-4 font-medium">Coordonnées</th>
                <th className="p-4 font-medium">Type de besoin</th>
                <th className="p-4 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredContacts.map(contact => (
                <tr key={contact.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                        {contact.name && contact.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{contact.name}</p>
                        <p className="text-xs text-slate-500">{contact.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2 text-slate-600">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      <span className="text-sm">{contact.company}</span>
                    </div>
                  </td>
                  <td className="p-4 space-y-1">
                    <div className="flex items-center space-x-2 text-slate-600">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs">{contact.email}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-slate-600">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs">{contact.phone}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {contact.needType}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button className="text-slate-400 hover:text-indigo-600 transition-colors opacity-0 group-hover:opacity-100">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredContacts.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-500">
                    Aucun contact trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderPipeline = () => (
    <div className="space-y-6 animate-in fade-in duration-500 h-full flex flex-col">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Pipeline des Missions</h2>
        <p className="text-slate-500 mt-1">Suivi de vos opportunités commerciales et missions en cours.</p>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex space-x-6 min-w-max h-full">
          {KANBAN_COLUMNS.map(col => {
            const columnItems = pipeline.filter(p => p.status === col.id);
            const columnTotal = columnItems.reduce((acc, item) => acc + item.value, 0);

            return (
              <div key={col.id} className="w-80 flex flex-col max-h-full">
                <div className={`px-4 py-3 rounded-t-xl border-t border-x border-b-0 ${col.color} flex justify-between items-center`}>
                  <h3 className="font-semibold text-sm">{col.title}</h3>
                  <span className="text-xs font-bold px-2 py-1 rounded-full bg-white/60">{columnItems.length}</span>
                </div>
                
                <div className="bg-slate-100/50 p-3 rounded-b-xl border-x border-b border-slate-200 flex-1 overflow-y-auto space-y-3 min-h-[500px]">
                  {columnItems.map(item => (
                    <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:border-indigo-300 transition-all group">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-wider">
                          {item.company}
                        </span>
                        
                        <div className="relative group/menu">
                          <button className="text-slate-400 hover:text-slate-600">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          <div className="absolute right-0 top-full mt-1 bg-white border border-slate-100 shadow-lg rounded-lg py-1 w-40 hidden group-hover/menu:block z-10">
                            <div className="px-3 py-1 text-xs font-semibold text-slate-500 uppercase">Déplacer vers...</div>
                            {KANBAN_COLUMNS.filter(c => c.id !== item.status).map(c => (
                              <button 
                                key={c.id} 
                                onClick={() => movePipelineItem(item.id, c.id)}
                                className="w-full text-left px-4 py-1.5 text-sm hover:bg-slate-50 text-slate-700"
                              >
                                {c.title}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm mb-1">{item.type}</h4>
                      <div className="flex items-center text-xs text-slate-500 mb-3">
                        <Users className="w-3.5 h-3.5 mr-1" />
                        {item.contactName}
                      </div>
                      <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                        <span className="font-bold text-slate-700 text-sm">{formatCurrency(item.value)}</span>
                      </div>
                    </div>
                  ))}
                  
                  {columnItems.length === 0 && (
                    <div className="h-24 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-400 text-sm">
                      Vide
                    </div>
                  )}
                </div>
                <div className="mt-2 text-right text-xs font-semibold text-slate-500">
                  Total : {formatCurrency(columnTotal)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  if (isAuthLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50" style={{ fontFamily: "'Quicksand', sans-serif" }}>
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden" style={{ fontFamily: "'Quicksand', sans-serif" }}>
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col h-full shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <div className="flex items-center space-x-2 text-indigo-600">
            <Target className="w-7 h-7" />
            <span className="text-lg font-black tracking-tight">La Libellule <span className="text-slate-800">Optimiste</span></span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <button 
            onClick={() => setCurrentTab('dashboard')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${currentTab === 'dashboard' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Tableau de bord</span>
          </button>
          
          <button 
            onClick={() => setCurrentTab('contacts')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${currentTab === 'contacts' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <Users className="w-5 h-5" />
            <span>Contacts</span>
          </button>
          
          <button 
            onClick={() => setCurrentTab('pipeline')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${currentTab === 'pipeline' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <KanbanSquare className="w-5 h-5" />
            <span>Missions & Pipeline</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center space-x-3 px-2 mb-4">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-9 h-9 rounded-full shadow-sm" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center font-bold text-slate-600">
                {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            <div className="flex-1 truncate">
              <p className="text-sm font-semibold text-slate-800 truncate">{user?.displayName || 'Utilisateur'}</p>
              <p className="text-[10px] text-slate-500 truncate">{user?.email || 'Non connecté avec Google'}</p>
            </div>
          </div>
          
          {!user?.email ? (
            <button 
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center space-x-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium shadow-sm"
            >
              <LogIn className="w-4 h-4" />
              <span>Connexion Google</span>
            </button>
          ) : (
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              <span>Se déconnecter</span>
            </button>
          )}
        </div>
      </aside>

      {/* Mobile Bottom Navigation (Visible only on small screens) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around p-3 pb-safe z-50">
        <button 
          onClick={() => setCurrentTab('dashboard')}
          className={`flex flex-col items-center space-y-1 p-2 rounded-lg ${currentTab === 'dashboard' ? 'text-indigo-600' : 'text-slate-500'}`}
        >
          <LayoutDashboard className="w-6 h-6" />
          <span className="text-[10px] font-medium">Accueil</span>
        </button>
        <button 
          onClick={() => setCurrentTab('contacts')}
          className={`flex flex-col items-center space-y-1 p-2 rounded-lg ${currentTab === 'contacts' ? 'text-indigo-600' : 'text-slate-500'}`}
        >
          <Users className="w-6 h-6" />
          <span className="text-[10px] font-medium">Contacts</span>
        </button>
        <button 
          onClick={() => setCurrentTab('pipeline')}
          className={`flex flex-col items-center space-y-1 p-2 rounded-lg ${currentTab === 'pipeline' ? 'text-indigo-600' : 'text-slate-500'}`}
        >
          <KanbanSquare className="w-6 h-6" />
          <span className="text-[10px] font-medium">Pipeline</span>
        </button>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto mb-16 md:mb-0">
        <div className="max-w-6xl mx-auto h-full">
          {currentTab === 'dashboard' && renderDashboard()}
          {currentTab === 'contacts' && renderContacts()}
          {currentTab === 'pipeline' && renderPipeline()}
        </div>
      </main>

      {/* Add Contact Modal */}
      {isAddContactOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">Ajouter un contact</h3>
              <button 
                onClick={() => setIsAddContactOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddContact} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-sm font-medium text-slate-700">Nom complet <span className="text-rose-500">*</span></label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                    value={newContact.name}
                    onChange={e => setNewContact({...newContact, name: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-sm font-medium text-slate-700">Rôle / Poste</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                    value={newContact.role}
                    onChange={e => setNewContact({...newContact, role: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Organisation / Entreprise <span className="text-rose-500">*</span></label>
                <input 
                  required
                  type="text" 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                  value={newContact.company}
                  onChange={e => setNewContact({...newContact, company: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-sm font-medium text-slate-700">Email</label>
                  <input 
                    type="email" 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                    value={newContact.email}
                    onChange={e => setNewContact({...newContact, email: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-sm font-medium text-slate-700">Téléphone</label>
                  <input 
                    type="tel" 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                    value={newContact.phone}
                    onChange={e => setNewContact({...newContact, phone: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Type de besoin principal</label>
                <select 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm bg-white"
                  value={newContact.needType}
                  onChange={e => setNewContact({...newContact, needType: e.target.value})}
                >
                  <option value="">Sélectionner...</option>
                  <option value="Coaching">Coaching</option>
                  <option value="Formation">Formation</option>
                  <option value="Transformation Orga">Transformation Orga</option>
                  <option value="Cadrage Stratégique">Cadrage Stratégique</option>
                  <option value="Séminaire">Séminaire</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end space-x-3 border-t border-slate-100 mt-6">
                <button 
                  type="button"
                  onClick={() => setIsAddContactOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
                >
                  Enregistrer le contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}