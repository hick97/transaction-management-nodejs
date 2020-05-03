import { getRepository, In } from 'typeorm';
import csv from 'csv-parse';
import fs from 'fs';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface CSVTransactions {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    const categoriesRepository = getRepository(Category);
    const transactionsRepository = getRepository(Transaction);

    const transactions: CSVTransactions[] = [];
    const categories: Array<string> = [];

    const contactsReadStream = fs.createReadStream(filePath);

    const parsers = csv({
      from_line: 2,
    });

    const parseCSV = contactsReadStream.pipe(parsers);

    parseCSV.on('data', async line => {
      const [title, type, value, category] = line.map((cell: string) =>
        cell.trim(),
      );

      if (!title || !type || !value) return;

      categories.push(category);

      transactions.push({
        title,
        type,
        value: parseFloat(value),
        category,
      });
    });

    await new Promise(resolve => parseCSV.on('end', resolve));

    const existentCategories = await categoriesRepository.find({
      where: {
        title: In(categories),
      },
    });

    // Returning only title
    const existentCategoriesTitles = existentCategories.map(
      (category: Category) => category.title,
    );

    // Get not included values and remove duplicated values
    const addCategoriesTitles = categories
      .filter(category => !existentCategoriesTitles.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    const newCategories = categoriesRepository.create(
      addCategoriesTitles.map(title => ({
        title,
      })),
    );

    await categoriesRepository.save(newCategories);

    const finalCategories = [...newCategories, ...existentCategories];

    const createdTransactions = transactionsRepository.create(
      transactions.map(t => ({
        title: t.title,
        type: t.type,
        value: t.value,
        category_id: this.findCategoryId(finalCategories, t.category),
      })),
    );

    await transactionsRepository.save(createdTransactions);

    return createdTransactions;
  }

  findCategoryId(
    finalCategories: Array<Category>,
    transaction: string,
  ): string {
    const index = finalCategories.findIndex(cat => cat.title === transaction);

    return finalCategories[index].id;
  }
}

export default ImportTransactionsService;
