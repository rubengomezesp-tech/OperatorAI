from pathlib import Path

filepath = Path("src/middleware.ts")
content = filepath.read_text(encoding='utf-8')

# El fix: el middleware debe ACTUALIZAR cookies, no solo leer
old_middleware_block = """try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return req.cookies.getAll(); },
          setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
            cookiesToSet.forEach(({ name, value }: { name: string; value: string; options?: any }) => {
              req.cookies.set(name, value);
            });
            res = NextResponse.next({ request: req });
            res.headers.set('x-pathname', req.nextUrl.pathname);
            cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options?: any }) => {
              res.cookies.set(name, value, options);
            });
          },
        },
      },
    );
    await supabase.auth.getUser();
  } catch {}"""

new_middleware_block = """try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return req.cookies.getAll(); },
          setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
            cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options?: any }) => {
              req.cookies.set(name, value);
            });
            // IMPORTANTE: Modificar la response existente, no crear una nueva
            cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options?: any }) => {
              res.cookies.set(name, value, options);
            });
          },
        },
      },
    );
    const { data: { session } } = await supabase.auth.getSession();
    // Si hay session pero no cookies, forzar refresh
    if (session && !req.cookies.getAll().some(c => c.name.includes('auth-token'))) {
      const { data: { session: refreshed } } = await supabase.auth.refreshSession();
      // Cookies ya se setearon via setAll
    }
  } catch {}"""

if old_middleware_block in content:
    content = content.replace(old_middleware_block, new_middleware_block)
    print("✅ Middleware fixed: ahora preserva sesiones correctamente")
    
    filepath.write_text(content, encoding='utf-8')
    print("✅ middleware.ts actualizado")
else:
    print("⚠️  No se encontró el bloque exacto en middleware.ts")
    print("   Revisa manualmente la función setAll")
