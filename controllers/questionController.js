import { questionModel } from '../models/questionModel.js';
// import { adminModel } from '../models/userModel.js';
import { validateQuestion, validateQuestionUpdate } from '../Validators/questionValidator.js';




// Create a new question (Admin only)
export const createQuestion = async (req, res) => {
  try {
    // Validate the question data
    const validation = validateQuestion(req.body);
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }

    // Additional validation for age range
    if (validation.data.ageRange.max < validation.data.ageRange.min) {
      return res.status(400).json({
        success: false,
        message: 'Maximum age must be greater than or equal to minimum age'
      });
    }

    // Create the question
    const question = new questionModel({
      ...validation.data,
      createdBy: req.admin._id
    });

    await question.save();

    res.status(201).json({
      success: true,
      message: 'Question created successfully',
      data: question
    });

  } catch (error) {
    console.error('Create question error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create question',
      error: error.message
    });
  }
};

// Get all questions with filtering, sorting, and pagination
export const getAllQuestions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      language,
      type,
      difficultyLevel,
      category,
      minAge,
      maxAge,
      minPoints,
      maxPoints,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search
    } = req.query;

    // Build filter object
    const filter = {};

    if (language) filter.language = language;
    if (type) filter.type = type;
    if (difficultyLevel) filter.difficultyLevel = difficultyLevel;
    if (category) filter.category = category;

    // Age range filtering
    if (minAge || maxAge) {
      filter.ageRange = {};
      if (minAge) filter['ageRange.min'] = { $gte: parseInt(minAge) };
      if (maxAge) filter['ageRange.max'] = { $lte: parseInt(maxAge) };
    }

    // Points range filtering
    if (minPoints || maxPoints) {
      filter.points = {};
      if (minPoints) filter.points.$gte = parseInt(minPoints);
      if (maxPoints) filter.points.$lte = parseInt(maxPoints);
    }

    // Text search
    if (search) {
      filter.$or = [
        { text: { $regex: search, $options: 'i' } },
        { explanation: { $regex: search, $options: 'i' } },
        { hint: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const questions = await questionModel
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');

    // Get total count for pagination
    const total = await questionModel.countDocuments(filter);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.status(200).json({
      success: true,
      message: 'Questions retrieved successfully',
      data: {
        questions,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalQuestions: total,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get all questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve questions',
      error: error.message
    });
  }
};

// Get single question by ID
export const getQuestionById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid question ID format'
      });
    }

    const question = await questionModel.findById(id).select('-__v');

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Question retrieved successfully',
      data: question
    });

  } catch (error) {
    console.error('Get question by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve question',
      error: error.message
    });
  }
};

// Update question (Admin only)
export const updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid question ID format'
      });
    }

    // Check if question exists
    const existingQuestion = await questionModel.findById(id);
    if (!existingQuestion) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Validate update data
    const validation = validateQuestionUpdate(req.body);
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }

    // Additional validation for age range if provided
    if (validation.data.ageRange && 
        validation.data.ageRange.max < validation.data.ageRange.min) {
      return res.status(400).json({
        success: false,
        message: 'Maximum age must be greater than or equal to minimum age'
      });
    }

    // Update the question
    const updatedQuestion = await questionModel.findByIdAndUpdate(
      id,
      { 
        ...validation.data,
        updatedBy: req.admin._id,
        updatedAt: new Date()
      },
      { 
        new: true,
        runValidators: true
      }
    ).select('-__v');

    res.status(200).json({
      success: true,
      message: 'Question updated successfully',
      data: updatedQuestion
    });

  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update question',
      error: error.message
    });
  }
};

// Delete question (Admin only)
export const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid question ID format'
      });
    }

    const question = await questionModel.findById(id);
    
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    await questionModel.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Question deleted successfully',
      data: { deletedId: id }
    });

  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete question',
      error: error.message
    });
  }
};

