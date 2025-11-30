console.log('Starting plan check...');

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

console.log('Environment loaded');
console.log('MongoDB URI exists:', !!process.env.MONGODB_URI);

const planSchema = new mongoose.Schema({}, { strict: false });
const Plan = mongoose.model('Plan', planSchema);

try {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected successfully');
  
  const planId = '689771da18b4ed6949b139c0';
  console.log('Looking for plan:', planId);
  
  const plan = await Plan.findById(planId);
  
  if (plan) {
    console.log('PLAN FOUND:');
    console.log('Title:', plan.title);
    console.log('FileName:', plan.fileName);
    console.log('Has Content:', !!plan.content);
  } else {
    console.log('PLAN NOT FOUND - This explains the 404 error');
  }
  
  await mongoose.disconnect();
  console.log('Disconnected');
} catch (error) {
  console.error('ERROR:', error.message);
}
