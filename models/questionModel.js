import mongoose from "mongoose";

const QuestionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, 'Please add question text']
  },
  language: {
    type: String,
    required: [true, 'Please specify language'],
    enum: ['twi', 'ewe', 'fante', 'ga']
  },
  type: {
    type: String,
    required: true,
    enum: ['multiple-choice', 'fill-in-blank', 'audio-recognition', 'image-word', 'spelling']
  },
  options: [String],
  correctAnswer: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
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
  category: {
    type: String,
    required: true,
    enum: ['vocabulary', 'grammar', 'pronunciation', 'reading', 'writing', 'listening']
  },
  imageUrl: String,
  audioUrl: String,
  points: {
    type: Number,
    default: 10
  },
  hint: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
},{
    timestamps:true
});

export const questionModel = ('Questions', QuestionSchema)