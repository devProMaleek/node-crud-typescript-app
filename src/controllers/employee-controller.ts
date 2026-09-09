import type { Request, Response } from 'express';
import EmployeeModel from '../model/employee.js';
import { HttpError } from '../errors/http-error.js';
import {
  paginationSchema,
  type CreateEmployeeInput,
  type EmployeeIdParams,
  type UpdateEmployeeInput,
} from '../validation/employee-schema.js';

/**
 * Request types carrying what validation guarantees. Because the schemas are
 * the source of both the runtime check and these types, a field renamed in a
 * schema breaks compilation here rather than failing silently at runtime.
 */
type BodyRequest<Body> = Request<Record<string, string>, unknown, Body>;
type IdRequest<Body = unknown> = Request<EmployeeIdParams, unknown, Body>;

/**
 * No try/catch anywhere below. Express 5 forwards a rejected promise from an
 * async handler straight to the error middleware, so anything that throws --
 * a failed validation, a duplicate email, a dropped database connection --
 * lands in `errorHandler` and is translated there.
 *
 * Methods are arrow properties so `this` survives being passed to the router
 * as `EmployeeController.getAllEmployees`. A normal method would arrive
 * unbound and `this` would be undefined.
 */
class EmployeeController {
  // Get all employees
  getAllEmployees = async (request: Request, response: Response) => {
    const { page, limit } = paginationSchema.parse(request.query);
    const skip = (page - 1) * limit;

    const [employees, totalEmployees] = await Promise.all([
      EmployeeModel.find().sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit),
      EmployeeModel.countDocuments(),
    ]);

    // Calculate metadata for pagination
    const totalPages = Math.ceil(totalEmployees / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    const metadata = {
      totalEmployees,
      totalPages,
      currentPage: page,
      limit: limit,
      hasNextPage,
      hasPrevPage,
    };
    response.status(200).json({ data: employees, metadata, message: 'Employees retrieved successfully' });
  };

  // Get employee by ID
  getEmployeeById = async (request: IdRequest, response: Response) => {
    const employee = await EmployeeModel.findById(request.params.id);
    if (!employee) throw new HttpError(404, 'Employee not found');

    response.status(200).json({ data: employee, message: 'Employee retrieved successfully' });
  };

  // Create a new employee
  createEmployee = async (request: BodyRequest<CreateEmployeeInput>, response: Response) => {
    const savedEmployee = await new EmployeeModel(request.body).save();
    response.status(201).json({ data: savedEmployee, message: 'Employee created successfully' });
  };

  // Update an existing employee
  updateEmployee = async (request: IdRequest<UpdateEmployeeInput>, response: Response) => {
    // `runValidators` keeps the schema honest on update, which Mongoose skips
    // by default. It is redundant while every route validates first, and cheap
    // insurance the day something writes through a path that does not.
    const updatedEmployee = await EmployeeModel.findByIdAndUpdate(
      request.params.id,
      request.body,
      { new: true, runValidators: true },
    );
    if (!updatedEmployee) throw new HttpError(404, 'Employee not found');

    response.status(200).json({ data: updatedEmployee, message: 'Employee updated successfully' });
  };

  // Delete an employee
  deleteEmployee = async (request: IdRequest, response: Response) => {
    const deletedEmployee = await EmployeeModel.findByIdAndDelete(request.params.id);
    if (!deletedEmployee) throw new HttpError(404, 'Employee not found');

    response.status(200).json({ data: deletedEmployee, message: 'Employee deleted successfully' });
  };
}

export default new EmployeeController();
