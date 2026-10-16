import React from 'react';
import { motion } from 'framer-motion';
import { FileUp, Languages, Scale, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';

const STEPS = [
  {
    step: '01',
    title: 'Upload Legal Document',
    description:
      'Securely provide scanned petitions, FIRs, court notices, lease agreements, or orders in PDF or image format.',
    icon: FileUp,
    badge: 'Privacy Protected',
    badgeVariant: 'outline' as const,
    highlights: ['One-click permanent deletion', 'Encrypted local processing', 'No public AI training'],
  },
  {
    step: '02',
    title: 'Instant Multilingual Simplification',
    description:
      'The engine breaks down complex, archaic legal jargon into plain language across 8 Indian languages.',
    icon: Languages,
    badge: 'Indic Scripts',
    badgeVariant: 'gold' as const,
    highlights: ['Kannada, Hindi, Telugu, Tamil', 'Malayalam, Marathi, Bengali', 'Simple citizen-first phrasing'],
  },
  {
    step: '03',
    title: 'Verified Rights & Advocate Prep',
    description:
      'Extract critical deadlines, pinpoint statutory rights, and distinguish mere allegations from proven facts.',
    icon: Scale,
    badge: 'Safety Enforced',
    badgeVariant: 'verified' as const,
    highlights: ['Allegations flagged explicitly', 'Statute & section citations', 'Questions for your advocate'],
  },
];

export function ExplainerSteps() {
  return (
    <section id="explainer" className="py-16 md:py-24 border-t border-navy-900/10 dark:border-charcoal-100 bg-white/50 dark:bg-charcoal-500/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="gold" className="mb-3">
            Three-Step Workflow
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-900 dark:text-ivory tracking-tight">
            How Law Mithra Empowers You
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-400">
            From convoluted legalese to clear, structured legal comprehension in minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STEPS.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
              >
                <Card className="h-full relative overflow-hidden group hover:border-gold-500/40 dark:hover:border-gold-500/30">
                  {/* Top Step Accent Header */}
                  <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity font-extrabold text-6xl text-navy-900 dark:text-gold-400 select-none pointer-events-none">
                    {item.step}
                  </div>

                  <CardHeader>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-navy-900/5 dark:bg-charcoal-200 border border-navy-900/10 dark:border-charcoal-100 flex items-center justify-center group-hover:bg-gold-500/10 group-hover:border-gold-500/30 transition-colors">
                        <Icon className="w-6 h-6 text-navy-900 dark:text-gold-400" />
                      </div>
                      <Badge variant={item.badgeVariant}>
                        {item.badge}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl">
                      {item.title}
                    </CardTitle>
                    <CardDescription className="text-sm mt-2">
                      {item.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <ul className="space-y-2.5 pt-4 border-t border-navy-900/5 dark:border-charcoal-100">
                      {item.highlights.map((h, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                          <CheckCircle2 className="w-4 h-4 text-verified shrink-0" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
