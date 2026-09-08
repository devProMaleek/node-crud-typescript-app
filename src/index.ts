import express from 'express';
import mongoose from "mongoose";
import router from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';

const app = express();
const PORT = process.env.PORT || 4000;
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';

// Connect to MongoDB
const connectToDatabase = async () => {
  try {
    await mongoose.connect(MONGO_URL, {
      dbName: 'node-typescript-app',
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

// Immediately invoke the function to connect to the database
await connectToDatabase();

app.use(express.json());

// Use the router for handling routes
app.use('/api', router);

// Anything that did not match a route above is a 404...
app.use(notFoundHandler);

// ...and the error handler goes dead last, so every throw from every route
// above funnels into it. Registered any earlier, the routes it is meant to
// protect would not yet exist.
app.use(errorHandler);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});