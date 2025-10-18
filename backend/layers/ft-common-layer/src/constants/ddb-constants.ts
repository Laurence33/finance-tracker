export const DDBConstants = {
  DDB_TABLE_NAME: process.env.DDB_TABLE_NAME || 'SingleTable',
  PARTITIONS: {
    EXPENSE: 'Expense#Expense',
    FUND_SOURCE: 'FundSource#FundSource',
  },
}
