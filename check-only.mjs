import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const { data, error } = await supabase
  .from('users')
  .select('id, email, stripe_customer_id')
  .eq('stripe_customer_id', 'cus_UL1DOwzcoXwfE0')

console.log('Registros encontrados:', data?.length || 0)
console.log('Datos:', data)
console.log('Error:', error)
