import mongoose from "mongoose";
import { questionModel } from "../models/questionModel.js";
import { quizModel } from "../models/quizModel.js";
import { validateCreateQuiz } from "../Validators/quizValidator.js";
import { validateUpdateQuiz } from "../Validators/quizValidator.js";

// Create a new quiz (Admin only)
export const createQuiz = async (req, res) => {
  console.log(req.body)
  try {
    // Validate input data
    const validation = validateCreateQuiz(req.body);
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }

    const { questions: questionIds, ...quizData } = validation.data;

    // Verify all questions exist and are active
    const questions = await questionModel.find({
      _id: { $in: questionIds },
      // isActive: true
    });

    if (questions.length !== 5) {
      return res.status(400).json({
        success: false,
        message: `Found ${questions.length} valid questions, but 5 are required`,
        details: 'Some questions may not exist or are inactive'
      });
    }

    // Verify questions match quiz criteria (age range, category, etc.)
    const invalidQuestions = questions.filter(question => {
      const ageOverlap = !(
        question.ageRange.max < quizData.ageRange.min || 
        question.ageRange.min > quizData.ageRange.max
      );
      return !ageOverlap;
    });

    if (invalidQuestions.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Some questions have incompatible age ranges',
        invalidQuestions: invalidQuestions.map(q => ({
          id: q._id,
          text: q.text.substring(0, 50) + '...',
          ageRange: q.ageRange
        }))
      });
    }

    // Check for duplicate quiz title
    const existingQuiz = await quizModel.findOne({
      title: { $regex: new RegExp(`^${quizData.title.trim()}$`, 'i') },
      language: quizData.language
    });

    if (existingQuiz) {
      return res.status(409).json({
        success: false,
        message: 'A quiz with this title already exists in the specified language'
      });
    }

    // Calculate total points
    const totalPoints = questions.reduce((sum, question) => {
      // Assuming each question has a points field, or default to 1 point per question
      return sum + (question.points || 1);
    }, 0);

    // Create the quiz
    const quiz = new quizModel({
      ...quizData,
      questions: questionIds,
      totalPoints
      
    });

    await quiz.save();

    // Populate questions for response
    await quiz.populate('questions', 'text difficulty category');

    res.status(201).json({
      success: true,
      message: 'Quiz created successfully',
      data: quiz
    });

  } catch (error) {
    console.error('Create quiz error:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Duplicate quiz detected',
        error: 'A quiz with similar details already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create quiz',
      error: error.message
    });
  }
};

// Get all quizzes with pagination
export const getAllQuizzes = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    
    if (req.query.language) filter.language = req.query.language;
    if (req.query.difficulty) filter.difficulty = req.query.difficulty;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';

    // Age range filtering
    if (req.query.minAge || req.query.maxAge) {
      const minAge = parseInt(req.query.minAge) || 4;
      const maxAge = parseInt(req.query.maxAge) || 12;
      
      filter.$and = [
        { 'ageRange.min': { $lte: maxAge } },
        { 'ageRange.max': { $gte: minAge } }
      ];
    }

    const total = await quizModel.countDocuments(filter);
    const quizzes = await quizModel
      .find(filter)
      .populate('questions', 'text difficulty category points')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      data: {
        quizzes,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalQuizzes: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get quizzes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quizzes',
      error: error.message
    });
  }
};

// Get a single quiz by ID
export const getQuizById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid quiz ID format'
      });
    }

    const quiz = await quizModel
      .findById(id)
      .populate('questions', 'text options difficulty category ageRange points');

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    res.json({
      success: true,
      data: quiz
    });

  } catch (error) {
    console.error('Get quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz',
      error: error.message
    });
  }
};

// Update a quiz (Admin only)
export const updateQuiz = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid quiz ID format'
      });
    }

    // Validate input data
    const validation = validateUpdateQuiz(req.body);
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }

    const updateData = validation.data;

    // If questions are being updated, verify them
    if (updateData.questions) {
      const questions = await questionModel.find({
        _id: { $in: updateData.questions },
        // isActive: true
      });

      if (questions.length !== 5) {
        return res.status(400).json({
          success: false,
          message: `Found ${questions.length} valid questions, but 5 are required`
        });
      }

      // Recalculate total points if questions changed
      updateData.totalPoints = questions.reduce((sum, question) => {
        return sum + (question.points || 1);
      }, 0);
    }

    const quiz = await quizModel
      .findByIdAndUpdate(id, updateData, { 
        new: true, 
        runValidators: true 
      })
      .populate('questions', 'text difficulty category');

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    res.json({
      success: true,
      message: 'Quiz updated successfully',
      data: quiz
    });

  } catch (error) {
    console.error('Update quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update quiz',
      error: error.message
    });
  }
};

// Delete a quiz (Admin only)
export const deleteQuiz = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid quiz ID format'
      });
    }

    const quiz = await quizModel.findByIdAndDelete(id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    res.json({
      success: true,
      message: 'Quiz deleted successfully',
      data: { deletedQuiz: quiz.title }
    });

  } catch (error) {
    console.error('Delete quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete quiz',
      error: error.message
    });
  }
};

// Toggle quiz active status (Admin only)
export const toggleQuizStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid quiz ID format'
      });
    }

    const quiz = await quizModel.findById(id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    quiz.isActive = !quiz.isActive;
    await quiz.save();

    res.json({
      success: true,
      message: `Quiz ${quiz.isActive ? 'activated' : 'deactivated'} successfully`,
      data: { title: quiz.title, isActive: quiz.isActive }
    });

  } catch (error) {
    console.error('Toggle quiz status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle quiz status',
      error: error.message
    });
  }
};

// Get quiz statistics (Admin only)
export const getQuizStats = async (req, res) => {
  try {
    const stats = await quizModel.aggregate([
      {
        $group: {
          _id: null,
          totalQuizzes: { $sum: 1 },
          activeQuizzes: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          },
          byLanguage: {
            $push: {
              language: '$language',
              difficulty: '$difficulty',
              category: '$category'
            }
          }
        }
      },
      {
        $project: {
          totalQuizzes: 1,
          activeQuizzes: 1,
          inactiveQuizzes: { $subtract: ['$totalQuizzes', '$activeQuizzes'] },
          languageStats: {
            $reduce: {
              input: '$byLanguage',
              initialValue: {},
              in: {
                $mergeObjects: [
                  '$$value',
                  {
                    $arrayToObject: [
                      [{ k: '$$this.language', v: { $add: [{ $ifNull: [{ $getField: { field: '$$this.language', input: '$$value' } }, 0] }, 1] } }]
                    ]
                  }
                ]
              }
            }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: stats[0] || {
        totalQuizzes: 0,
        activeQuizzes: 0,
        inactiveQuizzes: 0,
        languageStats: {}
      }
    });

  } catch (error) {
    console.error('Get quiz stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz statistics',
      error: error.message
    });
  }
};