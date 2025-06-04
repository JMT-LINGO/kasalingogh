import { lessonsModel } from '../models/lessonsModel.js'; 
import { validateLesson } from '../Validators/lessonsValidator.js'; 

// CREATE - Add a new lesson
export const createLesson = async (req, res) => {
    try {
        // Validate request body
        const { error, value } = validateLesson(req.body);
        
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: error.details.map(err => ({
                    field: err.path.join('.'),
                    message: err.message
                }))
            });
        }

        // Create new lesson
        const newLesson = new lessonsModel(value);
        const savedLesson = await newLesson.save();

        res.status(201).json({
            success: true,
            message: 'Lesson created successfully',
            data: savedLesson
        });

    } catch (error) {
        console.error('Error creating lesson:', error);
        
        // Handle MongoDB duplicate key error
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'Lesson already exists',
                error: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// READ - Get all lessons with optional filtering and pagination
export const getAllLessons = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            language, 
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build filter object
        const filter = {};
        
        if (language && ['twi', 'ewe', 'fante', 'ga'].includes(language)) {
            filter.language = language;
        }

        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { localLanguage: { $regex: search, $options: 'i' } },
                { english: { $regex: search, $options: 'i' } }
            ];
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Execute query with pagination
        const lessons = await lessonsModel
            .find(filter)
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        // Get total count for pagination info
        const totalLessons = await lessonsModel.countDocuments(filter);
        const totalPages = Math.ceil(totalLessons / parseInt(limit));

        res.status(200).json({
            success: true,
            message: 'Lessons retrieved successfully',
            data: lessons,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalLessons,
                hasNextPage: parseInt(page) < totalPages,
                hasPrevPage: parseInt(page) > 1
            }
        });

    } catch (error) {
        console.error('Error getting lessons:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// READ - Get a single lesson by ID
export const getLessonById = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate MongoDB ObjectId format
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid lesson ID format'
            });
        }

        const lesson = await lessonsModel.findById(id).lean();

        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: 'Lesson not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Lesson retrieved successfully',
            data: lesson
        });

    } catch (error) {
        console.error('Error getting lesson:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// READ - Get lessons by language
export const getLessonsByLanguage = async (req, res) => {
    try {
        const { language } = req.params;
        const { page = 1, limit = 10 } = req.query;

        // Validate language parameter
        if (!['twi', 'ewe', 'fante', 'ga'].includes(language)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid language. Must be one of: twi, ewe, fante, ga'
            });
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const lessons = await lessonsModel
            .find({ language })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        const totalLessons = await lessonsModel.countDocuments({ language });
        const totalPages = Math.ceil(totalLessons / parseInt(limit));

        res.status(200).json({
            success: true,
            message: `${language.charAt(0).toUpperCase() + language.slice(1)} lessons retrieved successfully`,
            data: lessons,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalLessons,
                hasNextPage: parseInt(page) < totalPages,
                hasPrevPage: parseInt(page) > 1
            }
        });

    } catch (error) {
        console.error('Error getting lessons by language:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// UPDATE - Update a lesson by ID
export const updateLesson = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate MongoDB ObjectId format
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid lesson ID format'
            });
        }

        // Validate request body
        const { error, value } = validateLesson(req.body);
        
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: error.details.map(err => ({
                    field: err.path.join('.'),
                    message: err.message
                }))
            });
        }

        // Update lesson
        const updatedLesson = await lessonsModel.findByIdAndUpdate(
            id,
            { ...value, updatedAt: new Date() },
            { 
                new: true, // Return updated document
                runValidators: true // Run Mongoose validators
            }
        );

        if (!updatedLesson) {
            return res.status(404).json({
                success: false,
                message: 'Lesson not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Lesson updated successfully',
            data: updatedLesson
        });

    } catch (error) {
        console.error('Error updating lesson:', error);
        
        // Handle MongoDB duplicate key error
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'Lesson with this data already exists',
                error: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// UPDATE - Partial update (PATCH)
export const patchLesson = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate MongoDB ObjectId format
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid lesson ID format'
            });
        }

        // For partial updates, we need to validate only the provided fields
        const allowedFields = ['title', 'localLanguage', 'english', 'response', 'language', 'emoji'];
        const updateData = {};
        
        // Filter out non-allowed fields
        Object.keys(req.body).forEach(key => {
            if (allowedFields.includes(key)) {
                updateData[key] = req.body[key];
            }
        });

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid fields provided for update'
            });
        }

        // Validate the update data
        const { error, value } = validateLesson(updateData);
        
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: error.details.map(err => ({
                    field: err.path.join('.'),
                    message: err.message
                }))
            });
        }

        // Update lesson
        const updatedLesson = await lessonsModel.findByIdAndUpdate(
            id,
            { ...value, updatedAt: new Date() },
            { 
                new: true,
                runValidators: true
            }
        );

        if (!updatedLesson) {
            return res.status(404).json({
                success: false,
                message: 'Lesson not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Lesson updated successfully',
            data: updatedLesson
        });

    } catch (error) {
        console.error('Error patching lesson:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// DELETE - Delete a lesson by ID
export const deleteLesson = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate MongoDB ObjectId format
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid lesson ID format'
            });
        }

        const deletedLesson = await lessonsModel.findByIdAndDelete(id);

        if (!deletedLesson) {
            return res.status(404).json({
                success: false,
                message: 'Lesson not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Lesson deleted successfully',
            data: deletedLesson
        });

    } catch (error) {
        console.error('Error deleting lesson:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// DELETE - Delete multiple lessons
export const deleteLessons = async (req, res) => {
    try {
        const { ids } = req.body;

        // Validate input
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide an array of lesson IDs'
            });
        }

        // Validate all IDs format
        const invalidIds = ids.filter(id => !id.match(/^[0-9a-fA-F]{24}$/));
        if (invalidIds.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid lesson ID format',
                invalidIds
            });
        }

        const result = await lessonsModel.deleteMany({ _id: { $in: ids } });

        res.status(200).json({
            success: true,
            message: `${result.deletedCount} lesson(s) deleted successfully`,
            deletedCount: result.deletedCount
        });

    } catch (error) {
        console.error('Error deleting lessons:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// GET - Get lessons statistics
export const getLessonsStats = async (req, res) => {
    try {
        const stats = await lessonsModel.aggregate([
            {
                $group: {
                    _id: '$language',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        const totalLessons = await lessonsModel.countDocuments();
        
        res.status(200).json({
            success: true,
            message: 'Lessons statistics retrieved successfully',
            data: {
                totalLessons,
                byLanguage: stats
            }
        });

    } catch (error) {
        console.error('Error getting lessons stats:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};