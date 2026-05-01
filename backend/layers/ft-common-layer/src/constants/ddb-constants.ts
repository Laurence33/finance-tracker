export const DDBConstants = {
  DDB_TABLE_NAME: process.env.DDB_TABLE_NAME || 'SingleTable',
  PARTITIONS: {
    EXPENSE: (userId: string) => `USER#${userId}#Expense`,
    FUND_SOURCE: (userId: string) => `USER#${userId}#FundSource`,
    TAGS: (userId: string) => `USER#${userId}#Tags`,
    LENDING: (userId: string) => `USER#${userId}#Lending`,
    LENDING_PAYMENT: (userId: string) => `USER#${userId}#LendingPayment`,
    INCOME: (userId: string) => `USER#${userId}#Income`,
    RECURRING_EXPENSE: (userId: string) => `USER#${userId}#RecurringExpense`,
    RECURRING_EXPENSE_PAYMENT: (userId: string) =>
      `USER#${userId}#RecurringExpensePayment`,
    TRANSFER: (userId: string) => `USER#${userId}#Transfer`,
  },
};
