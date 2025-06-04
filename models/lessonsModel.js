import { Schema, model } from "mongoose";


const lessonsSchema = new Schema({
    title: {
        type: String,
        trim: true
    },
    localLanguage: {
        type: String,
        required: true,
        trim: true
    },
    english: {
        type: String,
        required: true
    },
    pronunciation:{
        type:String,
        required: true
    },
    response: {
        type: String,
        required: true
    },
    language: {
        type: String,
        required: [true, 'Please specify language'],
        enum: ['twi', 'ewe', 'fante', 'ga']
    },
    emoji: {
        type: String,
        required: true
    }
})

export const lessonsModel = model('Lessons', lessonsSchema)