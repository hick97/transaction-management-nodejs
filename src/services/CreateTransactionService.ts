import { getRepository, getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    type,
    value,
    category,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);
    let categoryId = '';

    if (type === 'outcome') {
      const outcomeIsValid = await transactionsRepository.checkIfOutcomeIsValid(
        value,
      );

      if (!outcomeIsValid) {
        throw new AppError('Operation is not permitted, check your balance');
      }
    }

    // Check if category exists
    const categoryExists = await categoriesRepository.findOne({
      where: {
        title: category,
      },
    });

    // Create a new category
    if (!categoryExists) {
      const newCategory = categoriesRepository.create({
        title: category,
      });

      await categoriesRepository.save(newCategory);

      categoryId = newCategory.id;
    } else {
      categoryId = categoryExists.id;
    }

    // Create a new transaction
    const transaction = transactionsRepository.create({
      title,
      type,
      value,
      category_id: categoryId,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
