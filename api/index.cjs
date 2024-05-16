const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
};

router.post('/post', authenticateToken, async (req, res) => {
    const { description } = req.body;
  
    // Validate input
    if (!description) {
      return res.status(400).json({ message: 'Description is required' });
    }
  
    try {
      // Create a new post
      const newPost = await prisma.posts.create({
        data: {
          description,
          user: {
            connect: {
              id: req.user.userId
            }
          }
        }
      });
  
      res.status(201).json(newPost);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  });

// Get all posts
router.get('/posts', async (req, res) => {
  const posts = await prisma.posts.findMany({
    include: {
      user: true
    }
  });

  res.json(posts);
});

// Get a single post by ID
router.get('/post/:id', async (req, res) => {
  const post = await prisma.posts.findUnique({
    where: {
      id: parseInt(req.params.id)
    },
    include: {
      user: true
    }
  });

  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  res.json(post);
});



// // Delete a post by ID
router.delete('/post/:id', authenticateToken, async (req, res) => {
  const post = await prisma.posts.findUnique({
    where: {
      id: parseInt(req.params.id)
    }
  });
  if (!post || post.userid !== req.user.userId) {
    
    return res.status(401).json({ message: 'Unauthorized' });
  }

  await prisma.posts.delete({
    where: {
      id: parseInt(req.params.id)
    }
  });

  res.json({ message: 'Post deleted' });
});

// Get all posts by a specific user ID
router.get('/posts/user/:userid', authenticateToken, async (req, res) => {
    const { userid } = req.params;
  
    // Validate input
    if (!userid) {
      return res.status(400).json({ message: 'User ID is required' });
    }
  
    // Retrieve all posts by the specified user ID
    const posts = await prisma.posts.findMany({
      where: {
        userid: parseInt(userid)
      },
      include: {
        user: true
      }
    });
  
    res.json(posts);
  });
module.exports = router;