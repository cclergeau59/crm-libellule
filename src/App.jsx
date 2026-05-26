import React, { useState, useMemo, useEffect } from 'react';
import { 
  LayoutDashboard, Users, KanbanSquare, Search, Plus, X, Building2, 
  Phone, Mail, Briefcase, TrendingUp, Award, Clock, ChevronRight, 
  MoreVertical, Target, LogIn, LogOut, CheckCircle2, AlertCircle, FileText, Trash2,
  Download, AlertTriangle, Check, MapPin, Sliders, BarChart3, HelpCircle
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, doc, writeBatch } from 'firebase/firestore';

// --- CONFIGURATION FIREBASE DU PROJET ---
const firebaseConfig = {
  apiKey: "AIzaSyArBrqqePsBEPY1udEW5j2YQLd3taQi93U",
  authDomain: "libellule-crm.firebaseapp.com",
  projectId: "libellule-crm",
  storageBucket: "libellule-crm.firebasestorage.app",
  messagingSenderId: "146063665167",
  appId: "1:146063665167:web:feeb984d3cb903f7a0db7a"
};

// --- INITIALISATION DE FIREBASE ---
let app, auth, db, appId;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  appId = "libellule-crm";
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

// --- ICÔNE LINKEDIN SVG AUTONOME ---
const Linkedin = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

// --- LISTE DES RÉGIONS DE FRANCE ---
const FRENCH_REGIONS = [
  "Auvergne-Rhône-Alpes",
  "Bourgogne-Franche-Comté",
  "Bretagne",
  "Centre-Val de Loire",
  "Corse",
  "Grand Est",
  "Hauts-de-France",
  "Île-de-France",
  "Normandie",
  "Nouvelle-Aquitaine",
  "Occitanie",
  "Pays de la Loire",
  "Provence-Alpes-Côte d'Azur",
  "Autre / International"
];

// --- DONNÉES DE DÉMONSTRATION INITIALES ---
const initialContacts = [
  { id: 1, name: 'Sophie Laurent', role: 'DRH', company: 'TechSolutions France', email: 's.laurent@techsolutions.fr', phone: '06 12 34 56 78', needType: 'Coaching', region: 'Île-de-France' },
  { id: 2, name: 'Marc Dupont', role: 'CEO', company: 'Innovatech', email: 'm.dupont@innovatech.com', phone: '06 98 76 54 32', needType: 'Transformation Orga', region: 'Auvergne-Rhône-Alpes' },
  { id: 3, name: 'Julie Martin', role: 'Directrice Opérations', company: 'GreenEnergy', email: 'j.martin@greenenergy.fr', phone: '07 11 22 33 44', needType: 'Formation', region: "Provence-Alpes-Côte d'Azur" },
  { id: 4, name: 'Thomas Bernard', role: 'Fondateur', company: 'StartUp Studio', email: 'thomas@startup-studio.io', phone: '06 55 44 33 22', needType: 'Cadrage Stratégique', region: 'Nouvelle-Aquitaine' },
  { id: 5, name: 'Élodie Dubois', role: 'Responsable Formation', company: 'Grand Retail', email: 'e.dubois@grandretail.com', phone: '07 88 99 00 11', needType: 'Formation', region: 'Hauts-de-France' },
];

const initialPipeline = [
  { id: 101, company: 'Innovatech', type: 'Accompagnement Comex', value: 15000, status: 'diagnostic', contactName: 'Marc Dupont' },
  { id: 102, company: 'TechSolutions France', type: 'Coaching individuel (6 mois)', value: 4500, status: 'won', contactName: 'Sophie Laurent' },
  { id: 103, company: 'GreenEnergy', type: 'Formation Leadership', value: 8000, status: 'proposal', contactName: 'Julie Martin' },
  { id: 104, company: 'StartUp Studio', type: 'Atelier Vision & Valeurs', value: 2500, status: 'contact', contactName: 'Thomas Bernard' },
  { id: 105, company: 'Grand Retail', type: 'Parcours Managers (3 groupes)', value: 22000, status: 'diagnostic', contactName: 'Élodie Dubois' },
];

