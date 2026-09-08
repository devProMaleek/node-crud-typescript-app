import express from 'express';
import EmployeeModel from '../model/employee.js';

class EmployeeController {
  // Add your controller methods here
  constructor() { }

  // Get all employees
  async getAllEmployees(request: express.Request, response: express.Response) {
    // Logic to retrieve all employees
    try {
      // Example logic to fetch employees from a database or service
      const employees = await EmployeeModel.find();
      response.status(200).json({ data: employees, message: 'Employees retrieved successfully' });
    } catch (error) {
      response.status(500).json({ error: 'Failed to retrieve employees' });
    }
  }

  // Get employee by ID
  async getEmployeeById(request: express.Request, response: express.Response) {
    // Logic to retrieve an employee by ID
    try {
      const employee = await EmployeeModel.findById(request.params.id);
      if (!employee) {
        return response.status(404).json({ error: 'Employee not found' });
      }
      response.status(200).json({ data: employee, message: 'Employee retrieved successfully' });
    } catch (error) {
      response.status(500).json({ error: 'Failed to retrieve employee' });
    }
  }

  // Create a new employee
  async createEmployee(request: express.Request, response: express.Response) {
    // Logic to create a new employee
    try {
      const newEmployee = new EmployeeModel(request.body);
      const savedEmployee = await newEmployee.save();
      response.status(201).json({ data: savedEmployee, message: 'Employee created successfully' });
    } catch (error) {
      response.status(500).json({ error: 'Failed to create employee' });
    }
  }

  // Update an existing employee
  async updateEmployee(request: express.Request, response: express.Response) {
    // Logic to update an existing employee
    try {
      const updatedEmployee = await EmployeeModel.findByIdAndUpdate(request.params.id, request.body, { new: true });
      if (!updatedEmployee) {
        return response.status(404).json({ error: 'Employee not found' });
      }
      response.status(200).json({ data: updatedEmployee, message: 'Employee updated successfully' });
    } catch (error) {
      response.status(500).json({ error: 'Failed to update employee' });
    }
  }

  // Delete an employee
  async deleteEmployee(request: express.Request, response: express.Response) {
    // Logic to delete an employee
    try {
      const deletedEmployee = await EmployeeModel.findByIdAndDelete(request.params.id);
      if (!deletedEmployee) {
        return response.status(404).json({ error: 'Employee not found' });
      }
      response.status(200).json({ data: deletedEmployee, message: 'Employee deleted successfully' });
    } catch (error) {
      response.status(500).json({ error: 'Failed to delete employee' });
    }
  }
}

export default new EmployeeController();