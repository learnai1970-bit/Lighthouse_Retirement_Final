import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function TrialGuard({ children }: { children: React.ReactNode }) {
  const [isOwner, setIsOwner] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkStatus() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Check if user is the whitelisted owner
        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('is_owner')
          .eq('id', user.id)
          .single();

        if (fetchError) throw fetchError;
        setIsOwner(data?.is_owner || false);
      } catch (err: any) {
        console.error("TrialGuard Error:", err);
        setError(err.message);
        setIsOwner(false); // Default to non-owner if check fails
      }
    }
    checkStatus();
  }, []);

  if (error) return <div style={{color: 'white', padding: '20px'}}>Error: {error}</div>;
  
  // Show a "Loading" state instead of a white screen
  if (isOwner === null) {
    return (
      <div style={{background: '#020617', height: '100vh', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        Verifying permissions...
      </div>
    );
  }

  return <>{children}</>;
}