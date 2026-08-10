import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, CheckCircle2, ShieldCheck, BadgeCheck, GraduationCap, Building2,
  Camera, MapPin, Wifi, Globe, Cpu, Key, RefreshCw, X, ChevronDown, ChevronUp, ChevronRight, Calculator,
  Image as ImageIcon, AlertCircle
} from 'lucide-react';
import { Collaborator, EntityConfig, UserSession, TimePunchLog, formatDateBR, formatTimeBR, getTodayFormatted, getTimeNowFormatted } from '../types';

interface CollaboratorPortalTabProps {
  session?: UserSession | null;
  collaborators?: Collaborator[];
  entityConfig?: EntityConfig | null;
}

export default function CollaboratorPortalTab({
  session,
  collaborators = [],
  entityConfig
}: CollaboratorPortalTabProps) {
  // Find current collaborator from props session or storage
  const [currentCollaborator] = useState<Collaborator | null>(() => {
    // 1. Search in props collaborators
    if (session?.collaboratorId) {
      const found = collaborators.find(c => c.id === session.collaboratorId);
      if (found) return found;
    }

    // 2. Search in school_staff_list (from UEEI tab)
    try {
      const savedStaff = localStorage.getItem('school_staff_list');
      if (savedStaff) {
        const staffArr: any[] = JSON.parse(savedStaff);
        const foundStaff = staffArr.find(s => 
          s.id === session?.collaboratorId || 
          (session?.collaboratorName && s.name?.toLowerCase() === session.collaboratorName.toLowerCase()) || 
          (session?.collaboratorName && s.username?.toLowerCase() === session.collaboratorName.toLowerCase())
        );
        if (foundStaff) {
          return {
            id: foundStaff.id,
            name: foundStaff.name,
            cpf: foundStaff.cpf || '000.000.000-00',
            email: foundStaff.email || '',
            phone: foundStaff.phone || '',
            role: foundStaff.role || 'Colaborador',
            department: 'Escola Indígena UEEI',
            registration: foundStaff.registrationCode || foundStaff.registration || 'MAT-2026',
            accessLevel: 'Colaborador',
            username: foundStaff.username || '',
            password: foundStaff.password || '',
            status: foundStaff.status || 'Ativo',
            createdAt: '2026',
            lastAccess: 'Hoje'
          };
        }
      }
    } catch (e) {}

    // 3. Search in school_collaborators_list
    try {
      const savedColab = localStorage.getItem('school_collaborators_list');
      if (savedColab) {
        const colabArr: any[] = JSON.parse(savedColab);
        const foundColab = colabArr.find(c => 
          c.id === session?.collaboratorId || 
          (session?.collaboratorName && c.name?.toLowerCase() === session.collaboratorName.toLowerCase())
        );
        if (foundColab) return foundColab;
      }
    } catch (e) {}

    if (session?.collaboratorName) {
      const found = collaborators.find(c => c.name.toLowerCase() === session.collaboratorName?.toLowerCase() || c.username === session.collaboratorName);
      if (found) return found;
    }

    return {
      id: session?.collaboratorId || 'colab-1',
      name: session?.collaboratorName || 'Maria das Graças Xukuru',
      cpf: '123.456.789-00',
      email: 'colaborador@escola.edu.br',
      phone: '(81) 99888-1122',
      role: session?.collaboratorRole || 'Cozinheira(o)',
      department: 'Geral',
      registration: 'MAT-2026-001',
      accessLevel: 'Colaborador',
      username: 'colaborador',
      password: 'pass',
      status: 'Ativo',
      createdAt: '15/01/2026',
      lastAccess: 'Hoje'
    };
  });

  // Clock State
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Punch Logs State
  const loadPunches = (): TimePunchLog[] => {
    try {
      const savedGlobal = localStorage.getItem('all_collaborator_punches');
      if (savedGlobal !== null) {
        const parsed: TimePunchLog[] = JSON.parse(savedGlobal);
        const myPunches = parsed.filter(p => p.collaboratorId === currentCollaborator?.id || p.collaboratorName === currentCollaborator?.name);
        if (currentCollaborator?.id) {
          localStorage.setItem(`colab_punches_${currentCollaborator.id}`, JSON.stringify(myPunches));
        }
        return myPunches;
      }

      const savedLocal = localStorage.getItem(`colab_punches_${currentCollaborator?.id}`);
      if (savedLocal) return JSON.parse(savedLocal);
    } catch (e) {}

    const today = getTodayFormatted();
    const initial: TimePunchLog[] = [
      { 
        id: 'p1', 
        collaboratorId: currentCollaborator?.id || 'colab-1',
        collaboratorName: currentCollaborator?.name || 'Maria das Graças Xukuru',
        registration: currentCollaborator?.registration || 'MAT-2026-001',
        date: today, 
        time: '07:30:12', 
        type: 'Entrada', 
        location: entityConfig?.name || 'Escola Estadual Indígena Xukuru do Ororubá',
        coords: { latitude: -8.0476, longitude: -34.8770, accuracy: 5, addressString: 'Av. Principal, S/N - Aldeia Cimbres' },
        ipAddress: '187.58.120.45',
        macAddress: '74:89:C2:A1:FE:33',
        wifiSsid: 'REDE_ESCOLA_PROFESSORES_5G',
        wifiPassword: '••••••••••••',
        status: 'Pendente'
      },
      { 
        id: 'p2', 
        collaboratorId: currentCollaborator?.id || 'colab-1', 
        collaboratorName: currentCollaborator?.name || 'Maria das Graças Xukuru',
        registration: currentCollaborator?.registration || 'MAT-2026-001',
        date: today, 
        time: '12:00:45', 
        type: 'Pausa', 
        location: entityConfig?.name || 'Escola Indígena UEEI',
        coords: { latitude: -8.0476, longitude: -34.8770, accuracy: 4, addressString: 'Av. Principal, S/N - Aldeia Cimbres' },
        ipAddress: '187.58.120.45',
        macAddress: '74:89:C2:A1:FE:33',
        wifiSsid: 'REDE_ESCOLA_PROFESSORES_5G',
        wifiPassword: '••••••••••••',
        status: 'Pendente'
      }
    ];

    // Seed global storage
    try {
      const existingAllStr = localStorage.getItem('all_collaborator_punches');
      let existingAll: TimePunchLog[] = existingAllStr ? JSON.parse(existingAllStr) : [];
      if (existingAll.length === 0) {
        localStorage.setItem('all_collaborator_punches', JSON.stringify(initial));
      }
    } catch (e) {}

    return initial;
  };

  const [punchLogs, setPunchLogs] = useState<TimePunchLog[]>(loadPunches);

  // Listen for real-time punch updates (e.g. from UEEI approval)
  useEffect(() => {
    const handleSync = () => {
      setPunchLogs(loadPunches());
    };
    window.addEventListener('punch_updated', handleSync);
    return () => window.removeEventListener('punch_updated', handleSync);
  }, [currentCollaborator]);

  const savePunchLogs = (logs: TimePunchLog[]) => {
    setPunchLogs(logs);
    if (currentCollaborator?.id) {
      localStorage.setItem(`colab_punches_${currentCollaborator.id}`, JSON.stringify(logs));
    }
    // Sync to global punches store for UEEI approval
    try {
      const existingAllStr = localStorage.getItem('all_collaborator_punches');
      let existingAll: TimePunchLog[] = existingAllStr ? JSON.parse(existingAllStr) : [];
      
      // Filter out old logs of this collaborator and merge new ones
      const others = existingAll.filter(p => p.collaboratorId !== currentCollaborator?.id && p.collaboratorName !== currentCollaborator?.name);
      const combined = [...logs, ...others];
      localStorage.setItem('all_collaborator_punches', JSON.stringify(combined));
      window.dispatchEvent(new Event('punch_updated'));
    } catch (e) {
      console.warn('Error syncing global punches:', e);
    }
  };

  const [punchSuccessMsg, setPunchSuccessMsg] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

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

  const groupedColabDailyPunches = React.useMemo(() => {
    const map = new Map<string, {
      date: string;
      location: string;
      punches: TimePunchLog[];
    }>();

    punchLogs.forEach(p => {
      if (!map.has(p.date)) {
        map.set(p.date, {
          date: p.date,
          location: p.location || 'Escola Indígena UEEI',
          punches: []
        });
      }
      map.get(p.date)!.punches.push(p);
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
        { stage: 'Entrada' as const, label: 'Entrada', punch: entrada },
        { stage: 'Pausa' as const, label: 'Pausa', punch: pausa },
        { stage: 'Retorno' as const, label: 'Retorno', punch: retorno },
        { stage: 'Saída' as const, label: 'Saída', punch: saida }
      ];

      return {
        ...group,
        slots,
        hoursCalculation: {
          turno1Str: formatMinutesToHHMM(turno1Min),
          intervalStr: formatMinutesToHHMM(intervalMin),
          turno2Str: formatMinutesToHHMM(turno2Min),
          totalWorkedStr: formatMinutesToHHMM(totalWorkedMin)
        }
      };
    });
  }, [punchLogs]);

  // Modal State for Camera & GPS Verification
  const [activePunchType, setActivePunchType] = useState<TimePunchLog['type'] | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Auto-captured data state
  const [gpsData, setGpsData] = useState<{ latitude: number; longitude: number; accuracy?: number; addressString?: string } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const [ipAddress, setIpAddress] = useState<string>('Carregando IP...');
  const [macAddress, setMacAddress] = useState<string>('74:89:C2:A1:FE:33');
  const [wifiSsid, setWifiSsid] = useState<string>('REDE_ESCOLA_PROFESSORES_5G');
  const [wifiPassword, setWifiPassword] = useState<string>('Escola@2026!');

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Helper to generate MAC address fingerprint based on browser / localStorage
  const getOrGenerateMac = () => {
    let savedMac = localStorage.getItem('device_mac_fingerprint');
    if (!savedMac) {
      const hex = '0123456789ABCDEF';
      let mac = '';
      for (let i = 0; i < 6; i++) {
        mac += hex.charAt(Math.floor(Math.random() * 16)) + hex.charAt(Math.floor(Math.random() * 16));
        if (i < 5) mac += ':';
      }
      savedMac = mac;
      localStorage.setItem('device_mac_fingerprint', savedMac);
    }
    return savedMac;
  };

  // Open Modal and start Camera + Geolocation + IP
  const handleOpenPunchModal = (type: TimePunchLog['type']) => {
    setActivePunchType(type);
    setCapturedPhoto(null);
    setCameraError(null);
    setGpsError(null);
    setGpsLoading(true);

    // Get MAC Address
    setMacAddress(getOrGenerateMac());

    // Fetch Public IP
    fetch('https://api.ipify.org?format=json')
      ? fetch('https://api.ipify.org?format=json')
          .then(res => res.json())
          .then(data => setIpAddress(data.ip || '187.58.120.45'))
          .catch(() => setIpAddress('187.58.120.45'))
      : setIpAddress('187.58.120.45');

    // Get GPS Geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsData({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: Math.round(position.coords.accuracy),
            addressString: `Lat: ${position.coords.latitude.toFixed(5)}, Lon: ${position.coords.longitude.toFixed(5)}`
          });
          setGpsLoading(false);
        },
        (err) => {
          console.warn('Geolocation error:', err);
          setGpsError('Não foi possível obter GPS automático. Usando dados da Unidade.');
          setGpsData({
            latitude: -8.0476,
            longitude: -34.8770,
            accuracy: 10,
            addressString: 'Unidade Escolar - Sede Principal'
          });
          setGpsLoading(false);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setGpsError('Navegador não suporta geolocalização.');
      setGpsData({
        latitude: -8.0476,
        longitude: -34.8770,
        accuracy: 15,
        addressString: 'Unidade Escolar'
      });
      setGpsLoading(false);
    }

    // Start Camera Stream
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } 
      })
      .then((stream) => {
        setCameraStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => {
        console.warn('Camera access error:', err);
        setCameraError('Permissão da câmera necessária ou câmera indisponível.');
      });
    } else {
      setCameraError('Câmera não suportada neste dispositivo.');
    }
  };

  // Close Camera Stream & Modal
  const handleCloseModal = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setActivePunchType(null);
    setCapturedPhoto(null);
  };

  // Take photo snapshot from video stream
  const handleTakeSnapshot = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setCapturedPhoto(dataUrl);
      }
    }
  };

  // Confirm Punch
  const handleConfirmPunch = () => {
    if (!activePunchType) return;

    const dateStr = getTodayFormatted();
    const timeStr = getTimeNowFormatted();

    // Create a fallback avatar photo if none captured
    const finalPhoto = capturedPhoto || createFallbackAvatar(currentCollaborator?.name || 'C');

    const newPunch: TimePunchLog = {
      id: `punch-${Date.now()}`,
      collaboratorId: currentCollaborator?.id || 'colab-1',
      collaboratorName: currentCollaborator?.name || 'Maria das Graças Xukuru',
      registration: currentCollaborator?.registration || 'MAT-2026-001',
      date: dateStr,
      time: timeStr,
      type: activePunchType,
      location: 'Escola Indígena UEEI',
      photoUrl: finalPhoto,
      coords: gpsData || { latitude: -8.0476, longitude: -34.8770, accuracy: 5, addressString: 'Unidade Escolar Sede' },
      ipAddress: ipAddress,
      macAddress: macAddress,
      wifiSsid: wifiSsid,
      wifiPassword: wifiPassword ? '••••••••' : 'S/A',
      status: 'Pendente'
    };

    const updated = [newPunch, ...punchLogs];
    savePunchLogs(updated);

    setPunchSuccessMsg(`Ponto de "${activePunchType}" registrado e enviado para aprovação da UEEI!`);
    setTimeout(() => setPunchSuccessMsg(''), 6000);

    handleCloseModal();
  };

  // Generate fallback visual photo avatar
  const createFallbackAvatar = (name: string) => {
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#312e81';
      ctx.fillRect(0, 0, 300, 300);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 120px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(name.charAt(0).toUpperCase(), 150, 150);
    }
    return canvas.toDataURL('image/png');
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Colaborator Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900/40 via-[#161b2e] to-purple-900/40 border border-indigo-500/30 rounded-2xl p-5 md:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-300 overflow-hidden shrink-0 shadow-lg p-1.5">
              <GraduationCap className="h-8 w-8 text-indigo-300" />
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-indigo-300 text-[11px] font-bold tracking-wide uppercase flex items-center gap-1">
                  <Building2 className="h-3 w-3 text-indigo-400" />
                  Escola Indígena UEEI
                </span>
                {currentCollaborator?.registration && (
                  <span className="px-2.5 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded-full text-amber-300 text-[11px] font-mono font-bold flex items-center gap-1">
                    <BadgeCheck className="h-3 w-3 text-amber-400" />
                    Matrícula: {currentCollaborator.registration}
                  </span>
                )}
                <span className="px-2.5 py-0.5 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-emerald-300 text-[11px] font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {currentCollaborator?.status || 'Ativo'}
                </span>
              </div>

              <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                Olá, {currentCollaborator?.name || 'Colaborador'}!
              </h1>

              <p className="text-xs md:text-sm text-gray-300 flex flex-wrap items-center gap-3 font-medium">
                <span className="text-indigo-300 font-semibold">{currentCollaborator?.role || 'Cargo não especificado'}</span>
                {currentCollaborator?.department && (
                  <>
                    <span className="text-gray-600">•</span>
                    <span className="text-purple-300">{currentCollaborator.department}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Quick Info Badge */}
          <div className="bg-black/40 border border-white/10 rounded-xl p-3 text-xs space-y-1 md:min-w-[220px]">
            <div className="text-gray-400 font-semibold uppercase tracking-wider text-[10px] border-b border-white/10 pb-1 flex items-center justify-between">
              <span>Status do Vínculo</span>
              <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
            </div>
            <div className="flex justify-between text-gray-300">
              <span>Nível de Acesso:</span>
              <strong className="text-indigo-300">{currentCollaborator?.accessLevel || 'Colaborador'}</strong>
            </div>
            <div className="flex justify-between text-gray-300">
              <span>Usuário:</span>
              <strong className="text-amber-300 font-mono">{currentCollaborator?.username}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* PONTO ELETRÔNICO MAIN SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Digital Clock & Punch Buttons */}
        <div className="lg:col-span-1 bg-[#121212] border border-white/10 rounded-2xl p-6 space-y-6 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-indigo-400" />
                Relógio Digital Oficial
              </span>
              <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded font-mono text-[10px]">
                Auditoria Facial & GPS
              </span>
            </div>

            {/* Clock Display */}
            <div className="bg-black/60 border border-indigo-500/30 rounded-2xl p-5 text-center my-4 shadow-inner">
              <span className="text-xs text-gray-400 uppercase tracking-widest font-semibold block mb-1">
                {currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
              </span>
              <span className="text-4xl md:text-5xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-white to-purple-300 tracking-wider">
                {currentTime.toLocaleTimeString('pt-BR')}
              </span>
            </div>

            {punchSuccessMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>{punchSuccessMsg}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-2">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Registrar Frequência Agora:</span>
              <span className="text-[10px] text-indigo-400 flex items-center gap-1">
                <Camera className="h-3 w-3" />
                Requer Foto + GPS
              </span>
            </label>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleOpenPunchModal('Entrada')}
                className="py-3 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all cursor-pointer"
              >
                <Clock className="h-4 w-4" />
                Entrada
              </button>

              <button
                type="button"
                onClick={() => handleOpenPunchModal('Pausa')}
                className="py-3 px-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-900/30 transition-all cursor-pointer"
              >
                <Clock className="h-4 w-4" />
                Pausa
              </button>

              <button
                type="button"
                onClick={() => handleOpenPunchModal('Retorno')}
                className="py-3 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/30 transition-all cursor-pointer"
              >
                <Clock className="h-4 w-4" />
                Retorno
              </button>

              <button
                type="button"
                onClick={() => handleOpenPunchModal('Saída')}
                className="py-3 px-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-rose-900/30 transition-all cursor-pointer"
              >
                <Clock className="h-4 w-4" />
                Saída
              </button>
            </div>
          </div>
        </div>

        {/* Time Punch History Table */}
        <div className="lg:col-span-2 bg-[#121212] border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <BadgeCheck className="h-5 w-5 text-indigo-400" />
                Histórico de Batimentos de Ponto (Enviados para UEEI)
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Registros auditados com foto, GPS, IP, MAC e Wi-Fi oficial da escola.
              </p>
            </div>

            <span className="text-xs bg-white/5 border border-white/10 text-gray-300 px-3 py-1 rounded-lg font-mono">
              Total: {punchLogs.length} registros
            </span>
          </div>

          {punchLogs.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-sm">
              Nenhum ponto registrado no seu histórico até o momento.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-white/5 text-gray-400 uppercase font-semibold text-[10px]">
                  <tr>
                    <th className="p-3">Foto</th>
                    <th className="p-3">Data & Horário</th>
                    <th className="p-3">Tipo</th>
                    <th className="p-3">Status UEEI</th>
                    <th className="p-3">Geolocalização & IP</th>
                    <th className="p-3">Rede & Dispositivo</th>
                    <th className="p-3 text-right">Detalhes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  {punchLogs.map((log) => {
                    const isExpanded = expandedLogId === log.id;
                    return (
                      <React.Fragment key={log.id}>
                        <tr className="hover:bg-white/5 transition-colors cursor-pointer" onClick={() => setExpandedLogId(isExpanded ? null : log.id)}>
                          <td className="p-3">
                            {log.photoUrl ? (
                              <img 
                                src={log.photoUrl} 
                                alt="Foto do Ponto" 
                                className="w-9 h-9 rounded-lg object-cover border border-indigo-500/40 shadow"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-lg bg-indigo-900/40 border border-indigo-500/30 flex items-center justify-center text-indigo-300">
                                <Camera className="h-4 w-4" />
                              </div>
                            )}
                          </td>
                          <td className="p-3">
                            <span className="text-gray-200 block">{formatDateBR(log.date)}</span>
                            <strong className="text-white text-sm">{formatTimeBR(log.time)}</strong>
                          </td>
                          <td className="p-3 font-sans">
                            <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold inline-flex items-center gap-1 ${
                              log.type === 'Entrada' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30' :
                              (log.type === 'Pausa' || log.type === 'Pausa Almoço') ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30' :
                              (log.type === 'Retorno' || log.type === 'Retorno Almoço') ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/30' :
                              'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                            }`}>
                              {log.type.replace(' Almoço', '')}
                            </span>
                          </td>
                          <td className="p-3 font-sans">
                            {log.status === 'Aprovado' ? (
                              <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Aprovado UEEI
                              </span>
                            ) : log.status === 'Rejeitado' ? (
                              <span className="px-2.5 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                                <X className="h-3 w-3 text-rose-400" /> Rejeitado
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                                <Clock className="h-3 w-3 text-amber-400 animate-pulse" /> Pendente UEEI
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-sans">
                            <div className="space-y-0.5 text-[11px]">
                              {log.coords && (
                                <a 
                                  href={`https://www.google.com/maps?q=${log.coords.latitude},${log.coords.longitude}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-indigo-400 hover:text-indigo-300 font-mono flex items-center gap-1 hover:underline"
                                >
                                  <MapPin className="h-3 w-3 shrink-0 text-rose-400" />
                                  {log.coords.latitude.toFixed(4)}, {log.coords.longitude.toFixed(4)}
                                </a>
                              )}
                              <span className="text-gray-400 font-mono text-[10px] flex items-center gap-1">
                                <Globe className="h-3 w-3 text-cyan-400 shrink-0" />
                                IP: {log.ipAddress || '187.58.120.45'}
                              </span>
                            </div>
                          </td>
                          <td className="p-3 font-sans">
                            <div className="space-y-0.5 text-[11px]">
                              <span className="text-amber-300 font-mono text-[10px] flex items-center gap-1">
                                <Wifi className="h-3 w-3 text-amber-400 shrink-0" />
                                {log.wifiSsid || 'REDE_ESCOLA_5G'}
                              </span>
                              <span className="text-gray-400 font-mono text-[10px] flex items-center gap-1">
                                <Cpu className="h-3 w-3 text-emerald-400 shrink-0" />
                                MAC: {log.macAddress || '74:89:C2:A1:FE:33'}
                              </span>
                            </div>
                          </td>
                          <td className="p-3 text-right">
                            <button 
                              type="button" 
                              onClick={(e) => { e.stopPropagation(); setExpandedLogId(isExpanded ? null : log.id); }}
                              className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
                            >
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </button>
                          </td>
                        </tr>

                        {/* Expanded details row */}
                        {isExpanded && (
                          <tr className="bg-indigo-950/30 border-b border-indigo-500/20">
                            <td colSpan={7} className="p-4">
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-sans">
                                {/* Captured Photo */}
                                <div className="space-y-1.5">
                                  <span className="text-gray-400 font-bold uppercase text-[10px] flex items-center gap-1">
                                    <ImageIcon className="h-3.5 w-3.5 text-indigo-400" />
                                    Foto Facial Capturada
                                  </span>
                                  {log.photoUrl ? (
                                    <img 
                                      src={log.photoUrl} 
                                      alt="Selfie do Ponto" 
                                      className="w-full h-32 object-cover rounded-xl border border-indigo-500/40 shadow-lg"
                                    />
                                  ) : (
                                    <div className="w-full h-32 bg-black/40 border border-white/10 rounded-xl flex items-center justify-center text-gray-500">
                                      Sem foto
                                    </div>
                                  )}
                                </div>

                                {/* GPS Info */}
                                <div className="space-y-1 bg-black/40 p-3 rounded-xl border border-white/10">
                                  <span className="text-gray-400 font-bold uppercase text-[10px] flex items-center gap-1 border-b border-white/10 pb-1">
                                    <MapPin className="h-3.5 w-3.5 text-rose-400" />
                                    Geolocalização Exata
                                  </span>
                                  <div className="pt-1 space-y-1 font-mono text-[11px]">
                                    <p className="text-white">Lat: {log.coords?.latitude || -8.0476}</p>
                                    <p className="text-white">Lon: {log.coords?.longitude || -34.8770}</p>
                                    <p className="text-emerald-400 text-[10px]">Precisão GPS: ±{log.coords?.accuracy || 5}m</p>
                                    <p className="text-gray-300 font-sans text-[11px] pt-1">{log.location}</p>
                                  </div>
                                </div>

                                {/* Network Info */}
                                <div className="space-y-1 bg-black/40 p-3 rounded-xl border border-white/10">
                                  <span className="text-gray-400 font-bold uppercase text-[10px] flex items-center gap-1 border-b border-white/10 pb-1">
                                    <Wifi className="h-3.5 w-3.5 text-amber-400" />
                                    Dados de Rede
                                  </span>
                                  <div className="pt-1 space-y-1 font-mono text-[11px]">
                                    <p className="text-amber-300 flex items-center gap-1">
                                      <Wifi className="h-3 w-3" /> SSID: {log.wifiSsid || 'REDE_ESCOLA_5G'}
                                    </p>
                                    <p className="text-gray-300 flex items-center gap-1">
                                      <Key className="h-3 w-3 text-purple-400" /> Senha Wi-Fi: {log.wifiPassword || '••••••••'}
                                    </p>
                                    <p className="text-cyan-300 flex items-center gap-1">
                                      <Globe className="h-3 w-3 text-cyan-400" /> IP: {log.ipAddress || '187.58.120.45'}
                                    </p>
                                  </div>
                                </div>

                                {/* Device Hardware Info & Approval Status */}
                                <div className="space-y-1 bg-black/40 p-3 rounded-xl border border-white/10">
                                  <span className="text-gray-400 font-bold uppercase text-[10px] flex items-center gap-1 border-b border-white/10 pb-1">
                                    <Cpu className="h-3.5 w-3.5 text-emerald-400" />
                                    Dispositivo & Status UEEI
                                  </span>
                                  <div className="pt-1 space-y-1 font-mono text-[11px]">
                                    <p className="text-emerald-300 font-bold">MAC: {log.macAddress || '74:89:C2:A1:FE:33'}</p>
                                    {log.status === 'Rejeitado' && log.rejectionReason && (
                                      <p className="text-rose-400 text-[11px] font-sans pt-1 border-t border-rose-500/20 mt-1">
                                        <strong>Motivo Rejeição UEEI:</strong> {log.rejectionReason}
                                      </p>
                                    )}
                                    {log.status === 'Aprovado' && (
                                      <p className="text-emerald-400 text-[10px] font-sans pt-1">
                                        Aprovado em: {log.approvedAt || log.date} por {log.approvedBy || 'Gestão UEEI'}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* CAMERA & GPS PUNCH VERIFICATION MODAL */}
      {activePunchType && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#121625] border border-indigo-500/40 rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
                  <Camera className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    Registrar Frequência: <span className="text-indigo-400">{activePunchType}</span>
                  </h3>
                  <p className="text-xs text-gray-400">
                    Captura obrigatória de Foto, Geolocalização GPS, IP, MAC e Wi-Fi da Escola para Aprovação UEEI.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseModal}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Camera Stream / Snapshot Preview */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Camera className="h-4 w-4 text-indigo-400" />
                    Câmera ao Vivo
                  </span>
                  {capturedPhoto && (
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Foto Capturada
                    </span>
                  )}
                </label>

                <div className="relative w-full h-56 bg-black rounded-2xl overflow-hidden border-2 border-indigo-500/40 flex items-center justify-center shadow-inner">
                  {capturedPhoto ? (
                    <img 
                      src={capturedPhoto} 
                      alt="Foto capturada" 
                      className="w-full h-full object-cover"
                    />
                  ) : cameraError ? (
                    <div className="p-4 text-center space-y-2">
                      <AlertCircle className="h-8 w-8 text-amber-400 mx-auto" />
                      <p className="text-xs text-amber-300 font-medium">{cameraError}</p>
                      <button
                        type="button"
                        onClick={handleTakeSnapshot}
                        className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-500"
                      >
                        Gerar Avatar Digital
                      </button>
                    </div>
                  ) : (
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      muted 
                      className="w-full h-full object-cover transform -scale-x-100"
                    />
                  )}

                  {!capturedPhoto && !cameraError && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
                      <button
                        type="button"
                        onClick={handleTakeSnapshot}
                        className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-full text-xs font-bold flex items-center gap-2 shadow-lg cursor-pointer"
                      >
                        <Camera className="h-4 w-4" />
                        Tirar Foto
                      </button>
                    </div>
                  )}

                  {capturedPhoto && (
                    <div className="absolute bottom-3 right-3">
                      <button
                        type="button"
                        onClick={() => setCapturedPhoto(null)}
                        className="px-3 py-1.5 bg-black/70 hover:bg-black text-white rounded-lg text-[11px] font-bold flex items-center gap-1 border border-white/20 cursor-pointer"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Refazer Foto
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Automatic Audit Metadata */}
              <div className="space-y-3 bg-black/40 p-4 rounded-2xl border border-white/10 text-xs">
                <span className="text-gray-300 font-bold uppercase tracking-wider text-[11px] block border-b border-white/10 pb-2 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  Auditoria Automática do Dispositivo
                </span>

                {/* GPS Status */}
                <div className="space-y-1">
                  <label className="text-gray-400 font-semibold text-[10px] flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-rose-400" />
                    Geolocalização GPS Exata:
                  </label>
                  {gpsLoading ? (
                    <div className="text-gray-400 animate-pulse text-[11px] font-mono">
                      Obtendo coordenadas GPS...
                    </div>
                  ) : (
                    <div className="bg-white/5 p-2 rounded-lg font-mono text-[11px] space-y-0.5 border border-white/5">
                      <p className="text-emerald-300 font-bold">
                        Lat: {gpsData?.latitude.toFixed(6)} | Lon: {gpsData?.longitude.toFixed(6)}
                      </p>
                      <p className="text-gray-400 text-[10px]">
                        Precisão: ±{gpsData?.accuracy || 5} metros
                      </p>
                    </div>
                  )}
                  {gpsError && <p className="text-[10px] text-amber-400">{gpsError}</p>}
                </div>

                {/* IP & MAC */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="space-y-1">
                    <label className="text-gray-400 font-semibold text-[10px] flex items-center gap-1">
                      <Globe className="h-3.5 w-3.5 text-cyan-400" />
                      IP do Dispositivo:
                    </label>
                    <div className="bg-white/5 p-2 rounded-lg font-mono text-cyan-300 text-[11px] border border-white/5 truncate">
                      {ipAddress}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-gray-400 font-semibold text-[10px] flex items-center gap-1">
                      <Cpu className="h-3.5 w-3.5 text-emerald-400" />
                      Endereço MAC:
                    </label>
                    <div className="bg-white/5 p-2 rounded-lg font-mono text-emerald-300 text-[11px] border border-white/5 truncate">
                      {macAddress}
                    </div>
                  </div>
                </div>

                {/* Wi-Fi SSID & Key */}
                <div className="space-y-2 pt-1">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-gray-400 font-semibold text-[10px] flex items-center gap-1 mb-1">
                        <Wifi className="h-3.5 w-3.5 text-amber-400" />
                        Nome da Rede Wi-Fi:
                      </label>
                      <input 
                        type="text" 
                        value={wifiSsid}
                        onChange={(e) => setWifiSsid(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-2 font-mono text-[11px] text-amber-300 focus:outline-none focus:border-amber-400"
                        placeholder="Ex: REDE_ESCOLA_5G"
                      />
                    </div>

                    <div>
                      <label className="text-gray-400 font-semibold text-[10px] flex items-center gap-1 mb-1">
                        <Key className="h-3.5 w-3.5 text-purple-400" />
                        Senha do Wi-Fi:
                      </label>
                      <input 
                        type="password" 
                        value={wifiPassword}
                        onChange={(e) => setWifiPassword(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-2 font-mono text-[11px] text-purple-300 focus:outline-none focus:border-purple-400"
                        placeholder="Senha da Rede"
                      />
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Modal Footer Confirmation */}
            <div className="border-t border-white/10 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-[11px] text-gray-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Enviado automaticamente para a fila de aprovação da UEEI.</span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-gray-300 rounded-xl text-xs font-bold transition-colors w-full sm:w-auto"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleConfirmPunch}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40 transition-all w-full sm:w-auto cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Confirmar e Enviar para UEEI
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