// --- COLONNES KANBAN ADAPTÉES AUX COULEURS DE LA CHARTE ---
const KANBAN_COLUMNS = [
  { id: 'contact', title: 'Prise de contact', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  { id: 'diagnostic', title: 'Diagnostic / Cadrage', color: 'bg-[#96adc1]/10 text-[#05386b] border-[#96adc1]/30' },
  { id: 'proposal', title: 'Proposition envoyée', color: 'bg-[#96adc1]/35 text-[#05386b] border-[#96adc1]/50' },
  { id: 'won', title: 'Mission gagnée', color: 'bg-[#dde5d1] text-[#05386b] border-[#dde5d1]/80' },
  { id: 'lost', title: 'Perdu', color: 'bg-rose-50 text-rose-700 border-rose-200' },
];

export default function App() {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [contacts, setContacts] = useState([]);
  const [pipeline, setPipeline] = useState([]);

  // États pour les formulaires, filtres et confirmations
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [isAddMissionOpen, setIsAddMissionOpen] = useState(false);
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);
  
  const [newContact, setNewContact] = useState({ name: '', role: '', company: '', email: '', phone: '', needType: '', region: 'Île-de-France' });
  const [newMission, setNewMission] = useState({ company: '', type: '', value: '', status: 'contact', contactName: '' });

  // États pour les graphiques interactifs
  const [revenueGoal, setRevenueGoal] = useState(40000); 
  const [distributionMetric, setDistributionMetric] = useState('region'); 

  // États LinkedIn
  const [isImportLinkedInOpen, setIsImportLinkedInOpen] = useState(false);
  const [linkedInStep, setLinkedInStep] = useState(1); 
  const [parsedLinkedInContacts, setParsedLinkedInContacts] = useState([]);
  const [csvFileName, setCsvFileName] = useState('');

  // Notification d'état (remplace les alertes natives)
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // --- CHARGEMENT DE LA TYPOGRAPHIE QUICKSAND ---
  useEffect(() => {
    if (!document.getElementById('quicksand-font')) {
      const link = document.createElement('link');
      link.id = 'quicksand-font';
      link.rel = 'stylesheet';
      link.href = '[https://fonts.googleapis.com/css2?family=Quicksand:wght=400;500;600;700&display=swap](https://fonts.googleapis.com/css2?family=Quicksand:wght=400;500;600;700&display=swap)';
      document.head.appendChild(link);
    }
  }, []);

  // --- LOGIQUE AUTHENTIFICATION (REPLI ROBUSTE) ---
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
          try {
            await signInWithCustomToken(auth, __initial_auth_token);
          } catch (tokenError) {
            console.warn("Jeton personnalisé incompatible, repli sur l'authentification anonyme...");
            await signInAnonymously(auth);
          }
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Erreur d'authentification de repli:", error);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // --- CHARGEMENT DES DONNÉES TEMPS RÉEL (FIRESTORE) ---
  useEffect(() => {
    if (!user || !db) return;

    const contactsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'contacts');
    const unsubContacts = onSnapshot(contactsRef, (snap) => {
      if (snap.empty && contacts.length === 0) {
        setContacts([]);
      } else {
        setContacts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    }, (error) => console.error("Erreur écoute contacts:", error));

    const pipelineRef = collection(db, 'artifacts', appId, 'users', user.uid, 'pipeline');
    const unsubPipeline = onSnapshot(pipelineRef, (snap) => {
      if (snap.empty && pipeline.length === 0) {
        setPipeline([]);
      } else {
        setPipeline(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    }, (error) => console.error("Erreur écoute pipeline:", error));

    return () => {
      unsubContacts();
      unsubPipeline();
    };
  }, [user]);

  // --- ACTIONS ---
  const handleGoogleLogin = async () => {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      showNotification("Connexion Google réussie !");
    } catch (error) {
      console.error("Erreur de connexion Google:", error);
      showNotification("Échec de la connexion Google.", "error");
    }
  };

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      showNotification("Déconnecté avec succès.");
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
      showNotification("Données d'exemple chargées dans votre base Firestore !");
    } catch (error) {
      console.error("Erreur d'initialisation des données de test:", error);
      showNotification("Impossible de charger les données d'exemple.", "error");
    }
  };

  const clearAllData = async () => {
    if (user && db) {
      try {
        const batch = writeBatch(db);
        contacts.forEach(c => {
          const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'contacts', c.id);
          batch.delete(docRef);
        });
        pipeline.forEach(p => {
          const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'pipeline', p.id);
          batch.delete(docRef);
        });
        await batch.commit();
        setContacts([]);
        setPipeline([]);
        showNotification("Votre CRM a été entièrement vidé !");
      } catch (error) {
        console.error("Erreur lors de la réinitialisation de la base :", error);
        showNotification("Impossible de vider la base de données.", "error");
      }
    } else {
      setContacts([]);
      setPipeline([]);
      showNotification("Données locales réinitialisées.");
    }
    setIsConfirmClearOpen(false);
  };

  const handleAddContact = async (e) => {
    e.preventDefault();
    if (!newContact.name || !newContact.company) return;

    if (user && db) {
      try {
        const contactsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'contacts');
        await addDoc(contactsRef, { ...newContact, createdAt: new Date().toISOString() });
        showNotification("Contact ajouté avec succès !");
      } catch (error) {
        console.error("Erreur lors de l'ajout du contact:", error);
        showNotification("Erreur lors de l'ajout du contact.", "error");
      }
    } else {
      setContacts([{ ...newContact, id: Date.now() }, ...contacts]);
      showNotification("Contact ajouté localement.");
    }
    
    setIsAddContactOpen(false);
    setNewContact({ name: '', role: '', company: '', email: '', phone: '', needType: '', region: 'Île-de-France' });
  };

  const handleAddMission = async (e) => {
    e.preventDefault();
    if (!newMission.company || !newMission.type || !newMission.value) return;

    const missionData = {
      ...newMission,
      value: parseFloat(newMission.value) || 0,
      createdAt: new Date().toISOString()
    };

    if (user && db) {
      try {
        const pipelineRef = collection(db, 'artifacts', appId, 'users', user.uid, 'pipeline');
        await addDoc(pipelineRef, missionData);
        showNotification("Opportunité ajoutée au pipeline !");
      } catch (error) {
        console.error("Erreur lors de l'ajout de la mission:", error);
        showNotification("Erreur lors de l'ajout de la mission.", "error");
      }
    } else {
      setPipeline([{ ...missionData, id: Date.now() }, ...pipeline]);
      showNotification("Mission ajoutée localement.");
    }

    setIsAddMissionOpen(false);
    setNewMission({ company: '', type: '', value: '', status: 'contact', contactName: '' });
  };

  const movePipelineItem = async (itemId, newStatus) => {
    if (user && db) {
      try {
        const itemRef = doc(db, 'artifacts', appId, 'users', user.uid, 'pipeline', itemId);
        await updateDoc(itemRef, { status: newStatus });
        showNotification("Statut de la mission mis à jour !");
      } catch (error) {
        console.error("Erreur de mise à jour du statut:", error);
      }
    } else {
      setPipeline(pipeline.map(item => 
        item.id === itemId ? { ...item, status: newStatus } : item
      ));
    }
  };

  // --- MODULE D'IMPORTATION DE CONTACTS LINKEDIN CORRIGÉ ET ROBUSTE ---
  const handleLinkedInFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCsvFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const contactsParsed = parseLinkedInCSV(text);
      if (contactsParsed.length === 0) {
        showNotification("Aucun contact valide n'a pu être extrait. Vérifiez le format du fichier.", "error");
      } else {
        setParsedLinkedInContacts(contactsParsed);
        setLinkedInStep(2);
      }
    };
    reader.readAsText(file, "UTF-8");
  };

  const parseLinkedInCSV = (text) => {
    // 1. Suppression du Byte Order Mark (BOM) invisible d'Excel
    const cleanText = text.replace(/^\uFEFF/, '');
    const lines = cleanText.split(/\r?\n/);
    if (lines.length < 2) return [];

    // 2. Détection dynamique du séparateur (virgule ou point-virgule)
    const firstLine = lines[0];
    const commaCount = (firstLine.match(/,/g) || []).length;
    const semiCount = (firstLine.match(/;/g) || []).length;
    const separator = semiCount > commaCount ? ';' : ',';

    // 3. Découpeur de ligne CSV robuste qui gère les guillemets et préserve les espaces
    const splitCSVLine = (line, sep) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === sep && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      // On retire les guillemets externes
      return result.map(v => v.replace(/^"|"$/g, '').trim());
    };

    // Lecture des en-têtes
    const headers = splitCSVLine(lines[0], separator).map(h => h.toLowerCase());
    
    const firstNameIdx = headers.findIndex(h => h.includes('first name') || h.includes('prénom') || h.includes('prenom'));
    const lastNameIdx = headers.findIndex(h => h.includes('last name') || h.includes('nom'));
    const companyIdx = headers.findIndex(h => h.includes('company') || h.includes('entreprise') || h.includes('société') || h.includes('societe'));
    const positionIdx = headers.findIndex(h => h.includes('position') || h.includes('poste') || h.includes('rôle') || h.includes('role'));
    const emailIdx = headers.findIndex(h => h.includes('email') || h.includes('courriel') || h.includes('adresse e-mail'));

    // S'assurer qu'au moins un champ d'identification est présent
    if (firstNameIdx === -1 && lastNameIdx === -1) {
      console.error("En-têtes Prénom/Nom manquantes:", headers);
      return [];
    }

    const list = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = splitCSVLine(line, separator);
      if (values.length === 0) continue;

      const fName = firstNameIdx !== -1 && firstNameIdx < values.length ? values[firstNameIdx] : '';
      const lName = lastNameIdx !== -1 && lastNameIdx < values.length ? values[lastNameIdx] : '';
      const comp = companyIdx !== -1 && companyIdx < values.length ? values[companyIdx] : '';
      const pos = positionIdx !== -1 && positionIdx < values.length ? values[positionIdx] : '';
      const mail = emailIdx !== -1 && emailIdx < values.length ? values[emailIdx] : '';

      const fullName = `${fName} ${lName}`.trim();
      // On ignore la ligne d'en-tête accidentelle et les lignes vides
      if (fullName && fullName.toLowerCase() !== 'first name last name' && fullName.toLowerCase() !== 'prénom nom') {
        list.push({
          tempId: `li-${i}`,
          name: fullName,
          role: pos || 'Contact LinkedIn',
          company: comp || 'Individuel',
          email: mail || '',
          phone: '',
          needType: 'Coaching',
          region: 'Île-de-France',
          selected: true
        });
      }
    }
    return list;
  };

  const toggleLinkedInContactSelect = (tempId) => {
    setParsedLinkedInContacts(prev => prev.map(c => 
      c.tempId === tempId ? { ...c, selected: !c.selected } : c
    ));
  };

  const toggleAllLinkedInContacts = (isSelected) => {
    setParsedLinkedInContacts(prev => prev.map(c => ({ ...c, selected: isSelected })));
  };

  const executeLinkedInImport = async () => {
    const toImport = parsedLinkedInContacts.filter(c => c.selected);
    if (toImport.length === 0) {
      showNotification("Aucun contact sélectionné pour l'import.", "error");
      return;
    }

    setLinkedInStep(3);

    if (user && db) {
      try {
        const batch = writeBatch(db);
        const contactsColRef = collection(db, 'artifacts', appId, 'users', user.uid, 'contacts');
        
        toImport.forEach(contact => {
          const { tempId, selected, ...data } = contact;
          const newDocRef = doc(contactsColRef);
          batch.set(newDocRef, {
            ...data,
            createdAt: new Date().toISOString(),
            needType: 'LinkedIn Import'
          });
        });

        await batch.commit();
        showNotification(`${toImport.length} contacts importés avec succès sur Firestore !`);
      } catch (error) {
        console.error("Erreur de sauvegarde de l'import:", error);
        showNotification("L'écriture sur la base de données a échoué.", "error");
      }
    } else {
      const mapped = toImport.map((c, idx) => ({
        id: Date.now() + idx,
        name: c.name,
        role: c.role,
        company: c.company,
        email: c.email,
        phone: '',
        region: c.region,
        needType: 'LinkedIn Import'
      }));
      setContacts(prev => [...mapped, ...prev]);
      showNotification(`${toImport.length} contacts ajoutés localement.`);
    }

    setIsImportLinkedInOpen(false);
    setLinkedInStep(1);
    setParsedLinkedInContacts([]);
    setCsvFileName('');
  };

  // --- CALCULS ET STATISTIQUES AVANCÉES ---
  const filteredContacts = useMemo(() => {
    return contacts.filter(c => {
      const matchesSearch = 
        (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.company || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.needType || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRegion = filterRegion === '' || c.region === filterRegion;

      return matchesSearch && matchesRegion;
    });
  }, [contacts, searchQuery, filterRegion]);

  // Valeurs financières
  const wonMissions = useMemo(() => pipeline.filter(p => p.status === 'won'), [pipeline]);
  const activePipelineMissions = useMemo(() => pipeline.filter(p => ['contact', 'diagnostic', 'proposal'].includes(p.status)), [pipeline]);

  const totalWonValue = useMemo(() => wonMissions.reduce((acc, curr) => acc + curr.value, 0), [wonMissions]);
  const activeMissionsCount = wonMissions.length;
  const orgsAccompanied = useMemo(() => new Set(wonMissions.map(p => p.company)).size, [wonMissions]);
  const pipelineEstimatedValue = useMemo(() => activePipelineMissions.reduce((acc, curr) => acc + curr.value, 0), [activePipelineMissions]);

  // Calcul du pourcentage de l'objectif de chiffre d'affaires
  const goalPercentage = useMemo(() => {
    if (revenueGoal <= 0) return 0;
    return Math.min(Math.round((totalWonValue / revenueGoal) * 100), 100);
  }, [totalWonValue, revenueGoal]);

  // Distribution pour le Graphique Dynamique
  const distributionData = useMemo(() => {
    const counts = {};
    if (distributionMetric === 'region') {
      contacts.forEach(c => {
        const key = c.region || 'Île-de-France';
        counts[key] = (counts[key] || 0) + 1;
      });
    } else {
      contacts.forEach(c => {
        const key = c.needType || 'Autre';
        counts[key] = (counts[key] || 0) + 1;
      });
    }

    return Object.entries(counts)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); 
  }, [contacts, distributionMetric]);

  // Métrique maximale pour calibrer la largeur des barres du graphique
  const maxDistributionValue = useMemo(() => {
    if (distributionData.length === 0) return 1;
    return Math.max(...distributionData.map(d => d.value));
  }, [distributionData]);

  // Taux de conversion de l'entonnoir (Pipeline Funnel)
  const funnelData = useMemo(() => {
    const counts = { contact: 0, diagnostic: 0, proposal: 0, won: 0 };
    pipeline.forEach(p => {
      if (counts[p.status] !== undefined) {
        counts[p.status] += 1;
      }
    });

    const total = pipeline.length || 1;
    return [
      { step: 'Prise de contact', count: counts.contact, pct: Math.round((counts.contact / total) * 100), color: 'bg-[#96adc1]' },
      { step: 'Diagnostic / Cadrage', count: counts.diagnostic, pct: Math.round((counts.diagnostic / total) * 100), color: 'bg-[#96adc1]/80' },
      { step: 'Proposition envoyée', count: counts.proposal, pct: Math.round((counts.proposal / total) * 100), color: 'bg-[#05386b]/40' },
      { step: 'Mission gagnée', count: counts.won, pct: Math.round((counts.won / total) * 100), color: 'bg-[#dde5d1]' }
    ];
  }, [pipeline]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
  };

  // --- COMPOSANTS DE VUE ---
  const renderDashboard = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Tableau de bord</h2>
          <p className="text-slate-500 mt-1">Vos indicateurs de performance et analyses de marché.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {contacts.length === 0 && pipeline.length === 0 && user && (
            <button 
              onClick={seedDemoData} 
              className="px-5 py-2.5 bg-[#dde5d1] text-[#05386b] hover:bg-[#dde5d1]/80 transition-all font-semibold rounded-xl text-sm shadow-sm flex items-center gap-2"
            >
              <FileText className="w-4 h-4 text-[#05386b]" />
              <span>Générer des données de test</span>
            </button>
          )}
          {(contacts.length > 0 || pipeline.length > 0) && (
            <button 
              onClick={() => setIsConfirmClearOpen(true)} 
              className="px-5 py-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100/70 border border-rose-200 transition-all font-semibold rounded-xl text-sm shadow-sm flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4 text-rose-700" />
              <span>Vider le CRM</span>
            </button>
          )}
        </div>
      </div>

      {/* Kpi Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-[#dde5d1] text-[#05386b] rounded-xl">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Clients Accompagnés</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-0.5">{orgsAccompanied}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-[#96adc1]/20 text-[#05386b] rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Pipeline en cours</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-0.5">{formatCurrency(pipelineEstimatedValue)}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-[#05386b]/10 text-[#05386b] rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Missions Gagnées</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-0.5">{activeMissionsCount}</h3>
          </div>
        </div>
      </div>

      {/* ZONE GRAPHIQUES ET ANALYSES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Graphique 1 : Objectif Financier */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-1">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-[#05386b]" />
                Objectif de Chiffre d'Affaires
              </h3>
            </div>
            <p className="text-xs text-slate-400">Ajustez votre objectif mensuel en temps réel.</p>
          </div>

          <div className="flex flex-col items-center justify-center my-6">
            <div className="relative w-36 h-36">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" className="stroke-slate-100" strokeWidth="8" fill="transparent" />
                <circle 
                  cx="50" cy="50" r="40" 
                  stroke={goalPercentage >= 100 ? '#dde5d1' : '#05386b'} 
                  strokeWidth="8" 
                  fill="transparent" 
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (251.2 * goalPercentage) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-500 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-extrabold text-[#05386b]">{goalPercentage}%</span>
                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Atteint</span>
              </div>
            </div>
            
            <div className="text-center mt-3">
              <p className="text-xs text-slate-500">Cumulé : <strong className="text-slate-800">{formatCurrency(totalWonValue)}</strong></p>
            </div>
          </div>

          <div className="space-y-2 border-t border-slate-50 pt-4">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-500">Objectif mensuel :</span>
              <span className="text-[#05386b] font-bold text-sm">{formatCurrency(revenueGoal)}</span>
            </div>
            <input 
              type="range" 
              min="5000" 
              max="100000" 
              step="5000" 
              value={revenueGoal} 
              onChange={(e) => setRevenueGoal(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#05386b]"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-bold">
              <span>5 k€</span>
              <span>50 k€</span>
              <span>100 k€</span>
            </div>
          </div>
        </div>

        {/* Graphique 2 : Distribution interactive */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 lg:col-span-2 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-[#05386b]" />
                Analyse de Distribution
              </h3>
              <p className="text-xs text-slate-400">Top 5 de la répartition de vos contacts.</p>
            </div>
            
            <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-bold shrink-0 self-start">
              <button 
                onClick={() => setDistributionMetric('region')}
                className={`px-3 py-1.5 rounded-md transition-all ${distributionMetric === 'region' ? 'bg-white text-[#05386b] shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Par Région
              </button>
              <button 
                onClick={() => setDistributionMetric('needType')}
                className={`px-3 py-1.5 rounded-md transition-all ${distributionMetric === 'needType' ? 'bg-white text-[#05386b] shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Par Besoin
              </button>
            </div>
          </div>

          <div className="space-y-4 flex-1 flex flex-col justify-center">
            {distributionData.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm">
                Aucune donnée à analyser. Créez des contacts pour voir le graphique se mettre à jour !
              </div>
            ) : (
              distributionData.map((item, index) => {
                const percentage = Math.max(5, (item.value / maxDistributionValue) * 100);
                return (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span className="truncate max-w-[200px] sm:max-w-xs">{item.label}</span>
                      <span className="font-bold text-[#05386b]">{item.value} {item.value > 1 ? 'contacts' : 'contact'}</span>
                    </div>
                    <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100/50">
                      <div 
                        className="h-full bg-gradient-to-r from-[#96adc1]/60 to-[#05386b]/80 rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ZONE PIPELINE ENTONNOIR ET OPPORTUNITÉS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Entonnoir commercial visuel (Funnel) */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800 mb-1 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-[#05386b]" />
              Entonnoir de Conversion
            </h3>
            <p className="text-xs text-slate-400">Rapport de répartition des étapes.</p>
          </div>

          <div className="space-y-3 my-4">
            {funnelData.map((step, idx) => (
              <div key={idx} className="flex items-center space-x-3">
                <div className="w-24 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                  {step.step}
                </div>
                <div className="flex-1 bg-slate-50 rounded-lg p-2 flex items-center justify-between border border-slate-100 hover:border-slate-200 transition-colors">
                  <div className="flex items-center space-x-2 w-full">
                    <div className={`h-4 ${step.color} rounded`} style={{ width: `${Math.max(10, step.pct)}%` }}></div>
                    <span className="text-xs font-bold text-slate-700">{step.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dernières opportunités */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 lg:col-span-2">
          <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#05386b]"></span>
            Dernières opportunités qualifiées
          </h3>
          <div className="space-y-3">
            {pipeline.filter(p => ['contact', 'diagnostic', 'proposal'].includes(p.status)).length === 0 ? (
              <p className="text-slate-400 text-sm py-4 text-center">Aucune opportunité dans le tunnel de vente.</p>
            ) : (
              pipeline.filter(p => ['contact', 'diagnostic', 'proposal'].includes(p.status)).slice(0, 4).map(mission => (
                <div key={mission.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{mission.company}</p>
                    <p className="text-xs text-slate-500">{mission.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#05386b]">{formatCurrency(mission.value)}</p>
                    <span className="text-[10px] uppercase font-bold text-[#96adc1]">
                      {KANBAN_COLUMNS.find(c => c.id === mission.status)?.title}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );

  const renderContacts = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Répertoire de Contacts</h2>
          <p className="text-slate-500 mt-1">Vos fiches clients, partenaires et opportunités géolocalisées.</p>
        </div>
        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button 
            onClick={() => setIsImportLinkedInOpen(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center space-x-2 bg-white border-2 border-[#05386b] text-[#05386b] hover:bg-[#05386b]/5 px-4 py-2.5 rounded-xl transition-all font-semibold text-sm"
          >
            <Linkedin className="w-4 h-4 text-[#05386b]" />
            <span>Importer LinkedIn</span>
          </button>
          
          <button 
            onClick={() => setIsAddContactOpen(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center space-x-2 bg-[#05386b] hover:bg-[#05386b]/90 text-white px-5 py-2.5 rounded-xl transition-all shadow-sm font-semibold text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Créer un contact</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        
        {/* Barre de Recherche et de Filtrage */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/30 flex flex-col md:flex-row gap-4">
          
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Rechercher par nom, entreprise, besoin..." 
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 focus:border-[#05386b] focus:ring-2 focus:ring-[#05386b]/10 rounded-xl transition-all text-sm outline-none shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filtrage par Région de France */}
          <div className="relative w-full md:w-64">
            <MapPin className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#05386b]" />
            <select
              value={filterRegion}
              onChange={(e) => setFilterRegion(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 focus:border-[#05386b] focus:ring-2 focus:ring-[#05386b]/10 rounded-xl transition-all text-sm outline-none shadow-sm appearance-none font-semibold text-slate-700"
            >
              <option value="">Toutes les régions</option>
              {FRENCH_REGIONS.map((reg, idx) => (
                <option key={idx} value={reg}>{reg}</option>
              ))}
            </select>
          </div>

        </div>
        
        {/* Tableau de contacts */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100">
                <th className="p-4 font-semibold">Contact</th>
                <th className="p-4 font-semibold">Organisation</th>
                <th className="p-4 font-semibold">Localisation</th>
                <th className="p-4 font-semibold">Coordonnées</th>
                <th className="p-4 font-semibold">Type de besoin</th>
                <th className="p-4 font-semibold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredContacts.map(contact => (
                <tr key={contact.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-full bg-[#dde5d1]/50 text-[#05386b] flex items-center justify-center font-bold text-sm border border-[#dde5d1]">
                        {contact.name ? contact.name.split(' ').map(n => n[0]).join('') : 'C'}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-slate-800 text-sm">{contact.name}</p>
                          {contact.needType === 'LinkedIn Import' && (
                            <span className="p-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100" title="Importé de LinkedIn">
                              <Linkedin className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">{contact.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2 text-slate-600">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-medium">{contact.company}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-1.5 text-slate-600">
                      <MapPin className="w-4 h-4 text-[#96adc1]" />
                      <span className="text-xs font-semibold text-slate-700">{contact.region || "Non renseigné"}</span>
                    </div>
                  </td>
                  <td className="p-4 space-y-1">
                    <div className="flex items-center space-x-2 text-slate-600">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs">{contact.email || "Non renseigné"}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-slate-600">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs">{contact.phone || "Non renseigné"}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                      contact.needType === 'LinkedIn Import' 
                        ? 'bg-blue-50 text-blue-700 border border-blue-100'
                        : 'bg-[#dde5d1]/40 text-[#05386b] border border-[#dde5d1]'
                    }`}>
                      {contact.needType || "Indéfini"}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button className="text-slate-400 hover:text-[#05386b] transition-colors opacity-0 group-hover:opacity-100">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredContacts.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-slate-400 text-sm">
                    Aucun contact trouvé pour cette recherche ou cette région.
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
    <div className="space-y-6 animate-in fade-in duration-300 flex flex-col h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Pipeline Commercial</h2>
          <p className="text-slate-500 mt-1">Glissez vos missions à travers les étapes de diagnostic et de vente.</p>
        </div>
        <button 
          onClick={() => setIsAddMissionOpen(true)}
          className="flex items-center space-x-2 bg-[#05386b] hover:bg-[#05386b]/90 text-white px-5 py-2.5 rounded-xl transition-all shadow-sm font-semibold text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle opportunité</span>
        </button>
      </div>

      <div className="flex-1 overflow-x-auto pb-6">
        <div className="flex space-x-6 min-w-max h-full">
          {KANBAN_COLUMNS.map(col => {
            const columnItems = pipeline.filter(p => p.status === col.id);
            const columnTotal = columnItems.reduce((acc, item) => acc + item.value, 0);

            return (
              <div key={col.id} className="w-80 flex flex-col">
                <div className={`px-4 py-3 rounded-t-2xl border-t border-x ${col.color} flex justify-between items-center`}>
                  <h3 className="font-bold text-sm tracking-wide uppercase">{col.title}</h3>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/75">{columnItems.length}</span>
                </div>
                
                <div className="bg-slate-100/50 p-3 rounded-b-2xl border-x border-b border-slate-200 flex-1 overflow-y-auto space-y-3 min-h-[480px]">
                  {columnItems.map(item => (
                    <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:border-[#96adc1] transition-all group relative">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-[#05386b] bg-[#dde5d1]/50 border border-[#dde5d1] px-2 py-0.5 rounded">
                          {item.company}
                        </span>
                        
                        <div className="relative group/menu">
                          <button className="text-slate-400 hover:text-slate-600 p-0.5 rounded hover:bg-slate-50">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          <div className="absolute right-0 top-full mt-1 bg-white border border-slate-100 shadow-lg rounded-xl py-1.5 w-44 hidden group-hover/menu:block z-10">
                            <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Déplacer vers :</div>
                            {KANBAN_COLUMNS.filter(c => c.id !== item.status).map(c => (
                              <button 
                                key={c.id} 
                                onClick={() => movePipelineItem(item.id, c.id)}
                                className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 text-slate-700"
                              >
                                {c.title}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <h4 className="font-bold text-slate-800 text-sm mb-1">{item.type}</h4>
                      
                      {item.contactName && (
                        <div className="flex items-center text-xs text-slate-500 mb-3">
                          <Users className="w-3.5 h-3.5 mr-1 text-slate-400" />
                          {item.contactName}
                        </div>
                      )}

                      <div className="pt-2.5 border-t border-slate-100 flex justify-between items-center">
                        <span className="font-bold text-slate-800 text-sm">{formatCurrency(item.value)}</span>
                      </div>
                    </div>
                  ))}
                  
                  {columnItems.length === 0 && (
                    <div className="h-28 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-xs font-medium">
                      Aucun projet
                    </div>
                  )}
                </div>
                <div className="mt-2 text-right text-xs font-semibold text-slate-500 pr-1">
                  Sous-total : {formatCurrency(columnTotal)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-white text-slate-900 overflow-hidden" style={{ fontFamily: "'Quicksand', sans-serif" }}>
      
      {/* ALERTE DE NOTIFICATION */}
      {notification && (
        <div className="fixed top-4 right-4 z-[9999] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border animate-in slide-in-from-top duration-300 bg-white border-[#96adc1]/30">
          {notification.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-rose-500" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-[#05386b]" />
          )}
          <span className="text-sm font-semibold text-slate-700">{notification.message}</span>
        </div>
      )}

      {/* BARRE LATÉRALE DE NAVIGATION */}
      <aside className="w-68 bg-white border-r border-slate-100 hidden md:flex flex-col h-full shrink-0">
        <div className="h-20 flex items-center px-6 border-b border-slate-100">
          <div className="flex items-center space-x-2 text-[#05386b]">
            <Target className="w-8 h-8 text-[#05386b] shrink-0" />
            <span className="text-lg font-bold tracking-tight text-slate-800">
              La Libellule <span className="text-[#05386b] font-extrabold">Optimiste</span>
            </span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1.5">
          <button 
            onClick={() => setCurrentTab('dashboard')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm ${currentTab === 'dashboard' ? 'bg-[#dde5d1]/55 text-[#05386b]' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Tableau de bord</span>
          </button>
          
          <button 
            onClick={() => setCurrentTab('contacts')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm ${currentTab === 'contacts' ? 'bg-[#dde5d1]/55 text-[#05386b]' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'}`}
          >
            <Users className="w-5 h-5" />
            <span>Contacts</span>
          </button>
          
          <button 
            onClick={() => setCurrentTab('pipeline')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm ${currentTab === 'pipeline' ? 'bg-[#dde5d1]/55 text-[#05386b]' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'}`}
          >
            <KanbanSquare className="w-5 h-5" />
            <span>Suivi du Pipeline</span>
          </button>
        </nav>

        {/* PROFIL & CONNEXION */}
        <div className="p-4 border-t border-slate-100 bg-[#dde5d1]/20">
          <div className="flex items-center space-x-3 px-2 mb-4">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-9 h-9 rounded-full shadow-sm" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-[#dde5d1] border border-[#05386b]/20 shadow-sm flex items-center justify-center font-bold text-[#05386b] text-sm">
                {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            <div className="flex-1 truncate">
              <p className="text-sm font-bold text-slate-800 truncate">{user?.displayName || 'Utilisateur'}</p>
              <p className="text-[10px] text-[#05386b] font-medium truncate">{user?.email || 'Fichier Firestore Actif'}</p>
            </div>
          </div>
          
          {!user?.email || user.isAnonymous ? (
            <button 
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center space-x-2 bg-white border border-[#96adc1]/50 text-slate-700 px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-colors text-sm font-semibold shadow-sm"
            >
              <LogIn className="w-4 h-4 text-[#05386b]" />
              <span>Connexion Google</span>
            </button>
          ) : (
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl hover:bg-slate-100 transition-colors text-xs font-semibold shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              <span>Se déconnecter</span>
            </button>
          )}
        </div>
      </aside>

      {/* MENU MOBILE */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around p-2.5 z-50 shadow-lg">
        <button 
          onClick={() => setCurrentTab('dashboard')}
          className={`flex flex-col items-center p-2 rounded-xl transition-colors ${currentTab === 'dashboard' ? 'text-[#05386b] bg-[#dde5d1]/40' : 'text-slate-500'}`}
        >
          <LayoutDashboard className="w-5.5 h-5.5" />
          <span className="text-[9px] font-bold mt-1">Accueil</span>
        </button>
        <button 
          onClick={() => setCurrentTab('contacts')}
          className={`flex flex-col items-center p-2 rounded-xl transition-colors ${currentTab === 'contacts' ? 'text-[#05386b] bg-[#dde5d1]/40' : 'text-slate-500'}`}
        >
          <Users className="w-5.5 h-5.5" />
          <span className="text-[9px] font-bold mt-1">Contacts</span>
        </button>
        <button 
          onClick={() => setCurrentTab('pipeline')}
          className={`flex flex-col items-center p-2 rounded-xl transition-colors ${currentTab === 'pipeline' ? 'text-[#05386b] bg-[#dde5d1]/40' : 'text-slate-500'}`}
        >
          <KanbanSquare className="w-5.5 h-5.5" />
          <span className="text-[9px] font-bold mt-1">Pipeline</span>
        </button>
      </nav>

      {/* CONTENU PRINCIPAL */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto mb-16 md:mb-0">
        <div className="max-w-5xl mx-auto">
          {isAuthLoading ? (
            <div className="h-[60vh] flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#05386b]"></div>
            </div>
          ) : (
            <>
              {currentTab === 'dashboard' && renderDashboard()}
              {currentTab === 'contacts' && renderContacts()}
              {currentTab === 'pipeline' && renderPipeline()}
            </>
          )}
        </div>
      </main>

      {/* BOÎTE MODALE : AJOUT CONTACT */}
      {isAddContactOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">Ajouter un nouveau contact</h3>
              <button onClick={() => setIsAddContactOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddContact} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Nom complet *</label>
                  <input required type="text" className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#96adc1]/40 focus:border-[#05386b] outline-none transition-all text-sm" value={newContact.name} onChange={e => setNewContact({...newContact, name: e.target.value})} />
                </div>
                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Poste / Rôle</label>
                  <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#96adc1]/40 focus:border-[#05386b] outline-none transition-all text-sm" value={newContact.role} onChange={e => setNewContact({...newContact, role: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Entreprise / Organisation *</label>
                  <input required type="text" className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#96adc1]/40 focus:border-[#05386b] outline-none transition-all text-sm" value={newContact.company} onChange={e => setNewContact({...newContact, company: e.target.value})} />
                </div>
                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Région géographique *</label>
                  <select className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#96adc1]/40 focus:border-[#05386b] outline-none transition-all text-sm bg-white font-medium" value={newContact.region} onChange={e => setNewContact({...newContact, region: e.target.value})}>
                    {FRENCH_REGIONS.map((reg, idx) => (
                      <option key={idx} value={reg}>{reg}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Adresse Email</label>
                  <input type="email" className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#96adc1]/40 focus:border-[#05386b] outline-none transition-all text-sm" value={newContact.email} onChange={e => setNewContact({...newContact, email: e.target.value})} />
                </div>
                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Numéro de Téléphone</label>
                  <input type="tel" className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#96adc1]/40 focus:border-[#05386b] outline-none transition-all text-sm" value={newContact.phone} onChange={e => setNewContact({...newContact, phone: e.target.value})} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Type de besoin principal</label>
                <select className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#96adc1]/40 focus:border-[#05386b] outline-none transition-all text-sm bg-white" value={newContact.needType} onChange={e => setNewContact({...newContact, needType: e.target.value})}>
                  <option value="">Sélectionner un besoin...</option>
                  <option value="Coaching">Coaching</option>
                  <option value="Formation">Formation</option>
                  <option value="Transformation Orga">Transformation Orga</option>
                  <option value="Cadrage Stratégique">Cadrage Stratégique</option>
                  <option value="Séminaire">Séminaire</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end space-x-3 border-t border-slate-100 mt-6">
                <button type="button" onClick={() => setIsAddContactOpen(false)} className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-all">Annuler</button>
                <button type="submit" className="px-5 py-2 text-sm font-semibold text-white bg-[#05386b] hover:bg-[#05386b]/95 rounded-xl transition-all shadow-sm">Créer le contact</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BOÎTE MODALE : AJOUT MISSION */}
      {isAddMissionOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">Ajouter une opportunité</h3>
              <button onClick={() => setIsAddMissionOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddMission} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Entreprise ou client *</label>
                <input required type="text" placeholder="ex: Agence Alpha" className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#96adc1]/40 focus:border-[#05386b] outline-none transition-all text-sm" value={newMission.company} onChange={e => setNewMission({...newMission, company: e.target.value})} />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Type de prestation *</label>
                <input required type="text" placeholder="ex: Coaching individuel 6 mois" className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#96adc1]/40 focus:border-[#05386b] outline-none transition-all text-sm" value={newMission.type} onChange={e => setNewMission({...newMission, type: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Valeur estimée (€) *</label>
                  <input required type="number" placeholder="ex: 5000" className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#96adc1]/40 focus:border-[#05386b] outline-none transition-all text-sm" value={newMission.value} onChange={e => setNewMission({...newMission, value: e.target.value})} />
                </div>
                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Interlocuteur direct</label>
                  <input type="text" placeholder="ex: Sophie Laurent" className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#96adc1]/40 focus:border-[#05386b] outline-none transition-all text-sm" value={newMission.contactName} onChange={e => setNewMission({...newMission, contactName: e.target.value})} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Statut initial</label>
                <select className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#96adc1]/40 focus:border-[#05386b] outline-none transition-all text-sm bg-white" value={newMission.status} onChange={e => setNewMission({...newMission, status: e.target.value})}>
                  {KANBAN_COLUMNS.map(col => (
                    <option key={col.id} value={col.id}>{col.title}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex justify-end space-x-3 border-t border-slate-100 mt-6">
                <button type="button" onClick={() => setIsAddMissionOpen(false)} className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-all">Annuler</button>
                <button type="submit" className="px-5 py-2 text-sm font-semibold text-white bg-[#05386b] hover:bg-[#05386b]/95 rounded-xl transition-all shadow-sm">Créer l'opportunité</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BOÎTE MODALE : CONFIRMATION DE SUPPRESSION */}
      {isConfirmClearOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[10000] animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-rose-100">
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto border border-rose-100">
                <Trash2 className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-800">Vider le CRM ?</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Êtes-vous sûr de vouloir supprimer définitivement **tous les contacts** et **toutes les opportunités** de votre base de données ? Cette action est irréversible.
                </p>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 flex flex-col sm:flex-row gap-2 justify-end border-t border-slate-100">
              <button type="button" onClick={() => setIsConfirmClearOpen(false)} className="w-full sm:w-auto px-5 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100/50 rounded-xl transition-all text-center">Annuler</button>
              <button type="button" onClick={clearAllData} className="w-full sm:w-auto px-5 py-2.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-sm text-center">Oui, tout supprimer</button>
            </div>
          </div>
        </div>
      )}

      {/* BOÎTE MODALE : IMPORTER DEPUIS LINKEDIN */}
      {isImportLinkedInOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-[#dde5d1]/20">
              <div className="flex items-center space-x-2 text-[#05386b]">
                <Linkedin className="w-5 h-5" />
                <h3 className="text-lg font-bold">Importateur de Contacts LinkedIn</h3>
              </div>
              <button onClick={() => { setIsImportLinkedInOpen(false); setLinkedInStep(1); }} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {!user || user.isAnonymous ? (
              <div className="p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto border border-amber-100">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <div className="space-y-2 max-w-md mx-auto">
                  <h4 className="text-lg font-bold text-slate-800">Connexion Google Requise</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Pour pouvoir sauvegarder vos contacts LinkedIn directement et durablement dans votre espace CRM Cloud sécurisé, vous devez d'abord vous connecter.
                  </p>
                </div>
                <button 
                  onClick={() => { setIsImportLinkedInOpen(false); handleGoogleLogin(); }}
                  className="inline-flex items-center space-x-2 bg-[#05386b] hover:bg-[#05386b]/95 text-white px-6 py-3 rounded-xl transition-all font-semibold shadow-sm text-sm"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Se connecter avec Google</span>
                </button>
              </div>
            ) : (
              <div>
                {/* ÉTAPE 1 : UPLOAD */}
                {linkedInStep === 1 && (
                  <div className="p-6 space-y-6">
                    <div className="bg-[#96adc1]/10 p-4 rounded-xl border border-[#96adc1]/20">
                      <h4 className="font-bold text-[#05386b] text-sm mb-2 flex items-center gap-1.5">
                        <Download className="w-4 h-4" />
                        Comment récupérer votre fichier de contacts sur LinkedIn ?
                      </h4>
                      <ol className="text-xs text-slate-600 space-y-2 list-decimal list-inside pl-1">
                        <li>Allez sur votre compte LinkedIn puis sur <strong>"Vous &gt; Réglages et confidentialité"</strong>.</li>
                        <li>Dans l'onglet <strong>"Confidentialité des données"</strong>, cliquez sur <strong>"Obtenir une copie de vos données"</strong>.</li>
                        <li>Cochez uniquement <strong>"Mes relations"</strong> puis cliquez sur <strong>"Demander l'archive"</strong>.</li>
                        <li>Vous recevrez un email sous 5 minutes contenant un fichier ZIP. Extrayez-y le fichier <strong>Connections.csv</strong> et déposez-le ci-dessous !</li>
                      </ol>
                    </div>

                    <div className="border-2 border-dashed border-[#96adc1]/50 hover:border-[#05386b] transition-all rounded-2xl p-8 text-center bg-slate-50 relative group">
                      <input 
                        type="file" 
                        accept=".csv" 
                        onChange={handleLinkedInFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                      />
                      <div className="space-y-3 pointer-events-none">
                        <div className="w-12 h-12 bg-white text-[#05386b] rounded-full flex items-center justify-center mx-auto shadow-sm border border-slate-100 group-hover:scale-105 transition-transform">
                          <Linkedin className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-slate-800">Glissez-déposez votre fichier Connections.csv</p>
                          <p className="text-xs text-slate-400">ou cliquez pour parcourir vos fichiers (.csv uniquement)</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ÉTAPE 2 : APERÇU */}
                {linkedInStep === 2 && (
                  <div className="flex flex-col h-[450px]">
                    <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center text-xs text-slate-500 font-semibold">
                      <span>Fichier : <strong className="text-slate-700">{csvFileName}</strong> ({parsedLinkedInContacts.length} relations détectées)</span>
                      <div className="flex gap-2">
                        <button onClick={() => toggleAllLinkedInContacts(true)} className="text-[#05386b] hover:underline">Tout cocher</button>
                        <span>•</span>
                        <button onClick={() => toggleAllLinkedInContacts(false)} className="text-rose-600 hover:underline">Tout décocher</button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
                      {parsedLinkedInContacts.map(c => (
                        <div 
                          key={c.tempId} 
                          onClick={() => toggleLinkedInContactSelect(c.tempId)}
                          className={`flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer ${
                            c.selected ? 'bg-[#dde5d1]/30 border border-[#dde5d1]/60' : 'bg-white hover:bg-slate-50 border border-transparent'
                          } mb-1`}
                        >
                          <div className="flex items-center space-x-3 truncate">
                            <div className="w-5 h-5 rounded border flex items-center justify-center transition-all shrink-0 bg-white border-slate-300">
                              {c.selected && <Check className="w-3.5 h-3.5 text-[#05386b] stroke-[3]" />}
                            </div>
                            <div className="truncate">
                              <p className="text-sm font-bold text-slate-800 truncate">{c.name}</p>
                              <p className="text-xs text-slate-500 truncate">{c.role} @ <strong className="text-slate-600 font-semibold">{c.company}</strong></p>
                            </div>
                          </div>
                          {c.email && <span className="text-xs text-slate-400 hidden sm:inline">{c.email}</span>}
                        </div>
                      ))}
                    </div>

                    <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-slate-50">
                      <button 
                        onClick={() => { setLinkedInStep(1); setParsedLinkedInContacts([]); }}
                        className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-800"
                      >
                        Retour
                      </button>
                      <button 
                        onClick={executeLinkedInImport}
                        className="px-5 py-2.5 bg-[#05386b] text-white hover:bg-[#05386b]/95 rounded-xl transition-all shadow-sm font-semibold text-sm flex items-center space-x-2"
                      >
                        <Linkedin className="w-4 h-4" />
                        <span>Importer {parsedLinkedInContacts.filter(c => c.selected).length} contacts</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* ÉTAPE 3 : CHARGEMENT */}
                {linkedInStep === 3 && (
                  <div className="p-12 text-center space-y-4">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#05386b] mx-auto"></div>
                    <p className="text-sm font-semibold text-slate-700">Importation de vos contacts LinkedIn en cours...</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}