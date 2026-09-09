import express from 'express';
import EmployeeController from '../controllers/employee-controller.js';
import { validate } from '../middleware/validate.js';
import {
  createEmployeeSchema,
  employeeIdParamsSchema,
  updateEmployeeSchema,
} from '../validation/employee-schema.js';

const router = express.Router();

router.get('/', (req, res) => {
  res.send('Welcome to the Employee Management API');
});

router.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP' });
});

// Employee routes
router.get('/employees', EmployeeController.getAllEmployees);

// Validation runs as middleware, so a controller below never receives a
// request that has not already been checked and coerced.
router.get(
  '/employees/:id',
  validate({ params: employeeIdParamsSchema }),
  EmployeeController.getEmployeeById,
);

router.post(
  '/employees',
  validate({ body: createEmployeeSchema }),
  EmployeeController.createEmployee,
);

router.put(
  '/employees/:id',
  validate({ params: employeeIdParamsSchema, body: updateEmployeeSchema }),
  EmployeeController.updateEmployee,
);

router.delete(
  '/employees/:id',
  validate({ params: employeeIdParamsSchema }),
  EmployeeController.deleteEmployee,
);

export default router;
