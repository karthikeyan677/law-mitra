import React from 'react';
import { Palette, Layers, Bell, Shield, Type, CheckCircle2, AlertTriangle, AlertCircle, HelpCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Skeleton } from './ui/Skeleton';
import { useToast } from './ui/Toast';

export function DesignSystemShowcase() {
  const { toast } = useToast();

  const colorTokens = [
    { name: 'Navy (Primary)', hex: '#0B1F3A', bg: 'bg-[#0B1F3A]', text: 'text-white' },
    { name: 'Gold (Accent)', hex: '#C9A227', bg: 'bg-[#C9A227]', text: 'text-navy-950' },
    { name: 'Ivory (Light Bg)', hex: '#FAF7F0', bg: 'bg-[#FAF7F0] border border-slate-300', text: 'text-navy-900' },
    { name: 'Charcoal (Dark Bg)', hex: '#0F141B', bg: 'bg-[#0F141B]', text: 'text-white' },
    { name: 'Teal (Verified)', hex: '#1F8A70', bg: 'bg-[#1F8A70]', text: 'text-white' },
    { name: 'Amber (Needs Verify)', hex: '#D98E04', bg: 'bg-[#D98E04]', text: 'text-white' },
    { name: 'Soft Red (Alleged/Error)', hex: '#C0392B', bg: 'bg-[#C0392B]', text: 'text-white' },
  ];

  return (
    <section id="design-system" className="py-16 md:py-24 border-t border-navy-900/10 dark:border-charcoal-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="default" className="mb-3">
            Phase 0 Foundation
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-900 dark:text-ivory tracking-tight">
            Design Tokens & UI Component System
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-400">
            Engineered with strict adherence to Indian legal aesthetics: authoritative Navy, dignified Gold, 8-point rhythm, and explicit semantic status badges.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Palette Token Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-accent" />
                <CardTitle className="text-lg">Color Token Palette</CardTitle>
              </div>
              <CardDescription>
                Specified hex tokens with exact dark and light semantic mappings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {colorTokens.map((c) => (
                  <div
                    key={c.name}
                    className="p-3 rounded-xl border border-navy-900/5 dark:border-charcoal-100 flex flex-col gap-2 bg-slate-50/50 dark:bg-charcoal-300/40"
                  >
                    <div className={`w-full h-10 rounded-lg ${c.bg} shadow-sm flex items-center justify-center font-mono text-xs font-bold ${c.text}`}>
                      {c.hex}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-navy-900 dark:text-ivory leading-tight">{c.name}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Legal Badges Showcase Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-verified" />
                <CardTitle className="text-lg">Legal Semantic Badges</CardTitle>
              </div>
              <CardDescription>
                Distinct visual signifiers ensuring allegations are never confused with facts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-2.5">
                <Badge variant="verified" withIcon>
                  Verified Fact
                </Badge>
                <Badge variant="needs-verification" withIcon>
                  Needs Verification
                </Badge>
                <Badge variant="alleged" withIcon>
                  Allegation (Contested)
                </Badge>
                <Badge variant="missing" withIcon>
                  Missing Document
                </Badge>
                <Badge variant="gold">
                  Statute IPC § 420
                </Badge>
                <Badge variant="outline">
                  Civil Procedure
                </Badge>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-charcoal-300/40 border border-navy-900/5 dark:border-charcoal-100 text-xs text-slate-600 dark:text-slate-300 space-y-2">
                <div className="font-semibold text-navy-900 dark:text-ivory">Legal Safety Rule in Action:</div>
                <div className="flex items-start gap-2">
                  <Badge variant="alleged" withIcon className="shrink-0 mt-0.5">Allegation</Badge>
                  <span>"Complainant alleges defendant defaulted on invoice dated 12/04/2023." (Contested, unadjudicated claim)</span>
                </div>
                <div className="flex items-start gap-2">
                  <Badge variant="verified" withIcon className="shrink-0 mt-0.5">Verified</Badge>
                  <span>"Bank transaction receipt #TX9481 confirms payment of ₹50,000 on 15/04/2023." (Corroborated by bank ledger)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Buttons & Interactive States */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-navy-900 dark:text-gold-400" />
                <CardTitle className="text-lg">Buttons & States</CardTitle>
              </div>
              <CardDescription>
                Reusable buttons featuring 12px radius, 8-point spacing, and loading indicators.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary">Primary Navy</Button>
                <Button variant="gold">Gold Accent</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="destructive">Destructive</Button>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm" variant="primary">Small</Button>
                <Button size="md" variant="primary">Medium</Button>
                <Button size="lg" variant="primary">Large</Button>
                <Button variant="gold" isLoading>Processing</Button>
                <Button variant="secondary" disabled>Disabled</Button>
              </div>
            </CardContent>
          </Card>

          {/* Skeletons & Toast Showcase */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-accent" />
                <CardTitle className="text-lg">Skeletons & Toast Notification</CardTitle>
              </div>
              <CardDescription>
                Loading states for document processing and instant feedback toasts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Skeleton loading demo */}
              <div className="p-4 rounded-xl border border-navy-900/5 dark:border-charcoal-100 bg-slate-50/50 dark:bg-charcoal-300/30 space-y-2.5">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-9 h-9 rounded-xl" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-3.5 w-1/3" />
                    <Skeleton className="h-2.5 w-2/3" />
                  </div>
                </div>
                <Skeleton className="h-2.5 w-full mt-2" />
                <Skeleton className="h-2.5 w-5/6" />
              </div>

              {/* Toast Interactive Triggers */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Test Toast System:</span>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      toast({
                        title: 'Document Verified',
                        description: 'Statutory section citations successfully verified against legal database.',
                        type: 'success',
                      })
                    }
                  >
                    Success Toast
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      toast({
                        title: 'Unverified Citation Found',
                        description: 'Section 482 CrPC requires cross-verification with original petition.',
                        type: 'warning',
                      })
                    }
                  >
                    Warning Toast
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      toast({
                        title: 'Safety Check Triggered',
                        description: 'System blocked generation of an unverified court deadline.',
                        type: 'error',
                      })
                    }
                  >
                    Error Toast
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
