import { questionModel } from '../models/questionModel.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

//   Create new question

export const createQuestion = asyncHandler(async (req, res) => {
  const question = await questionModel.create(req.body);
  res.status(201).json({
    success: true,
    data: question
  });
});

//    Get all questions with filtering, sorting, and pagination

export const getQuestions = asyncHandler(async (req, res) => {
  let query = { ...req.query };
  
  // Fields to exclude from filtering
  const excludeFields = ['page', 'sort', 'limit', 'fields'];
  excludeFields.forEach(field => delete query[field]);
  
  // Advanced filtering
  let queryStr = JSON.stringify(query);
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
  query = JSON.parse(queryStr);

  // Building query
  let questionQuery = questionModel.find(query);

  // Sorting
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    questionQuery = questionQuery.sort(sortBy);
  } else {
    questionQuery = questionQuery.sort('-createdAt');
  }

  // Field limiting
  if (req.query.fields) {
    const fields = req.query.fields.split(',').join(' ');
    questionQuery = questionQuery.select(fields);
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await questionModel.countDocuments(query);

  questionQuery = questionQuery.skip(startIndex).limit(limit);

  // Execute query
  const questions = await questionQuery;

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
    count: questions.length,
    pagination,
    data: questions
  });
});

//    Get single question

export const getQuestion = asyncHandler(async (req, res) => {
  const question = await questionModel.findById(req.params.id);
  
  if (!question) {
    throw new ApiError(404, 'Question not found');
  }

  res.status(200).json({
    success: true,
    data: question
  });
});

//     Update question

export const updateQuestion = asyncHandler(async (req, res) => {
  let question = await questionModel.findById(req.params.id);

  if (!question) {
    throw new ApiError(404, 'Question not found');
  }

  question = await questionModel.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    success: true,
    data: question
  });
});

//   Delete question

export const deleteQuestion = asyncHandler(async (req, res) => {
  const question = await questionModel.findById(req.params.id);

  if (!question) {
    throw new ApiError(404, 'Question not found');
  }

  await question.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

//   Get questions by language

export const getQuestionsByLanguage = asyncHandler(async (req, res) => {
  const questions = await questionModel.find({ language: req.params.language });

  res.status(200).json({
    success: true,
    count: questions.length,
    data: questions
  });
});

//    Get questions by difficulty level

export const getQuestionsByDifficulty = asyncHandler(async (req, res) => {
  const questions = await questionModel.find({ difficultyLevel: req.params.level });

  res.status(200).json({
    success: true,
    count: questions.length,
    data: questions
  });
});

//    Get questions by category
 

export const getQuestionsByCategory = asyncHandler(async (req, res) => {
  const questions = await questionModel.find({ category: req.params.category });

  res.status(200).json({
    success: true,
    count: questions.length,
    data: questions
  });
});