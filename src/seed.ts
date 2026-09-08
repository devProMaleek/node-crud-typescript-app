import { faker } from '@faker-js/faker';
import mongoose from 'mongoose';
import EmployeeModel from './model/employee.js';

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
const DB_NAME = 'node-typescript-app';

// Real-world departments read better than faker's retail-oriented ones.
const DEPARTMENTS = [
  'Engineering', 'Sales', 'Marketing', 'Human Resources', 'Finance',
  'Operations', 'Legal', 'Customer Support', 'Product', 'Design',
];

// `--fresh` wipes the collection first, like `migrate:fresh --seed` in Laravel.
const fresh = process.argv.includes('--fresh');
const count = Number(process.argv.find((a) => /^\d+$/.test(a))) || 25;

// Every email handed out this run, so we never trip the schema's unique index.
// Pre-loaded with what is already stored, which keeps a plain `npm run seed`
// safe to run repeatedly on top of existing data.
const usedEmails = new Set<string>();

const uniqueEmail = (firstName: string, lastName: string): string => {
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = faker.internet
      .email({ firstName, lastName, provider: 'example.com' })
      .toLowerCase();
    if (!usedEmails.has(candidate)) {
      usedEmails.add(candidate);
      return candidate;
    }
  }
  // Faker keeps colliding on a popular name -- fall back to something random.
  const fallback = `${faker.string.alphanumeric(12)}@example.com`.toLowerCase();
  usedEmails.add(fallback);
  return fallback;
};

/**
 * Build one employee. Fields are generated together rather than independently
 * so the record stays internally consistent: the email matches the name, the
 * first name matches the gender, and the join date falls after the 20th birthday.
 */
const makeEmployee = () => {
  const sex = faker.person.sexType();
  const firstName = faker.person.firstName(sex);
  const lastName = faker.person.lastName();

  const dob = faker.date.birthdate({ min: 22, max: 60, mode: 'age' });

  // Nobody joins before they turn 20, and nobody joins in the future.
  const earliestJoin = new Date(dob);
  earliestJoin.setFullYear(earliestJoin.getFullYear() + 20);
  const doj = faker.date.between({ from: earliestJoin, to: new Date() });

  return {
    name: `${firstName} ${lastName}`,
    email: uniqueEmail(firstName, lastName),
    position: faker.person.jobTitle(),
    salary: faker.number.int({ min: 90, max: 400 }) * 500, // tidy round numbers
    mobile: faker.phone.number({ style: 'international' }),
    address: `${faker.location.streetAddress(true)}, ${faker.location.city()}, ${faker.location.country()}`,
    dob,
    gender: sex === 'male' ? 'Male' : 'Female',
    doj,
    department: faker.helpers.arrayElement(DEPARTMENTS),
  };
};

const seed = async () => {
  await mongoose.connect(MONGO_URL, { dbName: DB_NAME });
  console.log(`Connected to MongoDB (${DB_NAME})`);

  if (fresh) {
    const { deletedCount } = await EmployeeModel.deleteMany({});
    console.log(`Cleared ${deletedCount} existing employee(s)`);
  }

  const existing = await EmployeeModel.find({}, 'email').lean();
  existing.forEach((e) => usedEmails.add(e.email));

  const employees = Array.from({ length: count }, () => makeEmployee());
  const inserted = await EmployeeModel.insertMany(employees);

  console.log(`Seeded ${inserted.length} employee(s)`);
  console.table(
    inserted.slice(0, 5).map((e) => ({
      name: e.name,
      email: e.email,
      department: e.department,
      salary: e.salary,
    })),
  );
  if (inserted.length > 5) console.log(`...and ${inserted.length - 5} more`);
};

try {
  await seed();
} catch (error) {
  console.error('Seeding failed:', error);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
