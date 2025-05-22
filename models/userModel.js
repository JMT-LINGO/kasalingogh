import { Schema, model } from "mongoose";



const userSchema = new Schema({
    userName: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 30
    },
    name: {
        type: String,
        trim: true,
        maxlength: 50
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,

    },
    age: {
        type: Number,
        min: 4,
        max: 16
    },
    password:{
        type:String,
        required:true
    }
}, {
    timestamps: true
});


const adminSchema = new Schema ({
    userName:{
        type:String,
        required: true,
        trim: true
    },
    email:{
         type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    password:{
        type:String,
        required:true
    }
},
{
    timestamps:true
});



export const userModel = model("User", userSchema);
export const adminModel = model("Admin", adminSchema);