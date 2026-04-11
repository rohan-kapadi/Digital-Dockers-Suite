const express = require('express');
const router = express.Router();
const {
	createProject,
	getProjects,
	getProjectById,
	updateProject,
	deleteProject,
	getProjectStats,
	getWorkTypes,
} = require('../controllers/projectController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.route('/').post(protect, admin, createProject).get(protect, getProjects);
router.route('/:id').get(protect, getProjectById).put(protect, admin, updateProject).patch(protect, admin, updateProject).delete(protect, admin, deleteProject);
router.route('/:id/stats').get(protect, getProjectStats);
router.route('/:id/work-types').get(protect, getWorkTypes);

module.exports = router;
