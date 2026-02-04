"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HyperBorder } from "@/components/design-system";
import Link from "next/link";

const FAQ_ITEMS = [
  {
    question: "Comment fonctionnent les signaux de trading ?",
    answer:
      "Les signaux sont envoyés en temps réel par nos traders vérifiés. Chaque signal inclut le symbole (ex: BTC/USDT), le type de trade (LONG/SHORT), le prix d'entrée, le stop loss et les objectifs de take profit. Vous recevez les signaux sur Discord et dans l'application.",
  },
  {
    question: "Comment sont vérifiés les traders ?",
    answer:
      "Nous connectons directement aux APIs des exchanges (Binance, Bybit) pour récupérer les vraies performances des traders. Pas de screenshots modifiables, uniquement des données vérifiées on-chain. Chaque trader doit avoir un historique d'au moins 30 trades avec un winrate minimum de 55%.",
  },
  {
    question: "Quels moyens de paiement acceptez-vous ?",
    answer:
      "Nous acceptons uniquement les paiements en crypto : USDC sur Base et USDT sur Tron (TRC-20). Pas de carte bancaire requise. Les paiements sont calculés au pro-rata si vous upgradez en cours de mois.",
  },
  {
    question: "Qu'est-ce que la Console de Risque ?",
    answer:
      "La Console de Risque est un outil qui calcule automatiquement la taille de votre position en fonction de votre capital et de votre risque maximum (ex: règle des 2%). Elle vous aide à définir vos SL/TP et à respecter votre plan de trading.",
  },
  {
    question: "Puis-je annuler mon abonnement ?",
    answer:
      "Oui, vous pouvez annuler à tout moment. Votre abonnement restera actif jusqu'à la fin de la période payée. Aucun remboursement n'est possible pour les périodes entamées.",
  },
  {
    question: "Le copy-trading automatique est-il disponible ?",
    answer:
      "Le copy-trading manuel est disponible dès maintenant : vous recevez les signaux et exécutez les trades vous-même. Le copy-trading automatique (exécution automatique sur votre exchange) est en développement et sera disponible prochainement pour les plans Pro et Ultra.",
  },
];

export function FaqSection() {
  return (
    <section className="bg-[var(--bg-obsidian)] py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-[var(--text-primary)] sm:text-4xl">
            Questions Fréquentes
          </h2>
          <p className="text-lg text-[var(--text-secondary)]">
            Tout ce que vous devez savoir pour commencer
          </p>
        </div>

        {/* FAQ Accordion */}
        <HyperBorder className="p-6">
          <Accordion type="single" collapsible className="w-full">
            {FAQ_ITEMS.map((item, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border-b border-[var(--glass-border)] last:border-b-0"
              >
                <AccordionTrigger className="py-4 text-left font-semibold text-[var(--text-primary)] hover:text-[var(--accent-emerald)] hover:no-underline">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="pb-4 text-[var(--text-secondary)]">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </HyperBorder>

        {/* Contact CTA */}
        <p className="mt-8 text-center text-sm text-[var(--text-muted)]">
          Une autre question ?{" "}
          <Link
            href="/contact"
            className="text-[var(--accent-emerald)] hover:underline"
          >
            Contactez-nous
          </Link>
        </p>
      </div>
    </section>
  );
}
