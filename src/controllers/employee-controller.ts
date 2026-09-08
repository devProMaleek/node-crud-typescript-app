import type { Request, Response } from 'express';
import EmployeeModel from '../model/employee.js';
import { HttpError } from '../errors/http-error.js';

/**
 * No try/catch anywhere below. Express 5 forwards a rejected promise from an
 * async handler straight to the error middleware, so anything that throws --
 * a bad ObjectId, a failed validation, a dropped database connection --
 * lands in `errorHandler` and is translated there.
 *
 * Methods are arrow properties so `this` survives being passed to the router
 * as `EmployeeController.getAllEmployees`. A normal method would arrive
 * unbound and `this` would be undefined.
 */
class EmployeeController {
  // Get all employees
  getAllEmployees = async (_request: Request, response: Response) => {
    const employees = await EmployeeModel.find();
    response.status(200).json({ data: employees, message: 'Employees retrieved successfully' });
  };

  // Get employee by ID
  getEmployeeById = async (request: Request, response: Response) => {
    const employee = await EmployeeModel.findById(request.params.id);
    if (!employee) throw new HttpError(404, 'Employee not found');

    response.status(200).json({ data: employee, message: 'Employee retrieved successfully' });
  };

  // Create a new employee
  createEmployee = async (request: Request, response: Response) => {
    const savedEmployee = await new EmployeeModel(request.body).save();
    response.status(201).json({ data: savedEmployee, message: 'Employee created successfully' });
  };

  // Update an existing employee
  updateEmployee = async (request: Request, response: Response) => {
    // `runValidators` matters: without it Mongoose skips schema rules on
    // update, so an existing record could be edited into an invalid state.
    const updatedEmployee = await EmployeeModel.findByIdAndUpdate(
      request.params.id,
      request.body,
      { new: true, runValidators: true },
    );
    if (!updatedEmployee) throw new HttpError(404, 'Employee not found');

    response.status(200).json({ data: updatedEmployee, message: 'Employee updated successfully' });
  };

  // Delete an employee
  deleteEmployee = async (request: Request, response: Response) => {
    const deletedEmployee = await EmployeeModel.findByIdAndDelete(request.params.id);
    if (!deletedEmployee) throw new HttpError(404, 'Employee not found');

    response.status(200).json({ data: deletedEmployee, message: 'Employee deleted successfully' });
  };
}

export default new EmployeeController();
