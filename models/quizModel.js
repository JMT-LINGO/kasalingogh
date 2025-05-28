import { Schema, model, Types } from "mongoose";

const quizSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Please add a quiz title'],
    trim: true
  },

  description: {
    type: String,
    required: true,
    trim: true
  },

  language: {
    type: String,
    required: [true, 'Please specify language'],
    enum: ['twi', 'ewe', 'fante', 'ga']
  },
 
 difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true
  },
  
 
  ageRange: {
    min: {
      type: Number,
      required: true,
      min: 4,
      max: 12
    },
    max: {
      type: Number,
      required: true,
      min: 4,
      max: 12
    }
  },
  questions: [{
    type: Schema.Types.ObjectId,
    ref: 'Questions',
    required: true
  }],
  category: {
    type: String,
    required: true,
    enum: ['vocabulary', 'grammar', 'reading', 'writing']
  },
 
  totalPoints: {
    type: Number,
    default: 0
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
 
  
 
},{
  timestamps:true
});

export const quizModel = model('Quizzes', quizSchema)