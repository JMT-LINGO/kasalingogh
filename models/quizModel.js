import mongoose from "mongoose";

const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a quiz title']
  },
  language: {
    type: String,
    required: [true, 'Please specify language'],
    enum: ['english', 'spanish', 'french', 'german', 'chinese', 'japanese']
  },
  description: String,
  difficultyLevel: {
    type: Number,
    required: true,
    min: 1,
    max: 5
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
    type: mongoose.Schema.ObjectId,
    ref: 'Question'
  }],
  category: {
    type: String,
    required: true,
    enum: ['vocabulary', 'grammar', 'pronunciation', 'reading', 'writing', 'listening', 'mixed']
  },
  timeLimit: {
    type: Number, // in seconds
    default: 300
  },
  requiredScore: {
    type: Number,
    default: 70 // percentage to pass
  },
  imageUrl: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export const quizModel = ('Quizes', quizSchema)