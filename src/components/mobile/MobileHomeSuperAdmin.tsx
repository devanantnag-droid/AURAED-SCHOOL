import { useEffect, useState } from 'react';
import { School as SchoolIcon, CreditCard, LifeBuoy, Megaphone, UserCog } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { MobileHomeHeader } from '@/components/mobile/MobileHeader';
import { SummaryCard, IconGridTile } from '@/components/mobile/MobileTiles';

export function MobileHomeSuperAdmin() {
  const { profile } = useAuth();
  const [counts, setCounts] = useState<{ total: number; active: number } | null>(null);

  useEffect(() => {
    supabase
      .from('schools')
      .select('is_active')
      .then(({ data }) => {
        if (!data) return;
        setCounts({ total: data.length, active: data.filter((s) => s.is_active).length });
      });
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div>
      <MobileHomeHeader subtitle="Super Admin" />

      <div className="p-4">
        <p className="mb-4 text-lg font-semibold text-primary-900 dark:text-gray-50">
          {greeting}, {profile?.fullName?.split(' ')[0] ?? 'there'}
        </p>

        <div className="mb-5 grid grid-cols-2 gap-3">
          <SummaryCard label="Total schools" value={counts?.total} />
          <SummaryCard label="Active schools" value={counts?.active} />
        </div>

        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Quick actions</p>
        <div className="grid grid-cols-3 gap-3">
          <IconGridTile to="/super-admin/schools" icon={SchoolIcon} label="Schools" />
          <IconGridTile to="/super-admin/plans" icon={CreditCard} label="Plans" />
          <IconGridTile to="/super-admin/tickets" icon={LifeBuoy} label="Tickets" />
          <IconGridTile to="/super-admin/announcements" icon={Megaphone} label="Announce" />
          <IconGridTile to="/super-admin/account" icon={UserCog} label="Account" />
        </div>
      </div>
    </div>
  );
}
