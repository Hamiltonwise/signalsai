import { supabase } from './supabaseClient';

export const AuthService = {
  async getSession() {
    const { data } = await supabase.auth.getSession();
    return data.session ?? null;
  },
  
  onAuthStateChange(callback: (event: string, session: any) => void) {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
    return () => data.subscription?.unsubscribe();
  },
  
  async signInWithPassword(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },
  
  async signOut() {
    await supabase.auth.signOut();
  },
};

export default AuthService;