import { Shield, Database, Bell } from 'lucide-react'

export default function AdminSettings() {
  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-display font-black text-on-surface tracking-tight">Settings</h1>
        <p className="text-sm text-muted mt-0.5">Admin configuration and platform settings</p>
      </div>

      {/* Admin access instructions */}
      <div className="bg-white rounded-2xl border border-overlay p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-navy/10 flex items-center justify-center">
            <Shield className="w-4.5 h-4.5 text-navy" />
          </div>
          <div>
            <h2 className="text-sm font-display font-black text-on-surface">Grant Admin Access</h2>
            <p className="text-xs text-muted">Promote a user to admin role</p>
          </div>
        </div>
        <p className="text-sm text-muted mb-3">Run the following query in your Supabase SQL Editor to grant admin access to a user:</p>
        <div className="bg-surface-low rounded-xl p-4 font-mono text-xs text-on-surface border border-overlay leading-relaxed select-all">
          {'UPDATE auth.users'}<br />
          {"SET raw_user_meta_data = raw_user_meta_data || '{\"role\":\"admin\"}'"}<br />
          {'WHERE email = \'your@email.com\';'}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-overlay p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
            <Database className="w-4.5 h-4.5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-sm font-display font-black text-on-surface">Supabase Tables in Use</h2>
            <p className="text-xs text-muted">Key data sources for this dashboard</p>
          </div>
        </div>
        <div className="space-y-2">
          {[
            { table: 'profiles', purpose: 'User accounts and metadata' },
            { table: 'ai_chats', purpose: 'AI diagnostic sessions' },
            { table: 'service_providers_raw', purpose: 'Towing and mechanic providers' },
            { table: 'vehicles', purpose: 'User vehicle registrations' },
          ].map(r => (
            <div key={r.table} className="flex items-center gap-3 px-3 py-2.5 bg-surface-low rounded-xl border border-overlay">
              <code className="text-xs font-mono font-bold text-navy">{r.table}</code>
              <span className="text-xs text-muted">—</span>
              <span className="text-xs text-on-surface">{r.purpose}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-overlay p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center">
            <Bell className="w-4.5 h-4.5 text-violet-600" />
          </div>
          <div>
            <h2 className="text-sm font-display font-black text-on-surface">Roadmap</h2>
            <p className="text-xs text-muted">Planned admin features</p>
          </div>
        </div>
        <ul className="space-y-2 text-sm text-muted">
          {[
            'Polar/Stripe webhook → subscriptions table for real billing data',
            'Provider image upload (Supabase Storage bucket)',
            'Bulk provider verification tool',
            'Email notifications for new signups',
            'Export users/providers to CSV',
          ].map(item => (
            <li key={item} className="flex items-start gap-2">
              <span className="text-navy mt-0.5">→</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
