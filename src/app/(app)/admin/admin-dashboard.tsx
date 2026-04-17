'use client';
import { useState } from 'react';
import { Users, MessageSquare, ImageIcon, ThumbsUp, ThumbsDown, Heart, Flag, Shield, TrendingUp, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Stats { users: number; conversations: number; images: number }
interface FeedbackItem { id: string; feedback_type: string; message_preview: string | null; comment: string | null; created_at: string }
interface UserItem { id: string; email: string; full_name: string | null; created_at: string }

export function AdminDashboard({ stats, feedback, recentUsers }: { stats: Stats; feedback: FeedbackItem[]; recentUsers: UserItem[] }) {
  const [tab, setTab] = useState<'overview' | 'feedback' | 'users'>('overview');
  const [ff, setFf] = useState('all');
  const fc = { all: feedback.length, up: feedback.filter(f => f.feedback_type === 'up').length, down: feedback.filter(f => f.feedback_type === 'down').length, heart: feedback.filter(f => f.feedback_type === 'heart').length, report: feedback.filter(f => f.feedback_type === 'report').length };
  const filtered = ff === 'all' ? feedback : feedback.filter(f => f.feedback_type === ff);

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1100px] w-full mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center"><Shield className="h-5 w-5 text-red-400" /></div>
        <div><h1 className="font-display text-[28px]">Admin Panel</h1><p className="text-[12px] text-fg-muted">CEO access only</p></div>
      </div>
      <div className="flex gap-1 p-1 rounded-lg border border-border bg-surface-2 w-fit">
        {[{id:'overview',label:'Overview',I:TrendingUp},{id:'feedback',label:'Feedback',I:MessageSquare},{id:'users',label:'Users',I:Users}].map(t=>(<button key={t.id} onClick={()=>setTab(t.id as any)} className={cn('h-8 px-4 rounded-md text-[13px] flex items-center gap-2',tab===t.id?'bg-surface-3 text-fg':'text-fg-muted hover:text-fg')}><t.I className="h-3.5 w-3.5"/>{t.label}</button>))}
      </div>
      {tab==='overview'&&(<div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SC icon={Users} label="Total Users" value={stats.users} color="text-blue-400"/>
          <SC icon={MessageSquare} label="Conversations" value={stats.conversations} color="text-emerald-400"/>
          <SC icon={ImageIcon} label="Images" value={stats.images} color="text-purple-400"/>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[{l:'Positive',v:fc.up,e:'text-emerald-400'},{l:'Negative',v:fc.down,e:'text-red-400'},{l:'Loved',v:fc.heart,e:'text-pink-400'},{l:'Reports',v:fc.report,e:'text-orange-400'}].map(s=>(<div key={s.l} className={cn('rounded-lg border p-3 text-center',s.l==='Reports'&&s.v>0?'border-orange-500/30 bg-orange-500/5':'border-border bg-surface')}><div className={cn('text-[20px] font-display',s.e)}>{s.v}</div><div className="text-[10.5px] text-fg-muted">{s.l}</div></div>))}
        </div>
        {fc.report>0&&(<div className="rounded-lg border border-orange-500/30 bg-orange-500/5 p-4"><div className="flex items-center gap-2 mb-3"><Flag className="h-4 w-4 text-orange-400"/><span className="text-[13px] font-medium text-orange-400">Recent Reports</span></div><div className="space-y-2">{feedback.filter(f=>f.feedback_type==='report').slice(0,5).map(f=>(<div key={f.id} className="rounded-md bg-surface-2 border border-border p-3">{f.comment&&<p className="text-[13px] text-fg-soft italic mb-1">{f.comment}</p>}{f.message_preview&&<p className="text-[11.5px] text-fg-muted line-clamp-2">{f.message_preview}</p>}<span className="text-[10px] text-fg-subtle">{new Date(f.created_at).toLocaleString()}</span></div>))}</div></div>)}
      </div>)}
      {tab==='feedback'&&(<div className="space-y-4">
        <div className="flex gap-2">{['all','up','down','heart','report'].map(f=>(<button key={f} onClick={()=>setFf(f)} className={cn('h-8 px-3 rounded-md text-[12px] border flex items-center gap-1.5',ff===f?'border-gold/40 bg-gold/10 text-gold':'border-border bg-surface-2 text-fg-muted')}><span>{f==='all'?'All':f==='up'?'Good':f==='down'?'Bad':f==='heart'?'Loved':'Reports'}</span><span className="text-[10px]">({fc[f as keyof typeof fc]})</span></button>))}</div>
        {filtered.length===0?<div className="rounded-lg border border-dashed border-border py-12 text-center text-[13px] text-fg-muted">No feedback yet</div>:
        <div className="space-y-2">{filtered.map(f=>(<div key={f.id} className={cn('rounded-lg border p-4',f.feedback_type==='report'?'border-orange-500/20 bg-orange-500/5':f.feedback_type==='up'?'border-emerald-500/20 bg-emerald-500/5':f.feedback_type==='down'?'border-red-500/20 bg-red-500/5':f.feedback_type==='heart'?'border-pink-500/20 bg-pink-500/5':'border-border bg-surface')}><div className="flex items-start gap-3"><span className="text-[18px]">{f.feedback_type==='up'?'Good':f.feedback_type==='down'?'Bad':f.feedback_type==='heart'?'Loved':'Report'}</span><div className="flex-1 min-w-0">{f.message_preview&&<p className="text-[13px] text-fg-soft line-clamp-3">{f.message_preview}</p>}{f.comment&&<div className="mt-2 rounded-md bg-surface-2 border border-border px-3 py-2"><p className="text-[12.5px] text-fg-muted italic">{f.comment}</p></div>}<span className="text-[10.5px] text-fg-subtle mt-2 block">{new Date(f.created_at).toLocaleString()}</span></div></div></div>))}</div>}
      </div>)}
      {tab==='users'&&(<div className="space-y-2">{recentUsers.map(u=>(<div key={u.id} className="rounded-lg border border-border bg-surface p-4 flex items-center gap-4"><div className="h-9 w-9 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center text-[14px] font-display text-gold shrink-0">{(u.full_name??u.email)?.[0]?.toUpperCase()??'?'}</div><div className="flex-1 min-w-0"><div className="text-[14px] truncate">{u.full_name||'No name'}</div><div className="text-[12px] text-fg-muted truncate">{u.email}</div></div><div className="flex items-center gap-1.5 text-[10.5px] text-fg-subtle shrink-0"><Clock className="h-3 w-3"/><span>{new Date(u.created_at).toLocaleDateString()}</span></div></div>))}</div>)}
    </div>
  );
}

function SC({icon:Icon,label,value,color}:{icon:typeof Users;label:string;value:number;color:string}){return(<div className="rounded-xl border border-border bg-surface p-5"><div className="flex items-center gap-3 mb-3"><div className={cn('h-9 w-9 rounded-lg bg-surface-2 border border-border flex items-center justify-center',color)}><Icon className="h-4 w-4"/></div><span className="text-[12px] text-fg-muted uppercase tracking-[0.12em]">{label}</span></div><div className="font-display text-[32px]">{value.toLocaleString()}</div></div>)}
