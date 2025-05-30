import { storyModel } from '../models/storiesModel.js';
import { validateStory, updateStorySchema } from '../Validators/storiesValidator.js';

// Create a new bilingual story
export const createStory = async (req, res) => {
    try {
        const { error, value } = validateStory(req.body);
        
        if (error) {
            const errorMessages = error.details.map(detail => detail.message);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errorMessages
            });
        }

        // Check for duplicate titles within the same language
        const existingStory = await storyModel.findOne({
            $and: [
                { language: value.language },
                {
                    $or: [
                        { "title.local": value.title.local.trim() },
                        { "title.english": value.title.english.trim() }
                    ]
                }
            ]
        });
        
        if (existingStory) {
            return res.status(409).json({
                success: false,
                message: `A ${value.language} story with this title already exists`
            });
        }

        const story = new storyModel(value);
        const savedStory = await story.save();

        res.status(201).json({
            success: true,
            message: `${value.language.charAt(0).toUpperCase() + value.language.slice(1)} story created successfully`,
            data: savedStory
        });

    } catch (error) {
        console.error('Error creating story:', error);
        
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'A story with this title already exists'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get all stories with language and display preference
export const getAllStories = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            difficulty,
            isRead,
            search,
            language,        // Filter by specific language: 'twi', 'ga', 'ewe', 'fante'
            display = 'both', // 'local', 'english', or 'both'
            category,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const filter = {};
        
        // Filter by specific local language
        if (language && ['twi', 'ga', 'ewe', 'fante'].includes(language)) {
            filter.language = language;
        }
        
        if (difficulty && ['beginner', 'intermediate', 'advanced'].includes(difficulty)) {
            filter.difficultyLevel = difficulty;
        }
        
        if (isRead !== undefined) {
            filter.isRead = isRead === 'true';
        }

        if (category && ['folktale', 'adventure', 'moral', 'historical', 'daily-life', 'fantasy'].includes(category)) {
            filter.category = category;
        }
        
        if (search) {
            const searchRegex = { $regex: search, $options: 'i' };
            filter.$or = [
                { "title.local": searchRegex },
                { "title.english": searchRegex },
                { "content.local": searchRegex },
                { "content.english": searchRegex }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        let projection = {};
        
        // Control which language fields to return
        if (display === 'local') {
            projection = {
                'title.english': 0,
                'content.english': 0,
                'audioUrl.english': 0
            };
        } else if (display === 'english') {
            projection = {
                'title.local': 0,
                'content.local': 0,
                'audioUrl.local': 0
            };
        }

        const [stories, totalCount] = await Promise.all([
            storyModel
                .find(filter, projection)
                .sort(sortOptions)
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            storyModel.countDocuments(filter)
        ]);

        const totalPages = Math.ceil(totalCount / parseInt(limit));

        res.status(200).json({
            success: true,
            message: 'Stories retrieved successfully',
            data: stories,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalCount,
                hasNextPage: parseInt(page) < totalPages,
                hasPrevPage: parseInt(page) > 1,
                limit: parseInt(limit)
            },
            filters: {
                language: language || 'all',
                display: display
            }
        });

    } catch (error) {
        console.error('Error fetching stories:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Get story by ID with display preference
export const getStoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const { display = 'both' } = req.query;

        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid story ID format'
            });
        }

        let projection = {};
        if (display === 'local') {
            projection = {
                'title.english': 0,
                'content.english': 0,
                'audioUrl.english': 0
            };
        } else if (display === 'english') {
            projection = {
                'title.local': 0,
                'content.local': 0,
                'audioUrl.local': 0
            };
        }

        const story = await storyModel.findById(id, projection);

        if (!story) {
            return res.status(404).json({
                success: false,
                message: 'Story not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Story retrieved successfully',
            data: story,
            display: display
        });

    } catch (error) {
        console.error('Error fetching story:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Get stories by specific language
export const getStoriesByLanguage = async (req, res) => {
    try {
        const { language } = req.params;
        const { page = 1, limit = 10, display = 'both' } = req.query;

        if (!['twi', 'ga', 'ewe', 'fante'].includes(language)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid language. Must be one of: twi, ga, ewe, fante'
            });
        }

        const filter = { language: language };
        const skip = (parseInt(page) - 1) * parseInt(limit);

        let projection = {};
        if (display === 'local') {
            projection = {
                'title.english': 0,
                'content.english': 0,
                'audioUrl.english': 0
            };
        } else if (display === 'english') {
            projection = {
                'title.local': 0,
                'content.local': 0,
                'audioUrl.local': 0
            };
        }

        const [stories, totalCount] = await Promise.all([
            storyModel
                .find(filter, projection)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            storyModel.countDocuments(filter)
        ]);

        const totalPages = Math.ceil(totalCount / parseInt(limit));

        res.status(200).json({
            success: true,
            message: `${language.charAt(0).toUpperCase() + language.slice(1)} stories retrieved successfully`,
            data: stories,
            language: language,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalCount,
                hasNextPage: parseInt(page) < totalPages,
                hasPrevPage: parseInt(page) > 1,
                limit: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Error fetching stories by language:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Get story vocabulary for language learning
export const getStoryVocabulary = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid story ID format'
            });
        }

        const story = await storyModel.findById(id, { vocabulary: 1, title: 1, language: 1 });

        if (!story) {
            return res.status(404).json({
                success: false,
                message: 'Story not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Story vocabulary retrieved successfully',
            data: {
                storyTitle: story.title,
                language: story.language,
                vocabulary: story.vocabulary || []
            }
        });

    } catch (error) {
        console.error('Error fetching vocabulary:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Get language statistics
export const getLanguageStats = async (req, res) => {
    try {
        const stats = await storyModel.aggregate([
            {
                $group: {
                    _id: '$language',
                    count: { $sum: 1 },
                    beginnerCount: {
                        $sum: { $cond: [{ $eq: ['$difficultyLevel', 'beginner'] }, 1, 0] }
                    },
                    intermediateCount: {
                        $sum: { $cond: [{ $eq: ['$difficultyLevel', 'intermediate'] }, 1, 0] }
                    },
                    advancedCount: {
                        $sum: { $cond: [{ $eq: ['$difficultyLevel', 'advanced'] }, 1, 0] }
                    }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        const totalStories = await storyModel.countDocuments();

        res.status(200).json({
            success: true,
            message: 'Language statistics retrieved successfully',
            data: {
                totalStories,
                byLanguage: stats
            }
        });

    } catch (error) {
        console.error('Error fetching language stats:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Updated update function
export const updateStory = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid story ID format'
            });
        }

        const { error, value } = updateStorySchema.validate(req.body);
        
        if (error) {
            const errorMessages = error.details.map(detail => detail.message);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errorMessages
            });
        }

        const existingStory = await storyModel.findById(id);
        if (!existingStory) {
            return res.status(404).json({
                success: false,
                message: 'Story not found'
            });
        }

        // Check for title duplicates if title is being updated
        if (value.title) {
            const searchLanguage = value.language || existingStory.language;
            const duplicateQuery = { 
                _id: { $ne: id },
                language: searchLanguage
            };
            const orConditions = [];
            
            if (value.title.local) {
                orConditions.push({ "title.local": value.title.local.trim() });
            }
            if (value.title.english) {
                orConditions.push({ "title.english": value.title.english.trim() });
            }
            
            if (orConditions.length > 0) {
                duplicateQuery.$or = orConditions;
                const duplicateStory = await storyModel.findOne(duplicateQuery);
                
                if (duplicateStory) {
                    return res.status(409).json({
                        success: false,
                        message: 'A story with this title already exists in this language'
                    });
                }
            }
        }

        const updatedStory = await storyModel.findByIdAndUpdate(
            id,
            { $set: value },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'Story updated successfully',
            data: updatedStory
        });

    } catch (error) {
        console.error('Error updating story:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

export const deleteStory = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid story ID format'
            });
        }

        const deletedStory = await storyModel.findByIdAndDelete(id);

        if (!deletedStory) {
            return res.status(404).json({
                success: false,
                message: 'Story not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Story deleted successfully',
            data: deletedStory
        });

    } catch (error) {
        console.error('Error deleting story:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};






// Mark story as read/unread
export const toggleStoryReadStatus = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate MongoDB ObjectId format
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid story ID format'
            });
        }

        const story = await storyModel.findById(id);

        if (!story) {
            return res.status(404).json({
                success: false,
                message: 'Story not found'
            });
        }

        story.isRead = !story.isRead;
        await story.save();

        res.status(200).json({
            success: true,
            message: `Story marked as ${story.isRead ? 'read' : 'unread'}`,
            data: story
        });

    } catch (error) {
        console.error('Error toggling story read status:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};