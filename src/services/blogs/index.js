import express from "express";
import createError from "http-errors";
import blogsModel from "./model.js";

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

blogsRouter.get("/", async (req, res, next) => {
  try {
    const allBlogs = await blogsModel.find();
    res.send(allBlogs);
  } catch (error) {
    next(error);
    console.log(error);
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

export default blogsRouter;
