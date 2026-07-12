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
