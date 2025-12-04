import mongoose from 'mongoose';
const expSchema=new mongoose.Schema({key:{type:String,unique:true},variants:[String],active:{type:Boolean,default:true}}, {timestamps:true});
export default mongoose.model('Experiment', expSchema);