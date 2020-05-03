import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async checkIfOutcomeIsValid(value: number): Promise<boolean> {
    // Check if outcome is valid
    const balance = await this.getBalance();

    if (balance.total - value < 0) {
      return false;
    }

    return true;
  }

  public async getBalance(): Promise<Balance> {
    const incomeArray = await this.find({
      where: {
        type: 'income',
      },
    });

    const outcomeArray = await this.find({
      where: {
        type: 'outcome',
      },
    });

    const reducer = (accumulator: number, currentValue: number): number =>
      accumulator + currentValue;

    const totalIncome = incomeArray.map(i => i.value).reduce(reducer, 0);
    const totalOutcome = outcomeArray.map(o => o.value).reduce(reducer, 0);

    const balance = {
      income: totalIncome,
      outcome: totalOutcome,
      total: totalIncome - totalOutcome,
    };

    return balance;
  }
}

export default TransactionsRepository;
