import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Ver todas las columnas de users
const { data: users } = await supabase
  .from('users')
  .select('*')
  .limit(1)

console.log('=== COLUMNAS DE USERS ===')
console.log(users?.[0] ? Object.keys(users[0]) : 'Tabla vacía o no existe')

// Intentar con profiles
const { data: profiles } = await supabase
  .from('profiles')
  .select('*')
  .limit(1)

console.log('\n=== COLUMNAS DE PROFILES ===')
console.log(profiles?.[0] ? Object.keys(profiles[0]) : 'Tabla no existe')

// Intentar con customers
const { data: customers } = await supabase
  .from('customers')
  .select('*')
  .limit(1)

console.log('\n=== COLUMNAS DE CUSTOMERS ===')
console.log(customers?.[0] ? Object.keys(customers[0]) : 'Tabla no existe')

// Buscar cualquier columna que tenga "stripe" en cualquier tabla
console.log('\n🔍 Buscando todas las columnas con "stripe"...')
