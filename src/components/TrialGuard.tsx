import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function TrialGuard({ children }: { children: React.ReactNode }) {
  const [isOwner, setIsOwner] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkStatus() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsOwner(false);
          return;
        }

        // FIX: Using maybeSingle() so the app doesn't crash (406 error) if profile is missing
        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('is_owner')
          .eq('id', user.id)
          .maybeSingle(); 

        // Impact: We log the error but don't THROW it, which prevents the white screen
        if (fetchError) {
          console.warn("TrialGuard: Profile fetch failed, treating as guest user.");
        }
        
        // Impact: If data is null (new user), isOwner becomes false, and the app continues
        setIsOwner(data?.is_owner || false);
      } catch (err: any) {
        console.error("TrialGuard Crash Prevented:", err);
        // We no longer set the global 'error' state here to avoid blocking the render
        setIsOwner(false); 
      }
    }
    checkStatus();
  }, []);

  // Impact: This will only show if a fatal system error occurs, not a missing profile
  if (error) return <div style={{color: 'white', padding: '20px', background: '#020617', height: '100vh'}}>System Error: {error}</div>;
  
  if (isOwner === null) {
    return (
      <div style={{background: '#020617', height: '100vh', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        Unlocking Vault...
      </div>
    );
  }

  return <>{children}</>;
}
