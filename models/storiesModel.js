import { Schema, model } from "mongoose";

const storySchema = new Schema({
    title: {
        local: {
            type: String,
            required: true,
            trim: true
        },
        english: {
            type: String,
            required: true,
            trim: true
        }
    },

    content: {
        local: {
            type: String,
            required: true,
        },
        english: {
            type: String,
            required: true,
        }
    },

    // Language pair - which local language this story is written in
    language: {
        type: String,
        enum: ['twi', 'ga', 'ewe', 'fante'],
        required: true
    },

    image: {
        type: String
    },

    difficultyLevel: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        required: true
    },

    isRead: {
        type: Boolean,
        default: false
    },

    // Vocabulary for the local language
    vocabulary: [{
        local: {
            type: String,
            required: true
        },
        english: {
            type: String,
            required: true
        },
        pronunciation: {
            type: String  // Phonetic pronunciation guide
        }
    }],

    audioUrl: {
        local: String,     // Audio file URL for local language version
        english: String    // Audio file URL for English version
    },

    category: {
        type: String,
        enum: ['folktale', 'adventure', 'moral', 'historical', 'daily-life', 'fantasy'],
        default: 'folktale'
    }

}, {
    timestamps: true
});

// Create compound index for unique titles within same language
storySchema.index({ "title.local": 1, "language": 1 }, { unique: true });
storySchema.index({ "title.english": 1, "language": 1 });

export const storyModel = model('Stories', storySchema);