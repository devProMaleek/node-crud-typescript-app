import express from 'express';
import mongoose from "mongoose";

const app = express();
const PORT = process.env.PORT || 4000;
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';

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

await connectToDatabase();

app.use(express.json());

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});