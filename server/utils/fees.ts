export type FeePaymentStatus = 'unpaid' | 'partial' | 'paid'

const membershipAmountByChildren = new Map<number, number>([
  [1, 150],
  [2, 270],
  [3, 360],
  [4, 450],
])

export function getMembershipAmount(childrenCount: number): number {
  if (childrenCount <= 0) {
    return 0
  }

  if (childrenCount >= 4) {
    return membershipAmountByChildren.get(4) ?? 450
  }

  return membershipAmountByChildren.get(childrenCount) ?? 0
}

export function getRegistrationFeeAmount(): number {
  return 50
}

export function getPaymentStatus(amountDue: number, paymentAmounts: number[]): FeePaymentStatus {
  if (amountDue <= 0) {
    return 'paid'
  }

  const paidTotal = paymentAmounts.reduce((total, amount) => total + amount, 0)
  const epsilon = 0.01

  if (paidTotal <= epsilon) {
    return 'unpaid'
  }

  if (paidTotal + epsilon < amountDue) {
    return 'partial'
  }

  return 'paid'
}
