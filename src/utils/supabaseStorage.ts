import { getSupabaseClient } from '../lib/supabase';
import { Associate, Transaction, Announcement, ReportCopy, Assembly, Poll, EntityConfig, AdminConfig, Charge } from '../types';

// Helper to convert any object to a clean format
function cleanForDatabase<T>(data: T): T {
  return JSON.parse(JSON.stringify(data, (_, value) => value === undefined ? null : value)) as T;
}

// Local cache helpers to guarantee data persistence even if remote DB errors out or is uninitialized
export function getLocalCache<T extends { id: string }>(key: string, fallback: T[]): T[] {
  try {
    const raw = localStorage.getItem(`union_db_${key}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn(`Erro ao ler cache local para ${key}:`, e);
  }
  return fallback;
}

export function saveLocalCacheItem<T extends { id: string }>(key: string, id: string, item: T): void {
  try {
    const items = getLocalCache<T>(key, []);
    const idx = items.findIndex(i => i.id === id);
    if (idx >= 0) {
      items[idx] = item;
    } else {
      items.unshift(item);
    }
    localStorage.setItem(`union_db_${key}`, JSON.stringify(items));
  } catch (e) {
    console.warn(`Erro ao salvar no cache local para ${key}:`, e);
  }
}

export function deleteLocalCacheItem(key: string, id: string): void {
  try {
    const items = getLocalCache<any>(key, []);
    const filtered = items.filter(i => i.id !== id);
    localStorage.setItem(`union_db_${key}`, JSON.stringify(filtered));
  } catch (e) {
    console.warn(`Erro ao deletar do cache local para ${key}:`, e);
  }
}

export function saveLocalCacheCollection<T>(key: string, items: T[]): void {
  try {
    localStorage.setItem(`union_db_${key}`, JSON.stringify(items));
  } catch (e) {
    console.warn(`Erro ao atualizar cache local para ${key}:`, e);
  }
}

// Helper to sync remote Supabase table with local cache fallback
async function syncSupabaseTable<T extends { id: string }>(
  tableName: string,
  initialData: T[]
): Promise<T[]> {
  const localItems = getLocalCache<T>(tableName, initialData);
  const supabase = getSupabaseClient();
  
  if (!supabase) return localItems;

  try {
    const { data: rows, error } = await supabase.from(tableName).select('*');
    
    if (error) {
      console.warn(`Tabela Supabase '${tableName}' inacessível (${error.message}). Usando armazenamento local.`);
      return localItems;
    }

    if (!rows || rows.length === 0) {
      // Seed table with current localItems
      for (const item of localItems) {
        const payload: any = { id: item.id, data: cleanForDatabase(item) };
        if ('name' in item) payload.name = (item as any).name;
        if ('email' in item) payload.email = (item as any).email;
        if ('cpf' in item) payload.cpf = (item as any).cpf;
        if ('status' in item) payload.status = (item as any).status;
        if ('date' in item) payload.date = (item as any).date;
        if ('type' in item) payload.type = (item as any).type;
        if ('title' in item) payload.title = (item as any).title;
        if ('category' in item) payload.category = (item as any).category;
        
        try {
          await supabase.from(tableName).upsert(payload);
        } catch (e) {}
      }
      return localItems;
    }

    const fetched: T[] = rows.map(row => {
      if (row.data) {
        return { ...row.data, id: row.id } as T;
      }
      return row as unknown as T;
    });

    saveLocalCacheCollection(tableName, fetched);
    return fetched;
  } catch (err) {
    console.error(`Erro ao sincronizar '${tableName}' com Supabase:`, err);
    return localItems;
  }
}

export async function getSupabaseAssociates(initialData: Associate[]): Promise<Associate[]> {
  return syncSupabaseTable<Associate>('associates', initialData);
}

export async function getSupabaseTransactions(initialData: Transaction[]): Promise<Transaction[]> {
  return syncSupabaseTable<Transaction>('transactions', initialData);
}

export async function getSupabaseAnnouncements(initialData: Announcement[]): Promise<Announcement[]> {
  return syncSupabaseTable<Announcement>('announcements', initialData);
}

export async function getSupabaseClients(initialData: Associate[]): Promise<Associate[]> {
  return syncSupabaseTable<Associate>('clients', initialData);
}

export async function getSupabaseReports(): Promise<ReportCopy[]> {
  return syncSupabaseTable<ReportCopy>('reports', []);
}

export async function getSupabaseAssemblies(initialData: Assembly[]): Promise<Assembly[]> {
  return syncSupabaseTable<Assembly>('assemblies', initialData);
}

export async function getSupabasePolls(initialData: Poll[]): Promise<Poll[]> {
  return syncSupabaseTable<Poll>('polls', initialData);
}

export async function getSupabaseCharges(initialData: Charge[]): Promise<Charge[]> {
  return syncSupabaseTable<Charge>('charges', initialData);
}

// CUD operations with multi-tier persistence (Local Cache + Supabase)
export async function saveSupabaseRecord(tableName: string, id: string, item: any): Promise<void> {
  // Always write to local cache first so UI is immediately updated and persistent
  saveLocalCacheItem(tableName, id, item);

  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    const payload: any = { id, data: cleanForDatabase(item) };
    if ('name' in item) payload.name = item.name;
    if ('email' in item) payload.email = item.email;
    if ('cpf' in item) payload.cpf = item.cpf;
    if ('status' in item) payload.status = item.status;
    if ('date' in item) payload.date = item.date;
    if ('type' in item) payload.type = item.type;
    if ('title' in item) payload.title = item.title;
    if ('category' in item) payload.category = item.category;

    const { error } = await supabase.from(tableName).upsert(payload);
    if (error) {
      console.warn(`Supabase upsert avisou em '${tableName}': ${error.message}. Salvo localmente.`);
    }
  } catch (err) {
    console.error(`Erro ao salvar no Supabase (${tableName}):`, err);
  }
}

export async function deleteSupabaseRecord(tableName: string, id: string): Promise<void> {
  deleteLocalCacheItem(tableName, id);

  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    const { error } = await supabase.from(tableName).delete().eq('id', id);
    if (error) {
      console.warn(`Supabase delete avisou em '${tableName}': ${error.message}`);
    }
  } catch (err) {
    console.error(`Erro ao deletar no Supabase (${tableName}):`, err);
  }
}

// Configs
export async function getSupabaseEntityConfig(defaultConfig: EntityConfig): Promise<EntityConfig> {
  try {
    const rawLocal = localStorage.getItem('union_db_config_entity');
    if (rawLocal) {
      return JSON.parse(rawLocal) as EntityConfig;
    }
  } catch (e) {}

  const supabase = getSupabaseClient();
  if (!supabase) return defaultConfig;

  try {
    const { data, error } = await supabase.from('configs').select('*').eq('id', 'entity').single();
    if (error || !data) {
      try {
        await supabase.from('configs').upsert({ id: 'entity', data: cleanForDatabase(defaultConfig) });
      } catch (e) {}
      localStorage.setItem('union_db_config_entity', JSON.stringify(defaultConfig));
      return defaultConfig;
    }
    const result = (data.data || defaultConfig) as EntityConfig;
    localStorage.setItem('union_db_config_entity', JSON.stringify(result));
    return result;
  } catch (err) {
    console.error("Erro ao buscar configuração de entidade no Supabase:", err);
    return defaultConfig;
  }
}

const DEFAULT_ADMIN_CONFIG: AdminConfig = {
  email: '@gaeloj.com.br',
  password: '@Goj030824',
  isConfigured: true
};

export async function getSupabaseAdminConfig(): Promise<AdminConfig | null> {
  try {
    const rawLocal = localStorage.getItem('union_db_config_admin');
    if (rawLocal) {
      return JSON.parse(rawLocal) as AdminConfig;
    }
  } catch (e) {}

  const supabase = getSupabaseClient();
  if (!supabase) return DEFAULT_ADMIN_CONFIG;

  try {
    const { data, error } = await supabase.from('configs').select('*').eq('id', 'admin').single();
    if (error || !data) {
      try {
        await supabase.from('configs').upsert({ id: 'admin', data: cleanForDatabase(DEFAULT_ADMIN_CONFIG) });
      } catch (e) {}
      localStorage.setItem('union_db_config_admin', JSON.stringify(DEFAULT_ADMIN_CONFIG));
      return DEFAULT_ADMIN_CONFIG;
    }
    const result = (data.data || DEFAULT_ADMIN_CONFIG) as AdminConfig;
    localStorage.setItem('union_db_config_admin', JSON.stringify(result));
    return result;
  } catch (err) {
    console.error("Erro ao buscar configuração de admin no Supabase:", err);
    return DEFAULT_ADMIN_CONFIG;
  }
}
