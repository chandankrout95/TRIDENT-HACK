import mongoose from 'mongoose';

beforeAll(async () => {
  // Connect to a test database if real mongo connection is required for testing
  // await mongoose.connect(process.env.MONGO_URI_TEST);
});

afterAll(async () => {
  await mongoose.disconnect();
});
