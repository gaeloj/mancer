export const maskMoney = (val: string): string => {
  // Strip all non-digits
  const digits = val.replace(/\D/g, '');
  if (!digits) return '';
  const numValue = parseInt(digits, 10) / 100;
  return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numValue);
};

export const parseMaskedMoney = (val: string): number => {
  if (!val) return 0;
  // Replace all dots with nothing, then replace comma with dot
  const clean = val.replace(/\./g, '').replace(',', '.');
  return parseFloat(clean) || 0;
};

export const maskDate = (val: string): string => {
  // Only allow digits
  const clean = val.replace(/\D/g, '');
  if (clean.length === 0) return '';
  
  let formatted = '';
  if (clean.length <= 2) {
    formatted = clean;
  } else if (clean.length <= 4) {
    formatted = `${clean.slice(0, 2)}/${clean.slice(2)}`;
  } else {
    formatted = `${clean.slice(0, 2)}/${clean.slice(2, 4)}/${clean.slice(4, 8)}`;
  }
  return formatted;
};

export const dateToISO = (brDate: string): string => {
  if (!brDate) return '';
  const parts = brDate.split('/');
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    if (year.length === 4) {
      return `${year}-${month}-${day}`;
    }
  }
  return brDate;
};

export const dateToBRL = (isoDate: string): string => {
  if (!isoDate) return '';
  if (isoDate.includes('/')) return isoDate; // already in BRL format
  const parts = isoDate.split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const month = parts[1];
    const day = parts[2];
    return `${day}/${month}/${year}`;
  }
  return isoDate;
};

export const maskTime = (val: string): string => {
  // Strip all non-digits
  const clean = val.replace(/\D/g, '');
  if (clean.length === 0) return '';
  
  let formatted = '';
  if (clean.length <= 2) {
    formatted = clean;
  } else if (clean.length <= 4) {
    formatted = `${clean.slice(0, 2)}:${clean.slice(2)}`;
  } else {
    formatted = `${clean.slice(0, 2)}:${clean.slice(2, 4)}:${clean.slice(4, 6)}`;
  }
  return formatted;
};

export const maskCpfCnpj = (val: string): string => {
  const clean = val.replace(/\D/g, '').slice(0, 14);
  if (clean.length <= 11) {
    // CPF: 000.000.000-00
    return clean
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  } else {
    // CNPJ: 00.000.000/0000-00
    return clean
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  }
};

