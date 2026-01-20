const branchService = require('../services/branch.service');
const {
  successResponse,
  createdResponse,
  badRequestResponse,
  notFoundResponse,
} = require('../utils/response');
const { MESSAGES } = require('../config/constants');

class BranchController {
  /**
   * Create new branch
   * POST /api/branches
   */
  async createBranch(req, res, next) {
    try {
      const { name, address } = req.body;

      // Validation
      if (!name || !address) {
        return badRequestResponse(res, 'Name and address are required');
      }

      // Create branch
      const branch = await branchService.createBranch({
        name,
        address,
      });

      return createdResponse(res, MESSAGES.BRANCH_CREATED, branch);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all branches
   * GET /api/branches
   */
  async getAllBranches(req, res, next) {
    try {
      const branches = await branchService.getAllBranches();

      return successResponse(res, MESSAGES.BRANCHES_FETCHED, {
        count: branches.length,
        branches,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update branch
   * PUT /api/branches/:id
   */
  async updateBranch(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Check if branch exists
      const existingBranch = await branchService.findById(id);
      if (!existingBranch) {
        return notFoundResponse(res, MESSAGES.BRANCH_NOT_FOUND);
      }

      // Update branch
      const updatedBranch = await branchService.updateBranch(id, updateData);

      return successResponse(res, MESSAGES.BRANCH_UPDATED, updatedBranch);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BranchController();