// Get questions by language
export const getQuestionsByLanguage = async (req, res) => {
  try {
    const { language } = req.params;
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      type,
      difficultyLevel,
      category
    } = req.query;

    // Validate language
    const validLanguages = ['twi', 'ewe', 'fante', 'ga'];
    if (!validLanguages.includes(language)) {
      return res.status(400).json({
        success: false,
        message: `Invalid language. Must be one of: ${validLanguages.join(', ')}`
      });
    }

    // Build filter
    const filter = { language };
    if (type) filter.type = type;
    if (difficultyLevel) filter.difficultyLevel = difficultyLevel;
    if (category) filter.category = category;

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const questions = await questionModel
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');

    const total = await questionModel.countDocuments(filter);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.status(200).json({
      success: true,
      message: `Questions in ${language} retrieved successfully`,
      data: {
        language,
        questions,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalQuestions: total,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get questions by language error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve questions by language',
      error: error.message
    });
  }
};

// Get questions by difficulty level
export const getQuestionsByDifficulty = async (req, res) => {
  try {
    const { difficulty } = req.params;
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      language,
      type,
      category
    } = req.query;

    // Validate difficulty
    const validDifficulties = ['beginner', 'intermediate', 'advanced'];
    if (!validDifficulties.includes(difficulty)) {
      return res.status(400).json({
        success: false,
        message: `Invalid difficulty level. Must be one of: ${validDifficulties.join(', ')}`
      });
    }

    // Build filter
    const filter = { difficultyLevel: difficulty };
    if (language) filter.language = language;
    if (type) filter.type = type;
    if (category) filter.category = category;

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const questions = await questionModel
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');

    const total = await questionModel.countDocuments(filter);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.status(200).json({
      success: true,
      message: `${difficulty} level questions retrieved successfully`,
      data: {
        difficultyLevel: difficulty,
        questions,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalQuestions: total,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get questions by difficulty error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve questions by difficulty',
      error: error.message
    });
  }
};

// Get questions by category
export const getQuestionsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      language,
      type,
      difficultyLevel
    } = req.query;

    // Validate category
    const validCategories = ['vocabulary', 'grammar', 'reading', 'writing'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Must be one of: ${validCategories.join(', ')}`
      });
    }

    // Build filter
    const filter = { category };
    if (language) filter.language = language;
    if (type) filter.type = type;
    if (difficultyLevel) filter.difficultyLevel = difficultyLevel;

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const questions = await questionModel
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');

    const total = await questionModel.countDocuments(filter);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.status(200).json({
      success: true,
      message: `${category} questions retrieved successfully`,
      data: {
        category,
        questions,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalQuestions: total,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get questions by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve questions by category',
      error: error.message
    });
  }
};

// Get question statistics (bonus controller)
export const getQuestionStats = async (req, res) => {
  try {
    const stats = await questionModel.aggregate([
      {
        $group: {
          _id: null,
          totalQuestions: { $sum: 1 },
          avgPoints: { $avg: '$points' },
          languages: { $addToSet: '$language' },
          categories: { $addToSet: '$category' },
          difficulties: { $addToSet: '$difficultyLevel' },
          types: { $addToSet: '$type' }
        }
      },
      {
        $project: {
          _id: 0,
          totalQuestions: 1,
          avgPoints: { $round: ['$avgPoints', 2] },
          languageCount: { $size: '$languages' },
          categoryCount: { $size: '$categories' },
          difficultyCount: { $size: '$difficulties' },
          typeCount: { $size: '$types' }
        }
      }
    ]);

    // Get breakdown by language
    const languageBreakdown = await questionModel.aggregate([
      {
        $group: {
          _id: '$language',
          count: { $sum: 1 },
          avgPoints: { $avg: '$points' }
        }
      },
      {
        $project: {
          language: '$_id',
          count: 1,
          avgPoints: { $round: ['$avgPoints', 2] },
          _id: 0
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get breakdown by difficulty
    const difficultyBreakdown = await questionModel.aggregate([
      {
        $group: {
          _id: '$difficultyLevel',
          count: { $sum: 1 },
          avgPoints: { $avg: '$points' }
        }
      },
      {
        $project: {
          difficulty: '$_id',
          count: 1,
          avgPoints: { $round: ['$avgPoints', 2] },
          _id: 0
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      message: 'Question statistics retrieved successfully',
      data: {
        overview: stats[0] || {
          totalQuestions: 0,
          avgPoints: 0,
          languageCount: 0,
          categoryCount: 0,
          difficultyCount: 0,
          typeCount: 0
        },
        languageBreakdown,
        difficultyBreakdown
      }
    });

  } catch (error) {
    console.error('Get question stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve question statistics',
      error: error.message
    });
  }
};