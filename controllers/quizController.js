const Quiz = require('../models/Quiz');
const Question = require('../models/Question');

// @desc    Create new quiz
// @route   POST /api/v1/quizzes
// @access  Private/Parent
exports.createQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.create(req.body);

    res.status(201).json({
      success: true,
      data: quiz
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Get all quizzes
// @route   GET /api/v1/quizzes
// @access  Private
exports.getQuizzes = async (req, res) => {
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
    query = Quiz.find(JSON.parse(queryStr));

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
    const total = await Quiz.countDocuments();

    query = query.skip(startIndex).limit(limit);

    // Executing query
    const quizzes = await query;

    // Age appropriate filter if user is a child
    let filteredQuizzes = quizzes;
    if (!req.user.isParent) {
      filteredQuizzes = quizzes.filter(quiz => 
        quiz.ageRange.min <= req.user.age && 
        quiz.ageRange.max >= req.user.age
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
      count: filteredQuizzes.length,
      pagination,
      data: filteredQuizzes
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Get single quiz
// @route   GET /api/v1/quizzes/:id
// @access  Private
exports.getQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate('questions');

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: `No quiz found with id of ${req.params.id}`
      });
    }

    // Check if quiz is appropriate for user's age
    if (!req.user.isParent && 
        (quiz.ageRange.min > req.user.age || 
         quiz.ageRange.max < req.user.age)) {
      return res.status(403).json({
        success: false,
        message: 'This quiz is not appropriate for your age'
      });
    }

    res.status(200).json({
      success: true,
      data: quiz
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Update quiz
// @route   PUT /api/v1/quizzes/:id
// @access  Private/Parent
exports.updateQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: `No quiz found with id of ${req.params.id}`
      });
    }

    res.status(200).json({
      success: true,
      data: quiz
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Delete quiz
// @route   DELETE /api/v1/quizzes/:id
// @access  Private/Parent
exports.deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: `No quiz found with id of ${req.params.id}`
      });
    }

    await quiz.remove();

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

// @desc    Generate quiz based on parameters
// @route   POST /api/v1/quizzes/generate
// @access  Private
exports.generateQuiz = async (req, res) => {
  try {
    const { language, difficulty, category, questionsCount = 10 } = req.body;

    // Find suitable questions
    const questions = await Question.find({
      language,
      difficultyLevel: difficulty,
      category,
      'ageRange.min': { $lte: req.user.age },
      'ageRange.max': { $gte: req.user.age }
    }).limit(questionsCount);

    if (questions.length < questionsCount) {
      return res.status(400).json({
        success: false,
        message: `Not enough questions available for the specified parameters. Found ${questions.length} out of ${questionsCount} requested.`
      });
    }

    // Create quiz
    const quiz = await Quiz.create({
      title: `${language.charAt(0).toUpperCase() + language.slice(1)} ${category} Quiz - Level ${difficulty}`,
      language,
      description: `Generated quiz for ${language} ${category} at difficulty level ${difficulty}`,
      difficultyLevel: difficulty,
      ageRange: {
        min: 4,
        max: 12
      },
      questions: questions.map(q => q._id),
      category,
      timeLimit: questionsCount * 30 // 30 seconds per question
    });

    res.status(201).json({
      success: true,
      data: quiz
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Get quizzes by language and difficulty
// @route   GET /api/v1/quizzes/language/:language/difficulty/:difficulty
// @access  Private
exports.getQuizzesByLanguageAndDifficulty = async (req, res) => {
  try {
    const { language, difficulty } = req.params;
    
    const quizzes = await Quiz.find({
      language,
      difficultyLevel: difficulty,
      'ageRange.min': { $lte: req.user.age },
      'ageRange.max': { $gte: req.user.age }
    });

    res.status(200).json({
      success: true,
      count: quizzes.length,
      data: quizzes
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Add question to quiz
// @route   PUT /api/v1/quizzes/:id/questions
// @access  Private/Parent
exports.addQuestionToQuiz = async (req, res) => {
  try {
    const { questionId } = req.body;

    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: `No quiz found with id of ${req.params.id}`
      });
    }

    const question = await Question.findById(questionId);
    
    if (!question) {
      return res.status(404).json({
        success: false,
        message: `No question found with id of ${questionId}`
      });
    }

    // Check if question is already in quiz
    