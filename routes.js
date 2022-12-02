'use strict';

const express = require('express');
const router = express.Router();
const { User, Course } = require('./models');
const { authenticateUser } = require('./middleware/auth-user');

//middleware
const asyncHandler = (cb) => {
  return async (req, res, next) => {
    try {
      await cb(req, res, next);
    } catch (error) {
      if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
        const errors = error.errors.map(err => err.message);
        res.status(400).json({ errors });   
      } else {
        // Forward error to the global error handler
        next(error);
      }
    }
  }
}

router.get('/users', authenticateUser, asyncHandler(async (req, res) => {
  const user = await req.currentUser;
  res.json({user});
}));

//This route creates a new user
router.post('/users', asyncHandler(async (req, res) => {
  await User.create(req.body);
  res.status(201).location("/").end();
}));

router.get('/courses', asyncHandler(async (req, res) => {
  let courses = await Course.findAll({
    include: {model: User}
  });
  res.json(courses);
}))

router.get('/courses/:id', asyncHandler(async(req, res, next) => {
  let course = await Course.findByPk(req.params.id, {
    include: {model: User}
  });
  course ? res.json(course) : next();
}))

router.post('/courses', authenticateUser, asyncHandler(async (req, res, next) => {
  const user = await req.currentUser
  if (user) {
    const course = await Course.create(req.body);
    res.status(201).location(`/courses/${course.id}`).end();
  } else {
    next()
  }
}));

router.put('/courses/:id', authenticateUser, asyncHandler(async (req, res, next) => {
  let course = await Course.findByPk(req.params.id)
  let user = await req.currentUser
  if(course.userId === user.id) {
    await course.update(req.body)
    res.status(204).end();
  } else {
    next()
  }
}))
router.delete('/courses/:id', authenticateUser, asyncHandler(async (req, res, next) => {
  let course = await Course.findByPk(req.params.id)
  let user = await req.currentUser
  if(course.userId === user.id) {
    await course.destroy()
    res.status(204).end()
  } else {
    next()
  }
}))

module.exports = router;
