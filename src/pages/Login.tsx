const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError(null);

  // 1. Attempt to sign in
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: pin,
  });

  // 2. If user doesn't exist (Invalid credentials), sign them up instantly
  if (signInError && signInError.message.includes("Invalid login credentials")) {
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password: pin,
      options: {
        // We leave data empty to ensure no database 'NOT NULL' errors occur
        data: {} 
      }
    });

    if (signUpError) {
      setError("Vault Error: " + signUpError.message);
    }
  } else if (signInError) {
    setError(signInError.message);
  }

  setLoading(false);
};
