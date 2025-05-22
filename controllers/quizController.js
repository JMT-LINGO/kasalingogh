import { quizModel } from '../models/quizModel.js';
import { questionModel } from '../models/questionModel.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

//  Create new quiz

export const createQuiz = asyncHandler(async (req, res) => {
  const quiz = await quizModel.create(req.body);
  res.status(201).json({
    success: true,
    data: quiz
  });
});

//    Get all quizzes with filtering, sorting, and pagination

export const getQuizzes = asyncHandler(async (req, res) => {
  let query = { ...req.query };
  
  // Fields to exclude from filtering
  const excludeFields = ['page', 'sort', 'limit', 'fields'];
  excludeFields.forEach(field => delete query[field]);
  
  // Advanced filtering
  let queryStr = JSON.stringify(query);
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
  query = JSON.parse(queryStr);

  // Building query
  let quizQuery = quizModel.find(query).populate('questions');

  // Sorting
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    quizQuery = quizQuery.sort(sortBy);
  } else {
    quizQuery = quizQuery.sort('-createdAt');
  }

  // Field limiting
  if (req.query.fields) {
    const fields = req.query.fields.split(',').join(' ');
    quizQuery = quizQuery.select(fields);
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await quizModel.countDocuments(query);

  quizQuery = quizQuery.skip(startIndex).limit(limit);

  // Execute query
  const quizzes = await quizQuery;

  // Pagination result
  const pagination = {};

  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit
    };
  }

  res.status(200).json({
    success: true,
    count: quizzes.length,
    pagination,
    data: quizzes
  });
});

//   Get single quiz

export const getQuiz = asyncHandler(async (req, res) => {
  const quiz = await quizModel.findById(req.params.id).populate('questions');
  
  if (!quiz) {
    throw new ApiError(404, 'Quiz not found');
  }

  res.status(200).json({
    success: true,
    data: quiz
  });
});

//    Update quiz

export const updateQuiz = asyncHandler(async (req, res) => {
  let quiz = await quizModel.findById(req.params.id);

  if (!quiz) {
    throw new ApiError(404, 'Quiz not found');
  }

  quiz = await quizModel.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  ).populate('questions');

  res.status(200).json({
    success: true,
    data: quiz
  });
});

//   Delete quiz

export const deleteQuiz = asyncHandler(async (req, res) => {
  const quiz = await quizModel.findById(req.params.id);

  if (!quiz) {
    throw new ApiError(404, 'Quiz not found');
  }

  await quiz.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

//   Add question to quiz

export const addQuestionToQuiz = asyncHandler(async (req, res) => {
  const quiz = await quizModel.findById(req.params.id);
  const question = await questionModel.findById(req.body.questionId);
  
  if (!quiz) {
    throw new ApiError(404, 'Quiz not found');
  }

  if (!question) {
    throw new ApiError(404, 'Question not found');
  }

  // Validate language match
  if (quiz.language !== question.language) {
    throw new ApiError(400, 'Question language does not match quiz language');
  }

  // Validate difficulty match
  if (quiz.difficulty !== question.difficultyLevel) {
    throw new ApiError(400, 'Question difficulty does not match quiz difficulty');
  }

  // Add question ID to quiz
  quiz.questions.push(question._id);
  
  // Update total points
  quiz.totalPoints += question.points;
  
  const updatedQuiz = await quiz.save();
  
  res.status(200).json({
    success: true,
    data: updatedQuiz
  });
});

//     Remove question from quiz

export const removeQuestionFromQuiz = asyncHandler(async (req, res) => {
  const quiz = await quizModel.findById(req.params.id);
  const question = await questionModel.findById(req.params.questionId);
  
  if (!quiz) {
    throw new ApiError(404, 'Quiz not found');
  }

  if (!question) {
    throw new ApiError(404, 'Question not found');
  }

  // Remove question ID from quiz
  quiz.questions = quiz.questions.filter(
    qId => qId.toString() !== req.params.questionId
  );
  
  // Update total points
  quiz.totalPoints -= question.points;
  
  const updatedQuiz = await quiz.save();
  
  res.status(200).json({
    success: true,
    data: updatedQuiz
  });
});

//     Get quizzes by language

export const getQuizzesByLanguage = asyncHandler(async (req, res) => {
  const quizzes = await quizModel.find({ language: req.params.language }).populate('questions');

  res.status(200).json({
    success: true,
    count: quizzes.length,
    data: quizzes
  });
});

//     Get quizzes by difficulty

export const getQuizzesByDifficulty = asyncHandler(async (req, res) => {
  const quizzes = await quizModel.find({ difficulty: req.params.level }).populate('questions');

  res.status(200).json({
    success: true,
    count: quizzes.length,
    data: quizzes
  });
});

//    Get active quizzes

export const getActiveQuizzes = asyncHandler(async (req, res) => {
  const quizzes = await quizModel.find({ isActive: true }).populate('questions');

  res.status(200).json({
    success: true,
    count: quizzes.length,
    data: quizzes
  });
}); 
    