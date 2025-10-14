import { getRequiredAdmin } from "@/lib/auth/auth-user";
import { prisma } from "@/lib/prisma";
import { route } from "@/lib/zod-route";
import { z } from "zod";

export const GET = route
  .params(
    z.object({
      orgId: z.string(),
    }),
  )
  .handler(async (req, { params }) => {
    await getRequiredAdmin();

    // Get organization with members
    const organization = await prisma.organization.findUnique({
      where: { id: params.orgId },
      include: {
        members: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!organization) {
      return { payments: [], total: 0, totalAmountUSD: 0 };
    }

    // Get user ID (1 org = 1 user in MyCryptoPilot)
    const userId = organization.members[0]?.userId;

    if (!userId) {
      return { payments: [], total: 0, totalAmountUSD: 0 };
    }

    // Fetch all crypto payments for this user
    const payments = await prisma.cryptoPayment.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate total amount in USD
    const totalAmountUSD = payments.reduce((sum, payment) => {
      return sum + parseFloat(payment.amountUSD.toString());
    }, 0);

    // Format payments for response
    const formattedPayments = payments.map((payment) => ({
      id: payment.id,
      network: payment.network,
      txHash: payment.txHash,
      amountToken: payment.amountToken.toString(),
      amountUSD: payment.amountUSD.toString(),
      currency: payment.currency,
      status: payment.status,
      confirmations: payment.confirmations,
      plan: payment.plan,
      daysGranted: payment.daysGranted,
      createdAt: payment.createdAt.toISOString(),
      confirmedAt: payment.confirmedAt?.toISOString() ?? null,
    }));

    return {
      payments: formattedPayments,
      total: payments.length,
      totalAmountUSD,
    };
  });
