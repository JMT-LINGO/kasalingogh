import { Schema, model, Types } from "mongoose";

const QuestionSchema = new Schema({

  text: {
    type: String,
    required: [true, 'Please add question text'],
    trim: true
  },

  language: {
    type: String,
    required: [true, 'Please specify language'],
    enum: ['twi', 'ewe', 'fante', 'ga']
  },

  type: {
    type: String,
    required: true,
    enum: ['multiple-choice', 'fill-in-blank', 'spelling']
  },

  options: [{
    text: {
      type: String,
      required: true,
      trim: true
    },

    isCorrect: {
      type: Boolean,
      required: true
    }
  }],

  explanation: {
    type: String,
    required: true,
    trim: true
  },

  points: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },

  difficultyLevel: {
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

  category: {
    type: String,
    required: true,
    enum: ['vocabulary', 'grammar', 'reading', 'writing']
  },
  // imageUrl: String,
  // audioUrl: String,

  hint: {
    type: String,
    trim: true
  }



}, {
  timestamps: true
});

export const questionModel = model('Questions', QuestionSchema)