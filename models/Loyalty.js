import mongoose from 'mongoose';
const loyaltySchema = new mongoose.Schema({ userId:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true}, points:{type:Number,default:0}}, {timestamps:true});
export default mongoose.model('Loyalty', loyaltySchema);