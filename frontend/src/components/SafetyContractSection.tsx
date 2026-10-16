import React from 'react';
import { ShieldAlert, BookCheck, FileText, Ban, Trash2, HelpCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';

const CONTRACT_RULES = [
  {
    icon: ShieldAlert,
    title: 'Informational Assistant Only',
    desc: 'Law Mithra is an AI assistant, not a replacement for a licensed advocate. It provides legal comprehension, not legal representation.',
    variant: 'verified' as const,
  },
  {
    icon: BookCheck,
    title: 'Mandatory Legal Citations',
    desc: 'Every legal claim, right, or statute reference must be backed by a verified citation or flagged with an [Unverified] label.',
    variant: 'verified' as const,
  },
  {
    icon: Ban,
    title: 'Zero Invention (No Hallucinations)',
    desc: 'The assistant will never invent judgments, case numbers, statutory sections, dates, or court limitation deadlines.',
    variant: 'alleged' as const,
  },
  {
    icon: FileText,
    title: 'Allegations vs. Proven Facts',
    desc: 'Allegations in petitions or complaints are strictly presented as contested claims, never as established factual truths.',
    variant: 'needs-verification' as const,
  },
  {
    icon: HelpCircle,
    title: 'Objective Court Preparation',
    desc: 'Chronologies and dossiers only help organise truthful facts and formulate articulate questions for your advocate.',
    variant: 'verified' as const,
  },
  {
    icon: Trash2,
    title: 'Permanent Data Deletion',
    desc: 'Users hold full data sovereignty. You can delete your uploaded documents, analyses, and history permanently anytime.',
    variant: 'gold' as const,
  },
];

export function SafetyContractSection() {
  return (
    <section id="safety-contract" className="py-16 md:py-24 border-t border-navy-900/10 dark:border-charcoal-100 bg-slate-50/50 dark:bg-charcoal-500/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="verified" withIcon className="mb-3">
            Safety First Legal Tech
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-900 dark:text-ivory tracking-tight">
            AI Safety & Ethics Contract
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-400">
            Law Mithra operates under strict ethical constraints to prevent legal disinformation and protect citizen rights.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CONTRACT_RULES.map((rule, idx) => {
            const Icon = rule.icon;
            return (
              <Card key={idx} className="hover:border-navy-900/30 dark:hover:border-gold-500/30">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 rounded-xl bg-navy-900/5 dark:bg-charcoal-200 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-accent" />
                    </div>
                    <Badge variant={rule.variant}>Rule #{idx + 1}</Badge>
                  </div>
                  <CardTitle className="text-base font-bold">{rule.title}</CardTitle>
                  <CardDescription className="text-xs mt-2">{rule.desc}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
