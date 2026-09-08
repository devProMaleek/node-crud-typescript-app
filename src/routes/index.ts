import express from 'express';
import EmployeeController from '../controllers/employee-controller.js';


const router = express.Router();

router.get('/', (req, res) => {
  res.send('Welcome to the Employee Management API');
});

router.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP' });
});

router.get('/employees', EmployeeController.getAllEmployees);
router.get('/employees/:id', EmployeeController.getEmployeeById);
router.post('/employees', EmployeeController.createEmployee);
router.put('/employees/:id', EmployeeController.updateEmployee);
router.delete('/employees/:id', EmployeeController.deleteEmployee);


export default router;