import type { Database } from '@/types/db';
export type Organization = Database['public']['Tables']['organizations']['Row'];
export type Membership = Database['public']['Tables']['memberships']['Row'];
