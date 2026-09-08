import { z } from 'zod';

/** The wire format of a Mongo ObjectId: 24 hexadecimal characters. */
const OBJECT_ID = /^[0-9a-f]{24}$/i;

export const objectIdSchema = z
  .string()
  .regex(OBJECT_ID, 'Must be a 24-character hexadecimal id');

export const employeeIdParamsSchema = z.strictObject({ id: objectIdSchema });

/**
 * Dates arrive as JSON strings, and ISO 8601 is the only format accepted.
 *
 * The obvious alternative, `z.coerce.date()`, hands the string to `new Date()`,
 * whose parsing of non-ISO input is engine-defined -- "01/02/1990" is the 2nd
 * of January or the 1st of February depending on where it runs. It also turns
 * unparseable input into an Invalid Date object rather than a clean failure,
 * which surfaces to the client as "expected date, received Date".
 */
const isoDate = (label: string) =>
  z
    .union([z.iso.date(), z.iso.datetime({ offset: true })], `${label} must be an ISO 8601 date`)
    .transform((value) => new Date(value));

/**
 * The field rules, defined once. `createEmployeeSchema` requires all of them
 * and `updateEmployeeSchema` makes them optional, so the two can never drift
 * apart the way two hand-written schemas would.
 */
const employeeFields = {
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(120),
  email: z.email('Must be a valid email address').toLowerCase(),
  position: z.string().trim().min(2).max(120),
  salary: z.coerce.number().positive('Salary must be greater than zero').max(100_000_000),
  mobile: z.string().trim().min(7, 'Mobile number looks too short').max(20),
  address: z.string().trim().min(5).max(300),
  dob: isoDate('Date of birth').refine((d) => d <= new Date(), 'Date of birth must be in the past'),
  gender: z.enum(['Male', 'Female', 'Other']),
  doj: isoDate('Joining date').refine((d) => d <= new Date(), 'Joining date cannot be in the future'),
  department: z.string().trim().min(2).max(120),
};

/** Nobody joins the company before they were born. */
// `exactOptionalPropertyTypes` in tsconfig means an optional Date field is
// `Date | undefined`, not just an absent key -- the signature has to say so.
const joinedAfterBirth = (value: { dob?: Date | undefined; doj?: Date | undefined }) =>
  !value.dob || !value.doj || value.doj > value.dob;

const JOIN_ORDER_ERROR = {
  message: 'Joining date must be after date of birth',
  path: ['doj'],
};

// `strictObject` rejects unknown keys outright rather than quietly dropping
// them. A client sending `_id` or `createdAt` gets told, instead of silently
// having it ignored -- and it closes off mass-assignment.
export const createEmployeeSchema = z
  .strictObject(employeeFields)
  .refine(joinedAfterBirth, JOIN_ORDER_ERROR);

// `.partial()` has to come before `.refine()`: refining returns a schema that
// can no longer be structurally modified.
export const updateEmployeeSchema = z
  .strictObject(employeeFields)
  .partial()
  .refine((value) => Object.keys(value).length > 0, 'Provide at least one field to update')
  .refine(joinedAfterBirth, JOIN_ORDER_ERROR);

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export type EmployeeIdParams = z.infer<typeof employeeIdParamsSchema>;
