import { MockupStudioView } from '@/features/ai-mockup/components/mockup-studio-view';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function MockupPage() {
  if (process.env.MOCKUP_ENGINE_ENABLED !== 'true') {
    redirect('/chat');
  }
  return <MockupStudioView />;
}
