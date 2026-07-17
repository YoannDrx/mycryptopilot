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
      "Les signaux sont des scénarios de démonstration ou des données attribuées à leur source. Ils servent à tester une exposition dans la Console de Risque ; MyCryptoPilot ne transmet aucun ordre à un exchange.",
  },
  {
    question: "Comment sont vérifiés les traders ?",
    answer:
      "Une statistique est marquée comme vérifiée uniquement lorsqu'elle provient d'un historique synchronisé via une clé Binance ou Bybit strictement en lecture seule. Les jeux d'exemple sont toujours étiquetés Démo / Testnet et ne constituent pas une preuve de performance future.",
  },
  {
    question: "Faut-il payer ou déposer des fonds ?",
    answer:
      "Non. Cette version est un démonstrateur technique gratuit. Elle n'accepte ni carte, ni paiement crypto, ni dépôt et ne conserve jamais vos fonds.",
  },
  {
    question: "Qu'est-ce que la Console de Risque ?",
    answer:
      "La Console de Risque est un outil qui calcule automatiquement la taille de votre position en fonction de votre capital et de votre risque maximum (ex: règle des 2%). Elle vous aide à définir vos SL/TP et à respecter votre plan de trading.",
  },
  {
    question: "Mes clés peuvent-elles exécuter un trade ?",
    answer:
      "Non. Les clés avec une permission de trading sont refusées, les méthodes de création et d'annulation d'ordre sont bloquées dans l'adaptateur commun, et les anciens workers d'exécution ne peuvent pas démarrer.",
  },
  {
    question: "Le copy-trading automatique est-il disponible ?",
    answer:
      "Non. Le copy-trading réel est hors périmètre : il n'est ni vendu, ni annoncé, ni accessible par deep-link. La Console de Risque simule uniquement la taille et la perte potentielle d'une position.",
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
