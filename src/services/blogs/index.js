import express from "express";
import createError from "http-errors";
import blogsModel from "./model.js";
import q2m from "query-to-mongo";
const blogsRouter = express.Router();

blogsRouter.post("/", async (req, res, next) => {
  try {
    const newBlog = new blogsModel(req.body);
    const { _id } = await newBlog.save();
    res.status(201).send({ _id });
  } catch (error) {
    next(error);
    console.log(error);
  }
});

// blogsRouter.get("/", async (req, res, next) => {
//   try {
//     const allBlogs = await blogsModel.find();
//     res.send(allBlogs);
//   } catch (error) {
//     next(error);
//     console.log(error);
//   }
// });

blogsRouter.get("/", async (req, res, next) => {
  try {
    const mongoQuery = q2m(req.query);
    const total = await blogsModel.countDocuments(mongoQuery.criteria);
    const blogs = await blogsModel
      .find(mongoQuery.criteria, mongoQuery.options.fields)
      .limit(mongoQuery.options.limit || 20)
      .skip(mongoQuery.options.skip || 0)
      .sort(mongoQuery.options.sort); // no matter in which order you call this methods, Mongo will ALWAYS do SORT, SKIP, LIMIT in this order
    res.send({
      links: mongoQuery.links(`http://localhost:3001/blogs`, total),
      total,
      totalPages: Math.ceil(total / mongoQuery.options.limit),
      blogs,
    });
  } catch (error) {
    next(error);
  }
});

blogsRouter.get("/:blogId", async (req, res, next) => {
  try {
    const blog = await blogsModel.findById(req.params.blogId);
    if (blog) {
      res.send(blog);
    } else {
      next(
        createError(404),
        `Blog with the ID ${req.params.blogId} is not found.`
      );
    }
  } catch (error) {
    next(error);
    console.log(error);
  }
});

blogsRouter.put("/:blogId", async (req, res, next) => {
  try {
    const updatedBlog = await blogsModel.findByIdAndUpdate(
      req.params.blogId, // WHO
      req.body, // HOW
      { new: true, runValidators: true } // OPTIONS by default findByIdAndUpdate returns the record pre-modification, if you want to get back the newly updated record you should use the option new: true
      // by default validation is off here, if you want to have it --> runValidators: true as an option
    );

    // ** ALTERNATIVE METHOD ***
    // const user = await UsersModel.findById(req.params.userId)

    // user.firstName = "John"

    // await user.save()

    if (updatedBlog) {
      res.send(updatedBlog);
    } else {
      next(createError(404, `Blog with id ${req.params.blogId} not found!`));
    }
  } catch (error) {
    next(error);
  }
});

blogsRouter.delete("/:blogId", async (req, res, next) => {
  try {
    const deletedBlog = blogsModel.findByIdAndDelete(req.params.blogId);
    if (deletedBlog) {
      res.status(204).send();
    } else {
      next(
        createError(404),
        `Blog with the ID ${req.params.blogId} is not found.`
      );
    }
  } catch (error) {
    next(error);
    console.log(error);
  }
});

blogsRouter.post("/:blogId/comments", async (req, res, next) => {
  try {
    const blog = await blogsModel.findById(req.params.blogId, { _id: 0 });
    console.log(blog);
    if (blog) {
      const comments = req.body;
      console.log(comments);
      const commentToInsert = {
        ...comments,
        commentDate: new Date(),
      };
      const modifiedBlog = await blogsModel.findByIdAndUpdate(
        req.params.blogId,
        { $push: { comments: commentToInsert } },
        { new: true }
      );
      if (modifiedBlog) res.send(modifiedBlog);
      else
        next(createError(404, `Blog with id ${req.params.userId} not found!`));
    } else {
      next(
        createError(404, `Blog with id ${req.body.bookId} has no comments!`)
      );
    }
  } catch (error) {
    next(error);
  }
});

blogsRouter.get("/:blogId/comments", async (req, res, next) => {
  try {
    const blog = await blogsModel.findById(req.params.blogId);
    if (blog) {
      res.send(blog.comments);
    } else {
      next(createError(404, `Blog with id ${req.params.blogId} not found!`));
    }
  } catch (error) {
    next(error);
  }
});

blogsRouter.get("/:blogId/comments/:commentId", async (req, res, next) => {
  try {
    const blog = await blogsModel.findById(req.params.blogId);
    if (blog) {
      const comment = blog.comments.find(
        (comment) => comment._id.toString() === req.params.commentId
      );

      if (comment) {
        res.send(comment);
      } else {
        next(
          createError(404, `comment with id ${req.params.commentId} not found!`)
        );
      }
    } else {
      next(createError(404, `blog with id ${req.params.blogId} not found!`));
    }
  } catch (error) {
    next(error);
  }
});

blogsRouter.put("/:blogId/comments/:commentId", async (req, res, next) => {
  try {
    const blog = await blogsModel.findById(req.params.blogId);
    if (blog) {
      const index = blog.comments.findIndex(
        (comment) => comment._id.toString() === req.params.commentId
      );

      if (index !== -1) {
        blog.comments[index] = {
          ...blog.comments[index].toObject(),
          ...req.body,
        };

        await blog.save();
        res.send(blog);
      } else {
        next(
          createError(404, `comment with id ${req.params.commentId} not found!`)
        );
      }
    } else {
      next(createError(404, `blog with id ${req.params.blogId} not found!`));
    }
  } catch (error) {
    next(error);
  }
});

blogsRouter.delete("/:blogId/comments/:commentId", async (req, res, next) => {
  try {
    const blogToModify = await blogsModel.findByIdAndUpdate(
      req.params.blogId,
      { $pull: { comments: { _id: req.params.commentId } } },
      { new: true }
    );

    if (blogToModify) {
      res.send(blogToModify);
    } else {
      next(createError(404, `Blog with id ${req.params.blogId} not found!`));
    }
  } catch (error) {
    next(error);
  }
});

export default blogsRouter;
