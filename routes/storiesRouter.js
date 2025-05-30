import { Router } from 'express';
import { verifyAdmin } from '../middlewares/auth.js';
import {  createStory, deleteStory, getAllStories, getStoryById, toggleStoryReadStatus, updateStory } from '../controllers/storiesController.js';


const storiesRouter = Router();

storiesRouter.post('/stories', verifyAdmin, createStory);
storiesRouter.get('/stories/fetch', getAllStories);
storiesRouter.get('/stories/:id', getStoryById);
storiesRouter.patch('/stories/:id', verifyAdmin, updateStory);
storiesRouter.delete('/stories/:id', verifyAdmin, deleteStory);
storiesRouter.patch('/stories/:id/toggle-read',toggleStoryReadStatus);


export default storiesRouter;