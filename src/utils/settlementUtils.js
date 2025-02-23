export function calculateSettlement(updatedParticipants) {
    const balances = updatedParticipants.map((p) => {
      const netBalance = p.amountPaid - p.amountOwed;
      return { ...p, netBalance };
    });
  
    const debtors = balances
      .filter((p) => p.netBalance < 0)
      .sort((a, b) => a.netBalance - b.netBalance);
    const creditors = balances
      .filter((p) => p.netBalance > 0)
      .sort((a, b) => b.netBalance - a.netBalance);
  
    const settlementPlan = [];
    let d = 0;
    let c = 0;
  
    while (d < debtors.length && c < creditors.length) {
      const debtor = debtors[d];
      const creditor = creditors[c];
      const amount = Math.min(Math.abs(debtor.netBalance), creditor.netBalance);
  
      settlementPlan.push({
        from: debtor.name,
        to: creditor.name,
        amount: amount.toFixed(2),
      });
  
      debtor.netBalance += amount;
      creditor.netBalance -= amount;
  
      if (Math.abs(debtor.netBalance) < 0.0001) d++;
      if (creditor.netBalance < 0.0001) c++;
    }
  
    return settlementPlan;
  }
  