export const formatBRL = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export const generateAuthCode7 = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 7; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const formatDateTimeBRL = (dateString?: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

export const calculateMembershipDuration = (joiningDateStr: string): string => {
  if (!joiningDateStr) return 'Não informado';
  
  let isoDate = joiningDateStr;
  if (joiningDateStr.includes('/')) {
    isoDate = dateToISO(joiningDateStr);
  }
  
  const joiningDate = new Date(isoDate + 'T00:00:00');
  const now = new Date();
  
  if (isNaN(joiningDate.getTime())) return 'Não informado';
  if (joiningDate > now) return 'Filiação Futura';
  
  let years = now.getFullYear() - joiningDate.getFullYear();
  let months = now.getMonth() - joiningDate.getMonth();
  let days = now.getDate() - joiningDate.getDate();
  
  if (days < 0) {
    months--;
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonth.getDate();
  }
  
  if (months < 0) {
    years--;
    months += 12;
  }
  
  const parts: string[] = [];
  if (years > 0) {
    parts.push(`${years} ${years === 1 ? 'ano' : 'anos'}`);
  }
  if (months > 0) {
    parts.push(`${months} ${months === 1 ? 'mês' : 'meses'}`);
  }
  if (days > 0 || parts.length === 0) {
    parts.push(`${days} ${days === 1 ? 'dia' : 'dias'}`);
  }
  
  if (parts.length === 0) return 'Menos de 1 dia';
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} e ${parts[1]}`;
  return `${parts[0]}, ${parts[1]} e ${parts[2]}`;
};

export const calculateAssociateContribution = (
  associate: { joiningDate?: string; monthlyFee?: number; financialStatus?: string; status?: string },
  defaultFee: number = 10
): { monthsElapsed: number; monthlyFee: number; totalContributed: number; isAdimplente: boolean } => {
  const fee = (associate.monthlyFee && associate.monthlyFee > 0) ? associate.monthlyFee : defaultFee;
  const isAdimplente = associate.financialStatus === 'Adimplente' || !associate.financialStatus;

  if (!associate.joiningDate) {
    return { monthsElapsed: 0, monthlyFee: fee, totalContributed: 0, isAdimplente };
  }

  let isoDate = associate.joiningDate;
  if (associate.joiningDate.includes('/')) {
    isoDate = dateToISO(associate.joiningDate);
  }

  const joiningDate = new Date(isoDate + 'T00:00:00');
  const now = new Date();

  if (isNaN(joiningDate.getTime()) || joiningDate > now) {
    return { monthsElapsed: 0, monthlyFee: fee, totalContributed: 0, isAdimplente };
  }

  let yearsDiff = now.getFullYear() - joiningDate.getFullYear();
  let monthsDiff = now.getMonth() - joiningDate.getMonth();
  let totalMonths = yearsDiff * 12 + monthsDiff + 1;
  if (totalMonths < 1) totalMonths = 1;

  const totalContributed = isAdimplente ? totalMonths * fee : 0;

  return {
    monthsElapsed: totalMonths,
    monthlyFee: fee,
    totalContributed,
    isAdimplente
  };
};

export const formatMatricula = (value: string | number): string => {
  const clean = String(value || '').replace(/\D/g, '');
  if (!clean) return '00001';
  const num = parseInt(clean, 10);
  if (isNaN(num) || num <= 0) return '00001';
  const capped = Math.min(num, 99999);
  return String(capped).padStart(5, '0');
};

export const getNextMatriculaNumber = (members: { id?: string; matricula?: string }[]): string => {
  let maxNum = 0;
  if (members && members.length > 0) {
    members.forEach(m => {
      if (m.matricula) {
        const num = parseInt(String(m.matricula).replace(/\D/g, ''), 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    });
  }
  const nextNum = maxNum + 1;
  if (nextNum > 99999) return '99999';
  return String(nextNum).padStart(5, '0');
};

export const isMatriculaInUse = (
  targetMatricula: string,
  members: { id?: string; matricula?: string }[],
  currentId?: string
): boolean => {
  const formattedTarget = formatMatricula(targetMatricula);
  return members.some(m => {
    if (currentId && m.id === currentId) return false;
    if (!m.matricula) return false;
    return formatMatricula(m.matricula) === formattedTarget;
  });
};

export const numberToWordsBRL = (amount: number): string => {
  if (isNaN(amount) || amount <= 0) return 'zero reais';

  const units = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
  const teens = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
  const tens = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
  const hundreds = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

  const convertGroup = (n: number): string => {
    if (n === 0) return '';
    if (n === 100) return 'cem';
    let res = '';
    const h = Math.floor(n / 100);
    const rem = n % 100;
    if (h > 0) res += hundreds[h];
    if (rem > 0) {
      if (res) res += ' e ';
      if (rem < 10) {
        res += units[rem];
      } else if (rem < 20) {
        res += teens[rem - 10];
      } else {
        const t = Math.floor(rem / 10);
        const u = rem % 10;
        res += tens[t];
        if (u > 0) res += ' e ' + units[u];
      }
    }
    return res;
  };

  const integerPart = Math.floor(amount);
  const centsPart = Math.round((amount - integerPart) * 100);

  let result = '';

  if (integerPart === 0) {
    result = 'zero reais';
  } else {
    const thousands = Math.floor(integerPart / 1000);
    const rest = integerPart % 1000;

    if (thousands > 0) {
      if (thousands === 1) {
        result += 'mil';
      } else {
        result += convertGroup(thousands) + ' mil';
      }
      if (rest > 0) {
        if (rest < 100 || rest % 100 === 0) {
          result += ' e ';
        } else {
          result += ', ';
        }
      }
    }

    if (rest > 0 || thousands === 0) {
      result += convertGroup(rest);
    }

    result += integerPart === 1 ? ' real' : ' reais';
  }

  if (centsPart > 0) {
    result += ' e ';
    if (centsPart < 10) {
      result += units[centsPart];
    } else if (centsPart < 20) {
      result += teens[centsPart - 10];
    } else {
      const t = Math.floor(centsPart / 10);
      const u = centsPart % 10;
      result += tens[t];
      if (u > 0) result += ' e ' + units[u];
    }
    result += centsPart === 1 ? ' centavo' : ' centavos';
  }

  return result;
};

