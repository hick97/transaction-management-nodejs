import { getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';

import TransactionsRepository from '../repositories/TransactionsRepository';

class DeleteTransactionService {
  public async execute(id: string): Promise<void> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const balance = await transactionsRepository.getBalance();

    const transactionExists = await transactionsRepository.findOne(id);

    if (!transactionExists) {
      throw new AppError('Transaction does not exists');
    }
    const { value, type } = transactionExists;

    if (type === 'income') {
      const newBalance = balance.total - value;

      if (newBalance < 0) {
        throw new AppError('Operation is invalid, check your balance');
      }
    }

    await transactionsRepository.delete(id);
  }
}

export default DeleteTransactionService;
