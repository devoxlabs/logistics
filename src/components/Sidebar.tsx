'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase';
import {
  ArrowDownToLine,
  ArrowUpToLine,
  BarChart3,
  BookOpenText,
  BookUser,
  CircleUserRound,
  ClipboardList,
  CreditCard,
  FileDown,
  FileSpreadsheet,
  FileText,
  FileUp,
  Scale,
  Settings2,
  TrendingUp,
  Truck,
  Users,
  WalletCards,
  LogOut,
  ChevronLeft,
  ChevronRight,
  FilePlus,
  type LucideIcon,
} from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  Icon: LucideIcon;
  children?: MenuItem[];
}

const MENU: MenuItem[] = [
  {
    id: 'add-jobs',
    label: 'Add Jobs',
    Icon: ClipboardList,
    children: [
      { id: 'customer-profile', label: 'Customer Profile', Icon: BookUser },
      { id: 'vendor-profile', label: 'Vendor Profile', Icon: Truck },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    Icon: Settings2,
    children: [
      { id: 'import-shipment-form', label: 'Import Shipment Form', Icon: ArrowDownToLine },
      { id: 'export-shipment-form', label: 'Export Shipment Form', Icon: ArrowUpToLine },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    Icon: BarChart3,
    children: [
      {
        id: 'import-shipment-detail-report',
        label: 'Import Shipment Detail Report',
        Icon: FileDown,
      },
      {
        id: 'export-shipment-detail-report',
        label: 'Export Shipment Detail Report',
        Icon: FileUp,
      },
      {
        id: 'customer-group-ledger',
        label: 'Customer Group Ledger',
        Icon: Users,
      },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    Icon: WalletCards,
    children: [

      { id: 'invoice', label: 'Invoice', Icon: FileText },
      { id: 'billing', label: 'Billing', Icon: CreditCard },
      { id: 'ledger-entry', label: 'Ledger Entry', Icon: FilePlus },
      { id: 'customer-ledger', label: 'Customer Ledger', Icon: BookUser },
      { id: 'vendor-ledger', label: 'Vendor Ledger', Icon: FileSpreadsheet },
      { id: 'general-ledger', label: 'General Ledger', Icon: BookOpenText },
      { id: 'profit-and-loss', label: 'Profit & Loss', Icon: TrendingUp },
      { id: 'balance-sheet', label: 'Balance Sheet', Icon: Scale },
    ],
  },
];

type SidebarVariant = 'desktop' | 'mobile';

interface SidebarProps {
  variant?: SidebarVariant;
  selectedId?: string;
  onSelect?: (id: string) => void;
  onClose?: () => void;
}

export default function Sidebar({
  variant = 'desktop',
  selectedId,
  onSelect,
  onClose,
}: SidebarProps) {
  const [internalActiveId, setInternalActiveId] = useState<string>(selectedId ?? 'add-jobs');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    'add-jobs': true,
    operations: true,
    reports: false,
    finance: false,
  });
  const [collapsed, setCollapsed] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const resolveUserName = (user: User | null) => {
      if (!user) {
        setUserName(null);
        return;
      }
      const fromDisplayName = user.displayName ?? null;
      const fromEmail = user.email ?? undefined;
      const fromEmailPrefix = fromEmail ? fromEmail.split('@')[0] : undefined;

      setUserName(fromDisplayName || fromEmailPrefix || fromEmail || null);
    };

    try {
      const auth = getFirebaseAuth();
      if (auth.currentUser) {
        resolveUserName(auth.currentUser);
      }
      unsubscribe = onAuthStateChanged(auth, (user) => {
        resolveUserName(user);
      });
    } catch (error) {
      console.error(error);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const activeId = selectedId ?? internalActiveId;

  const handleItemClick = (item: MenuItem) => {
    if (!selectedId) {
      setInternalActiveId(item.id);
    }
    if (onSelect) onSelect(item.id);
  };

  const handleSignOut = async () => {
    try {
      const auth = getFirebaseAuth();
      await signOut(auth);
      document.cookie = 'firebaseAuthToken=; Max-Age=0; path=/';
      router.replace('/login');
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleCollapse = () => {
    setCollapsed((prev) => !prev);
  };

  const rootClasses = [
    'bg-white/95 backdrop-blur-xl border-r border-border flex flex-col shadow-2xl transition-all duration-300 ease-in-out',
    variant === 'desktop'
      ? collapsed
        ? 'h-screen w-20'
        : 'h-screen w-72'
      : 'h-full w-full',
  ].join(' ');

  return (
    <aside className={rootClasses}>
      {/* Header / User Profile */}
      <div className='px-4 py-6 flex items-center gap-3 border-b border-border/50'>
        <div className='h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 animate-in zoom-in duration-300'>
          <CircleUserRound className='h-6 w-6' />
        </div>
        {!collapsed && (
          <div className='flex flex-col flex-1 min-w-0'>
            <span className='text-sm font-semibold text-foreground truncate'>
              {userName ?? 'User'}
            </span>
            <span className='text-xs text-muted-foreground truncate'>Signed in</span>
          </div>
        )}
        {variant === 'desktop' ? (
          <button
            type='button'
            onClick={handleToggleCollapse}
            className='ml-auto flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 hover-lift transition-all duration-200 cursor-pointer'
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className='h-4 w-4 transition-transform duration-200' />
            ) : (
              <ChevronLeft className='h-4 w-4 transition-transform duration-200' />
            )}
          </button>
        ) : (
          onClose && (
            <button
              type='button'
              onClick={onClose}
              className='ml-auto flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-secondary-foreground hover:bg-destructive/10 hover:text-destructive hover-lift transition-all duration-200 cursor-pointer group'
              aria-label='Close menu'
            >
              <svg className='h-5 w-5 transition-transform duration-200 group-hover:rotate-90' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
              </svg>
            </button>
          )
        )}
      </div>

      {/* Navigation */}
      <nav className='flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar'>
        {MENU.map((item) => {
          const hasChildren = !!item.children?.length;
          const isExpanded = expanded[item.id];
          const isParentActive = hasChildren
            ? item.children!.some((child) => child.id === activeId)
            : activeId === item.id;

          const buttonClasses = [
            'flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left cursor-pointer transition-all duration-200 group hover-lift',
            isParentActive
              ? 'bg-primary/10 text-primary font-medium shadow-sm'
              : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
          ].join(' ');

          return (
            <div key={item.id}>
              {hasChildren ? (
                <>
                  <button
                    type='button'
                    onClick={() =>
                      setExpanded((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
                    }
                    className={buttonClasses}
                  >
                    <span className='flex items-center gap-3 flex-1 min-w-0'>
                      <item.Icon className='h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110' />
                      {!collapsed && (
                        <span className='text-sm font-medium truncate'>{item.label}</span>
                      )}
                    </span>
                    {!collapsed && (
                      <ChevronRight
                        className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''
                          }`}
                      />
                    )}
                  </button>
                  {isExpanded && !collapsed && (
                    <div className='ml-4 mt-1 space-y-1 border-l-2 border-border/50 pl-3'>
                      {item.children!.map((child) => (
                        <button
                          key={child.id}
                          type='button'
                          onClick={() => handleItemClick(child)}
                          className={[
                            'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left cursor-pointer transition-all duration-200 group',
                            activeId === child.id
                              ? 'bg-primary/10 text-primary font-medium'
                              : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground',
                          ].join(' ')}
                        >
                          <child.Icon className='h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110' />
                          <span className='text-sm truncate'>{child.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <button
                  type='button'
                  onClick={() => handleItemClick(item)}
                  className={buttonClasses}
                >
                  <span className='flex items-center gap-3 flex-1 min-w-0'>
                    <item.Icon className='h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110' />
                    {!collapsed && (
                      <span className='text-sm font-medium truncate'>{item.label}</span>
                    )}
                  </span>
                </button>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer / Sign Out */}
      <div className='px-3 py-4 border-t border-border/50'>
        <button
          type='button'
          onClick={handleSignOut}
          className='flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200 cursor-pointer group hover-lift'
        >
          <LogOut className='h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110' />
          {!collapsed && <span className='text-sm font-medium'>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
