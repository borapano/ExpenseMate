export type ExpenseStatus = 'SETTLED' | 'IN_VERIFICATION' | 'DEBT' | 'RECEIVABLE';

export interface StatusInfo {
    status: ExpenseStatus;
    label: string;
    colorClass: string;
    amount?: number;
    isPending?: boolean;
    isActionRequired?: boolean;
    isWaitingForOther?: boolean;
}

/**
 * Determines the display status of a single expense row for the current user.
 *
 * Priority:
 *   1. IN_VERIFICATION — backend set transaction_status = 'PENDING' for this expense
 *   2. DEBT            — user owes money (balance < 0)
 *   3. RECEIVABLE      — user is owed money (balance > 0)
 *   4. ISSUED/SETTLED  — fully resolved
 *
 * NOTE: pendingRequests / expectedPayments are global settlement objects and
 *       do NOT carry expense_id, so we do NOT use them for per-expense matching.
 *       Per-expense pending status is supplied by the backend via `transaction_status`.
 */
export const calculateExpenseStatus = (
    expense: any,
    userId: string,
    _pendingRequests: any[] = [],  // kept for API compat; not used per-expense
    _expectedPayments: any[] = [] // kept for API compat; not used per-expense
): StatusInfo => {
    const isPayer = expense.payer_id === userId;
    const myShareData = expense.participants?.find((p: any) => p.user_id === userId);

    // ─── Balance ───────────────────────────────────────────────────────────────
    // Prefer the backend-computed value; fall back to client-side derivation.
    let balance: number = expense.user_balance;
    if (balance === undefined || balance === null) {
        if (isPayer) {
            balance = (expense.participants ?? []).reduce((acc: number, p: any) => {
                if (p.user_id !== userId && !p.is_settled) return acc + Number(p.share_amount);
                return acc;
            }, 0);
        } else {
            balance = myShareData?.is_settled ? 0 : -Number(myShareData?.share_amount ?? 0);
        }
    }

    // ─── 1. IN VERIFICATION — pending settlement exists for this expense ──────
    if (expense.transaction_status === 'PENDING') {
        return {
            status: 'IN_VERIFICATION',
            label: 'In Verification',
            colorClass: 'text-amber-500',
            amount: balance,
            isPending: true,
            isActionRequired: isPayer,   // payer (= money receiver) must confirm
            isWaitingForOther: !isPayer  // participant sent payment, waiting
        };
    }

    // ─── 2. DEBT ──────────────────────────────────────────────────────────────
    if (balance < -0.01) {
        return {
            status: 'DEBT',
            label: `-€${Math.abs(balance).toFixed(2)} (To Pay)`,
            colorClass: 'text-red-600',
            amount: balance
        };
    }

    // ─── 3. RECEIVABLE ────────────────────────────────────────────────────────
    if (balance > 0.01) {
        return {
            status: 'RECEIVABLE',
            label: `+€${balance.toFixed(2)} (To Be Paid)`,
            colorClass: 'text-emerald-600',
            amount: balance
        };
    }

    // ─── 4. ISSUED / SETTLED ──────────────────────────────────────────────────
    return {
        status: 'SETTLED',
        label: 'ISSUED',
        colorClass: 'text-secondary/50',
        amount: 0
    };
};
