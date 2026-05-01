import React from 'react';

export type ExpenseStatus = 'SETTLED' | 'IN_VERIFICATION' | 'DEBT' | 'RECEIVABLE';

export interface StatusInfo {
    status: ExpenseStatus;
    label: string;
    colorClass: string;
    amount?: number;
    isPending?: boolean;
    isActionRequired?: boolean; // User needs to confirm something
    isWaitingForOther?: boolean; // User sent/performed action, waiting for other
}

/**
 * Standardized logic to determine the status of an expense for a specific user.
 */
export const calculateExpenseStatus = (
    expense: any,
    userId: string,
    pendingRequests: any[] = [],
    expectedPayments: any[] = []
): StatusInfo => {
    const isPayer = expense.payer_id === userId;
    const myShareData = expense.participants?.find((p: any) => p.user_id === userId);
    
    // ─── 1. CALCULATE SPECIFIC BALANCE ─────────────────────────────────────
    let balance = 0;
    if (isPayer) {
        // Amount others specifically owe me for THIS expense
        balance = expense.participants?.reduce((acc: number, p: any) => {
            if (p.user_id !== userId && !p.is_settled) return acc + Number(p.share_amount);
            return acc;
        }, 0) || 0;
    } else {
        // My specific remaining share for THIS expense
        const isConfirmedSettled = myShareData?.is_settled;
        balance = isConfirmedSettled ? 0 : -Number(myShareData?.share_amount || 0);
    }

    // ─── 2. PENDING TRANSACTION CHECKS ─────────────────────────────────────
    // Logic: Action has been taken specifically for this expense.
    
    // Check nested transactions
    const pendingTx = (expense.transactions || []).find((t: any) => 
        (t.user_id === userId || t.sender_id === userId || t.receiver_id === userId) && 
        (t.status === 'pending' || t.is_pending)
    );

    // Fallback: Check global pending lists for specific matches
    const isPendingConfirmation = isPayer && pendingRequests.some(r => r.expense_id === expense.id);
    const isPendingPayment = !isPayer && expectedPayments.some(e => e.expense_id === expense.id);

    const isPending = !!pendingTx || isPendingConfirmation || isPendingPayment;

    if (isPending) {
        // Action Required: Someone sent me money (I am Recipient)
        const actionRequired = (isPayer && isPendingConfirmation) || (pendingTx && pendingTx.receiver_id === userId);
        
        // Waiting for Other: I sent money (I am Sender)
        const waitingForOther = (!isPayer && isPendingPayment) || (pendingTx && pendingTx.sender_id === userId);

        return {
            status: 'IN_VERIFICATION',
            label: 'In Verification',
            colorClass: 'text-amber-500',
            amount: balance,
            isPending: true,
            isActionRequired: actionRequired,
            isWaitingForOther: waitingForOther
        };
    }

    // ─── 3. DEBT (Red) ───────────────────────────────────────────────────────
    if (balance < -0.01) {
        return {
            status: 'DEBT',
            label: `-€${Math.abs(balance).toFixed(2)} to pay`,
            colorClass: 'text-red-600',
            amount: balance
        };
    }

    // ─── 4. RECEIVABLE (Green) ───────────────────────────────────────────────
    if (balance > 0.01) {
        return {
            status: 'RECEIVABLE',
            label: `+€${balance.toFixed(2)} to receive`,
            colorClass: 'text-emerald-600',
            amount: balance
        };
    }

    // ─── 5. SETTLED (Gray) ───────────────────────────────────────────────────
    return {
        status: 'SETTLED',
        label: 'Settled',
        colorClass: 'text-secondary/50',
        amount: 0
    };
};




