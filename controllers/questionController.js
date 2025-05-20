// const Question = require('../models/Question');
// const { getAgeAppropriateContent } = require('../utils/ageAppropriateContent');

// @desc    Create new question
// @route   POST /api/v1/questions
// @access  Private/Parent
export const createQuestion = async (req, res) => {
  try {
    const question = await Question.create(req.body);

    res.status(201).json({
      success: true,
      data: question
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

//  Get all questions

export const getQuestions = async (req, res) => {
  try {
    let query;

    // Copy req.query
    const reqQuery = { ...req.query };

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit'];

    // Loop over removeFields and delete them from reqQuery
    removeFields.forEach(param => delete reqQuery[param]);

    // Create query string
    let queryStr = JSON.stringify(reqQuery);

    // Create operators ($gt, $gte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // Finding resource
    query = Question.find(JSON.parse(queryStr));

    // Select Fields
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    }

    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Question.countDocuments();

    query = query.skip(startIndex).limit(limit);

    // Executing query
    const questions = await query;

    // Age appropriate filter if user is a child
    let filteredQuestions = questions;
    if (!req.user.isParent) {
      filteredQuestions = questions.filter(question => 
        question.ageRange.min <= req.user.age && 
        question.ageRange.max >= req.user.age
      );
    }

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
      count: filteredQuestions.length,
      pagination,
      data: filteredQuestions
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

//Get single question

export const getQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: `No question found with id of ${req.params.id}`
      });
    }

    // Check if question is appropriate for user's age
    if (!req.user.isParent && 
        (question.ageRange.min > req.user.age || 
         question.ageRange.max < req.user.age)) {
      return res.status(403).json({
        success: false,
        message: 'This question is not appropriate for your age'
      });
    }

    res.status(200).json({
      success: true,
      data: question
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

//Update question

export const updateQuestion = async (req, res) => {
  try {
    const question = await Question.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!question) {
      return res.status(404).json({
        success: false,
        message: `No question found with id of ${req.params.id}`
      });
    }

    res.status(200).json({
      success: true,
      data: question
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// Delete question

export const deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: `No question found with id of ${req.params.id}`
      });
    }

    await question.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// Get questions by language and difficulty

export const getQuestionsByLanguageAndDifficulty = async (req, res) => {
  try {
    const { language, difficulty } = req.params;
    
    const questions = await Question.find({
      language,
      difficultyLevel: difficulty,
      'ageRange.min': { $lte: req.user.age },
      'ageRange.max': { $gte: req.user.age }
    });

    res.status(200).json({
      success: true,
      count: questions.length,
      data: questions
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};
