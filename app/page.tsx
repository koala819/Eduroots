import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://sopyqttakjinwjxscgmk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvcHlxdHRha2ppbndqeHNjZ21rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3NjY0NjUsImV4cCI6MjA2NDM0MjQ2NX0.y0cwzKTjf2b7re7u9-Uw3moo5G5_sS4THFyCG-81Hb0',
)

// Fetch user named John along with their orders
const { data, error } = await supabase
  .from('users')
  .select(
    `
    id, name,
    orders (product, quantity)
  `,
  )
  .eq('name', 'John')

if (error) {
  console.error(error)
} else {
  console.log(data)
}
